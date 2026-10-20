/**
 * Browser uploads for Context. XHR rather than fetch, since fetch can't
 * report upload progress and videos can be 200 MB.
 *
 * - Images and audio post to the Worker, which stores them in Cloudflare
 *   Images or R2.
 * - Video asks the Worker for a one-time Stream URL, posts the file
 *   straight to Stream, then tells the Worker it's done.
 */

type Progress = (fraction: number) => void;

function post(url: string, body: FormData, onProgress?: Progress) {
  return new Promise<{ status: number; body: unknown }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(event.loaded / event.total);
    };
    xhr.onload = () => {
      let parsed: unknown = null;
      try {
        parsed = JSON.parse(xhr.responseText);
      } catch {}
      resolve({ status: xhr.status, body: parsed });
    };
    xhr.onerror = () => reject(new Error("The upload failed. Check your connection and try again."));
    xhr.send(body);
  });
}

function errorFrom(body: unknown, fallback: string) {
  const message = (body as { error?: unknown } | null)?.error;
  return new Error(typeof message === "string" ? message : fallback);
}

/** How long an audio or video file runs, read in the browser before upload. */
export function readDuration(file: File) {
  const url = URL.createObjectURL(file);
  const element = document.createElement(file.type.startsWith("video/") ? "video" : "audio");
  return new Promise<number | null>((resolve) => {
    const done = () => {
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(element.duration) ? element.duration : null);
    };
    element.preload = "metadata";
    element.onloadedmetadata = done;
    element.onerror = done;
    element.src = url;
  });
}

/** What the Worker sends back once a file is stored. Video has no url until Stream is done. */
export type UploadedFile = { id: string; url: string | null; status: string };

export async function uploadFile(workspaceId: string, file: File, onProgress?: Progress): Promise<UploadedFile | null> {
  const base = `/api/workspaces/${workspaceId}`;

  if (file.type.startsWith("video/")) {
    const start = await fetch(`${base}/videos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: file.name, type: file.type, bytes: file.size }),
    });
    const body: unknown = await start.json().catch(() => null);
    if (!start.ok) throw errorFrom(body, `${file.name} couldn't be uploaded.`);
    const { id, uploadURL } = body as { id: string; uploadURL: string };

    const form = new FormData();
    form.append("file", file);
    const upload = await post(uploadURL, form, onProgress);
    if (upload.status >= 300) throw new Error(`Stream didn't accept ${file.name}.`);

    const done = await fetch(`${base}/videos/${id}/done`, { method: "POST" });
    const saved: unknown = await done.json().catch(() => null);
    return (saved as { file?: UploadedFile } | null)?.file ?? null;
  }

  const form = new FormData();
  form.append("file", file);
  if (file.type.startsWith("audio/")) {
    const seconds = await readDuration(file);
    if (seconds) form.append("seconds", String(seconds));
  }
  const result = await post(`${base}/files`, form, onProgress);
  if (result.status >= 300) throw errorFrom(result.body, `${file.name} couldn't be uploaded.`);
  return (result.body as { file?: UploadedFile } | null)?.file ?? null;
}
