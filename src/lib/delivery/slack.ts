import "server-only";

import { getConfig } from "@/lib/config";
import type { Meeting, MeetingBrief } from "@/lib/domain";
import { fetchJson } from "@/lib/http";

type SlackBlock = Record<string, unknown>;
type SlackPayload = {
  text: string;
  attachments: Array<{ color: string; blocks: SlackBlock[] }>;
};

const section = (text: string): SlackBlock => ({ type: "section", text: { type: "mrkdwn", text } });

function escapeMrkdwn(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function bullets(items: string[]) {
  return items.slice(0, 3).map((item) => `• ${escapeMrkdwn(item)}`).join("\n");
}

export function briefToSlackBlocks(brief: MeetingBrief, attribution = "Prepared by Signalbrief"): SlackBlock[] {
  const meetingDate = new Date(brief.meetingTime);
  const time = Number.isNaN(meetingDate.getTime())
    ? "Upcoming meeting"
    : new Intl.DateTimeFormat("en-US", { weekday: "short", hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(meetingDate);
  const sourceLinks = brief.sources.slice(0, 3).map((source) => source.url
    ? `<${source.url}|${escapeMrkdwn(source.label)}>`
    : escapeMrkdwn(source.label)).join("  ·  ");
  const questions = brief.discoveryQuestions.slice(0, 2).map((question) => `• ${escapeMrkdwn(question)}`).join("\n");
  const watchOut = brief.watchOuts[0] ? escapeMrkdwn(brief.watchOuts[0]) : "No material risk surfaced—validate assumptions early.";

  return [
    { type: "header", text: { type: "plain_text", text: brief.accountName.slice(0, 150), emoji: true } },
    section(`*PRE-CALL BRIEF*  ·  ${escapeMrkdwn(brief.meetingTitle)}\n${time}  ·  *${brief.confidence} confidence*`),
    section(`*WHY NOW*\n${escapeMrkdwn(brief.whyNow)}`),
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*ACCOUNT IN 30 SECONDS*\n${bullets(brief.accountSnapshot)}` },
        { type: "mrkdwn", text: `*WHAT WE ALREADY KNOW*\n${bullets(brief.relationshipContext)}` },
      ],
    },
    { type: "divider" },
    section(`*YOUR PLAY*\n${brief.recommendedPlays.slice(0, 3).map((play, index) => `${index + 1}.  ${escapeMrkdwn(play)}`).join("\n")}`),
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*ASK ON THE CALL*\n${questions}` },
        { type: "mrkdwn", text: `*WATCH FOR*\n⚠️ ${watchOut}` },
      ],
    },
    { type: "context", elements: [{ type: "mrkdwn", text: `${sourceLinks ? `*Sources:* ${sourceLinks}  ·  ` : ""}${escapeMrkdwn(attribution)}` }] },
  ];
}

export function briefToSlackPayload(brief: MeetingBrief, attribution?: string): SlackPayload {
  return {
    text: `Pre-call brief for ${brief.accountName}: ${brief.whyNow}`,
    attachments: [{ color: "#e56f61", blocks: briefToSlackBlocks(brief, attribution) }],
  };
}

async function slackApi<T>(method: string, body: unknown): Promise<T> {
  return fetchJson<T>("slack", `https://slack.com/api/${method}`, {
    method: "POST",
    headers: { authorization: `Bearer ${getConfig().SLACK_BOT_TOKEN}`, "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  });
}

export async function deliverBrief(meeting: Meeting, brief: MeetingBrief) {
  const config = getConfig();
  const attribution = config.AI_PROVIDER === "openrouter"
    ? `Powered by OpenRouter · ${config.AI_MODEL}`
    : `Prepared with ${config.AI_PROVIDER} · ${config.AI_MODEL}`;
  const payload = briefToSlackPayload(brief, attribution);
  const blocks = payload.attachments[0].blocks;

  if (config.DRY_RUN === "true") return { delivered: false, mode: "dry-run" as const, blocks };
  if (config.SLACK_BOT_TOKEN) {
    let channel = config.SLACK_CHANNEL_ID;
    if (meeting.ownerSlackId) {
      const opened = await slackApi<{ ok: boolean; channel?: { id?: string }; error?: string }>("conversations.open", { users: meeting.ownerSlackId });
      if (!opened.ok || !opened.channel?.id) throw new Error(`Slack DM failed: ${opened.error ?? "no channel"}`);
      channel = opened.channel.id;
    }
    if (!channel) throw new Error("Set SLACK_CHANNEL_ID or map the meeting owner to a Slack member ID");
    const posted = await slackApi<{ ok: boolean; error?: string }>("chat.postMessage", { channel, ...payload, unfurl_links: false });
    if (!posted.ok) throw new Error(`Slack delivery failed: ${posted.error ?? "unknown error"}`);
    return { delivered: true, mode: "bot" as const };
  }
  if (config.SLACK_WEBHOOK_URL) {
    const response = await fetch(config.SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`Slack webhook delivery failed (${response.status})`);
    return { delivered: true, mode: "webhook" as const };
  }
  return { delivered: false, mode: "unconfigured" as const, blocks };
}
