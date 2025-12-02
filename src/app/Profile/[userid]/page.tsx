"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { Auth } from "../../../lib/firebase";
import { updateUserProfile, fetchUser, fetchUserRecipes, fetchUserFavoriteRecipes } from "../../../lib/authService";
import Navbar from "../../components/Navbar";
import RecipeCard from "../../components/RecipeCard";
import GithubImageUploader from "../../components/GithubImageUploader";
import type { User as AppUser } from "../../../database/user";
import { useSafeDateFormatter } from "../../../hooks/useClientSide";
import Image from "next/image";

export default function UserProfilePage() {
  const params = useParams();
  const userId = params!.userid as string;
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profileUser, setProfileUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [userRecipes, setUserRecipes] = useState<any[]>([]);
  const [favoriteRecipes, setFavoriteRecipes] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'recipes' | 'favorites'>('recipes');
  
  const { isClient, formatJoinDate } = useSafeDateFormatter();

  // Check if current user is viewing their own profile
  const isOwnProfile = currentUser?.uid === userId;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(Auth, (user) => {
      setCurrentUser(user);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userId) return;
      
      setLoading(true);
      setNotFound(false);
      
      try {
        // ใช้ fetchUser จาก authService
        const userData = await fetchUser(userId);
        
        if (userData) {
          setProfileUser(userData);
          
          // Set editing fields if this is own profile
          if (isOwnProfile) {
            setDisplayName(userData.username || "");
            setAvatarUrl(userData.imageUrl || "");
          }
        } else {
          // ไม่พบข้อมูลใน Firestore
          setNotFound(true);
        }
        
        // ดึงสูตรอาหารของผู้ใช้
        const recipes = await fetchUserRecipes(userId);
        setUserRecipes(recipes);
        
        // ดึงรายการโปรด (เฉพาะเมื่อเป็นโปรไฟล์ตัวเอง)
        if (isOwnProfile) {
          const favorites = await fetchUserFavoriteRecipes(userId);
          setFavoriteRecipes(favorites);
        }
        
      } catch (err) {
        console.error("Error fetching user profile:", err);
        setError("ไม่สามารถโหลดข้อมูลโปรไฟล์ได้");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId, isOwnProfile, currentUser]);

  const handleUpdateProfile = async () => {
    if (!currentUser || !isOwnProfile) return;
    
    setUpdating(true);
    setError(null);
    setSuccess(null);

    try {
      await updateUserProfile({
        username: displayName,
        imageUrl: avatarUrl
      });
      
      // Update local state
      setProfileUser(prev => prev ? {
        ...prev,
        username: displayName,
        imageUrl: avatarUrl
      } : null);
      
      setSuccess("อัปเดตโปรไฟล์สำเร็จ!");
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการอัปเดตโปรไฟล์");
    } finally {
      setUpdating(false);
    }
  };

  const handleAvatarUpload = (url: string) => {
    setAvatarUrl(url);
    setSuccess("อัปโหลดรูปโปรไฟล์สำเร็จ!");
  };

  const handleCancel = () => {
    if (profileUser) {
      setDisplayName(profileUser.username || "");
      setAvatarUrl(profileUser.imageUrl || "");
    }
    setEditing(false);
    setError(null);
    setSuccess(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-peach">
        <Navbar />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-peach">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center">
            <div className="text-6xl mb-4">😕</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">ไม่พบผู้ใช้นี้</h1>
            <p className="text-gray-600 mb-8">ผู้ใช้ที่คุณค้นหาอาจไม่มีอยู่หรือถูกลบไปแล้ว</p>
            <a 
              href="/" 
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              กลับหน้าแรก
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-peach">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">เกิดข้อผิดพลาด</h1>
            <p className="text-gray-600">ไม่สามารถโหลดข้อมูลโปรไฟล์ได้</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-peach">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-softwhite rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            
            {/* Avatar Section */}
            <div className="flex-shrink-0">
              <div className="relative">
                {(editing && isOwnProfile ? avatarUrl : profileUser.imageUrl) ? (
                  <Image
                    src={(editing && isOwnProfile ? avatarUrl : profileUser.imageUrl) || "/default-avatar.png"}
                    alt="Avatar"
                    width={100}
                    height={100}
                    priority={true} // โหลดทันที
                  />

                ) : (
                  <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center border-4 border-gray-200">
                    <span className="text-2xl font-bold text-white">
                      {profileUser.username?.charAt(0).toUpperCase() || "U"}
                    </span>
                  </div>
                )}
                {editing && isOwnProfile && (
                  <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white rounded-full p-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 min-w-0">
              {editing && isOwnProfile ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ชื่อแสดง
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="ป้อนชื่อของคุณ"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      รูปโปรไฟล์
                    </label>
                    <GithubImageUploader
                      folder="profiles"
                      onUploadSuccess={handleAvatarUpload}
                      onUploadError={(error) => setError(error)}
                      className="max-w-md"
                      acceptedTypes={["image/png", "image/jpeg", "image/webp"]}
                      maxSizeMB={5}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {profileUser.username || "ผู้ใช้งาน"}
                  </h1>
                  <p className="text-gray-600">{profileUser.email}</p>
                  <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                    <span>
                      เข้าร่วมเมื่อ: {isClient ? formatJoinDate(profileUser.createdAt) : "กำลังโหลด..."}
                    </span>
                    <span>•</span>
                    <span>{userRecipes.length} สูตร</span>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {isOwnProfile && (
              <div className="flex-shrink-0">
                {editing ? (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleUpdateProfile}
                      disabled={updating}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {updating ? "กำลังบันทึก..." : "บันทึก"}
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 border border-primary text-gray-700 rounded-md hover:bg-primary"
                    >
                      ยกเลิก
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditing(true)}
                    className="px-4 py-2 border border-primary text-gray-700 rounded-md hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>แก้ไขโปรไฟล์</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Status Messages */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
              {success}
            </div>
          )}
        </div>

        {/* Tabs (สำหรับโปรไฟล์ตัวเอง) */}
        {isOwnProfile && (
          <div className="bg-softwhite rounded-lg shadow-sm p-6 mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('recipes')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'recipes'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  สูตรอาหารของฉัน ({userRecipes.length})
                </button>
                <button
                  onClick={() => setActiveTab('favorites')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'favorites'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  รายการที่แชร์ ({favoriteRecipes.length})
                </button>
              </nav>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="bg-softwhite rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {isOwnProfile 
                ? (activeTab === 'recipes' ? "สูตรอาหารของคุณ" : "รายการที่แชร์")
                : `สูตรอาหารของ ${profileUser.username}`
              }
            </h2>
            {isOwnProfile && activeTab === 'recipes' && (
              <a
                href="/recipes/new"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>เพิ่มสูตรใหม่</span>
              </a>
            )}
          </div>

          {/* Render content based on active tab */}
          {(() => {
            const currentRecipes = isOwnProfile && activeTab === 'favorites' ? favoriteRecipes : userRecipes;
            const isEmptyFavorites = isOwnProfile && activeTab === 'favorites' && favoriteRecipes.length === 0;
            const isEmptyRecipes = activeTab === 'recipes' && userRecipes.length === 0;

            if (currentRecipes.length > 0) {
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {currentRecipes.map((recipe: any) => (
                    <RecipeCard key={recipe.recipeid} recipe={recipe} />
                  ))}
                </div>
              );
            }

            // Empty state
            if (isEmptyFavorites) {
              return (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">⭐</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    ยังไม่มีรายการโปรด
                  </h3>
                  <p className="text-gray-600 mb-6">
                    เริ่มเพิ่มสูตรอาหารที่ชอบลงในรายการโปรดของคุณ
                  </p>
                  <a
                    href="/"
                    className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-yellow-600"
                  >
                    เลือกดูสูตรอาหาร
                  </a>
                </div>
              );
            }

            if (isEmptyRecipes) {
              return (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">👨‍🍳</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {isOwnProfile ? "ยังไม่มีสูตรอาหาร" : "ยังไม่มีสูตรอาหารที่แชร์"}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {isOwnProfile 
                      ? "เริ่มแชร์สูตรอาหารอร่อยๆ ของคุณกันเลย!" 
                      : "ผู้ใช้คนนี้ยังไม่ได้แชร์สูตรอาหารใดๆ"
                    }
                  </p>
                  {isOwnProfile && (
                    <a
                      href="/recipes/new"
                      className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      เพิ่มสูตรแรก
                    </a>
                  )}
                </div>
              );
            }

            return null;
          })()}
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <div className="bg-softwhite rounded-lg shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{userRecipes.length}</div>
            <div className="text-sm text-gray-600">สูตรทั้งหมด</div>
          </div>
          <div className="bg-softwhite rounded-lg shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {userRecipes.reduce((sum: number, recipe: any) => sum + (recipe.likeCount || 0), 0)}
            </div>
            <div className="text-sm text-gray-600">ไลค์ทั้งหมด</div>
          </div>
          {isOwnProfile && (
            <div className="bg-softwhite rounded-lg shadow-sm p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{favoriteRecipes.length}</div>
              <div className="text-sm text-gray-600">รายการโปรด</div>
            </div>
          )}
          <div className="bg-softwhite rounded-lg shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {/* คำนวณจำนวนหมวดหมู่ที่แตกต่างกัน */}
              {new Set(userRecipes.map((recipe: any) => recipe.category)).size}
            </div>
            <div className="text-sm text-gray-600">หมวดหมู่</div>
          </div>
        </div>
      </div>
    </div>
  );
}