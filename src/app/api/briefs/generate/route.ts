import { bearerMatches } from "@/lib/auth";
import { getConfig } from "@/lib/config";
import { getDemoMeeting } from "@/lib/demo/data";
import { meetingSchema } from "@/lib/domain";
import { compileMeetingBrief } from "@/lib/pipeline/compile-brief";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const config = getConfig();
  if (!bearerMatches(request, config.ADMIN_API_KEY)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const meeting = body.meeting ? meetingSchema.parse(body.meeting) : getDemoMeeting();
    return Response.json(await compileMeetingBrief(meeting));
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Brief generation failed" },
      { status: 400 },
    );
  }
}
