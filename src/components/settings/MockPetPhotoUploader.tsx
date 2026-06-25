"use client";

import React, { useState } from "react";
import { Camera } from "lucide-react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { showToast } from "@/components/shared/Toast";

interface MockPetPhotoUploaderProps {
  photo: string | null;
  onChange: (photo: string | null) => void;
}

export function MockPetPhotoUploader({
  photo,
  onChange,
}: MockPetPhotoUploaderProps) {
  const [isCapturing, setIsCapturing] = useState(false);

  const handleMockUpload = () => {
    setIsCapturing(true);
    setTimeout(() => {
      const mockAvatars = [
        "🐈 Fesli Kedi",
        "🐕 Golden Retriever",
        "🦜 Papağan",
      ];
      const randomPet =
        mockAvatars[Math.floor(Math.random() * mockAvatars.length)];
      onChange(randomPet);
      setIsCapturing(false);
      showToast("success", `Fotoğraf simüle edildi: ${randomPet}`);
    }, 800);
  };

  return (
    <div className="space-y-1">
      <label className="text-[10px] text-muted-foreground uppercase font-semibold">
        Evcil Hayvan Fotoğrafı (Kamera Simülasyonu)
      </label>
      {photo ? (
        <div className="relative rounded-lg border border-border bg-secondary p-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-lg">
              🐾
            </div>
            <div>
              <p className="font-semibold text-foreground text-[11px] truncate max-w-[150px]">
                {photo}
              </p>
              <p className="text-[9px] text-emerald-600">
                Yüklendi (Mobil Simülasyon)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="p-1 rounded bg-red-50 text-red-600 hover:bg-red-100 text-[10px] font-semibold transition-colors"
          >
            Sil
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleMockUpload}
          disabled={isCapturing}
          className="w-full h-14 border border-dashed border-border rounded-lg flex items-center justify-center gap-2 hover:bg-secondary active:bg-muted transition-all"
        >
          {isCapturing ? (
            <>
              <LoadingSpinner size="sm" />
              <span className="text-muted-foreground text-[11px]">
                Kamera Açılıyor...
              </span>
            </>
          ) : (
            <>
              <Camera className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground text-[11px]">
                Fotoğraf Çek / Görsel Yükle
              </span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
