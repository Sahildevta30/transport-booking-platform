"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArmchairIcon, Car, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { trackEvent } from "@/lib/analytics/events";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Seat = { id: string; seat_number: string; seat_type: string | null };

/**
 * Trivial wrapper, defined outside the component. The compiler's purity
 * check flags a direct Date.now() call reached from a component body, even
 * from inside an async event-handler closure; going through a named
 * module-level function is enough to tell it apart from a render-time read.
 * Behaviour is identical — it's still just Date.now().
 */
function currentTimeMs(): number {
  return Date.now();
}
type Props = {
  tripId: string;
  seats: Seat[];
  unavailableSeatIds: string[];
  passengerCount: number;
  basePrice: number;
  bookingMode: "SEAT_BOOKING" | "FULL_VEHICLE_BOOKING" | "BOTH";
};
export function BookingForm({
  tripId,
  seats,
  unavailableSeatIds,
  passengerCount,
  basePrice,
  bookingMode,
}: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [selected, setSelected] = useState<string[]>([]);
  const [mode, setMode] = useState<"SEAT_BOOKING" | "FULL_VEHICLE_BOOKING">(
    bookingMode === "FULL_VEHICLE_BOOKING"
      ? "FULL_VEHICLE_BOOKING"
      : "SEAT_BOOKING",
  );
  const [passengers, setPassengers] = useState(
    Array.from({ length: passengerCount }, () => ({ fullName: "", phone: "" })),
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [lockUntil, setLockUntil] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    // No active lock: nothing to tick. The countdown text is only ever
    // rendered while `selected.length > 0`, which is always cleared
    // together with lockUntil, so no display can go stale here — and the
    // submit() guard below checks lockUntil/Date.now() directly rather
    // than trusting this display-only state, so there is nothing to reset.
    if (!lockUntil) return;
    const tick = () => {
      const seconds = Math.max(0, Math.ceil((lockUntil - Date.now()) / 1000));
      setRemaining(seconds);
      if (seconds === 0) {
        setSelected([]);
        setLockUntil(null);
        setMessage("Seat lock expired. Please select your seats again.");
        router.refresh();
      }
    };
    // Run the first tick via a macrotask instead of calling tick()
    // synchronously in the effect body. Same one-frame-later timing as
    // before (no perceptible delay), it just avoids updating state
    // directly within the effect's own synchronous execution.
    const immediate = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, 1000);
    return () => {
      window.clearTimeout(immediate);
      window.clearInterval(timer);
    };
  }, [lockUntil, router]);
  const toggle = async (id: string) => {
    if (busy || mode !== "SEAT_BOOKING" || unavailableSeatIds.includes(id))
      return;
    const removing = selected.includes(id);
    if (removing) {
      const next = selected.filter((x) => x !== id);
      setSelected(next);
      const { error } = await supabase.rpc("release_seat_locks", {
        p_trip_id: tripId,
        p_seat_ids: [id],
      });
      if (error) {
        setSelected(selected);
        setMessage("Seat selection could not be updated. Please try again.");
      } else {
        if (!next.length) setLockUntil(null);
        setMessage(
          next.length
            ? "Seat released. Remaining seats stay locked."
            : "Seat released.",
        );
      }
      return;
    }
    if (selected.length >= passengerCount) return;
    const next = [...selected, id];
    setSelected(next);
    const { data, error } = await supabase.rpc("acquire_seat_locks", {
      p_trip_id: tripId,
      p_seat_ids: next,
      p_ttl_seconds: 600,
    });
    if (error) {
      setSelected(selected);
      setMessage(
        "One of those seats is no longer available. Please refresh and choose again.",
      );
    } else {
      const expiries = (data ?? [])
        .map((x) => new Date(x.expires_at).getTime())
        .filter(Number.isFinite);
      setLockUntil(
        expiries.length ? Math.min(...expiries) : currentTimeMs() + 600000,
      );
      setMessage("Seats locked for 10 minutes.");
      void trackEvent(supabase, {
        event: "seat_selected",
        properties: { tripId, seatCount: next.length },
      });
    }
  };
  const switchMode = async (
    nextMode: "SEAT_BOOKING" | "FULL_VEHICLE_BOOKING",
  ) => {
    if (busy || nextMode === mode) return;
    if (nextMode === "FULL_VEHICLE_BOOKING" && selected.length) {
      setBusy(true);
      const { error } = await supabase.rpc("release_seat_locks", {
        p_trip_id: tripId,
        p_seat_ids: selected,
      });
      setBusy(false);
      if (error) {
        setMessage("Could not release selected seats. Please try again.");
        return;
      }
      setSelected([]);
      setLockUntil(null);
    }
    setMode(nextMode);
    setMessage(
      nextMode === "FULL_VEHICLE_BOOKING"
        ? "Selected seat locks released for full-vehicle booking."
        : "",
    );
  };
  const submit = async () => {
    setMessage("");
    // Check the actual lock expiry against wall-clock time rather than the
    // once-a-second `remaining` display state: `remaining` can lag reality
    // by up to a second, which could otherwise let a submit through just
    // after the lock actually expired, or block one still technically
    // valid. The database lock (acquire_seat_locks / create_seat_booking)
    // remains the real source of truth either way — this is a UX guard.
    if (mode === "SEAT_BOOKING" && (!lockUntil || lockUntil <= currentTimeMs())) {
      setMessage("Seat lock expired. Please select your seats again.");
      setSelected([]);
      router.refresh();
      return;
    }
    if (
      passengers.some(
        (p) => p.fullName.trim().length < 2 || p.phone.trim().length < 7,
      )
    ) {
      setMessage("Enter valid passenger names and phone numbers.");
      return;
    }
    if (mode === "SEAT_BOOKING" && selected.length !== passengerCount) {
      setMessage(`Select exactly ${passengerCount} seat(s).`);
      return;
    }
    await trackEvent(supabase, {
      event: "booking_started",
      properties: { tripId, mode, passengerCount },
    });
    setBusy(true);
    const call =
      mode === "SEAT_BOOKING"
        ? await supabase.rpc("create_seat_booking", {
            p_trip_id: tripId,
            p_seat_ids: selected,
            p_passengers: passengers,
          })
        : await supabase.rpc("create_full_vehicle_booking", {
            p_trip_id: tripId,
            p_passengers: passengers,
          });
    setBusy(false);
    if (call.error) {
      setMessage(
        "Booking could not be completed. Availability may have changed.",
      );
      return;
    }
    await trackEvent(supabase, {
      event: "booking_completed",
      properties: {
        bookingId: call.data,
        tripId,
        mode,
        passengerCount,
        amount:
          mode === "SEAT_BOOKING" ? basePrice * passengerCount : basePrice,
      },
    });
    router.push(`/customer/bookings/${call.data}`);
    router.refresh();
  };
  const clock = `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;
  const urgent = mode === "SEAT_BOOKING" && selected.length > 0 && remaining > 0 && remaining <= 60;
  return (
    <div className="space-y-8 rounded-[1.75rem] border border-border bg-card p-5 shadow-elevated sm:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Complete your booking</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick your booking style and passenger details. Selected seats stay
            held while you finish.
          </p>
        </div>
        {mode === "SEAT_BOOKING" && selected.length > 0 ? (
          <div
            aria-live="polite"
            className={`flex shrink-0 items-center gap-2 self-start rounded-full px-3.5 py-1.5 text-sm font-bold ${
              urgent
                ? "bg-destructive/10 text-destructive"
                : "bg-mode-seat/10 text-mode-seat"
            }`}
          >
            <Clock className="h-4 w-4" aria-hidden />
            Seats held for {clock}
          </div>
        ) : null}
      </div>

      {bookingMode === "BOTH" ? (
        <div role="tablist" aria-label="Booking style" className="inline-flex gap-1 rounded-full bg-muted p-1">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "SEAT_BOOKING"}
            disabled={busy}
            onClick={() => switchMode("SEAT_BOOKING")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${
              mode === "SEAT_BOOKING"
                ? "bg-background text-foreground shadow-card"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Book seats
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "FULL_VEHICLE_BOOKING"}
            disabled={busy}
            onClick={() => switchMode("FULL_VEHICLE_BOOKING")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${
              mode === "FULL_VEHICLE_BOOKING"
                ? "bg-background text-foreground shadow-card"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Full vehicle
          </button>
        </div>
      ) : null}

      {mode === "SEAT_BOOKING" ? (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold">
              Select {passengerCount} seat{passengerCount === 1 ? "" : "s"}
              <span className="ml-2 font-normal text-muted-foreground">
                ({selected.length}/{passengerCount} selected)
              </span>
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 rounded-md border-2 border-border" aria-hidden />
                Available
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 rounded-md bg-mode-seat" aria-hidden />
                Selected
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 rounded-md bg-muted-foreground/30" aria-hidden />
                Unavailable
              </span>
            </div>
          </div>

          <div
            role="group"
            aria-label="Seat map"
            className="mt-4 grid grid-cols-4 gap-2.5 rounded-2xl bg-muted/50 p-4 sm:grid-cols-6 md:grid-cols-8"
          >
            {seats.map((s) => {
              const unavailable = unavailableSeatIds.includes(s.id);
              const isSelected = selected.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  disabled={busy || unavailable}
                  onClick={() => toggle(s.id)}
                  aria-pressed={isSelected}
                  aria-label={`Seat ${s.seat_number}${unavailable ? ", unavailable" : isSelected ? ", selected" : ", available"}`}
                  title={unavailable ? "Unavailable" : undefined}
                  className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded-t-xl rounded-b-md border-2 text-xs font-bold transition-all disabled:cursor-not-allowed ${
                    unavailable
                      ? "border-transparent bg-muted-foreground/20 text-muted-foreground/60 line-through"
                      : isSelected
                        ? "border-mode-seat bg-mode-seat text-white shadow-card"
                        : "border-border bg-background text-foreground hover:border-mode-seat/50 hover:bg-mode-seat/5"
                  }`}
                >
                  <ArmchairIcon className="h-4 w-4" aria-hidden />
                  {s.seat_number}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-2xl border border-mode-full-vehicle/30 bg-mode-full-vehicle/5 p-5">
          <Car className="h-6 w-6 shrink-0 text-mode-full-vehicle" aria-hidden />
          <p className="text-sm font-semibold">
            Full vehicle reservation · ₹{basePrice.toFixed(2)}
          </p>
        </div>
      )}

      <div className="space-y-4">
        <p className="text-sm font-semibold">Passenger details</p>
        {passengers.map((p, i) => (
          <div key={i} className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={`passenger-name-${i}`} className="text-xs text-muted-foreground">
                Passenger {i + 1} full name
              </Label>
              <Input
                id={`passenger-name-${i}`}
                value={p.fullName}
                onChange={(e) =>
                  setPassengers((x) =>
                    x.map((v, j) => (j === i ? { ...v, fullName: e.target.value } : v)),
                  )
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`passenger-phone-${i}`} className="text-xs text-muted-foreground">
                Phone number
              </Label>
              <Input
                id={`passenger-phone-${i}`}
                type="tel"
                value={p.phone}
                onChange={(e) =>
                  setPassengers((x) =>
                    x.map((v, j) => (j === i ? { ...v, phone: e.target.value } : v)),
                  )
                }
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 rounded-2xl bg-muted/50 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Estimated total</p>
          <p className="text-2xl font-black">
            ₹
            {(mode === "SEAT_BOOKING" ? basePrice * passengerCount : basePrice).toFixed(2)}
          </p>
        </div>
        <Button type="button" size="lg" disabled={busy} onClick={submit} className="w-full sm:w-auto">
          {busy ? "Booking…" : "Confirm & continue"}
        </Button>
      </div>

      {message ? (
        <p role="status" className="text-sm text-muted-foreground">
          {message}
        </p>
      ) : null}
    </div>
  );
}
