"use client";

import { FONT } from "@/lib/typography";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supabaseConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseConfigured) {
      setMessage("Supabase er ikke konfigureret endnu. Se .env.example");
      return;
    }

    setLoading(true);
    setMessage(null);

    const supabase = createClient();

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      setMessage(
        error
          ? error.message
          : "Konto oprettet! Tjek din email hvis bekræftelse er slået til.",
      );
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage(error.message);
      } else {
        window.location.href = "/";
      }
    }

    setLoading(false);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-5"
      style={{ backgroundColor: "#F0EBE1" }}
    >
      <div className="w-full max-w-sm">
        <Link
          href="/"
          style={{
            fontFamily: FONT.fraunces,
            fontWeight: 900,
            fontStyle: "italic",
            letterSpacing: "-0.04em",
            fontSize: "1.25rem",
            color: "#18120E",
            display: "block",
            marginBottom: "2rem",
          }}
        >
          dailies
        </Link>

        <h1
          style={{
            fontFamily: FONT.fraunces,
            fontStyle: "italic",
            fontWeight: 700,
            fontSize: "1.75rem",
            color: "#18120E",
            marginBottom: "0.5rem",
          }}
        >
          {mode === "login" ? "Log ind" : "Opret konto"}
        </h1>
        <p className="text-sm mb-8" style={{ color: "#8A7A68" }}>
          Gem din streak og statistik på tværs af enheder.
        </p>

        {!supabaseConfigured && (
          <div
            className="text-xs mb-6 p-3"
            style={{
              backgroundColor: "rgba(184,56,37,0.08)",
              color: "#B83825",
              fontFamily: FONT.mono,
              lineHeight: 1.6,
            }}
          >
            Kopiér `.env.example` → `.env.local` og udfyld nøglerne fra Supabase Connect-dialogen.
            Spil virker uden login.
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="email"
              className="block text-xs mb-1.5"
              style={{ fontFamily: FONT.mono, color: "#8A7A68", letterSpacing: "0.08em" }}
            >
              EMAIL
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 text-sm outline-none"
              style={{
                backgroundColor: "#E8E0D0",
                border: "1px solid rgba(24,18,14,0.1)",
                color: "#18120E",
              }}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs mb-1.5"
              style={{ fontFamily: FONT.mono, color: "#8A7A68", letterSpacing: "0.08em" }}
            >
              ADGANGSKODE
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 text-sm outline-none"
              style={{
                backgroundColor: "#E8E0D0",
                border: "1px solid rgba(24,18,14,0.1)",
                color: "#18120E",
              }}
            />
          </div>

          {message && (
            <p className="text-xs" style={{ color: "#B83825", fontFamily: FONT.mono }}>
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-sm font-semibold transition-opacity"
            style={{
              backgroundColor: "#18120E",
              color: "#F0EBE1",
              opacity: loading ? 0.6 : 1,
              cursor: loading ? "wait" : "pointer",
            }}
          >
            {loading ? "Vent..." : mode === "login" ? "Log ind" : "Opret konto"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="mt-6 text-xs w-full text-left"
          style={{ color: "#8A7A68", fontFamily: FONT.mono }}
        >
          {mode === "login" ? "Ingen konto? Opret en →" : "Har du allerede en konto? Log ind →"}
        </button>
      </div>
    </div>
  );
}
