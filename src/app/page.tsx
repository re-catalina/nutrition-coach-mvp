"use client";

import { FormEvent, useMemo, useState } from "react";

type TargetResponse = {
  bmr: number;
  tdee: number;
  strategyPercent: number;
  targetCalories: number;
};

type TodayTarget = {
  targetCalories: number;
  consumedCalories: number;
  remainingCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
};

export default function HomePage() {
  const [userId] = useState("demo-user-1");
  const [target, setTarget] = useState<TargetResponse | null>(null);
  const [today, setToday] = useState<TodayTarget | null>(null);
  const [foodLogResult, setFoodLogResult] = useState<string>("");
  const [eventGuidance, setEventGuidance] = useState<string>("");

  const remainingCalories = useMemo(() => today?.remainingCalories ?? target?.targetCalories ?? 2000, [today, target]);

  async function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      userId,
      weightKg: Number(form.get("weightKg")),
      heightCm: Number(form.get("heightCm")),
      age: Number(form.get("age")),
      sex: String(form.get("sex")) as "male" | "female",
      activityLevel: String(form.get("activityLevel")),
      goalType: String(form.get("goalType"))
    };
    const response = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (response.ok) {
      setTarget(data);
      await loadToday();
    }
  }

  async function loadToday() {
    const response = await fetch(`/api/targets/today?userId=${encodeURIComponent(userId)}`);
    if (!response.ok) {
      return;
    }
    const data = await response.json();
    setToday(data);
  }

  async function submitFoodLog(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      userId,
      rawText: String(form.get("rawText")),
      mealType: String(form.get("mealType"))
    };
    const response = await fetch("/api/food/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (response.ok) {
      setFoodLogResult(
        data.needsConfirmation
          ? "Logged with medium confidence; confirm serving sizes when prompted."
          : "Meal logged successfully with high confidence."
      );
      await loadToday();
      return;
    }
    setFoodLogResult(data.error ?? "Unable to log meal.");
  }

  async function submitEventPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      userId,
      restaurantName: String(form.get("restaurantName")),
      plannedItemsText: String(form.get("plannedItemsText")),
      plannedDrinks: String(form.get("plannedDrinks")),
      menuImageUrl: String(form.get("menuImageUrl")) || undefined,
      remainingCalories
    };
    const response = await fetch("/api/event/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (response.ok) {
      setEventGuidance(`${data.analysis.category}: ${data.analysis.guidance}`);
      return;
    }
    setEventGuidance(data.error ?? "Could not analyze menu plan.");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 p-6">
      <h1 className="text-3xl font-semibold text-brand-500">Nutrition Coaching MVP</h1>
      <p className="text-sm text-slate-300">
        Informational coaching only; this app does not provide medical advice.
      </p>

      <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <h2 className="mb-3 text-xl font-medium">1) Calorie Goal Setup</h2>
        <form className="grid grid-cols-2 gap-3" onSubmit={submitProfile}>
          <input className="rounded bg-slate-800 p-2" name="weightKg" type="number" step="0.1" placeholder="Weight (kg)" required />
          <input className="rounded bg-slate-800 p-2" name="heightCm" type="number" step="0.1" placeholder="Height (cm)" required />
          <input className="rounded bg-slate-800 p-2" name="age" type="number" placeholder="Age" required />
          <select className="rounded bg-slate-800 p-2" name="sex" defaultValue="male">
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
          <select className="rounded bg-slate-800 p-2" name="activityLevel" defaultValue="moderate">
            <option value="sedentary">Sedentary</option>
            <option value="light">Light</option>
            <option value="moderate">Moderate</option>
            <option value="active">Active</option>
            <option value="very_active">Very Active</option>
          </select>
          <select className="rounded bg-slate-800 p-2" name="goalType" defaultValue="fat_loss">
            <option value="fat_loss">Fat Loss</option>
            <option value="maintenance">Maintenance</option>
            <option value="muscle_gain">Muscle Gain</option>
          </select>
          <button className="col-span-2 rounded bg-brand-700 px-4 py-2 font-medium" type="submit">
            Save Profile and Calculate Target
          </button>
        </form>
        {target && (
          <p className="mt-3 text-sm text-slate-200">
            BMR: {target.bmr} | TDEE: {target.tdee} | Goal Calories: {target.targetCalories}
          </p>
        )}
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <h2 className="mb-3 text-xl font-medium">2) Natural Language Diary</h2>
        <form className="grid grid-cols-1 gap-3" onSubmit={submitFoodLog}>
          <input className="rounded bg-slate-800 p-2" name="rawText" placeholder="Example: 2 eggs, toast with butter, and a latte" required />
          <input className="rounded bg-slate-800 p-2" name="mealType" placeholder="Meal type (breakfast/lunch/dinner)" />
          <button className="rounded bg-brand-700 px-4 py-2 font-medium" type="submit">
            Log Meal
          </button>
        </form>
        {foodLogResult && <p className="mt-2 text-sm text-slate-200">{foodLogResult}</p>}
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <h2 className="mb-3 text-xl font-medium">3) Going-Out Planner (Text + Menu Photo URL)</h2>
        <form className="grid grid-cols-1 gap-3" onSubmit={submitEventPlan}>
          <input className="rounded bg-slate-800 p-2" name="restaurantName" placeholder="Restaurant name" required />
          <input className="rounded bg-slate-800 p-2" name="plannedItemsText" placeholder="Planned food items" required />
          <input className="rounded bg-slate-800 p-2" name="plannedDrinks" placeholder="Planned drinks" />
          <input className="rounded bg-slate-800 p-2" name="menuImageUrl" placeholder="Optional menu photo URL" />
          <button className="rounded bg-brand-700 px-4 py-2 font-medium" type="submit">
            Analyze Plan
          </button>
        </form>
        {eventGuidance && <p className="mt-2 text-sm text-slate-200">{eventGuidance}</p>}
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-200">
        <h2 className="mb-2 text-xl font-medium">Today&apos;s Summary</h2>
        <button className="mb-2 rounded bg-slate-700 px-3 py-1" onClick={loadToday} type="button">
          Refresh
        </button>
        <p>Target: {today?.targetCalories ?? target?.targetCalories ?? "Not set"} kcal</p>
        <p>Consumed: {today?.consumedCalories ?? 0} kcal</p>
        <p>Remaining: {today?.remainingCalories ?? remainingCalories} kcal</p>
      </section>
    </main>
  );
}
