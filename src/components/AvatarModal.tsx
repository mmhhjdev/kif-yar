import React, { useState, useRef } from 'react';
import { X, Upload, Check, Camera, Image, Sparkles, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DEFAULT_AVATARS, MALE_AVATAR_SVG, FEMALE_AVATAR_SVG } from '../utils/avatars';

interface AvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AvatarModal: React.FC<AvatarModalProps> = ({ isOpen, onClose }) => {
  const { user, updateUserProfile } = useApp();
  const [selectedAvatar, setSelectedAvatar] = useState<string>(user.avatar_url || MALE_AVATAR_SVG);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Process file upload
  const handleFileChange = (file: File) => {
    setPreviewError(null);

    // Validate type
    if (!file.type.startsWith('image/')) {
      setPreviewError('لطفاً یک فایل تصویری معتبر (PNG, JPG, SVG, WebP) انتخاب کنید.');
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setPreviewError('حجم تصویر نباید بیشتر از ۵ مگابایت باشد.');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        // Create an image element to resize if large
        const img = new window.Image();
        img.src = result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 300;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
            setSelectedAvatar(compressedDataUrl);
          } else {
            setSelectedAvatar(result);
          }
          setIsUploading(false);
        };
        img.onerror = () => {
          setSelectedAvatar(result);
          setIsUploading(false);
        };
      } else {
        setIsUploading(false);
      }
    };

    reader.onerror = () => {
      setPreviewError('خطا در خواندن فایل تصویر');
      setIsUploading(false);
    };

    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSave = () => {
    updateUserProfile({
      avatar_url: selectedAvatar,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto font-vazir">
      <div
        id="avatar-modal-card"
        className="relative my-auto w-full max-w-md bg-white dark:bg-[#0F1512] rounded-2xl shadow-2xl border border-[#E2E8E4] dark:border-[#1A2621] overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8E4] dark:border-[#1A2621] shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-[#15271E] dark:text-emerald-300">
              <Camera className="w-5 h-5" />
            </div>
            <h3 className="font-cairo text-lg font-bold text-zinc-900 dark:text-zinc-100">
              تغییر و آپلود تصویر پروفایل
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-[#16221D] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Current / Selected Avatar Preview */}
          <div className="flex flex-col items-center justify-center text-center">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full ring-4 ring-emerald-600/30 overflow-hidden bg-emerald-50 dark:bg-[#15241C] shadow-md flex items-center justify-center">
                <img
                  src={selectedAvatar}
                  alt={user.full_name}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="انتخاب فایل جدید"
                className="absolute bottom-0 left-0 p-2 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white shadow-md transition cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>
            <span className="text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300 mt-2">
              پیش‌نمایش تصویر انتخابی
            </span>
          </div>

          {previewError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{previewError}</span>
            </div>
          )}

          {/* 1. Default Vector Avatars (Male & Female) */}
          <div>
            <label className="block text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300 mb-2">
              آواتارهای وکتور پیش‌فرض (مرد و زن)
            </label>
            <div className="grid grid-cols-2 gap-3">
              {DEFAULT_AVATARS.map((avatar) => {
                const isSelected = selectedAvatar === avatar.url;
                return (
                  <button
                    key={avatar.id}
                    type="button"
                    onClick={() => setSelectedAvatar(avatar.url)}
                    className={`p-3 rounded-xl border flex items-center gap-3 transition cursor-pointer text-right ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 dark:bg-[#162B21] dark:text-emerald-200 ring-2 ring-emerald-600'
                        : 'border-[#E2E8E4] dark:border-[#1F2E27] bg-zinc-50/50 dark:bg-[#141E1A] text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-emerald-600/20 bg-white">
                      <img src={avatar.url} alt={avatar.label} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-cairo font-bold">{avatar.label}</span>
                        {isSelected && <Check className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />}
                      </div>
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-vazir block">
                        وکتور ساده {avatar.gender}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Upload Custom Image */}
          <div>
            <label className="block text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300 mb-2">
              یا آپلود تصویر دلخواه از دستگاه
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
            />

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-4 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition ${
                isDragging
                  ? 'border-emerald-600 bg-emerald-50/80 dark:bg-[#172E23]'
                  : 'border-[#E2E8E4] dark:border-[#1F2E27] hover:border-emerald-600 bg-zinc-50/50 dark:bg-[#141E1A]'
              }`}
            >
              <Upload className="w-6 h-6 text-emerald-700 dark:text-emerald-400 mb-1.5" />
              <p className="text-xs font-cairo font-bold text-zinc-800 dark:text-zinc-200">
                کلیک کنید یا تصویر را به اینجا بکشید
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-vazir mt-0.5">
                فرمت‌های JPG، PNG، WebP یا SVG (حداکثر ۵ مگابایت)
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E8E4] dark:border-[#1A2621]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-cairo font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#16221D] transition cursor-pointer"
            >
              انصراف
            </button>
            <button
              id="save-avatar-btn"
              type="button"
              onClick={handleSave}
              disabled={isUploading}
              className="px-6 py-2.5 rounded-xl text-sm font-cairo font-bold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isUploading ? 'در حال پردازش...' : 'ذخیره در پروفایل و دیتابیس'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
