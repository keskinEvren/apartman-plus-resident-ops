"use client";

import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { showToast } from "@/components/shared/Toast";
import { GlassCard } from "@/components/shared/GlassCard";
import { AmenityCard } from "@/components/bookings/AmenityCard";
import { SessionSlot } from "@/components/bookings/SessionSlot";
import { ReservationTable } from "@/components/bookings/ReservationTable";
import { DayTabs } from "@/components/bookings/DayTabs";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { CalendarDays } from "lucide-react";

export function BookingsClient() {
  const [selectedAmenity, setSelectedAmenity] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const utils = trpc.useUtils();
  const { data: amenities, isLoading: loadingAmenities } =
    trpc.amenity.listAmenities.useQuery();

  const { data: sessions } = trpc.booking.listSessions.useQuery(
    { amenityId: selectedAmenity!, dayOfWeek: selectedDay },
    { enabled: !!selectedAmenity },
  );

  const { data: myReservations = [], isLoading: loadingRes } =
    trpc.booking.listMyReservations.useQuery();

  const bookMutation = trpc.booking.bookSession.useMutation({
    onSuccess: () => {
      showToast("success", "Rezervasyon başarıyla oluşturuldu!");
      utils.booking.listMyReservations.invalidate();
      utils.booking.listSessions.invalidate();
      setSelectedSession(null);
    },
    onError: (err) => showToast("error", err.message),
  });

  const cancelMutation = trpc.booking.cancelReservation.useMutation({
    onSuccess: () => {
      showToast("success", "Rezervasyon iptal edildi");
      utils.booking.listMyReservations.invalidate();
    },
    onError: (err) => showToast("error", err.message),
  });

  const handleBook = () => {
    if (!selectedSession || !date) return;
    bookMutation.mutate({ sessionId: selectedSession, reservationDate: date });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold">
          Tesis Rezervasyonları
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ortak alan tesislerini seçin ve uygun seansa rezervasyon yapın
        </p>
      </div>

      {/* Amenity Selection */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Tesis Seçimi
        </h2>
        {loadingAmenities ? (
          <LoadingSpinner />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {amenities?.map((a) => (
              <AmenityCard
                key={a.id}
                id={a.id}
                name={a.name}
                description={a.description}
                isSelected={selectedAmenity === a.id}
                onSelect={(id) => {
                  setSelectedAmenity(id);
                  setSelectedSession(null);
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* Session Picker */}
      {selectedAmenity && (
        <section className="animate-fade-in">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Gün & Seans
          </h2>

          <DayTabs
            selectedDay={selectedDay}
            onSelect={(day) => {
              setSelectedDay(day);
              setSelectedSession(null);
            }}
          />

          {/* Session slots */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sessions?.map((s) => (
              <SessionSlot
                key={s.id}
                id={s.id}
                startTime={s.startTime}
                endTime={s.endTime}
                capacity={s.capacity}
                bookedCount={0}
                isSelected={selectedSession === s.id}
                onSelect={setSelectedSession}
              />
            ))}
            {sessions?.length === 0 && (
              <GlassCard className="col-span-full text-center py-8">
                <p className="text-sm text-muted-foreground">
                  Bu gün için tanımlı seans yok
                </p>
              </GlassCard>
            )}
          </div>

          {/* Date + Book */}
          {selectedSession && (
            <GlassCard className="mt-4 animate-fade-in">
              <div className="flex flex-col sm:flex-row items-end gap-4">
                <div className="flex-1 w-full">
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Rezervasyon Tarihi
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
                  />
                </div>
                <button
                  onClick={handleBook}
                  disabled={bookMutation.isPending}
                  className="w-full sm:w-auto px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-sm font-semibold transition-all shadow-glow disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CalendarDays className="h-4 w-4" />
                  {bookMutation.isPending
                    ? "Kaydediliyor..."
                    : "Rezervasyon Yap"}
                </button>
              </div>
            </GlassCard>
          )}
        </section>
      )}

      {/* My Reservations */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Rezervasyonlarım
        </h2>
        {loadingRes ? (
          <LoadingSpinner />
        ) : (
          <ReservationTable
            reservations={myReservations}
            onCancel={(id) => cancelMutation.mutate({ reservationId: id })}
            isCancelling={cancelMutation.isPending}
          />
        )}
      </section>
    </div>
  );
}
