import { parseFoodLog } from "@/lib/food-logging";

type MenuInput = {
  restaurantName: string;
  plannedItemsText: string;
  plannedDrinks?: string;
  remainingCalories: number;
  menuImageUrl?: string;
};

export function analyzeMenuPlan(input: MenuInput) {
  const combinedText = `${input.plannedItemsText}, ${input.plannedDrinks ?? ""}`.trim();
  const parsed = parseFoodLog(combinedText);

  const estimatedCalories = parsed.items.reduce((sum, item) => sum + item.macros.calories, 0);
  const budgetDelta = input.remainingCalories - estimatedCalories;
  const category = budgetDelta >= 150 ? "Best" : budgetDelta >= 0 ? "Good" : "Avoid";

  const substitutions =
    budgetDelta >= 0
      ? ["Keep protein-focused entree.", "Choose zero-calorie mixer for drinks."]
      : ["Swap fried dishes for grilled alternatives.", "Limit sugary cocktails to one and switch to light beer or spirits with soda water."];

  return {
    category,
    estimatedCalories,
    budgetDelta,
    parsedMenuItems: parsed.items.map((item) => ({
      name: item.foodName,
      quantity: item.quantity,
      calories: item.macros.calories
    })),
    confidence: parsed.overallConfidence,
    guidance: `At ${input.restaurantName}, this plan is ${category.toLowerCase()} for your remaining budget.`,
    substitutions,
    imageProvided: Boolean(input.menuImageUrl)
  };
}
