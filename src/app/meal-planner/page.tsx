"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { Auth } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

// Firestore
import { db } from "../../lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

export default function MealPlanner() {
  const days = ["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์", "อาทิตย์"];
  const meals = ["เช้า", "กลางวัน", "เย็น"];

  const emptyPlan = days.map(() => meals.map(() => ""));
  const [plan, setPlan] = useState<string[][]>(emptyPlan);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true); // ⭐ โหลดครั้งแรก

  // ⭐ โหลดข้อมูลผู้ใช้ + ข้อมูลจาก Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(Auth, async (user) => {
      if (user) {
        setUserId(user.uid);

        // โหลดข้อมูลจาก Firestore
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);

        if (snap.exists() && snap.data().mealPlan) {
          setPlan(snap.data().mealPlan);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateMeal = (dayIndex: number, mealIndex: number, value: string) => {
    const newPlan = [...plan];
    newPlan[dayIndex][mealIndex] = value;
    setPlan(newPlan);
  };

  const clearAll = () => setPlan(emptyPlan);

  // ⭐ บันทึกลง Firestore
  const saveData = async () => {
    if (!userId) {
      alert("กรุณาเข้าสู่ระบบก่อนบันทึกข้อมูล");
      return;
    }

    try {
      await setDoc(
        doc(db, "users", userId),
        { mealPlan: plan },
        { merge: true } // ⭐ ป้องกันการลบข้อมูลอื่นใน users/{uid}
      );

      alert("บันทึกข้อมูลเรียบร้อย! 🎉");
    } catch (error) {
      console.error("Save Error:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-600">กำลังโหลดข้อมูล...</div>;
  }

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
