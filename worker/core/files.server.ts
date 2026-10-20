/**
 * Images, video and audio for Context, one row each in `files`.
 *
 * - Images go to Cloudflare Images through the binding. The row keeps the
 *   delivery URL for the `public` variant.
 * - Video goes to Stream. The browser uploads straight to a one-time
 *   direct upload URL, so large files never pass through the Worker. The
 *   row waits as `uploading`, then `processing`, until Stream says it's
 *   ready; listing refreshes any that are still waiting.
 * - Audio goes to R2, since Stream only takes video, and is served from
 *   /files/<workspace>/<id> with Range support so players can seek.
 */
import { env, waitUntil } from "cloudflare:workers";

import { db, isId, newId } from "./db.server";

export type FileKind = "image" | "video" | "audio";
export type FileStatus = "uploading" | "processing" | "ready" | "error";

export const maxBytes: Record<FileKind, number> = {
  image: 10_000_000,
  // Stream's limit for a basic direct upload.
  video: 200_000_000,
  audio: 50_000_000,
};

/** Longest video Stream will accept from a direct upload. */
const MAX_VIDEO_SECONDS = 10 * 60;

export type StoredFile = {
  id: string;
  kind: FileKind;
  name: string;
  /** Null until a video has finished processing. */
  url: string | null;
  poster: string | null;
  status: FileStatus;
  contentType: string;
  bytes: number;
  width: number | null;
  height: number | null;
  seconds: number | null;
  alt: string;
  createdAt: number;
};

type FileRow = {
  workspace_id: string;
  id: string;
  kind: FileKind;
  name: string;
  store: "images" | "stream" | "r2" | "url";
  ref: string;
  url: string | null;
  poster: string | null;
  status: FileStatus;
  content_type: string;
  bytes: number;
  width: number | null;
  height: number | null;
  seconds: number | null;
  alt: string;
  created_at: number;
};

function toFile(row: FileRow): StoredFile {
  return {
    id: row.id,
    kind: row.kind,
    name: row.name,
    url: row.url,
    poster: row.poster,
    status: row.status,
    contentType: row.content_type,
    bytes: row.bytes,
    width: row.width,
    height: row.height,
    seconds: row.seconds,
    alt: row.alt,
    createdAt: row.created_at,
  };
}

export class FileError extends Error {}

export function kindOf(contentType: string): FileKind | null {
  const [type] = contentType.split("/");
  return type === "image" || type === "video" || type === "audio" ? type : null;
}

function checkFile(kind: FileKind, contentType: string, bytes: number) {
  if (kindOf(contentType) !== kind) throw new FileError(`That isn't ${kind === "image" ? "an" : "a"} ${kind} file.`);
  if (bytes > maxBytes[kind]) throw new FileError(`Files must be under ${maxBytes[kind] / 1_000_000} MB.`);
}

async function getRow(workspaceId: string, id: string) {
  return db()
    .prepare("SELECT * FROM files WHERE workspace_id = ? AND id = ?")
    .bind(workspaceId, id)
    .first<FileRow>();
}

const insert = `INSERT INTO files (workspace_id, id, kind, name, store, ref, url, poster, status, content_type,
  bytes, width, height, seconds, alt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`;

export async function listFiles(workspaceId: string, kind?: FileKind) {
  const { results } = await db()
    .prepare(`SELECT * FROM files WHERE workspace_id = ?1 AND (?2 IS NULL OR kind = ?2) ORDER BY created_at DESC`)
    .bind(workspaceId, kind ?? null)
    .all<FileRow>();
  // Uploading too, in case the browser finished but never said so.
  const waiting = results.filter((row) => row.store === "stream" && (row.status === "processing" || row.status === "uploading"));
  const refreshed = new Map((await Promise.all(waiting.map(refreshVideo))).map((row) => [row.id, row]));
  return results.map((row) => toFile(refreshed.get(row.id) ?? row));
}

/* Images */

export async function saveImage(workspaceId: string, file: File, alt = "") {
  checkFile("image", file.type, file.size);
  const info = await env.IMAGES.info(file.stream()).catch(() => null);
  if (!info) throw new FileError(`${file.name} couldn't be read as an image.`);

  const id = newId("img");
  const image = await env.IMAGES.hosted.upload(file.stream(), {
    filename: file.name,
    metadata: { workspace: workspaceId, file: id },
  });
  const url = image.variants.find((v) => v.endsWith("/public")) ?? image.variants[0];
  const size = "width" in info ? info : { width: null, height: null };

  const row = await db()
    .prepare(insert)
    .bind(workspaceId, id, "image", file.name, "images", image.id, url, null, "ready", file.type, file.size,
      size.width, size.height, null, alt)
    .first<FileRow>();
  return toFile(row!);
}

/* Video */

/** Makes the row and a one-time URL the browser posts the file to. */
export async function startVideoUpload(workspaceId: string, file: { name: string; type: string; bytes: number }) {
  checkFile("video", file.type, file.bytes);
  const id = newId("video");
  const upload = await env.STREAM.createDirectUpload({
    maxDurationSeconds: MAX_VIDEO_SECONDS,
    meta: { workspace: workspaceId, file: id, name: file.name },
  });
  await db()
    .prepare(insert)
    .bind(workspaceId, id, "video", file.name, "stream", upload.id, null, null, "uploading", file.type, file.bytes,
      null, null, null, "")
    .run();
  return { id, uploadURL: upload.uploadURL };
}

/** Called once the browser's upload finishes. Stream takes a little longer to encode. */
export async function finishVideoUpload(workspaceId: string, id: string) {
  const row = await getRow(workspaceId, id);
  if (!row || row.store !== "stream") return null;
  const updated = await db()
    .prepare("UPDATE files SET status = 'processing' WHERE workspace_id = ? AND id = ? RETURNING *")
    .bind(workspaceId, id)
    .first<FileRow>();
  return toFile(await refreshVideo(updated!));
}

async function refreshVideo(row: FileRow): Promise<FileRow> {
  const video = await env.STREAM.video(row.ref).details().catch(() => null);
  if (!video) return row;
  const status: FileStatus =
    video.status.state === "error" ? "error" : video.readyToStream ? "ready" : "processing";
  if (status === "processing") return row;

  const updated = await db()
    .prepare(
      `UPDATE files SET status = ?, url = ?, poster = ?, seconds = ?, bytes = ?, width = ?, height = ?
       WHERE workspace_id = ? AND id = ? RETURNING *`,
    )
    .bind(
      status,
      status === "ready" ? video.hlsPlaybackUrl : null,
      status === "ready" ? video.thumbnail : null,
      video.duration > 0 ? video.duration : null,
      video.size || row.bytes,
      video.input.width > 0 ? video.input.width : null,
      video.input.height > 0 ? video.input.height : null,
      row.workspace_id,
      row.id,
    )
    .first<FileRow>();
  return updated ?? row;
}

/** Stream's player page for a video, which plays HLS in every browser. */
export function streamEmbedUrl(hlsUrl: string) {
  return hlsUrl.replace(/\/manifest\/video\.m3u8.*$/, "/iframe");
}

/* Audio */

export async function saveAudio(workspaceId: string, file: File, seconds: number | null = null) {
  checkFile("audio", file.type, file.size);
  const id = newId("audio");
  const key = `${workspaceId}/${id}`;
  await env.AUDIO.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
    customMetadata: { name: file.name },
  });
  const row = await db()
    .prepare(insert)
    .bind(workspaceId, id, "audio", file.name, "r2", key, `/files/${key}`, null, "ready", file.type, file.size,
      null, null, seconds, "")
    .first<FileRow>();
  return toFile(row!);
}

/* Any kind */

export async function updateFile(workspaceId: string, id: string, fields: { name: string; alt?: string }) {
  const row = await db()
    .prepare("UPDATE files SET name = ?, alt = coalesce(?, alt) WHERE workspace_id = ? AND id = ? RETURNING *")
    .bind(fields.name, fields.alt ?? null, workspaceId, id)
    .first<FileRow>();
  return row ? toFile(row) : null;
}

/** Removes the stored bytes. Failures are logged, not thrown: the row is what the admin shows. */
async function deleteStored(row: Pick<FileRow, "store" | "ref">) {
  try {
    if (row.store === "images") await env.IMAGES.hosted.image(row.ref).delete();
    if (row.store === "stream") await env.STREAM.video(row.ref).delete();
    if (row.store === "r2") await env.AUDIO.delete(row.ref);
  } catch (error) {
    console.error(`Couldn't delete ${row.store} ${row.ref}`, error);
  }
}

export async function deleteFile(workspaceId: string, id: string) {
  const row = await db()
    .prepare("DELETE FROM files WHERE workspace_id = ? AND id = ? RETURNING store, ref")
    .bind(workspaceId, id)
    .first<Pick<FileRow, "store" | "ref">>();
  if (row) waitUntil(deleteStored(row));
  return Boolean(row);
}

/** Before a workspace is deleted, since the cascade only removes rows. */
export async function deleteWorkspaceFiles(workspaceId: string) {
  const { results } = await db()
    .prepare("SELECT store, ref FROM files WHERE workspace_id = ? AND store <> 'url'")
    .bind(workspaceId)
    .all<Pick<FileRow, "store" | "ref">>();
  waitUntil(Promise.all(results.map(deleteStored)));
}

/** The response for GET /files/:workspace/:id, which only audio uses. */
export async function serveFile(request: Request, workspaceId: string, id: string) {
  if (!isId(workspaceId) || !isId(id)) return new Response("Not found", { status: 404 });
  const object = await env.AUDIO.get(`${workspaceId}/${id}`, { range: request.headers, onlyIf: request.headers });
  if (!object) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("accept-ranges", "bytes");
  headers.set("cache-control", "public, max-age=31536000, immutable");
  // A failed precondition (If-None-Match matched) returns no body.
  if (!("body" in object)) return new Response(null, { status: 304, headers });

  const range = request.headers.has("range") ? object.range : undefined;
  if (!range) return new Response(object.body, { headers });

  const start = "suffix" in range ? object.size - range.suffix : (range.offset ?? 0);
  const end = "length" in range && range.length !== undefined ? start + range.length - 1 : object.size - 1;
  headers.set("content-range", `bytes ${start}-${end}/${object.size}`);
  return new Response(object.body, { status: 206, headers });
}
