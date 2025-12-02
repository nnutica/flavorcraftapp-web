"use client";

import { useState, useRef } from "react";
import Image from "next/image";
interface UploadResponse {
  success: boolean;
  data?: {
    fileName: string;
    filePath: string;
    url: string;
    downloadUrl: string;
    sha: string;
    size: number;
    type: string;
  };
  error?: string;
  details?: string;
}

interface GithubImageUploaderProps {
  folder?: string;
  onUploadSuccess?: (url: string, data: UploadResponse['data']) => void;
  onUploadError?: (error: string) => void;
  className?: string;
  acceptedTypes?: string[];
  maxSizeMB?: number;
}

export default function GithubImageUploader({
  folder = "uploads",
  onUploadSuccess,
  onUploadError,
  className = "",
  acceptedTypes = ["image/png", "image/jpeg", "image/webp"],
  maxSizeMB = 10,
}: GithubImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // ตรวจสอบประเภทไฟล์
    if (!acceptedTypes.includes(file.type)) {
      const errorMsg = `ประเภทไฟล์ไม่ถูกต้อง. รองรับเฉพาะ: ${acceptedTypes.join(", ")}`;
      setError(errorMsg);
      onUploadError?.(errorMsg);
      return;
    }

    // ตรวจสอบขนาดไฟล์
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      const errorMsg = `ไฟล์ใหญ่เกินไป (${fileSizeMB.toFixed(2)}MB). ขนาดสูงสุด: ${maxSizeMB}MB`;
      setError(errorMsg);
      onUploadError?.(errorMsg);
      return;
    }

    // แสดง preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // เริ่มอัปโหลด
    uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      // จำลอง progress (เนื่องจาก fetch ไม่รองรับ upload progress)
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch("/api/upload-github", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      const result: UploadResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "การอัปโหลดล้มเหลว");
      }

      if (result.data) {
        setUploadedUrl(result.data.url);
        onUploadSuccess?.(result.data.url, result.data);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการอัปโหลด";
      setError(errorMsg);
      onUploadError?.(errorMsg);
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && fileInputRef.current) {
      // สร้าง FileList จำลอง
      const dt = new DataTransfer();
      dt.items.add(file);
      fileInputRef.current.files = dt.files;
      
      // จำลอง change event
      const changeEvent = new Event("change", { bubbles: true });
      fileInputRef.current.dispatchEvent(changeEvent);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const resetUploader = () => {
    setPreview(null);
    setUploadedUrl(null);
    setError(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${uploading ? "border-blue-300 bg-blue-50" : "border-gray-300 hover:border-gray-400"}
          ${error ? "border-red-300 bg-red-50" : ""}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(",")}
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />

        {uploading ? (
          <div className="space-y-2">
            <div className="text-blue-600">กำลังอัปโหลด...</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-sm text-gray-500">{progress}%</div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-4xl">📷</div>
            <div className="text-gray-600">
              คลิกเพื่อเลือกรูป หรือลากไฟล์มาวางที่นี่
            </div>
            <div className="text-sm text-gray-400">
              รองรับ: {acceptedTypes.map(type => type.split('/')[1]).join(', ')} • สูงสุด {maxSizeMB}MB
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Preview & Result */}
      {(preview || uploadedUrl) && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">
              {uploadedUrl ? "อัปโหลดสำเร็จ" : "ตัวอย่าง"}
            </h4>
            <button
              onClick={resetUploader}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ลบ
            </button>
          </div>

          {preview && (
            <div className="relative">
              <Image
                src={preview}
                alt="Preview"
                className="max-w-full h-auto max-h-64 object-contain border rounded-lg"
              />
              {uploadedUrl && (
                <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
                  ✓ อัปโหลดแล้ว
                </div>
              )}
            </div>
          )}

          {uploadedUrl && (
            <div className="space-y-2">
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="text-sm text-green-800 font-medium mb-1">
                  URL รูปภาพ:
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={uploadedUrl}
                    readOnly
                    className="flex-1 p-2 text-xs bg-white border rounded font-mono text-gray-700"
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(uploadedUrl)}
                    className="px-3 py-2 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                  >
                    คัดลอก
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
