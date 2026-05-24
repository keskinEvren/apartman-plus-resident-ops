"use client";

import React, { useState } from "react";
import { Modal } from "@/components/shared/Modal";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Hash } from "lucide-react";

interface DeliverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeliver: (otpCode: string) => void;
  isPending: boolean;
}

export function DeliverModal({
  isOpen,
  onClose,
  onDeliver,
  isPending,
}: DeliverModalProps) {
  const [otpInput, setOtpInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onDeliver(otpInput);
    setOtpInput("");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose();
        setOtpInput("");
      }}
      title="Kargo OTP Teslimat Doğrulaması"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="text-center space-y-2">
          <Hash className="h-8 w-8 text-amber-400 mx-auto" />
          <h3 className="text-sm font-bold">
            Lütfen Daire Sakininin OTP Kodunu Girin
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
            Sakinin mobil uygulamasında Kargo detayında yazan 6 haneli kodu
            doğrulamadan paket teslim edilemez.
          </p>
        </div>

        <div className="space-y-1.5 max-w-[240px] mx-auto">
          <input
            type="text"
            maxLength={6}
            placeholder="000000"
            value={otpInput}
            onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
            className="glass-input w-full rounded-xl px-4 py-3 text-xl font-mono text-center tracking-widest focus:outline-none focus:ring-1 focus:ring-amber-500/50"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-amber-500 hover:bg-amber-600 text-black py-3 rounded-xl text-sm font-semibold transition-all shadow-glow disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isPending ? (
            <LoadingSpinner size="sm" />
          ) : (
            "Kodu Doğrula ve Paketi Teslim Et"
          )}
        </button>
      </form>
    </Modal>
  );
}
