import type { ConnectorResult, Evidence, ResearchConnector } from "@/lib/domain";

const connectorDelays = { gong: 180, crm: 110, web: 260 } as const;

export class MockResearchConnector implements ResearchConnector {
  constructor(
    readonly name: ConnectorResult["connector"],
    private readonly evidence: Evidence[],
  ) {}

  isConfigured() {
    return true;
  }

  async research(): Promise<ConnectorResult> {
    await new Promise((resolve) => setTimeout(resolve, connectorDelays[this.name]));
    return {
      connector: this.name,
      evidence: this.evidence.filter((item) => item.source === this.name),
      status: "ok",
      message: this.evidence.some((item) => item.source === this.name)
        ? "Synthetic fixture loaded"
        : "No matching synthetic records",
    };
  }
}

export function createMockConnectors(evidence: Evidence[]): ResearchConnector[] {
  return [
    new MockResearchConnector("gong", evidence),
    new MockResearchConnector("crm", evidence),
    new MockResearchConnector("web", evidence),
  ];
}
