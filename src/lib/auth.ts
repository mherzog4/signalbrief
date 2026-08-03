import "server-only";

import { timingSafeEqual } from "node:crypto";

export function bearerMatches(request: Request, expected?: string) {
  if (!expected) return false;
  const actual = request.headers.get("authorization") ?? "";
  const wanted = `Bearer ${expected}`;
  const actualBuffer = Buffer.from(actual);
  const wantedBuffer = Buffer.from(wanted);
  return actualBuffer.length === wantedBuffer.length && timingSafeEqual(actualBuffer, wantedBuffer);
}
