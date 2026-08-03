import { getConfig } from "@/lib/config";
import { getDemoMeeting } from "@/lib/demo/data";
import type { Meeting } from "@/lib/domain";
import { fetchJson } from "@/lib/http";

type GoogleEvent = {
  id?: string;
  summary?: string;
  start?: { dateTime?: string };
  end?: { dateTime?: string };
  organizer?: { displayName?: string; email?: string };
  attendees?: Array<{ displayName?: string; email?: string; self?: boolean }>;
};

const personalDomains = new Set(["gmail.com", "outlook.com", "hotmail.com", "icloud.com", "yahoo.com"]);

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
  if (!config.GOOGLE_ACCESS_TOKEN) {
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
    headers: { authorization: `Bearer ${config.GOOGLE_ACCESS_TOKEN}` },
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
    const account = accountFromEvent(event, internalDomains);
    if (!event.id || !event.start?.dateTime || !event.end?.dateTime || !account) return [];

    return [{
      id: event.id,
      title: event.summary ?? `Meeting with ${account.name}`,
      startsAt: new Date(event.start.dateTime).toISOString(),
      endsAt: new Date(event.end.dateTime).toISOString(),
      ownerName: event.organizer?.displayName ?? event.organizer?.email?.split("@")[0] ?? "Account executive",
      ownerSlackId: event.organizer?.email ? slackUserMap[event.organizer.email.toLowerCase()] : undefined,
      attendees: (event.attendees ?? []).flatMap((attendee) => {
        if (!attendee.email) return [];
        const domain = attendee.email.split("@")[1]?.toLowerCase();
        return [{
          name: attendee.displayName ?? attendee.email.split("@")[0],
          email: attendee.email,
          external: !attendee.self && !internalDomains.has(domain),
        }];
      }),
      account,
    }];
  });
}
