import { describe, expect, it } from "vitest";

import { createGoogleOAuthState, verifyGoogleOAuthState } from "@/lib/google-oauth";
import { __testables as integrationStoreTestables } from "@/lib/store/integration-store";

describe("Google Calendar OAuth security", () => {
  const secret = "a-long-admin-secret-for-test-only";
  const redirectUri = "https://signalbrief.example/api/integrations/google/callback";

  it("accepts a signed, unexpired state", () => {
    const state = createGoogleOAuthState(redirectUri, secret, 1_000);
    expect(verifyGoogleOAuthState(state, secret, 2_000).redirectUri).toBe(redirectUri);
  });

  it("rejects tampered and expired state", () => {
    const state = createGoogleOAuthState(redirectUri, secret, 1_000);
    expect(() => verifyGoogleOAuthState(`${state}x`, secret, 2_000)).toThrow();
    expect(() => verifyGoogleOAuthState(state, secret, 700_000)).toThrow("Expired");
  });

  it("encrypts stored refresh tokens and authenticates the ciphertext", () => {
    const sealed = integrationStoreTestables.sealCredential("refresh-token-value", secret);
    expect(sealed).not.toContain("refresh-token-value");
    expect(integrationStoreTestables.openCredential(sealed, secret)).toBe("refresh-token-value");
    expect(() => integrationStoreTestables.openCredential(`${sealed}x`, secret)).toThrow();
  });
});
