import { NextResponse } from "next/server";
import { buildCoachResponse } from "@/lib/coach";
import { trackEvent } from "@/lib/observability";
import { prisma } from "@/lib/prisma";
import { coachQuerySchema } from "@/lib/validation";

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = coachQuerySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const input = parsed.data;
  const response = buildCoachResponse(input);

  const saved = await prisma.coachInteraction.create({
    data: {
      userId: input.userId,
      prompt: input.question,
      response,
      contextJson: {
        remainingCalories: input.remainingCalories,
        proteinConsumed: input.proteinConsumed
      }
    }
  });

  await trackEvent({
    eventName: "coach_query_answered",
    userId: input.userId,
    properties: {
      questionLength: input.question.length
    }
  });

  return NextResponse.json({ interactionId: saved.id, response });
}
