"use client";

import { useState } from "react";
import { CalendarCheck2, ExternalLink, KeyRound, LoaderCircle } from "lucide-react";

type CalendarConnectProps = {
  connected: boolean;
  oauthConfigured: boolean;
  configurationUrl: string;
  outcome?: "connected" | "error";
};

export function CalendarConnect({ connected, oauthConfigured, configurationUrl, outcome }: CalendarConnectProps) {
  const [adminKey, setAdminKey] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [showReconnect, setShowReconnect] = useState(false);
  const [message, setMessage] = useState(
    outcome === "connected"
      ? "Calendar connected. Scheduled scans can now read upcoming events."
      : outcome === "error"
        ? "Google could not be connected. Check the callback URL and try again."
        : "",
  );

  async function connect() {
    setConnecting(true);
    setMessage("");
    try {
      const response = await fetch("/api/integrations/google/start", {
        method: "POST",
        headers: { authorization: `Bearer ${adminKey}` },
      });
      const result = await response.json() as { authorizationUrl?: string; error?: string };
      if (!response.ok || !result.authorizationUrl) throw new Error(result.error ?? "Unable to start Google OAuth");
      window.location.assign(result.authorizationUrl);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to connect Google Calendar");
      setConnecting(false);
    }
  }

  if (!oauthConfigured) {
    return (
      <div className="calendar-connect setup-required">
        <KeyRound size={15} />
        <div><strong>Enable calendar connection</strong><p>Add Google OAuth, Upstash, and admin credentials to this deployment.</p></div>
        <a href={configurationUrl} target="_blank" rel="noreferrer">Setup <ExternalLink size={11} /></a>
      </div>
    );
  }

  if (connected && !showReconnect) {
    return (
      <div className="calendar-connect connected-calendar">
        <CalendarCheck2 size={16} />
        <div><strong>Calendar connected</strong><p>Upcoming events can trigger the scheduled research loop.</p>{message ? <small>{message}</small> : null}</div>
        <button type="button" onClick={() => setShowReconnect(true)}>Reconnect</button>
      </div>
    );
  }

  return (
    <div className="calendar-connect connect-form">
      <div><strong>{connected ? "Reconnect Google Calendar" : "Connect Google Calendar"}</strong><p>Your admin key is sent once to authorize this action and is never stored in the browser.</p></div>
      <label>
        <span>Admin key</span>
        <input
          type="password"
          value={adminKey}
          onChange={(event) => setAdminKey(event.target.value)}
          placeholder="ADMIN_API_KEY"
          autoComplete="off"
        />
      </label>
      <button type="button" disabled={connecting || adminKey.length < 16} onClick={connect}>
        {connecting ? <LoaderCircle className="spin" size={13} /> : <CalendarCheck2 size={13} />}
        {connecting ? "Opening Google…" : "Connect"}
      </button>
      {message ? <small>{message}</small> : null}
    </div>
  );
}
