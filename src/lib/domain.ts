import { z } from "zod";

export const attendeeSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  title: z.string().optional(),
  external: z.boolean(),
});

export const meetingSchema = z.object({
  id: z.string(),
  title: z.string(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  ownerName: z.string(),
  ownerSlackId: z.string().optional(),
  attendees: z.array(attendeeSchema),
  account: z.object({
    name: z.string(),
    domain: z.string(),
  }),
});

export type Meeting = z.infer<typeof meetingSchema>;

export const evidenceSchema = z.object({
  source: z.enum(["calendar", "gong", "crm", "web"]),
  title: z.string(),
  detail: z.string(),
  url: z.string().url().optional(),
  observedAt: z.string().datetime().optional(),
  confidence: z.enum(["high", "medium", "low"]).default("medium"),
});

export type Evidence = z.infer<typeof evidenceSchema>;

export const meetingBriefSchema = z.object({
  accountName: z.string(),
  meetingTitle: z.string(),
  meetingTime: z.string(),
  whyNow: z.string().max(280),
  accountSnapshot: z.array(z.string().max(180)).min(2).max(4),
  relationshipContext: z.array(z.string().max(180)).min(1).max(4),
  recommendedPlays: z.array(z.string().max(180)).min(2).max(4),
  discoveryQuestions: z.array(z.string().max(180)).min(2).max(4),
  watchOuts: z.array(z.string().max(180)).max(3),
  sources: z.array(
    z.object({
      label: z.string(),
      url: z.string().url().optional(),
    }),
  ).max(6),
  confidence: z.enum(["high", "medium", "low"]),
  generatedAt: z.string().datetime(),
});

export type MeetingBrief = z.infer<typeof meetingBriefSchema>;

export type ConnectorResult = {
  connector: "gong" | "crm" | "web";
  evidence: Evidence[];
  status: "ok" | "skipped" | "error";
  message?: string;
  durationMs?: number;
};

export interface ResearchConnector {
  readonly name: ConnectorResult["connector"];
  isConfigured(): boolean;
  research(meeting: Meeting): Promise<ConnectorResult>;
}
