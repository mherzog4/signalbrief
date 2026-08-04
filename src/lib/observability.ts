type EventData = Record<string, boolean | number | string | undefined>;

export function logEvent(name: string, data: EventData = {}, level: "error" | "info" | "warn" = "info") {
  const payload = JSON.stringify({
    timestamp: new Date().toISOString(),
    service: "signalbrief",
    event: name,
    ...data,
  });
  console[level](payload);
}
