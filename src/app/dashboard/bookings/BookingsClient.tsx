"use client";

import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { showToast } from "@/components/shared/Toast";
import { AmenitySelectionSection } from "@/components/bookings/AmenitySelectionSection";
import { SessionPickerSection } from "@/components/bookings/SessionPickerSection";
import { MyReservationsSection } from "@/components/bookings/MyReservationsSection";

export function BookingsClient() {
  const [selectedAmenity, setSelectedAmenity] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const utils = trpc.useUtils();
  const { data: amenities, isLoading: loadingAmenities } =
    trpc.amenity.listAmenities.useQuery();

  const { data: sessions } = trpc.booking.listSessions.useQuery(
    { amenityId: selectedAmenity!, dayOfWeek: selectedDay, date },
    { enabled: !!selectedAmenity && !!date },
  );

  const { data: myReservations = [], isLoading: loadingRes } =
    trpc.amenity.listMyReservations.useQuery();

  const bookMutation = trpc.booking.bookSession.useMutation({
    onSuccess: () => {
      showToast("success", "Rezervasyon başarıyla oluşturuldu!");
      utils.amenity.listMyReservations.invalidate();
      utils.booking.listSessions.invalidate();
      setSelectedSession(null);
    },
    onError: (err) => showToast("error", err.message),
  });

  const cancelMutation = trpc.amenity.cancelReservation.useMutation({
    onSuccess: () => {
      showToast("success", "Rezervasyon iptal edildi");
      utils.amenity.listMyReservations.invalidate();
    },
    onError: (err) => showToast("error", err.message),
  });

  const handleBook = () => {
    if (!selectedSession || !date) return;
    bookMutation.mutate({ sessionId: selectedSession, reservationDate: date });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold">
          Tesis Rezervasyonları
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ortak alan tesislerini seçin ve uygun seansa rezervasyon yapın
        </p>
      </div>

      <AmenitySelectionSection
        loading={loadingAmenities}
        amenities={amenities}
        selectedAmenity={selectedAmenity}
        onSelect={(id) => {
          setSelectedAmenity(id);
          setSelectedSession(null);
        }}
      />

      {selectedAmenity && (
        <SessionPickerSection
          selectedDay={selectedDay}
          setSelectedDay={setSelectedDay}
          selectedSession={selectedSession}
          setSelectedSession={setSelectedSession}
          date={date}
          setDate={setDate}
          sessions={sessions}
          handleBook={handleBook}
          isBookingPending={bookMutation.isPending}
        />
      )}

      <MyReservationsSection
        loading={loadingRes}
        reservations={myReservations}
        onCancel={(id) => cancelMutation.mutate({ reservationId: id })}
        isCancelling={cancelMutation.isPending}
      />
    </div>
  );
}
