import { GoalType, ProfileInput } from "@/lib/types";

const ACTIVITY_MULTIPLIERS: Record<ProfileInput["activityLevel"], number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9
};

const GOAL_STRATEGY_PERCENT: Record<GoalType, number> = {
  fat_loss: -0.15,
  maintenance: 0,
  muscle_gain: 0.1
};

export function computeBmr(input: Pick<ProfileInput, "weightKg" | "heightCm" | "age" | "sex">): number {
  const sexOffset = input.sex === "male" ? 5 : -161;
  return 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age + sexOffset;
}

export function computeCalorieTarget(input: ProfileInput) {
  const bmr = computeBmr(input);
  const tdee = bmr * ACTIVITY_MULTIPLIERS[input.activityLevel];
  const strategyPercent = GOAL_STRATEGY_PERCENT[input.goalType];
  const targetCalories = Math.round(tdee * (1 + strategyPercent));
  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    strategyPercent,
    targetCalories
  };
}
