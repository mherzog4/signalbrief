import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clock3,
  GitFork,
  LayoutDashboard,
  MessageSquareText,
  Radio,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  Webhook,
} from "lucide-react";

import { DemoWorkbench } from "@/components/demo-workbench";
import { getConfig, getIntegrationStatus } from "@/lib/config";
import { Logo } from "@/components/logo";
import { getDemoScenarioPreviews } from "@/lib/demo/scenarios";
import { getRepositoryLinks, siteConfig } from "@/lib/site";

export const dynamic = "force-dynamic";

const nav = [
  { label: "Overview", href: "#overview", icon: LayoutDashboard, active: true },
  { label: "Briefs", href: "#brief-preview", icon: Sparkles },
  { label: "Meetings", href: "#meetings", icon: CalendarDays },
  { label: "Sources", href: "#integrations", icon: Radio },
];

export default function DashboardPage() {
  const config = getConfig();
  const scenarios = getDemoScenarioPreviews();
  const meeting = scenarios[0].meeting;
  const liveOpenRouter = config.DEMO_USE_LIVE_AI === "true" && config.AI_PROVIDER === "openrouter";
  const slackDeliveryEnabled = config.DEMO_SLACK_DELIVERY_ENABLED === "true"
    && config.DRY_RUN !== "true"
    && getIntegrationStatus(config).slack;
  const repositoryUrl = process.env.NEXT_PUBLIC_GITHUB_URL ?? siteConfig.repositoryUrl;
  const repositoryLinks = getRepositoryLinks(repositoryUrl);
  const todayLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Logo />
        <nav aria-label="Primary navigation">
          <p>Workspace</p>
          {nav.map(({ label, href, icon: Icon, active }) => <a className={active ? "nav-item active" : "nav-item"} href={href} key={label}><Icon size={17} />{label}</a>)}
          <p className="nav-group">Manage</p>
          <a className="nav-item" href="#integrations"><Webhook size={17} />Integrations</a>
          <a className="nav-item" href={repositoryLinks.configuration} target="_blank" rel="noreferrer"><Settings size={17} />Configuration</a>
        </nav>
        <div className="sidebar-bottom">
          <div className="setup-card">
            <div className="setup-icon"><ShieldCheck size={17} /></div>
            <strong>Your keys. Your data.</strong>
            <p>Signalbrief runs in your Vercel account. Credentials never leave your deployment.</p>
            <a href={repositoryLinks.deployment} target="_blank" rel="noreferrer">Deployment guide <ArrowRight size={13} /></a>
          </div>
          <a className="nav-item" href={repositoryLinks.documentation} target="_blank" rel="noreferrer"><BookOpen size={17} />Documentation</a>
          <a className="nav-item" href={repositoryLinks.help} target="_blank" rel="noreferrer"><CircleHelp size={17} />Get help</a>
          <div className="profile"><span>MH</span><div><strong>Matt’s workspace</strong><small>Open-source edition</small></div><ChevronRight size={15} /></div>
        </div>
      </aside>

      <main>
        <header className="topbar">
          <div className="mobile-logo"><Logo compact /></div>
          <div className="status-pill"><i /> {liveOpenRouter ? "Live via OpenRouter" : "Synthetic demo"}{slackDeliveryEnabled ? " · Slack ready" : " · ready"}</div>
          <a className="github-button" href={repositoryUrl} target="_blank" rel="noreferrer"><GitFork size={16} /> Star on GitHub</a>
        </header>

        <div className="page-content" id="overview">
          <div className="welcome-row">
            <div><p className="eyebrow">{todayLabel}</p><h1>Good morning, Matt.</h1><p>Your sellers have <strong>3 customer calls</strong> today. Here’s what Signalbrief is preparing.</p></div>
            <a className="primary-action" href="#brief-preview"><Sparkles size={16} /> Preview next brief</a>
          </div>

          <section className="metrics" aria-label="Today’s metrics">
            <article><span className="metric-icon coral"><CalendarDays size={18} /></span><div><p>Customer meetings</p><strong>3</strong><small><i /> 2 briefs ready</small></div></article>
            <article><span className="metric-icon mint"><Clock3 size={18} /></span><div><p>Prep time saved</p><strong>42 min</strong><small>Today</small></div></article>
            <article><span className="metric-icon violet"><MessageSquareText size={18} /></span><div><p>Signals surfaced</p><strong>17</strong><small>Across 4 sources</small></div></article>
          </section>

          <div className="dashboard-grid">
            <section className="panel upcoming" id="meetings">
              <div className="panel-head"><div><p className="eyebrow">Up next</p><h2>Today’s meetings</h2></div></div>
              <article className="meeting-card active-meeting">
                <div className="time-column"><strong>10:30</strong><span>AM</span><i /></div>
                <div className="meeting-detail"><div className="meeting-title"><span className="company-mark acme">O</span><div><strong>{meeting.title}</strong><p>in 24 minutes · 30 min</p></div></div><div className="attendees"><Users size={14} /><span>{meeting.attendees.filter((attendee) => attendee.external).map((attendee) => attendee.name).join(", ")}</span></div><div className="ready-tag"><CheckCircle2 size={14} /> Brief ready</div></div>
                <a href="#brief-preview">Open <ChevronRight size={15} /></a>
              </article>
              <article className="meeting-card">
                <div className="time-column"><strong>1:00</strong><span>PM</span><i /></div>
                <div className="meeting-detail"><div className="meeting-title"><span className="company-mark northstar">N</span><div><strong>Northstar — Technical validation</strong><p>in 2 hours · 45 min</p></div></div><div className="attendees"><Users size={14} /><span>Jordan Lee + 2</span></div><div className="working-tag"><span className="pulse" /> Researching</div></div>
              </article>
              <article className="meeting-card">
                <div className="time-column"><strong>3:30</strong><span>PM</span><i /></div>
                <div className="meeting-detail"><div className="meeting-title"><span className="company-mark lumen">L</span><div><strong>Lumen Labs — First conversation</strong><p>in 5 hours · 30 min</p></div></div><div className="attendees"><Users size={14} /><span>Sam Okafor</span></div><div className="queued-tag"><Clock3 size={13} /> Queued for 3:00</div></div>
              </article>
            </section>

            <section className="panel integrations" id="integrations">
              <div className="panel-head"><div><p className="eyebrow">Source health</p><h2>Connected signals</h2></div><span className="count-badge">4 simulated</span></div>
              <div className="source-list">
                <Source icon="G" color="blue" name="Google Calendar" detail="Synthetic meeting feed" />
                <Source icon="G" color="purple" name="Gong" detail="Conversation fixtures" />
                <Source icon="H" color="orange" name="HubSpot" detail="CRM opportunity fixtures" />
                <Source icon="↗" color="green" name="Public web" detail="News + hiring fixtures" />
              </div>
              <a className="manage-link" href={repositoryLinks.configuration} target="_blank" rel="noreferrer">Configure sources <ArrowRight size={14} /></a>
            </section>
          </div>

          <DemoWorkbench
            scenarios={scenarios}
            slackDeliveryEnabled={slackDeliveryEnabled}
          />

          <section className="how-section" id="how-it-works">
            <div><p className="eyebrow">Built for the moment before</p><h2>Research that arrives when it matters.</h2></div>
            <div className="steps">
              <article><span>01</span><CalendarDays size={20} /><strong>Watch the calendar</strong><p>Find external meetings inside your configurable prep window.</p></article>
              <article><span>02</span><Radio size={20} /><strong>Gather real signals</strong><p>Fan out across Gong, CRM, and fresh public company data.</p></article>
              <article><span>03</span><Sparkles size={20} /><strong>Compile the angle</strong><p>Turn evidence into a concise, sourced, role-aware account brief.</p></article>
              <article><span>04</span><MessageSquareText size={20} /><strong>Meet sellers in Slack</strong><p>Deliver it directly where the AE already works—just in time.</p></article>
            </div>
          </section>

          <footer><Logo /><p>Open source · BYOK · Built for revenue teams who value signal over noise.</p><a href={repositoryUrl} target="_blank" rel="noreferrer"><GitFork size={15} /> GitHub</a></footer>
        </div>
      </main>
    </div>
  );
}

function Source({ icon, color, name, detail }: { icon: string; color: string; name: string; detail: string }) {
  return <div className="source-row"><span className={`source-icon ${color}`}>{icon}</span><div><strong>{name}</strong><p>{detail}</p></div><span className="connected-dot"><i />Mock adapter</span></div>;
}
