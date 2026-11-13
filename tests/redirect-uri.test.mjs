import assert from "node:assert/strict";
import test from "node:test";

import { resolveRedirectUri } from "../src/lib/msal/commercialCloud.js";

test("redirect URI follows the page origin, whatever is configured", () => {
  assert.equal(
    resolveRedirectUri("https://www.nuketune.com", "https://nuketune.com"),
    "https://www.nuketune.com",
  );
  assert.equal(
    resolveRedirectUri("https://nuketune.com", "https://www.nuketune.com"),
    "https://nuketune.com",
  );
  assert.equal(resolveRedirectUri("http://localhost:4000", undefined), "http://localhost:4000");
});

test("redirect URI falls back to the configured value without a usable origin", () => {
  assert.equal(resolveRedirectUri(undefined, "https://nuketune.com"), "https://nuketune.com");
  assert.equal(resolveRedirectUri("null", "https://nuketune.com"), "https://nuketune.com");
  assert.equal(resolveRedirectUri("https://evil.example/path", "https://nuketune.com"), "https://nuketune.com");
  assert.equal(resolveRedirectUri(undefined, undefined), "");
});
