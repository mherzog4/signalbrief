export class UpstreamError extends Error {
  constructor(
    readonly service: string,
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "UpstreamError";
  }
}

export async function fetchJson<T>(
  service: string,
  input: string | URL,
  init: RequestInit = {},
  timeoutMs = 12_000,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
      headers: {
        accept: "application/json",
        ...init.headers,
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new UpstreamError(service, response.status, body.slice(0, 300));
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}
