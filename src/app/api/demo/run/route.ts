import { z } from "zod";

import { getConfig } from "@/lib/config";
import { runDemoScenario } from "@/lib/demo/run-scenario";

export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  scenarioId: z.string().min(1).max(64),
});

export async function POST(request: Request) {
  if (getConfig().DEMO_MODE !== "true") {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const { scenarioId } = requestSchema.parse(await request.json());
    const result = await runDemoScenario(scenarioId);
    if (!result) return Response.json({ error: "Unknown scenario" }, { status: 404 });
    return Response.json(result, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Invalid demo request" }, { status: 400 });
    }
    console.error("Signalbrief demo run failed", error);
    return Response.json({ error: "Demo run failed" }, { status: 500 });
  }
}
