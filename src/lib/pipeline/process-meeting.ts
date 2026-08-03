import "server-only";

import { deliverBrief } from "@/lib/delivery/slack";
import type { Meeting } from "@/lib/domain";
import { compileMeetingBrief } from "@/lib/pipeline/compile-brief";
import { createDeliveryStore, type DeliveryStore } from "@/lib/store/delivery-store";

export async function processMeeting(meeting: Meeting, store: DeliveryStore = createDeliveryStore()) {
  const key = `signalbrief:meeting:${meeting.id}:${meeting.startsAt}`;
  const acquired = await store.acquire(key);
  if (!acquired) return { status: "duplicate" as const, meetingId: meeting.id };

  try {
    const compiled = await compileMeetingBrief(meeting);
    const delivery = await deliverBrief(meeting, compiled.brief);
    await store.complete(key);
    return { status: "processed" as const, meetingId: meeting.id, ...compiled, delivery };
  } catch (error) {
    await store.release(key);
    throw error;
  }
}
