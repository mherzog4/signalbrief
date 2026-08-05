import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

import { getConfig } from "@/lib/config";
import { fetchJson } from "@/lib/http";

const googleRefreshTokenKey = "signalbrief:integration:google-calendar:refresh-token";
const credentialVersion = "v1";

function encryptionKey(secret: string) {
  return createHash("sha256").update(secret, "utf8").digest();
}

function sealCredential(value: string, secret: string) {
  const initializationVector = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(secret), initializationVector);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const authenticationTag = cipher.getAuthTag();

  return [
    credentialVersion,
    initializationVector.toString("base64url"),
    authenticationTag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

function openCredential(value: string, secret: string) {
  const [version, encodedInitializationVector, encodedAuthenticationTag, encodedCredential] = value.split(".");
  if (
    version !== credentialVersion
    || !encodedInitializationVector
    || !encodedAuthenticationTag
    || !encodedCredential
  ) {
    throw new Error("Unsupported stored credential format");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(secret),
    Buffer.from(encodedInitializationVector, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(encodedAuthenticationTag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encodedCredential, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

async function upstashCommand<T>(command: Array<string | number>) {
  const config = getConfig();
  if (!config.UPSTASH_REDIS_REST_URL || !config.UPSTASH_REDIS_REST_TOKEN) {
    throw new Error("Upstash Redis is required to persist a connected calendar");
  }

  return fetchJson<{ result: T }>("upstash", config.UPSTASH_REDIS_REST_URL.replace(/\/$/, ""), {
    method: "POST",
    headers: {
      authorization: `Bearer ${config.UPSTASH_REDIS_REST_TOKEN}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(command),
  });
}

export async function storeGoogleRefreshToken(refreshToken: string) {
  const config = getConfig();
  if (!config.ADMIN_API_KEY) throw new Error("ADMIN_API_KEY is required to encrypt calendar credentials");
  const sealed = sealCredential(refreshToken, config.ADMIN_API_KEY);
  await upstashCommand(["SET", googleRefreshTokenKey, sealed]);
}

export async function readGoogleRefreshToken() {
  const config = getConfig();
  if (!config.UPSTASH_REDIS_REST_URL || !config.UPSTASH_REDIS_REST_TOKEN || !config.ADMIN_API_KEY) {
    return undefined;
  }

  const response = await upstashCommand<string | null>(["GET", googleRefreshTokenKey]);
  return response.result ? openCredential(response.result, config.ADMIN_API_KEY) : undefined;
}

export const __testables = { openCredential, sealCredential };
