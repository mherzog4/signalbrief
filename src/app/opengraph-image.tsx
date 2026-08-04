import { ImageResponse } from "next/og";

export const alt = "Signalbrief — just-in-time account research delivered in Slack";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function SignalMark({ compact = false }: { compact?: boolean }) {
  const height = compact ? 38 : 48;
  return (
    <div style={{ alignItems: "flex-end", background: "#183b35", borderRadius: compact ? 8 : 12, display: "flex", gap: compact ? 3 : 4, height, justifyContent: "center", paddingBottom: compact ? 10 : 12, width: height }}>
      {[10, 18, 14].map((barHeight) => <div key={barHeight} style={{ background: "#d9f99d", borderRadius: 3, height: compact ? barHeight * 0.75 : barHeight, width: compact ? 3 : 4 }} />)}
    </div>
  );
}

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background: "#f5f7f3",
        color: "#18201e",
        display: "flex",
        fontFamily: "Arial, sans-serif",
        height: "100%",
        justifyContent: "space-between",
        padding: "64px 72px",
        width: "100%",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", maxWidth: 610 }}>
        <div style={{ alignItems: "center", display: "flex", fontSize: 27, fontWeight: 700, gap: 13 }}>
          <SignalMark />
          signalbrief
        </div>
        <div style={{ color: "#183b35", fontSize: 66, fontWeight: 750, letterSpacing: "-3px", lineHeight: 1.02, marginTop: 58 }}>
          Walk into every call ready.
        </div>
        <div style={{ color: "#69736f", fontSize: 25, lineHeight: 1.45, marginTop: 25 }}>
          JIT account research from calendar, Gong, CRM, and public signals—delivered in Slack.
        </div>
        <div style={{ color: "#183b35", display: "flex", fontSize: 18, fontWeight: 700, gap: 22, marginTop: 38 }}>
          <span>OPEN SOURCE</span><span>·</span><span>BYOK</span><span>·</span><span>OPENROUTER</span>
        </div>
      </div>

      <div style={{ background: "#ffffff", border: "1px solid #dfe5e1", borderRadius: 22, boxShadow: "0 20px 60px rgba(24,59,53,.12)", display: "flex", flexDirection: "column", padding: "27px", transform: "rotate(1.5deg)", width: 395 }}>
        <div style={{ alignItems: "center", display: "flex", fontSize: 18, fontWeight: 700, gap: 12 }}>
          <SignalMark compact />
          Signalbrief <span style={{ background: "#edf2ef", borderRadius: 5, color: "#69736f", fontSize: 11, padding: "4px 6px" }}>APP</span>
        </div>
        <div style={{ borderLeft: "5px solid #f0715b", display: "flex", flexDirection: "column", marginTop: 24, paddingLeft: 20 }}>
          <div style={{ color: "#f0715b", fontSize: 13, fontWeight: 800, letterSpacing: 1.3 }}>PRE-CALL BRIEF</div>
          <div style={{ fontSize: 31, fontWeight: 750, marginTop: 10 }}>Northstar Systems</div>
          <div style={{ color: "#69736f", fontSize: 15, marginTop: 6 }}>Technical validation · high confidence</div>
          <div style={{ fontSize: 15, fontWeight: 750, marginTop: 23 }}>Why now</div>
          <div style={{ color: "#4f5955", fontSize: 16, lineHeight: 1.45, marginTop: 7 }}>$240k decision with security review on the critical path.</div>
          <div style={{ display: "flex", gap: 8, marginTop: 24 }}>
            {["Gong", "HubSpot", "Public web"].map((label) => <span key={label} style={{ background: "#f1f4f2", borderRadius: 999, color: "#59635f", fontSize: 12, padding: "7px 10px" }}>{label}</span>)}
          </div>
        </div>
      </div>
    </div>,
    size,
  );
}
