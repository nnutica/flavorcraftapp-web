"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";

export default function MealPlanner() {
  const days = ["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์", "อาทิตย์"];
  const meals = ["เช้า", "กลางวัน", "เย็น"];

  const [plan, setPlan] = useState<string[][]>([]);

  // ⭐ โหลดข้อมูลจาก localStorage ตอนเปิดหน้า
  useEffect(() => {
    const saved = localStorage.getItem("mealPlan");
    if (saved) {
      setPlan(JSON.parse(saved));
    } else {
      setPlan(days.map(() => meals.map(() => "")));
    }
  }, []);

  const updateMeal = (dayIndex: number, mealIndex: number, value: string) => {
    const newPlan = [...plan];
    newPlan[dayIndex][mealIndex] = value;
    setPlan(newPlan);
  };

  const clearAll = () => {
    const empty = days.map(() => meals.map(() => ""));
    setPlan(empty);
    localStorage.removeItem("mealPlan");
  };

  const saveData = () => {
    localStorage.setItem("mealPlan", JSON.stringify(plan));
    alert("บันทึกข้อมูลเรียบร้อย! 🎉");
  };

  if (plan.length === 0) return null; // ป้องกัน error ตอน initial state

  return (
    <div className="min-h-screen bg-peach">

      <Navbar />

      <div className="max-w-4xl mx-auto p-6 pb-16">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">
          🗓️ วางแผนอาหารประจำสัปดาห์
        </h1>

        <div className="grid grid-cols-1 gap-6 bg-primary/20 p-4 rounded-xl">
          {days.map((day, dayIndex) => (
            <div
              key={day}
              className="bg-softwhite p-4 rounded-xl shadow border border-gray-200"
            >
              <h2 className="text-xl font-semibold mb-3">{day}</h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {meals.map((meal, mealIndex) => (
                  <div key={meal}>
                    <label className="text-sm text-gray-600">{meal}</label>
                    <input
                      type="text"
                      value={plan[dayIndex][mealIndex]}
                      onChange={(e) =>
                        updateMeal(dayIndex, mealIndex, e.target.value)
                      }
                      className="mt-1 w-full border border-peach rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder={`เมนู${meal}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-center gap-4">
          <button
            onClick={saveData}
            className="bg-primary text-white px-6 py-3 rounded-lg shadow hover:bg-primary/90"
          >
            บันทึกข้อมูล
          </button>

          <button
            onClick={clearAll}
            className="bg-red-500 text-white px-6 py-3 rounded-lg shadow hover:bg-red-600"
          >
            ล้างทั้งหมด
          </button>
        </div>
      </div>
    </div>
  );
}
