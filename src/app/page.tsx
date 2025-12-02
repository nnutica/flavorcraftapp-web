"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { Auth } from "../lib/firebase";
import Navbar from "./components/Navbar";
import RecipeCard from "./components/RecipeCard";
import { fetchPopularRecipes, fetchNewestRecipes } from "../lib/authService";

const fallbackRecipes = [
  {
    recipeid: "1",
    title: "ข้าวผัดกุ้ง",
    coverUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=300",
    category: "อาหารไทย",
    servings: 2,
    likeCount: 24,
    author: { name: "Chef Anna" }
  },
  {
    recipeid: "2",
    title: "แกงเขียวหวานไก่",
    coverUrl: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=400&h=300",
    category: "อาหารไทย",
    servings: 4,
    likeCount: 18,
    author: { name: "Nong Ploy" }
  },
];

export default function Home() {
  const router = useRouter();
  const [user] = useAuthState(Auth);

  // จำนวนที่แสดงเริ่มต้น = 8
  const [newestLimit, setNewestLimit] = useState(8);
  const [popularLimit, setPopularLimit] = useState(8);

  const [popularRecipes, setPopularRecipes] = useState<any[]>([]);
  const [newestRecipes, setNewestRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // โหลดข้อมูลทุกครั้งเมื่อ limit เปลี่ยน
  useEffect(() => {
    const loadRecipes = async () => {
      try {
        const [popular, newest] = await Promise.all([
          fetchPopularRecipes(popularLimit),
          fetchNewestRecipes(newestLimit),
        ]);

        setPopularRecipes(popular.length > 0 ? popular : fallbackRecipes);
        setNewestRecipes(newest.length > 0 ? newest : fallbackRecipes);
      } catch (error) {
        console.error("Error loading recipes:", error);
        setPopularRecipes(fallbackRecipes);
        setNewestRecipes(fallbackRecipes);
      } finally {
        setLoading(false);
      }
    };

    loadRecipes();
  }, [newestLimit, popularLimit]);

  const handleCreateRecipeClick = () => {
    if (user) router.push("/recipes/new");
    else router.push("/login");
  };

  return (
    <div className="min-h-screen bg-peach">
      <Navbar />

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {!loading && (
        <>
          {/* Newest Section */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold">สูตรใหม่ล่าสุด</h2>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {newestRecipes.map((recipe) => (
                <RecipeCard key={recipe.recipeid} recipe={recipe} />
              ))}
            </div>

            {/* Load More button */}
            <div className="flex justify-center mt-8">
              <button
                onClick={() => setNewestLimit(newestLimit + 8)}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                โหลดเพิ่ม
              </button>
            </div>
          </div>

          {/* Popular Section */}
          <div className="bg-softwhite py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold">สูตรยอดนิยม</h2>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {popularRecipes.map((recipe) => (
                  <RecipeCard key={recipe.recipeid} recipe={recipe} />
                ))}
              </div>

              {/* Load More Popular */}
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => setPopularLimit(popularLimit + 8)}
                  className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                  โหลดเพิ่ม
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
