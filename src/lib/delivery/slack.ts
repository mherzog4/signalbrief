import "server-only";

import { getConfig } from "@/lib/config";
import type { Meeting, MeetingBrief } from "@/lib/domain";
import { fetchJson } from "@/lib/http";

type SlackBlock = Record<string, unknown>;

const section = (text: string): SlackBlock => ({ type: "section", text: { type: "mrkdwn", text } });

function bullets(items: string[]) {
  return items.map((item) => `• ${item}`).join("\n");
}

export function briefToSlackBlocks(brief: MeetingBrief): SlackBlock[] {
  const time = new Intl.DateTimeFormat("en-US", { weekday: "short", hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(new Date(brief.meetingTime));
  const sourceLinks = brief.sources.map((source) => source.url ? `<${source.url}|${source.label}>` : source.label).join("  ·  ");
  return [
    { type: "header", text: { type: "plain_text", text: `Pre-call brief · ${brief.accountName}`, emoji: true } },
    section(`*${brief.meetingTitle}*\n${time}  ·  Confidence: *${brief.confidence}*`),
    { type: "divider" },
    section(`*Why now*\n${brief.whyNow}`),
    section(`*Account in 30 seconds*\n${bullets(brief.accountSnapshot)}`),
    section(`*What we already know*\n${bullets(brief.relationshipContext)}`),
    section(`*Recommended plays*\n${bullets(brief.recommendedPlays)}`),
    section(`*Ask these*\n${brief.discoveryQuestions.map((question, index) => `${index + 1}. ${question}`).join("\n")}`),
    ...(brief.watchOuts.length ? [section(`*Watch-outs*\n${bullets(brief.watchOuts)}`)] : []),
    { type: "context", elements: [{ type: "mrkdwn", text: sourceLinks ? `Sources: ${sourceLinks}` : "Sources: no linked evidence" }] },
  ];
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
  const blocks = briefToSlackBlocks(brief);
  const text = `Pre-call brief for ${brief.accountName}: ${brief.whyNow}`;

  if (config.DRY_RUN === "true") return { delivered: false, mode: "dry-run" as const, blocks };
  if (config.SLACK_BOT_TOKEN) {
    let channel = config.SLACK_CHANNEL_ID;
    if (meeting.ownerSlackId) {
      const opened = await slackApi<{ ok: boolean; channel?: { id?: string }; error?: string }>("conversations.open", { users: meeting.ownerSlackId });
      if (!opened.ok || !opened.channel?.id) throw new Error(`Slack DM failed: ${opened.error ?? "no channel"}`);
      channel = opened.channel.id;
    }
    if (!channel) throw new Error("Set SLACK_CHANNEL_ID or map the meeting owner to a Slack member ID");
    const posted = await slackApi<{ ok: boolean; error?: string }>("chat.postMessage", { channel, text, blocks, unfurl_links: false });
    if (!posted.ok) throw new Error(`Slack delivery failed: ${posted.error ?? "unknown error"}`);
    return { delivered: true, mode: "bot" as const };
  }
  if (config.SLACK_WEBHOOK_URL) {
    const response = await fetch(config.SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text, blocks }),
    });
    if (!response.ok) throw new Error(`Slack webhook delivery failed (${response.status})`);
    return { delivered: true, mode: "webhook" as const };
  }
  return { delivered: false, mode: "unconfigured" as const, blocks };
}
