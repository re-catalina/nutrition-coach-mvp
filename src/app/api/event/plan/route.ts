import { NextResponse } from "next/server";
import { analyzeMenuPlan } from "@/lib/event-planner";
import { trackEvent } from "@/lib/observability";
import { prisma } from "@/lib/prisma";
import { eventPlanSchema } from "@/lib/validation";

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = eventPlanSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const input = parsed.data;
  const analysis = analyzeMenuPlan(input);

  const event = await prisma.event.create({
    data: {
      userId: input.userId,
      restaurantName: input.restaurantName,
      plannedItemsText: input.plannedItemsText,
      plannedDrinks: input.plannedDrinks,
      estimatedCalories: analysis.estimatedCalories,
      guidanceSummary: analysis.guidance
    }
  });

  await prisma.menuAnalysis.create({
    data: {
      userId: input.userId,
      inputType: input.menuImageUrl ? "photo_and_text" : "text_only",
      inputText: `${input.restaurantName} - ${input.plannedItemsText}`,
      imageUrl: input.menuImageUrl,
      parsedMenuJson: analysis.parsedMenuItems,
      recommendationsJson: {
        category: analysis.category,
        substitutions: analysis.substitutions,
        budgetDelta: analysis.budgetDelta
      },
      confidence: analysis.confidence
    }
  });

  await trackEvent({
    eventName: "event_plan_analyzed",
    userId: input.userId,
    properties: {
      category: analysis.category,
      imageProvided: analysis.imageProvided
    }
  });

  return NextResponse.json({ event, analysis });
}
