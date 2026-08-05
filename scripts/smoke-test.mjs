const baseUrl = (process.argv[2] ?? "https://signalbrief-alpha.vercel.app").replace(/\/$/, "");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const healthResponse = await fetch(`${baseUrl}/api/health`, { signal: AbortSignal.timeout(10_000) });
assert(healthResponse.ok, `Health endpoint returned ${healthResponse.status}`);
const health = await healthResponse.json();
assert(health.ok === true && health.service === "signalbrief", "Health payload is invalid");

const demoResponse = await fetch(`${baseUrl}/api/demo/run`, {
  method: "POST",
  headers: { "content-type": "application/json", "user-agent": "signalbrief-uptime-monitor/1.0" },
  body: JSON.stringify({ scenarioId: "northstar-validation" }),
  signal: AbortSignal.timeout(60_000),
});
assert(demoResponse.ok, `Demo endpoint returned ${demoResponse.status}`);
const demo = await demoResponse.json();
assert(demo.brief?.accountName === "Northstar Systems", "Demo brief account is invalid");
assert(demo.evidence?.length === 5, "Demo evidence count changed unexpectedly");
const expectedMode = process.env.SIGNALBRIEF_EXPECTED_MODE;
if (expectedMode) {
  assert(demo.trace?.mode === expectedMode, `Demo ran in ${demo.trace?.mode ?? "unknown"} mode; expected ${expectedMode}`);
} else {
  assert(["fixture", "live"].includes(demo.trace?.mode), "Demo trace mode is invalid");
}
assert(Boolean(demo.trace?.runId), "Demo response is missing a run ID");
assert(Boolean(demoResponse.headers.get("x-request-id")), "Demo response is missing a request ID");
assert(Boolean(demoResponse.headers.get("ratelimit-limit")), "Demo response is missing rate-limit headers");

console.log(`Signalbrief smoke test passed for ${baseUrl} (${demo.trace.mode} mode)`);
