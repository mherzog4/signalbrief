import "server-only";

import { z } from "zod";

const optionalUrl = z.string().url().optional().or(z.literal(""));

const envSchema = z.object({
  CRON_SECRET: z.string().min(16).optional(),
  ADMIN_API_KEY: z.string().min(16).optional(),
  AI_PROVIDER: z.enum(["openrouter", "openai", "anthropic"]).default("openrouter"),
  AI_MODEL: z.string().default("openai/gpt-5-mini"),
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_APP_NAME: z.string().default("Signalbrief"),
  OPENROUTER_APP_URL: optionalUrl,
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_BASE_URL: optionalUrl,
  ANTHROPIC_API_KEY: z.string().optional(),
  GOOGLE_CALENDAR_ID: z.string().default("primary"),
  GOOGLE_ACCESS_TOKEN: z.string().optional(),
  INTERNAL_DOMAINS: z.string().default(""),
  LOOKAHEAD_MINUTES: z.coerce.number().int().min(10).max(240).default(45),
  GONG_ACCESS_KEY: z.string().optional(),
  GONG_ACCESS_SECRET: z.string().optional(),
  GONG_API_BASE_URL: z.string().url().default("https://api.gong.io"),
  HUBSPOT_ACCESS_TOKEN: z.string().optional(),
  TAVILY_API_KEY: z.string().optional(),
  SLACK_WEBHOOK_URL: optionalUrl,
  SLACK_BOT_TOKEN: z.string().optional(),
  SLACK_CHANNEL_ID: z.string().optional(),
  SLACK_USER_MAP: z.string().default("{}"),
  UPSTASH_REDIS_REST_URL: optionalUrl,
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  DEMO_MODE: z.enum(["true", "false"]).default("true"),
  DEMO_USE_LIVE_AI: z.enum(["true", "false"]).default("false"),
  DEMO_RATE_LIMIT_PER_MINUTE: z.coerce.number().int().min(1).max(120).default(12),
  DRY_RUN: z.enum(["true", "false"]).default("false"),
});

export type AppConfig = z.infer<typeof envSchema>;

let cachedConfig: AppConfig | undefined;

export function getConfig(): AppConfig {
  cachedConfig ??= envSchema.parse(process.env);
  return cachedConfig;
}

export type IntegrationName = "calendar" | "gong" | "crm" | "web" | "ai" | "slack" | "dedupe";

export function getIntegrationStatus(config = getConfig()): Record<IntegrationName, boolean> {
  return {
    calendar: Boolean(config.GOOGLE_ACCESS_TOKEN),
    gong: Boolean(config.GONG_ACCESS_KEY && config.GONG_ACCESS_SECRET),
    crm: Boolean(config.HUBSPOT_ACCESS_TOKEN),
    web: Boolean(config.TAVILY_API_KEY),
    ai: Boolean(config.AI_PROVIDER === "openrouter"
      ? config.OPENROUTER_API_KEY
      : config.AI_PROVIDER === "openai"
        ? config.OPENAI_API_KEY
        : config.ANTHROPIC_API_KEY),
    slack: Boolean(config.SLACK_WEBHOOK_URL || (config.SLACK_BOT_TOKEN && config.SLACK_CHANNEL_ID)),
    dedupe: Boolean(config.UPSTASH_REDIS_REST_URL && config.UPSTASH_REDIS_REST_TOKEN),
  };
}
