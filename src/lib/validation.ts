import { z } from "zod";

export const profileSchema = z.object({
  userId: z.string().min(1),
  weightKg: z.number().positive(),
  heightCm: z.number().positive(),
  age: z.number().int().min(18).max(100),
  sex: z.enum(["male", "female"]),
  activityLevel: z.enum(["sedentary", "light", "moderate", "active", "very_active"]),
  goalType: z.enum(["fat_loss", "maintenance", "muscle_gain"])
});

export const foodLogSchema = z.object({
  userId: z.string().min(1),
  rawText: z.string().min(3),
  mealType: z.string().optional(),
  eatenAt: z.string().datetime().optional()
});

export const eventPlanSchema = z.object({
  userId: z.string().min(1),
  restaurantName: z.string().min(2),
  plannedItemsText: z.string().min(3),
  plannedDrinks: z.string().optional(),
  menuImageUrl: z.string().url().optional(),
  remainingCalories: z.number().int().min(0)
});

export const coachQuerySchema = z.object({
  userId: z.string().min(1),
  question: z.string().min(3),
  remainingCalories: z.number().int().min(0),
  proteinConsumed: z.number().min(0)
});
