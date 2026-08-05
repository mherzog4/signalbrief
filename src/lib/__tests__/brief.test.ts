import { describe, expect, it } from "vitest";
import { z } from "zod";

import { briefToSlackBlocks, briefToSlackPayload } from "@/lib/delivery/slack";
import { demoEvidence, getDemoBrief, getDemoMeeting } from "@/lib/demo/data";
import { meetingBriefSchema } from "@/lib/domain";
import { __testables } from "@/lib/providers/brief-generator";

describe("meeting brief contract", () => {
  it("validates the product demo against the same schema used for model output", () => {
    expect(meetingBriefSchema.safeParse(getDemoBrief()).success).toBe(true);
  });

  it("keeps trusted identity, scheduling, and citation fields outside model generation", () => {
    const providerJsonSchema = z.toJSONSchema(__testables.generatedBriefSchema);
    const serializedProviderSchema = JSON.stringify(providerJsonSchema);

    expect(serializedProviderSchema).not.toContain('"format":"uri"');
    expect(providerJsonSchema.properties).not.toHaveProperty("accountName");
    expect(providerJsonSchema.properties).not.toHaveProperty("meetingTitle");
    expect(providerJsonSchema.properties).not.toHaveProperty("meetingTime");
    expect(providerJsonSchema.properties).not.toHaveProperty("sources");
    expect(meetingBriefSchema.safeParse({
      ...getDemoBrief(),
      sources: [{ label: "Invalid source", url: "not-a-url" }],
    }).success).toBe(false);
  });

  it("creates a useful deterministic brief when no model key is configured", () => {
    const brief = __testables.fallbackBrief(getDemoMeeting(), demoEvidence);

    expect(brief.accountName).toBe("OpenRouter");
    expect(brief.accountSnapshot.length).toBeGreaterThanOrEqual(2);
    expect(brief.discoveryQuestions).toHaveLength(3);
    expect(brief.sources.some((source) => source.label.includes("Gong") || source.label.includes("call"))).toBe(true);
  });

  it("renders a compact, visually grouped Slack brief with the AE essentials", () => {
    const blocks = briefToSlackBlocks(getDemoBrief(), "Powered by OpenRouter · openai/gpt-5-mini");
    const payload = briefToSlackPayload(getDemoBrief(), "Powered by OpenRouter · openai/gpt-5-mini");
    const serialized = JSON.stringify(blocks);

    expect(blocks).toHaveLength(8);
    expect(serialized).toContain("WHY NOW");
    expect(serialized).toContain("ACCOUNT IN 30 SECONDS");
    expect(serialized).toContain("YOUR PLAY");
    expect(serialized).toContain("ASK ON THE CALL");
    expect(serialized).toContain("Powered by OpenRouter");
    expect(serialized).toContain("OpenRouter");
    expect(payload.attachments[0].color).toBe("#e56f61");
  });
});
