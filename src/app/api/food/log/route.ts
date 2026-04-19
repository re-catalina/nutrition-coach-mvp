import { NextResponse } from "next/server";
import { parseFoodLog } from "@/lib/food-logging";
import { trackEvent } from "@/lib/observability";
import { prisma } from "@/lib/prisma";
import { foodLogSchema } from "@/lib/validation";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const date = searchParams.get("date");
  if (!userId || !date) {
    return NextResponse.json({ error: "userId and date are required" }, { status: 400 });
  }

  const selectedDate = new Date(`${date}T00:00:00.000Z`);
  const nextDate = new Date(selectedDate);
  nextDate.setUTCDate(selectedDate.getUTCDate() + 1);

  const entries = await prisma.foodEntry.findMany({
    where: {
      userId,
      eatenAt: {
        gte: selectedDate,
        lt: nextDate
      }
    },
    include: { items: true },
    orderBy: { eatenAt: "asc" }
  });

  return NextResponse.json({ entries });
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsedBody = foodLogSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ error: parsedBody.error.flatten() }, { status: 400 });
  }

  const { userId, rawText, mealType, eatenAt } = parsedBody.data;
  const parsedFood = parseFoodLog(rawText);

  if (parsedFood.items.length === 0) {
    return NextResponse.json({ error: "Unable to parse foods from entry text." }, { status: 422 });
  }

  const entry = await prisma.foodEntry.create({
    data: {
      userId,
      rawText,
      mealType,
      eatenAt: eatenAt ? new Date(eatenAt) : new Date(),
      confidence: parsedFood.overallConfidence,
      items: {
        create: parsedFood.items.map((item) => ({
          sourceFoodId: item.sourceFoodId,
          foodName: item.foodName,
          quantity: item.quantity,
          calories: item.macros.calories,
          proteinGrams: item.macros.proteinGrams,
          carbsGrams: item.macros.carbsGrams,
          fatGrams: item.macros.fatGrams,
          confidence: item.confidence
        }))
      }
    },
    include: { items: true }
  });

  await trackEvent({
    eventName: "food_logged",
    userId,
    properties: {
      confidence: parsedFood.overallConfidence,
      itemCount: parsedFood.items.length
    }
  });

  return NextResponse.json({
    entry,
    needsConfirmation: parsedFood.overallConfidence < 0.8
  });
}
