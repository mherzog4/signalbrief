import { z } from "zod";

import { getConfig, getIntegrationStatus } from "@/lib/config";
import { deliverBrief } from "@/lib/delivery/slack";
import { runDemoScenario } from "@/lib/demo/run-scenario";
import { logEvent } from "@/lib/observability";
import { demoRateLimiter, demoSlackDeliveryRateLimiter, getClientKey, rateLimitHeaders } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  scenarioId: z.string().min(1).max(64),
  deliverToSlack: z.boolean().default(false),
});

export async function POST(request: Request) {
  const startedAt = performance.now();
  const requestId = crypto.randomUUID();
  const config = getConfig();
  const requestHeaders = { "cache-control": "no-store", "x-request-id": requestId };

  if (config.DEMO_MODE !== "true") {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const clientKey = getClientKey(request);
  const rateLimit = demoRateLimiter.consume(clientKey, config.DEMO_RATE_LIMIT_PER_MINUTE);
  const responseHeaders = { ...requestHeaders, ...rateLimitHeaders(rateLimit) };
  if (!rateLimit.allowed) {
    const retryAfter = Math.max(1, Math.ceil((rateLimit.resetAt - Date.now()) / 1_000));
    logEvent("demo.rate_limited", { requestId }, "warn");
    return Response.json(
      { error: "Demo rate limit reached. Try again shortly.", requestId },
      { status: 429, headers: { ...responseHeaders, "retry-after": String(retryAfter) } },
    );
  }

  if (!request.headers.get("content-type")?.includes("application/json")) {
    return Response.json({ error: "Content-Type must be application/json", requestId }, { status: 415, headers: responseHeaders });
  }

  try {
    const { scenarioId, deliverToSlack } = requestSchema.parse(await request.json());
    if (deliverToSlack) {
      const deliveryEnabled = config.DEMO_SLACK_DELIVERY_ENABLED === "true"
        && config.DRY_RUN !== "true"
        && getIntegrationStatus(config).slack;
      if (!deliveryEnabled) {
        return Response.json(
          { error: "Slack delivery is not enabled for this demo", requestId },
          { status: 409, headers: responseHeaders },
        );
      }

      const deliveryLimit = demoSlackDeliveryRateLimiter.consume(clientKey, 1);
      if (!deliveryLimit.allowed) {
        const retryAfter = Math.max(1, Math.ceil((deliveryLimit.resetAt - Date.now()) / 1_000));
        return Response.json(
          { error: "Slack delivery is limited to once per minute", requestId },
          { status: 429, headers: { ...requestHeaders, ...rateLimitHeaders(deliveryLimit), "retry-after": String(retryAfter) } },
        );
      }
    }

    const result = await runDemoScenario(scenarioId);
    if (!result) return Response.json({ error: "Unknown scenario", requestId }, { status: 404, headers: responseHeaders });
    const delivery = deliverToSlack
      ? await deliverBrief(result.scenario.meeting, result.brief)
      : undefined;
    logEvent("demo.completed", {
      requestId,
      scenarioId,
      mode: result.trace.mode,
      deliveredToSlack: delivery?.delivered ?? false,
      durationMs: Math.round(performance.now() - startedAt),
    });
    return Response.json({ ...result, delivery }, { headers: responseHeaders });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Invalid demo request", requestId }, { status: 400, headers: responseHeaders });
    }
    logEvent("demo.failed", {
      requestId,
      error: error instanceof Error ? error.name : "UnknownError",
      durationMs: Math.round(performance.now() - startedAt),
    }, "error");
    return Response.json({ error: "Demo run failed", requestId }, { status: 500, headers: responseHeaders });
  }
}
