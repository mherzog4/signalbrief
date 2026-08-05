import { describe, expect, it } from "vitest";
import { z } from "zod";

import { briefToSlackBlocks } from "@/lib/delivery/slack";
import { demoEvidence, getDemoBrief, getDemoMeeting } from "@/lib/demo/data";
import { meetingBriefSchema } from "@/lib/domain";
import { __testables } from "@/lib/providers/brief-generator";

describe("meeting brief contract", () => {
  it("validates the product demo against the same schema used for model output", () => {
    expect(meetingBriefSchema.safeParse(getDemoBrief()).success).toBe(true);
  });

  it("keeps provider JSON Schema portable while enforcing URLs at the domain boundary", () => {
    const providerJsonSchema = z.toJSONSchema(__testables.generatedBriefSchema);
    const serializedProviderSchema = JSON.stringify(providerJsonSchema);
    const sourceItemSchema = providerJsonSchema.properties?.sources as {
      items?: { required?: string[] };
    };

    expect(serializedProviderSchema).not.toContain('"format":"uri"');
    expect(sourceItemSchema.items?.required).toContain("url");
    expect(meetingBriefSchema.safeParse({
      ...getDemoBrief(),
      sources: [{ label: "Invalid source", url: "not-a-url" }],
    }).success).toBe(false);
  });

  it("creates a useful deterministic brief when no model key is configured", () => {
    const brief = __testables.fallbackBrief(getDemoMeeting(), demoEvidence);

    expect(brief.accountName).toBe("Acme Corp");
    expect(brief.accountSnapshot.length).toBeGreaterThanOrEqual(2);
    expect(brief.discoveryQuestions).toHaveLength(3);
    expect(brief.sources.some((source) => source.label.includes("Gong") || source.label.includes("call"))).toBe(true);
  });

  it("renders a compact Slack Block Kit payload with all critical sections", () => {
    const serialized = JSON.stringify(briefToSlackBlocks(getDemoBrief()));

    expect(serialized).toContain("Why now");
    expect(serialized).toContain("Recommended plays");
    expect(serialized).toContain("Ask these");
    expect(serialized).toContain("Acme Corp");
  });
});
