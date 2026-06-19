"use client";

import { FONT } from "@/lib/typography";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const supabaseConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

  useEffect(() => {
    if (!supabaseConfigured) return;

    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabaseConfigured]);

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
  };

  if (!supabaseConfigured) {
    return (
      <Link
        href="/login"
        className="text-xs transition-colors duration-150 px-2.5 py-1"
        style={{
          fontFamily: FONT.mono,
          border: "1px solid rgba(24,18,14,0.12)",
          color: "#18120E",
        }}
      >
        Log ind
      </Link>
    );
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="text-xs transition-colors duration-150 px-2.5 py-1"
        style={{
          fontFamily: FONT.mono,
          border: "1px solid rgba(24,18,14,0.12)",
          color: "#18120E",
        }}
      >
        Log ind
      </Link>
    );
  }

  const label = user.email?.split("@")[0] ?? "Konto";

  return (
    <button
      onClick={signOut}
      className="text-xs transition-colors duration-150 px-2.5 py-1"
      style={{
        fontFamily: FONT.mono,
        border: "1px solid rgba(24,18,14,0.12)",
        color: "#18120E",
        background: "none",
        cursor: "pointer",
      }}
      title={user.email ?? undefined}
    >
      {label}
    </button>
  );
}
