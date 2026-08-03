import { describe, expect, it } from "vitest";

import { getDemoMeeting } from "@/lib/demo/data";
import type { ResearchConnector } from "@/lib/domain";
import { compileMeetingBrief } from "@/lib/pipeline/compile-brief";

describe("research pipeline", () => {
  it("isolates a failed source and still compiles the brief", async () => {
    const failingConnector: ResearchConnector = {
      name: "gong",
      isConfigured: () => true,
      research: async () => { throw new Error("temporary upstream failure"); },
    };
    const crmConnector: ResearchConnector = {
      name: "crm",
      isConfigured: () => true,
      research: async () => ({
        connector: "crm",
        status: "ok",
        evidence: [{ source: "crm", title: "Open opportunity", detail: "Discovery stage", confidence: "high" }],
      }),
    };

    const result = await compileMeetingBrief(getDemoMeeting(), [failingConnector, crmConnector]);

    expect(result.connectorResults[0].status).toBe("error");
    expect(result.connectorResults[1].status).toBe("ok");
    expect(result.brief.accountName).toBe("Acme Corp");
  });
});
