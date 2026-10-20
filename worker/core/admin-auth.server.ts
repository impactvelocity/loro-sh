/**
 * The admin password. Set the ADMIN_PASSWORD secret and the admin, and the
 * API routes it uses, need a sign-in; leave it unset and everything stays
 * open, as before, so fresh forks need no setup. The dev server never asks,
 * even with the password in .dev.vars, so local dev isn't blocked.
 *
 * Signing in sets a cookie holding an expiry and an HMAC of it, keyed by
 * the password. Nothing is stored, and changing the password signs
 * everyone out.
 */
import { env } from "cloudflare:workers";

const COOKIE = "loro-admin";
const MAX_AGE = 60 * 60 * 24 * 30;

const encoder = new TextEncoder();

/** True when the admin needs a password: never on the dev server. */
export function adminLocked() {
  return !import.meta.env.DEV && Boolean(env.ADMIN_PASSWORD);
}

async function sign(value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(env.ADMIN_PASSWORD ?? ""),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
}

const hex = (bytes: Uint8Array) => Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");

/** Looks at every byte whatever the first difference, so timing gives nothing away. */
function sameBytes(a: Uint8Array, b: Uint8Array) {
  if (a.byteLength !== b.byteLength) return false;
  let diff = 0;
  for (let i = 0; i < a.byteLength; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/** Compares HMACs rather than the strings, so the check takes the same time however close a guess is. */
export async function checkPassword(attempt: string) {
  if (!adminLocked()) return true;
  return sameBytes(await sign(`password:${attempt}`), await sign(`password:${env.ADMIN_PASSWORD}`));
}

function readCookie(request: Request) {
  const header = request.headers.get("Cookie") ?? "";
  for (const part of header.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === COOKIE) return rest.join("=");
  }
  return null;
}

/** True when the admin is open, or this request carries a live session. */
export async function hasAdminSession(request: Request) {
  if (!adminLocked()) return true;
  const [expires, signature] = (readCookie(request) ?? "").split(".");
  if (!expires || !signature || Number(expires) < Date.now() / 1000) return false;
  return sameBytes(encoder.encode(hex(await sign(`session:${expires}`))), encoder.encode(signature));
}

function cookie(request: Request, value: string, maxAge: number) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

/** The Set-Cookie header that signs this browser in. */
export async function signInCookie(request: Request) {
  const expires = Math.floor(Date.now() / 1000) + MAX_AGE;
  return cookie(request, `${expires}.${hex(await sign(`session:${expires}`))}`, MAX_AGE);
}

export function signOutCookie(request: Request) {
  return cookie(request, "", 0);
}

/** Where to go after signing in: only a path on this site, so the link can't send anyone elsewhere. */
export function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/admin";
}
