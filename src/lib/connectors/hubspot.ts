import { getConfig } from "@/lib/config";
import type { ConnectorResult, Meeting, ResearchConnector } from "@/lib/domain";
import { fetchJson } from "@/lib/http";

type SearchResult = { id: string; properties: Record<string, string | null> };

export class HubSpotConnector implements ResearchConnector {
  readonly name = "crm" as const;

  isConfigured() {
    return Boolean(getConfig().HUBSPOT_ACCESS_TOKEN);
  }

  private async search(object: "companies" | "deals", body: unknown) {
    const token = getConfig().HUBSPOT_ACCESS_TOKEN;
    return fetchJson<{ results?: SearchResult[] }>(
      "hubspot",
      `https://api.hubapi.com/crm/v3/objects/${object}/search`,
      {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify(body),
      },
    );
  }

  async research(meeting: Meeting): Promise<ConnectorResult> {
    if (!this.isConfigured()) return { connector: this.name, evidence: [], status: "skipped", message: "HubSpot token not configured" };

    try {
      const companies = await this.search("companies", {
        filterGroups: [{ filters: [{ propertyName: "domain", operator: "EQ", value: meeting.account.domain }] }],
        properties: ["name", "domain", "industry", "numberofemployees", "annualrevenue", "description", "hs_lastmodifieddate"],
        limit: 1,
      });
      const company = companies.results?.[0];
      if (!company) return { connector: this.name, evidence: [], status: "ok", message: "No matching CRM company" };

      const deals = await this.search("deals", {
        filterGroups: [{ filters: [{ propertyName: "associations.company", operator: "EQ", value: company.id }] }],
        properties: ["dealname", "amount", "dealstage", "pipeline", "closedate", "hs_lastmodifieddate"],
        limit: 10,
      });
      const companyDetail = [
        company.properties.industry && `Industry: ${company.properties.industry}`,
        company.properties.numberofemployees && `Employees: ${company.properties.numberofemployees}`,
        company.properties.annualrevenue && `Revenue: ${company.properties.annualrevenue}`,
        company.properties.description,
      ].filter(Boolean).join(". ");

      return {
        connector: this.name,
        status: "ok",
        evidence: [
          ...(companyDetail ? [{ source: "crm" as const, title: `${company.properties.name ?? meeting.account.name} account`, detail: companyDetail, confidence: "high" as const }] : []),
          ...(deals.results ?? []).slice(0, 5).map((deal) => ({
            source: "crm" as const,
            title: deal.properties.dealname ?? "CRM opportunity",
            detail: [
              deal.properties.amount && `Amount: ${deal.properties.amount}`,
              deal.properties.dealstage && `Stage: ${deal.properties.dealstage}`,
              deal.properties.closedate && `Close date: ${deal.properties.closedate}`,
            ].filter(Boolean).join(". "),
            observedAt: deal.properties.hs_lastmodifieddate ? new Date(deal.properties.hs_lastmodifieddate).toISOString() : undefined,
            confidence: "high" as const,
          })),
        ],
      };
    } catch (error) {
      return { connector: this.name, evidence: [], status: "error", message: error instanceof Error ? error.message : "HubSpot request failed" };
    }
  }
}
