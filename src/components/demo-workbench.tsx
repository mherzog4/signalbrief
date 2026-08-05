"use client";

import { Check, ChevronRight, Database, Globe2, LoaderCircle, Mic2, Play, Route, Sparkles } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import type { ConnectorResult, Evidence, MeetingBrief } from "@/lib/domain";
import type { DemoScenarioPreview } from "@/lib/demo/scenarios";

type DemoRunResult = {
  brief: MeetingBrief;
  evidence: Evidence[];
  connectorResults: ConnectorResult[];
  generationDurationMs: number;
  delivery?: {
    delivered: boolean;
    mode: "webhook" | "bot" | "dry-run" | "unconfigured" | "error";
    error?: string;
  };
  trace: {
    runId: string;
    mode: "live" | "fixture";
    provider: string;
    model: string;
    totalDurationMs: number;
    generatedAt: string;
  };
};

const phases = ["Reading calendar", "Gathering revenue signals", "Compiling account brief"];
const sourceMeta = {
  gong: { label: "Gong", icon: Mic2 },
  crm: { label: "HubSpot", icon: Database },
  web: { label: "Public web", icon: Globe2 },
} as const;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function DemoWorkbench({
  scenarios,
  slackDeliveryEnabled,
}: {
  scenarios: DemoScenarioPreview[];
  slackDeliveryEnabled: boolean;
}) {
  const [activeId, setActiveId] = useState(scenarios[0].id);
  const [brief, setBrief] = useState(scenarios[0].brief);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState(-1);
  const [result, setResult] = useState<DemoRunResult>();
  const [error, setError] = useState<string>();
  const runSequence = useRef(0);
  const activeScenario = useMemo(
    () => scenarios.find((scenario) => scenario.id === activeId) ?? scenarios[0],
    [activeId, scenarios],
  );

  function selectScenario(id: string) {
    const scenario = scenarios.find((candidate) => candidate.id === id);
    if (!scenario || running) return;
    setActiveId(id);
    setBrief(scenario.brief);
    setResult(undefined);
    setError(undefined);
    setPhase(-1);
  }

  async function runDemo() {
    const sequence = ++runSequence.current;
    setRunning(true);
    setError(undefined);
    setResult(undefined);
    setPhase(0);

    try {
      const request = fetch("/api/demo/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ scenarioId: activeId, deliverToSlack: slackDeliveryEnabled }),
      });
      await wait(420);
      if (sequence !== runSequence.current) return;
      setPhase(1);
      await wait(520);
      if (sequence !== runSequence.current) return;
      setPhase(2);

      const response = await request;
      const payload = await response.json() as DemoRunResult & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Demo run failed");
      await wait(360);
      if (sequence !== runSequence.current) return;
      setBrief(payload.brief);
      setResult(payload);
      setPhase(3);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Demo run failed");
      setPhase(-1);
    } finally {
      if (sequence === runSequence.current) setRunning(false);
    }
  }

  return (
    <section className="workbench" id="brief-preview" aria-labelledby="preview-title">
      <div className="section-heading demo-heading">
        <div>
          <p className="eyebrow">Interactive production simulation</p>
          <h2 id="preview-title">Run the brief pipeline</h2>
        </div>
        <button className="run-button" onClick={runDemo} disabled={running}>
          {running ? <LoaderCircle size={16} className="spin" /> : <Play size={15} fill="currentColor" />}
          {running
            ? phases[Math.min(phase, 2)]
            : result
              ? slackDeliveryEnabled ? "Generate + send again" : "Run again"
              : slackDeliveryEnabled ? "Generate + send to Slack" : "Generate brief"}
        </button>
      </div>

      <div className="scenario-bar" aria-label="Choose a synthetic meeting">
        <div className="scenario-copy">
          <span className="simulation-dot" />
          <div><strong>Synthetic workspace</strong><p>Real orchestration · no customer data</p></div>
        </div>
        <div className="scenario-tabs">
          {scenarios.map((scenario) => (
            <button
              aria-pressed={scenario.id === activeId}
              disabled={running}
              key={scenario.id}
              onClick={() => selectScenario(scenario.id)}
            >
              <strong>{scenario.label}</strong>
              <span>{scenario.stage}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="scenario-summary">
        <span>{activeScenario.stage}</span>
        <p>{activeScenario.summary}</p>
        <small>{activeScenario.meeting.attendees.filter((attendee) => attendee.external).map((attendee) => `${attendee.name} · ${attendee.title}`).join("  •  ")}</small>
      </div>

      {running && (
        <div className="pipeline-progress" role="status" aria-live="polite">
          {phases.map((label, index) => (
            <div className={index < phase ? "phase done" : index === phase ? "phase active" : "phase"} key={label}>
              <span>{index < phase ? <Check size={12} /> : index + 1}</span>
              {label}
            </div>
          ))}
        </div>
      )}
      {error && <div className="demo-error" role="alert">{error}</div>}

      <div className={`slack-shell ${running ? "researching" : ""}`}>
        <div className="slack-rail" aria-hidden="true">
          <span className="workspace-badge">S</span>
          <span className="rail-dot active" />
          <span className="rail-dot" />
          <span className="rail-dot" />
        </div>
        <div className="slack-channel">
          <div className="channel-head">
            <div><strong># account-prep</strong><span>JIT briefs for your next customer call</span></div>
            <div className="avatar-stack"><span>MC</span><span>AR</span><span>PS</span></div>
          </div>
          <div className="slack-message">
            <div className="bot-avatar"><Sparkles size={18} /></div>
            <div className="message-body">
              <div className="message-meta"><strong>Signalbrief</strong><em>APP</em><span>just now</span></div>
              <div className="brief-card">
                <div className="brief-accent" />
                <div className="brief-content">
                  <p className="brief-kicker">PRE-CALL BRIEF · {activeScenario.stage.toUpperCase()}</p>
                  <h3>{brief.accountName}</h3>
                  <p className="meeting-name">{brief.meetingTitle} <span>· {brief.confidence} confidence</span></p>
                  <div className="brief-section why-now"><strong>Why now</strong><p>{brief.whyNow}</p></div>
                  <div className="brief-grid">
                    <div className="brief-section"><strong>Account in 30 seconds</strong><ul>{brief.accountSnapshot.map((item) => <li key={item}>{item}</li>)}</ul></div>
                    <div className="brief-section"><strong>What we already know</strong><ul>{brief.relationshipContext.map((item) => <li key={item}>{item}</li>)}</ul></div>
                  </div>
                  <div className="brief-section plays"><strong>Your play</strong>{brief.recommendedPlays.slice(0, 3).map((item, index) => <p key={item}><span>{index + 1}</span>{item}</p>)}</div>
                  <div className="brief-footer"><span>Gong</span><span>HubSpot</span><span>Public web</span>{result?.trace.provider === "openrouter" && <span>OpenRouter AI</span>}<a href="#execution-trace">Inspect run <ChevronRight size={13} /></a></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="execution-panel" id="execution-trace">
        <div className="execution-head">
          <div><p className="eyebrow">Execution trace</p><h3>{result ? "Pipeline completed" : "Production-shaped by design"}</h3></div>
          {result && <span className={result.trace.mode === "live" ? "trace-mode live" : "trace-mode"}>{result.trace.mode === "live" ? "Live via OpenRouter" : "Curated fixture"}</span>}
        </div>
        <div className="trace-grid">
          {(["gong", "crm", "web"] as const).map((source) => {
            const trace = result?.connectorResults.find((item) => item.connector === source);
            const SourceIcon = sourceMeta[source].icon;
            return (
              <article key={source}>
                <span className={`trace-icon ${source}`}><SourceIcon size={15} /></span>
                <div><strong>{sourceMeta[source].label}</strong><p>{trace ? `${trace.evidence.length} signals · ${trace.durationMs}ms` : "Mock adapter ready"}</p></div>
                <i className={trace?.status === "error" ? "error" : "ok"}>{trace?.status === "error" ? "Error" : trace ? "Done" : "Ready"}</i>
              </article>
            );
          })}
          <article>
            <span className="trace-icon model"><Route size={15} /></span>
            <div><strong>{result?.trace.mode === "live" ? "OpenRouter" : "AI compiler"}</strong><p>{result ? `${result.trace.model} · ${result.generationDurationMs}ms` : "Structured output ready"}</p></div>
            <i className="ok">{result ? "Done" : "Ready"}</i>
          </article>
        </div>

        {result ? (
          <div className="evidence-panel">
            <div className="evidence-title"><strong>Normalized evidence</strong><span>{result.evidence.length} records · run {result.trace.runId.slice(0, 8)} · {result.trace.totalDurationMs}ms total</span></div>
            <div className="evidence-list">
              {result.evidence.slice(0, 6).map((item) => (
                <article key={`${item.source}-${item.title}`}>
                  <span>{item.source === "calendar" ? "Calendar" : sourceMeta[item.source].label}</span>
                  <div><strong>{item.title}</strong><p>{item.detail}</p></div>
                  <small>{item.confidence}</small>
                </article>
              ))}
            </div>
          </div>
        ) : (
          <p className="execution-note">Generate a brief to inspect normalized evidence, independent connector timings, model mode, and the exact payload rendered into Slack.</p>
        )}
        {result?.delivery?.delivered && (
          <p className="synthetic-note"><Check size={12} /> Delivered to Slack via {result.delivery.mode}.</p>
        )}
        {result?.delivery?.mode === "error" && (
          <p className="synthetic-note">{result.delivery.error}</p>
        )}
        <p className="synthetic-note"><Check size={12} /> Gong, HubSpot, and public records are synthetic. Adapter contracts, parallel fan-out, schema validation, trace timings, and Slack rendering are production code.</p>
      </div>
    </section>
  );
}
