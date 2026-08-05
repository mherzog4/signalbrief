import { describe, expect, it } from "vitest";

import { __testables } from "@/lib/connectors/calendar";

describe("calendar demo event markers", () => {
  it("resolves only an explicit Signalbrief scenario marker", () => {
    expect(__testables.demoScenarioIdFromEvent({
      description: "Interview rehearsal\n[signalbrief-demo:meridian-applied-ai]",
    })).toBe("meridian-applied-ai");
    expect(__testables.demoScenarioIdFromEvent({
      description: "Meridian AI production scale review",
    })).toBeUndefined();
  });
});
