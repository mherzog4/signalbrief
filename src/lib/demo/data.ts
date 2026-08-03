import { getDemoScenarios } from "@/lib/demo/scenarios";

export function getDemoMeeting() {
  return getDemoScenarios()[0].meeting;
}

export const demoEvidence = getDemoScenarios()[0].evidence;

export function getDemoBrief() {
  return getDemoScenarios()[0].brief;
}
