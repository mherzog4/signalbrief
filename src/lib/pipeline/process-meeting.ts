import "server-only";

import { deliverBrief } from "@/lib/delivery/slack";
import { createMockConnectors } from "@/lib/connectors/mock";
import { getDemoScenario } from "@/lib/demo/scenarios";
import type { Meeting } from "@/lib/domain";
import { compileMeetingBrief } from "@/lib/pipeline/compile-brief";
import { createDeliveryStore, type DeliveryStore } from "@/lib/store/delivery-store";

export async function processMeeting(meeting: Meeting, store: DeliveryStore = createDeliveryStore()) {
  const key = `signalbrief:meeting:${meeting.id}:${meeting.startsAt}`;
  const acquired = await store.acquire(key);
  if (!acquired) return { status: "duplicate" as const, meetingId: meeting.id };

  try {
    const demoScenario = meeting.demoScenarioId ? getDemoScenario(meeting.demoScenarioId) : undefined;
    const compiled = await compileMeetingBrief(
      meeting,
      demoScenario ? createMockConnectors(demoScenario.evidence) : undefined,
    );
    const delivery = await deliverBrief(meeting, compiled.brief);
    await store.complete(key);
    return { status: "processed" as const, meetingId: meeting.id, ...compiled, delivery };
  } catch (error) {
    await store.release(key);
    throw error;
  }
}
