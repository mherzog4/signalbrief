import { getConfig } from "@/lib/config";
import { getDemoMeeting } from "@/lib/demo/data";
import { getDemoScenario } from "@/lib/demo/scenarios";
import type { Meeting } from "@/lib/domain";
import { fetchJson } from "@/lib/http";
import { readGoogleRefreshToken } from "@/lib/store/integration-store";

type GoogleEvent = {
  id?: string;
  summary?: string;
  description?: string;
  start?: { dateTime?: string };
  end?: { dateTime?: string };
  organizer?: { displayName?: string; email?: string };
  attendees?: Array<{ displayName?: string; email?: string; self?: boolean }>;
};

const personalDomains = new Set(["gmail.com", "outlook.com", "hotmail.com", "icloud.com", "yahoo.com"]);
const demoMarkerPattern = /\[signalbrief-demo:([a-z0-9-]+)\]/i;

let cachedGoogleToken: { value: string; expiresAt: number } | undefined;

function demoScenarioIdFromEvent(event: GoogleEvent) {
  return event.description?.match(demoMarkerPattern)?.[1];
}

async function getGoogleAccessToken() {
  const config = getConfig();
  if (config.GOOGLE_ACCESS_TOKEN) return config.GOOGLE_ACCESS_TOKEN;
  if (cachedGoogleToken && cachedGoogleToken.expiresAt > Date.now() + 60_000) return cachedGoogleToken.value;
  if (!config.GOOGLE_CLIENT_ID || !config.GOOGLE_CLIENT_SECRET) return undefined;
  const refreshToken = config.GOOGLE_REFRESH_TOKEN ?? await readGoogleRefreshToken();
  if (!refreshToken) return undefined;

  const token = await fetchJson<{ access_token: string; expires_in?: number }>(
    "google-oauth",
    "https://oauth2.googleapis.com/token",
    {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: config.GOOGLE_CLIENT_ID,
        client_secret: config.GOOGLE_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }).toString(),
    },
  );
  cachedGoogleToken = {
    value: token.access_token,
    expiresAt: Date.now() + (token.expires_in ?? 3_600) * 1_000,
  };
  return cachedGoogleToken.value;
}

export async function isGoogleCalendarConnected() {
  const config = getConfig();
  if (config.GOOGLE_ACCESS_TOKEN || config.GOOGLE_REFRESH_TOKEN) return true;
  try {
    return Boolean(await readGoogleRefreshToken());
  } catch {
    return false;
  }
}

function accountFromEvent(event: GoogleEvent, internalDomains: Set<string>) {
  const external = event.attendees?.find(({ email, self }) => {
    const domain = email?.split("@")[1]?.toLowerCase();
    return !self && domain && !internalDomains.has(domain) && !personalDomains.has(domain);
  });
  const domain = external?.email?.split("@")[1]?.toLowerCase();
  if (!domain) return undefined;

  const titleAccount = event.summary?.split(/\s+[—–-]\s+/)[0]?.trim();
  const domainName = domain
    .split(".")[0]
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return { name: titleAccount || domainName, domain };
}

export async function listUpcomingMeetings(now = new Date()): Promise<Meeting[]> {
  const config = getConfig();
  const accessToken = await getGoogleAccessToken();
  if (!accessToken) {
    return config.DEMO_MODE === "true" ? [getDemoMeeting()] : [];
  }

  const until = new Date(now.getTime() + config.LOOKAHEAD_MINUTES * 60_000);
  const url = new URL(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(config.GOOGLE_CALENDAR_ID)}/events`,
  );
  url.searchParams.set("timeMin", now.toISOString());
  url.searchParams.set("timeMax", until.toISOString());
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");
  url.searchParams.set("maxResults", "20");

  const data = await fetchJson<{ items?: GoogleEvent[] }>("google-calendar", url, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  const internalDomains = new Set(
    config.INTERNAL_DOMAINS.split(",").map((value) => value.trim().toLowerCase()).filter(Boolean),
  );
  let slackUserMap: Record<string, string> = {};
  try {
    slackUserMap = JSON.parse(config.SLACK_USER_MAP) as Record<string, string>;
  } catch {
    // Invalid optional mapping should not block calendar ingestion.
  }

  return (data.items ?? []).flatMap((event): Meeting[] => {
    const demoScenarioId = config.DEMO_MODE === "true" ? demoScenarioIdFromEvent(event) : undefined;
    const demoScenario = demoScenarioId ? getDemoScenario(demoScenarioId, now) : undefined;
    const account = accountFromEvent(event, internalDomains) ?? demoScenario?.meeting.account;
    if (!event.id || !event.start?.dateTime || !event.end?.dateTime || !account) return [];

    const attendees = (event.attendees ?? []).flatMap((attendee) => {
      if (!attendee.email) return [];
      const domain = attendee.email.split("@")[1]?.toLowerCase();
      return [{
        name: attendee.displayName ?? attendee.email.split("@")[0],
        email: attendee.email,
        external: !attendee.self && !internalDomains.has(domain),
      }];
    });
    if (demoScenario && !attendees.some((attendee) => attendee.external)) {
      attendees.push(...demoScenario.meeting.attendees.filter((attendee) => attendee.external));
    }

    return [{
      id: event.id,
      title: event.summary ?? `Meeting with ${account.name}`,
      startsAt: new Date(event.start.dateTime).toISOString(),
      endsAt: new Date(event.end.dateTime).toISOString(),
      ownerName: event.organizer?.displayName ?? event.organizer?.email?.split("@")[0] ?? "Account executive",
      ownerSlackId: event.organizer?.email ? slackUserMap[event.organizer.email.toLowerCase()] : undefined,
      demoScenarioId: demoScenario?.id,
      attendees,
      account,
    }];
  });
}

export const __testables = { demoScenarioIdFromEvent };
