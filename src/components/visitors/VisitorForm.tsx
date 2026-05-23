"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { GlassCard } from "@/components/shared/GlassCard";
import { UserPlus } from "lucide-react";

const visitorSchema = z.object({
  visitorName: z.string().min(1, "Ziyaretçi adı zorunludur"),
  visitDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Geçerli tarih giriniz"),
  expectedTime: z.string().regex(/^\d{2}:\d{2}$/, "Geçerli saat giriniz").optional().or(z.literal("")),
});

type VisitorFormData = z.infer<typeof visitorSchema>;

interface VisitorFormProps {
  onSubmit: (data: { visitorName: string; visitDate: string; expectedTime?: string }) => void;
  isPending: boolean;
}

export function VisitorForm({ onSubmit, isPending }: VisitorFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VisitorFormData>({
    resolver: zodResolver(visitorSchema),
    defaultValues: {
      visitDate: new Date().toISOString().split("T")[0],
    },
  });

  const handleFormSubmit = (data: VisitorFormData) => {
    onSubmit({
      visitorName: data.visitorName,
      visitDate: data.visitDate,
      expectedTime: data.expectedTime || undefined,
    });
    reset();
  };

  return (
    <GlassCard>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Visitor Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Ziyaretçi Adı <span className="text-red-400">*</span>
            </label>
            <input
              {...register("visitorName")}
              placeholder="Adı Soyadı"
              className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
            />
            {errors.visitorName && (
              <p className="text-xs text-red-400">{errors.visitorName.message}</p>
            )}
          </div>

          {/* Visit Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Ziyaret Tarihi <span className="text-red-400">*</span>
            </label>
            <input
              {...register("visitDate")}
              type="date"
              className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
            />
            {errors.visitDate && (
              <p className="text-xs text-red-400">{errors.visitDate.message}</p>
            )}
          </div>

          {/* Expected Time */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Beklenen Saat
            </label>
            <input
              {...register("expectedTime")}
              type="time"
              className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-sm font-semibold transition-all shadow-glow disabled:opacity-50 flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            {isPending ? "Kaydediliyor..." : "Ön Kayıt Oluştur"}
          </button>
        </div>
      </form>
    </GlassCard>
  );
}
