"use client";

import { FONT } from "@/lib/typography";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { DaySchedulePreview } from "@/lib/daily-preview";
import type { DailyOverrides } from "@/games/content/daily-manifest";
import { PITCH_TRACKS } from "@/games/content/pitch-tracks";
import { RATIO_PUZZLES } from "@/games/content/ratio-puzzles";

type SaveTarget = "remote" | "local" | "none";

const BG = "#F0EBE1";
const FG = "#18120E";
const MUTED = "#8A7A68";
const BORDER = "rgba(24,18,14,0.12)";

function formatAdminDate(dateStr: string): string {
  const todayStr = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  if (dateStr === todayStr) {
    return "Today";
  }
  if (dateStr === tomorrowStr) {
    return "Tomorrow";
  }

  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function emptyForm(): DailyOverrides {
  return { verbum: "", context: "", pitch: undefined, ratio: undefined };
}

export function AdminDailyPanel() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [configured, setConfigured] = useState(false);
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [days, setDays] = useState<DaySchedulePreview[]>([]);
  const [saveTarget, setSaveTarget] = useState<SaveTarget>("none");
  const [remoteError, setRemoteError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [form, setForm] = useState<DailyOverrides>(emptyForm());
  const [saving, setSaving] = useState(false);

  const loadSession = useCallback(async () => {
    const res = await fetch("/api/admin/session");
    const data = (await res.json()) as { configured: boolean; authenticated: boolean };
    setConfigured(data.configured);
    setAuthenticated(data.authenticated);
    return data.authenticated;
  }, []);

  const loadSchedule = useCallback(async () => {
    const res = await fetch("/api/admin/daily?days=14");
    const data = (await res.json()) as {
      days?: DaySchedulePreview[];
      saveTarget?: SaveTarget;
      remoteError?: string | null;
      message?: string;
    };
    if (!res.ok) {
      toast.error(data.message ?? "Could not load schedule");
      return;
    }
    const scheduleDays = data.days ?? [];
    setDays(scheduleDays);
    setSaveTarget(data.saveTarget ?? "none");
    setRemoteError(data.remoteError ?? null);

    setSelectedDate((prevSelected) => {
      const tomorrowDay = scheduleDays.find(
        (d) => d.date === (prevSelected || (scheduleDays[1] ? scheduleDays[1].date : ""))
      );
      if (tomorrowDay) {
        setForm({
          verbum: tomorrowDay.override?.verbum ?? "",
          context: tomorrowDay.override?.context ?? "",
          pitch: tomorrowDay.override?.pitch,
          ratio: tomorrowDay.override?.ratio,
        });
        return tomorrowDay.date;
      }
      return prevSelected;
    });
  }, []);

  useEffect(() => {
    loadSession().then((ok) => {
      if (ok) loadSchedule();
    });
  }, [loadSession, loadSchedule]);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    const res = await fetch("/api/admin/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoginLoading(false);
    if (!res.ok) {
      toast.error("Wrong password");
      return;
    }
    setAuthenticated(true);
    setPassword("");
    loadSchedule();
  };

  const logout = async () => {
    await fetch("/api/admin/session", { method: "DELETE" });
    setAuthenticated(false);
    setDays([]);
    setSelectedDate(null);
  };

  const selectDay = (day: DaySchedulePreview) => {
    setSelectedDate(day.date);
    setForm({
      verbum: day.override?.verbum ?? "",
      context: day.override?.context ?? "",
      pitch: day.override?.pitch,
      ratio: day.override?.ratio,
    });
  };

  const save = async () => {
    if (!selectedDate) return;
    setSaving(true);
    const res = await fetch("/api/admin/daily", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: selectedDate,
        overrides: {
          verbum: form.verbum || undefined,
          context: form.context || undefined,
          pitch: form.pitch !== undefined ? Number(form.pitch) : undefined,
          ratio: form.ratio !== undefined ? Number(form.ratio) : undefined,
        },
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = (await res.json()) as { message?: string };
      toast.error(data.message ?? "Save failed");
      return;
    }
    toast.success("Saved");
    loadSchedule();
  };

  const clearOverride = async () => {
    if (!selectedDate) return;
    setSaving(true);
    const res = await fetch(`/api/admin/daily?date=${selectedDate}`, { method: "DELETE" });
    setSaving(false);
    if (!res.ok) {
      toast.error("Could not clear override");
      return;
    }
    toast.success("Back to auto rotation");
    setForm(emptyForm());
    loadSchedule();
  };

  if (authenticated === null) {
    return (
      <p style={{ fontFamily: FONT.mono, fontSize: "0.75rem", color: MUTED }}>
        Loading…
      </p>
    );
  }

  if (!configured) {
    return (
      <div
        style={{
          padding: "16px",
          border: `1px solid ${BORDER}`,
          fontFamily: FONT.mono,
          fontSize: "0.75rem",
          color: "#B83825",
          lineHeight: 1.6,
        }}
      >
        Set <code>ADMIN_SECRET</code> in <code>.env.local</code> to enable the admin panel.
      </div>
    );
  }

  if (!authenticated) {
    return (
      <form onSubmit={login} style={{ maxWidth: "320px" }}>
        <label
          htmlFor="admin-password"
          style={{
            display: "block",
            fontFamily: FONT.mono,
            fontSize: "0.65rem",
            color: MUTED,
            letterSpacing: "0.08em",
            marginBottom: "8px",
          }}
        >
          ADMIN PASSWORD
        </label>
        <input
          id="admin-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            padding: "12px 14px",
            backgroundColor: "#E8E0D0",
            border: `1px solid ${BORDER}`,
            fontFamily: FONT.mono,
            fontSize: "0.85rem",
            color: FG,
            marginBottom: "12px",
          }}
        />
        <button
          type="submit"
          disabled={loginLoading}
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: FG,
            color: BG,
            border: "none",
            fontFamily: FONT.mono,
            fontSize: "0.72rem",
            letterSpacing: "0.06em",
            cursor: loginLoading ? "wait" : "pointer",
          }}
        >
          {loginLoading ? "…" : "Log in"}
        </button>
      </form>
    );
  }

  const selected = days.find((d) => d.date === selectedDate);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <p style={{ fontFamily: FONT.mono, fontSize: "0.65rem", color: MUTED, margin: 0 }}>
            Storage:{" "}
            {saveTarget === "remote"
              ? "Supabase"
              : saveTarget === "local"
                ? "daily-overrides.json (local dev)"
                : "read-only — add SUPABASE_SERVICE_ROLE_KEY on Vercel for production saves"}
          </p>
          {remoteError && (
            <p style={{ fontFamily: FONT.mono, fontSize: "0.62rem", color: "#B83825", margin: 0, lineHeight: 1.5 }}>
              Supabase overrides unavailable ({remoteError}). Run{" "}
              <code>supabase/migrations/001_daily_overrides.sql</code> in the SQL editor — schedule still shows auto rotation.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={logout}
          style={{
            fontFamily: FONT.mono,
            fontSize: "0.65rem",
            color: MUTED,
            background: "none",
            border: `1px solid ${BORDER}`,
            padding: "6px 10px",
            cursor: "pointer",
          }}
        >
          Log out
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1fr)",
          gap: "20px",
        }}
      >
        <div>
          <p
            style={{
              fontFamily: FONT.mono,
              fontSize: "0.62rem",
              color: MUTED,
              letterSpacing: "0.12em",
              margin: "0 0 10px",
            }}
          >
            NEXT 14 DAYS
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {days.map((day) => {
              const active = day.date === selectedDate;
              const pinned = Boolean(day.override);
              return (
                <button
                  key={day.date}
                  type="button"
                  onClick={() => selectDay(day)}
                  style={{
                    textAlign: "left",
                    padding: "12px 14px",
                    border: `1px solid ${active ? FG : BORDER}`,
                    backgroundColor: active ? "#E8E0D0" : "transparent",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "4px",
                    }}
                  >
                    <span style={{ fontFamily: FONT.mono, fontSize: "0.72rem", color: FG }}>
                      {formatAdminDate(day.date)}
                      {pinned ? (
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontSize: "0.58rem",
                          fontWeight: "bold",
                          letterSpacing: "0.05em",
                          backgroundColor: "rgba(46, 125, 50, 0.15)",
                          color: "#2E7D32",
                          marginLeft: "8px"
                        }}>
                          PINNED
                        </span>
                      ) : (
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontSize: "0.58rem",
                          fontWeight: "normal",
                          letterSpacing: "0.05em",
                          backgroundColor: "rgba(24,18,14,0.06)",
                          color: MUTED,
                          marginLeft: "8px"
                        }}>
                          AUTO
                        </span>
                      )}
                    </span>
                    <span style={{ fontFamily: FONT.mono, fontSize: "0.62rem", color: MUTED }}>
                      NO. {day.puzzleNumbers.context}
                    </span>
                  </div>
                  <span style={{
                    fontFamily: FONT.mono,
                    fontSize: "0.68rem",
                    color: MUTED,
                    display: "block",
                    marginTop: "4px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                  }}>
                    V: {day.effective.verbum} · C: {day.effective.context} · P: {day.effective.pitch} · R: {day.effective.ratio}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          {selected ? (
            <div
              style={{
                padding: "16px",
                border: `1px solid ${BORDER}`,
                backgroundColor: "#E8E0D0",
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", marginBottom: "4px" }}>
                <p
                  style={{
                    fontFamily: FONT.fraunces,
                    fontStyle: "italic",
                    fontWeight: 700,
                    fontSize: "1.25rem",
                    color: FG,
                    margin: 0,
                  }}
                >
                  {formatAdminDate(selected.date)}
                </p>
                <p
                  style={{
                    fontFamily: FONT.mono,
                    fontSize: "0.68rem",
                    color: MUTED,
                    margin: 0,
                  }}
                >
                  {selected.date}
                </p>
              </div>
              <p
                style={{
                  fontFamily: FONT.sans,
                  fontSize: "0.72rem",
                  color: MUTED,
                  margin: "0 0 16px",
                  lineHeight: 1.4,
                }}
              >
                Efterlad tom for standard auto-rotation. Udfyld kun de spil, der skal overstyres.
              </p>

              <Field
                label="Verbum (Dagens 5-bogstavs ord)"
                value={form.verbum ?? ""}
                placeholder={`Auto (Standard: ${selected.auto.verbum})`}
                onChange={(v) => setForm((f) => ({ ...f, verbum: v }))}
              />
              <Field
                label="Context (Dagens hemmelige sprog-ord)"
                value={form.context ?? ""}
                placeholder={`Auto (Standard: ${selected.auto.context})`}
                onChange={(v) => setForm((f) => ({ ...f, context: v }))}
              />
              <SelectField
                label="Pitch (Dagens sang)"
                value={form.pitch?.toString() ?? ""}
                placeholder={`Auto (Standard: ${selected.auto.pitch})`}
                options={PITCH_TRACKS.map((t) => ({
                  value: String(t.id),
                  label: `#${t.id}: ${t.artist} - ${t.title}`,
                }))}
                onChange={(v) => setForm((f) => ({ ...f, pitch: v ? Number(v) : undefined }))}
              />
              <SelectField
                label="Ratio (Dagens duel)"
                value={form.ratio?.toString() ?? ""}
                placeholder={`Auto (Standard: ${selected.auto.ratio})`}
                options={RATIO_PUZZLES.map((p) => ({
                  value: String(p.id),
                  label: `#${p.id}: ${p.items[0]?.label || ""} vs ${p.items[1]?.label || ""}...`,
                }))}
                onChange={(v) => setForm((f) => ({ ...f, ratio: v ? Number(v) : undefined }))}
              />

              <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
                <button
                  type="button"
                  onClick={save}
                  disabled={saving || saveTarget === "none"}
                  style={btnPrimary}
                >
                  {saving ? "…" : "Gem overstyring"}
                </button>
                {selected.override && (
                  <button type="button" onClick={clearOverride} disabled={saving} style={btnGhost}>
                    Nulstil
                  </button>
                )}
              </div>

              <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: `1px solid ${BORDER}` }}>
                <p style={{ fontFamily: FONT.mono, fontSize: "0.58rem", color: MUTED, letterSpacing: "0.1em", margin: "0 0 8px" }}>
                  STANDARD AUTO-ROTATION
                </p>
                <p style={{ fontFamily: FONT.sans, fontSize: "0.78rem", color: MUTED, margin: 0, lineHeight: 1.5 }}>
                  Verbum: {selected.auto.verbum} · Context: {selected.auto.context}
                  <br />
                  Pitch: {selected.auto.pitch} · Ratio: {selected.auto.ratio}
                </p>
              </div>
            </div>
          ) : (
            <p style={{ fontFamily: FONT.sans, fontSize: "0.88rem", color: MUTED }}>
              Select a day to pin content.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ marginBottom: "12px" }}>
      <label
        style={{
          display: "block",
          fontFamily: FONT.mono,
          fontSize: "0.58rem",
          color: MUTED,
          letterSpacing: "0.1em",
          marginBottom: "6px",
        }}
      >
        {label}
      </label>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          padding: "10px 12px",
          backgroundColor: BG,
          border: `1px solid ${BORDER}`,
          fontFamily: FONT.mono,
          fontSize: "0.82rem",
          color: FG,
        }}
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  placeholder,
  options,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ marginBottom: "12px" }}>
      <label
        style={{
          display: "block",
          fontFamily: FONT.mono,
          fontSize: "0.58rem",
          color: MUTED,
          letterSpacing: "0.1em",
          marginBottom: "6px",
        }}
      >
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 32px 10px 12px",
            backgroundColor: BG,
            border: `1px solid ${BORDER}`,
            fontFamily: FONT.mono,
            fontSize: "0.82rem",
            color: FG,
            borderRadius: 0,
            appearance: "none",
            WebkitAppearance: "none",
            cursor: "pointer",
          }}
        >
          <option value="" style={{ color: MUTED }}>
            {placeholder}
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div
          style={{
            position: "absolute",
            right: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
            width: "0",
            height: "0",
            borderLeft: "5px solid transparent",
            borderRight: "5px solid transparent",
            borderTop: `6px solid ${FG}`,
            opacity: 0.5,
          }}
        />
      </div>
    </div>
  );
}

const btnPrimary: React.CSSProperties = {
  flex: 1,
  padding: "11px",
  backgroundColor: FG,
  color: BG,
  border: "none",
  fontFamily: FONT.mono,
  fontSize: "0.68rem",
  letterSpacing: "0.06em",
  cursor: "pointer",
};

const btnGhost: React.CSSProperties = {
  padding: "11px 14px",
  backgroundColor: "transparent",
  color: MUTED,
  border: `1px solid ${BORDER}`,
  fontFamily: FONT.mono,
  fontSize: "0.68rem",
  cursor: "pointer",
};

export function AdminDailyShell() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: BG, color: FG }}>
      <header
        style={{
          borderBottom: `1px solid ${BORDER}`,
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link
          href="/"
          style={{
            fontFamily: FONT.fraunces,
            fontWeight: 900,
            fontStyle: "italic",
            letterSpacing: "-0.04em",
            fontSize: "1.25rem",
            color: FG,
            textDecoration: "none",
          }}
        >
          dailies
        </Link>
        <span style={{ fontFamily: FONT.mono, fontSize: "0.65rem", color: MUTED }}>
          Daily schedule
        </span>
      </header>
      <main style={{ maxWidth: "960px", margin: "0 auto", padding: "28px 24px 48px" }}>
        <h1
          style={{
            fontFamily: FONT.fraunces,
            fontStyle: "italic",
            fontWeight: 700,
            fontSize: "1.75rem",
            margin: "0 0 8px",
          }}
        >
          Admin
        </h1>
        <p style={{ fontFamily: FONT.sans, fontSize: "0.92rem", color: MUTED, margin: "0 0 28px" }}>
          Pin daily puzzles without redeploying. Overrides apply immediately.
        </p>
        <AdminDailyPanel />
      </main>
    </div>
  );
}
