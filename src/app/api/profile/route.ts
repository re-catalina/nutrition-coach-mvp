import { NextResponse } from "next/server";
import { computeCalorieTarget } from "@/lib/calorie-engine";
import { trackEvent } from "@/lib/observability";
import { prisma } from "@/lib/prisma";
import { profileSchema } from "@/lib/validation";

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const input = parsed.data;
  const target = computeCalorieTarget(input);

  await prisma.bodyMetric.create({
    data: {
      userId: input.userId,
      weightKg: input.weightKg,
      heightCm: input.heightCm,
      age: input.age,
      sex: input.sex,
      activityLevel: input.activityLevel,
      goalType: input.goalType
    }
  });

  await prisma.calorieTarget.create({
    data: {
      userId: input.userId,
      bmr: target.bmr,
      tdee: target.tdee,
      targetCalories: target.targetCalories,
      strategyPercent: target.strategyPercent
    }
  });

  await trackEvent({
    eventName: "profile_saved",
    userId: input.userId,
    properties: {
      goalType: input.goalType,
      activityLevel: input.activityLevel
    }
  });

  return NextResponse.json(target);
}
