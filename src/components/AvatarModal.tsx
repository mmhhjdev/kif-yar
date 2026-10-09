import React, { useState } from 'react';
import { X, Check, Image as ImageIcon } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AVATAR_PRESETS } from '../utils/avatars';

interface AvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AvatarModal: React.FC<AvatarModalProps> = ({ isOpen, onClose }) => {
  const { user, updateUserProfile } = useApp();
  const [selectedUrl, setSelectedUrl] = useState(user.avatar_url);
  const [customUrl, setCustomUrl] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    const finalUrl = customUrl.trim() || selectedUrl;
    updateUserProfile({ avatar_url: finalUrl });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs font-cairo">
      <div
        id="avatar-modal-card"
        className="w-full max-w-md bg-white dark:bg-[#0F1512] rounded-3xl shadow-2xl border border-[#E2E8E4] dark:border-[#1A2621] overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-6 space-y-5"
      >
        <div className="flex items-center justify-between border-b border-[#E2E8E4] dark:border-[#1A2621] pb-3">
          <h3 className="font-cairo text-lg font-bold text-zinc-900 dark:text-zinc-100">
            انتخاب تصویر نمایه (آواتار)
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Preview */}
        <div className="flex items-center justify-center py-2">
          <img
            src={customUrl.trim() || selectedUrl}
            alt="پیش‌نمایش"
            className="w-20 h-20 rounded-full border-4 border-emerald-600 object-cover shadow-md"
          />
        </div>

        {/* Preset Avatars Grid */}
        <div className="space-y-2">
          <label className="text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300">
            تصاویر پیش‌فرض پیشنهادی
          </label>
          <div className="grid grid-cols-4 gap-3">
            {AVATAR_PRESETS.map((preset) => {
              const isSelected = selectedUrl === preset.url && !customUrl.trim();
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setSelectedUrl(preset.url);
                    setCustomUrl('');
                  }}
                  className={`relative rounded-2xl overflow-hidden aspect-square border-2 transition cursor-pointer p-0.5 ${
                    isSelected
                      ? 'border-emerald-600 ring-2 ring-emerald-500/40'
                      : 'border-[#E2E8E4] dark:border-[#1A2621] hover:border-emerald-400'
                  }`}
                >
                  <img
                    src={preset.url}
                    alt={preset.name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-emerald-900/30 flex items-center justify-center">
                      <Check className="w-5 h-5 text-white drop-shadow" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom URL Input */}
        <div>
          <label className="block text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
            یا لینک تصویر سفارشی
          </label>
          <input
            type="url"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            placeholder="https://example.com/avatar.jpg"
            className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-xs text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-600 font-mono text-left"
            dir="ltr"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E8E4] dark:border-[#1A2621]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-cairo font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#16221D] transition cursor-pointer"
          >
            انصراف
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-cairo font-bold shadow-xs transition cursor-pointer"
          >
            تایید و ثبت
          </button>
        </div>
      </div>
    </div>
  );
};
