import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getStartOfUtcDay() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const latestTarget = await prisma.calorieTarget.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" }
  });

  if (!latestTarget) {
    return NextResponse.json({ error: "No calorie target found for user" }, { status: 404 });
  }

  const dayStart = getStartOfUtcDay();
  const tomorrowStart = new Date(dayStart);
  tomorrowStart.setUTCDate(dayStart.getUTCDate() + 1);

  const entries = await prisma.foodEntry.findMany({
    where: {
      userId,
      eatenAt: {
        gte: dayStart,
        lt: tomorrowStart
      }
    },
    include: { items: true }
  });

  const consumed = entries.reduce(
    (acc, entry) => {
      for (const item of entry.items) {
        acc.calories += item.calories;
        acc.protein += item.proteinGrams;
        acc.carbs += item.carbsGrams;
        acc.fat += item.fatGrams;
      }
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return NextResponse.json({
    targetCalories: latestTarget.targetCalories,
    consumedCalories: consumed.calories,
    remainingCalories: latestTarget.targetCalories - consumed.calories,
    proteinGrams: Number(consumed.protein.toFixed(1)),
    carbsGrams: Number(consumed.carbs.toFixed(1)),
    fatGrams: Number(consumed.fat.toFixed(1))
  });
}
