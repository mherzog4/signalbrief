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

    expect(brief.accountName).toBe("Meridian AI");
    expect(brief.accountSnapshot.length).toBeGreaterThanOrEqual(2);
    expect(brief.discoveryQuestions).toHaveLength(3);
    expect(brief.sources.some((source) => source.label.includes("Gong") || source.label.includes("call"))).toBe(true);
  });

  it("renders a compact, visually grouped Slack brief with the AE essentials", () => {
    const meeting = getDemoMeeting();
    const blocks = briefToSlackBlocks(getDemoBrief(), "Powered by OpenRouter · openai/gpt-5-mini", meeting);
    const payload = briefToSlackPayload(getDemoBrief(), "Powered by OpenRouter · openai/gpt-5-mini", meeting);
    const serialized = JSON.stringify(blocks);

    expect(blocks).toHaveLength(7);
    expect(serialized).toContain("WHY NOW");
    expect(serialized).toContain("WHO'S IN THE ROOM");
    expect(serialized).toContain("YOUR ANGLE");
    expect(serialized).toContain("ASK");
    expect(serialized).toContain("Powered by OpenRouter");
    expect(serialized).toContain("Meridian AI");
    expect(serialized).not.toContain("…");
    expect(payload.text).toBe("🎯 Meridian AI pre-call brief is ready");
    expect(payload.attachments[0].color).toBe("#e56f61");

    const completeQuestion = "Which production workflow should we benchmark first to compare model quality, latency, reliability, and cost?";
    const completePayload = JSON.stringify(briefToSlackBlocks({
      ...getDemoBrief(),
      discoveryQuestions: [completeQuestion, ...getDemoBrief().discoveryQuestions.slice(1)],
    }, undefined, meeting));
    expect(completePayload).toContain(completeQuestion);
  });
});
