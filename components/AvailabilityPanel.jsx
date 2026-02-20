"use client";

import { useEffect, useMemo, useState } from "react";

function startOfWeekMonday(inputDate = new Date()) {
  const date = new Date(inputDate);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function toYmd(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function dayLabel(dateYmd) {
  const date = new Date(`${dateYmd}T00:00:00`);
  return date.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit" });
}

function isWeekend(dateYmd) {
  const date = new Date(`${dateYmd}T00:00:00`);
  const day = date.getDay();
  return day === 0 || day === 6;
}

function stateClass(state) {
  if (state === "off") return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (state === "full") return "bg-rose-100 text-rose-700 border-rose-200";
  if (state === "limited") return "bg-amber-100 text-amber-800 border-amber-200";
  if (state === "available") return "bg-emerald-100 text-emerald-700 border-emerald-200";
  return "bg-neutral-100 text-neutral-600 border-neutral-200";
}

function stateLabel(state) {
  if (state === "off") return "available";
  return state;
}

export default function AvailabilityPanel({ slug, itemType = "service" }) {
  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [days, setDays] = useState([]);

  const weekStartYmd = useMemo(() => toYmd(weekStart), [weekStart]);

  useEffect(() => {
    let ignore = false;
    async function loadAvailability() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(
          `/api/availability?slug=${encodeURIComponent(slug)}&week_start=${encodeURIComponent(
            weekStartYmd
          )}`
        );
        const payload = await res.json();
        if (!res.ok) {
          throw new Error(payload?.error || "Indisponible");
        }
        if (!ignore) {
          setDays(Array.isArray(payload?.days) ? payload.days : []);
        }
      } catch (err) {
        if (!ignore) {
          setError(err?.message || "Erreur de chargement");
          setDays([]);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    loadAvailability();
    return () => {
      ignore = true;
    };
  }, [slug, weekStartYmd]);

  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);

  return (
    <section id="availability" className="rounded-3xl border border-neutral-200 bg-white p-5 md:p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold text-neutral-900">Disponibilites hebdomadaires</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setWeekStart(addDays(weekStart, -7))}
            className="inline-flex items-center rounded-full border border-neutral-300 px-3 py-1 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
          >
            Semaine precedente
          </button>
          <button
            type="button"
            onClick={() => setWeekStart(addDays(weekStart, 7))}
            className="inline-flex items-center rounded-full border border-neutral-300 px-3 py-1 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
          >
            Semaine suivante
          </button>
        </div>
      </div>

      <p className="text-xs text-neutral-500 mb-4">
        Du {weekStart.toLocaleDateString("fr-FR")} au {weekEnd.toLocaleDateString("fr-FR")}
      </p>

      {loading ? (
        <p className="text-sm text-neutral-500">Chargement des disponibilites...</p>
      ) : error ? (
        <p className="text-sm text-rose-700">Erreur: {error}</p>
      ) : days.length === 0 ? (
        <p className="text-sm text-neutral-500">Aucune disponibilite definie pour cette semaine.</p>
      ) : (
        <div className="space-y-3">
          {days.map((day) => (
            <div
              key={day.date}
              className="rounded-2xl border border-neutral-100 bg-neutral-50 px-4 py-3"
            >
              {/*
                Weekends are always closed in UI, even if backend rules exist.
              */}
              {(() => {
                const weekend = isWeekend(day.date);
                const effectiveState = weekend ? "off" : day.state;
                return (
                  <>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-neutral-900">{dayLabel(day.date)}</p>
                <span
                  className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${stateClass(
                    effectiveState
                  )}`}
                >
                  {stateLabel(effectiveState)}
                </span>
              </div>

              {!weekend && Array.isArray(day.slots) && day.slots.length > 0 ? (
                <div className="space-y-2">
                  {day.slots.map((slot, idx) => (
                    <div
                      key={`${day.date}-${slot.slot || idx}`}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2"
                    >
                      <div>
                        <p className="text-xs font-semibold text-neutral-800">
                          {slot.slot || "Journee"}
                        </p>
                        <p className="text-[11px] text-neutral-500">
                          {slot.booked}/{slot.capacity} reserves · {slot.remaining} restant(s)
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${stateClass(
                            slot.state
                          )}`}
                        >
                          {slot.state}
                        </span>
                        <a
                          href={`/?${itemType}=${encodeURIComponent(
                            slug
                          )}&scheduled_date=${encodeURIComponent(day.date)}&time_slot=${encodeURIComponent(
                            slot.slot || ""
                          )}#contact`}
                          className="inline-flex items-center rounded-full bg-amber-700 px-3 py-1 text-[11px] font-semibold text-white hover:bg-amber-800"
                        >
                          Reserver ce creneau
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : weekend ? (
                <p className="text-xs text-neutral-500">Weekend ferme.</p>
              ) : (
                <p className="text-xs text-neutral-500">Aucun creneau configure.</p>
              )}
                  </>
                );
              })()}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
