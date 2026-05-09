import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Usa service_role para bypassar RLS — só roda no servidor
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "E-mail inválido." }, { status: 400 });
    }

    const normalized = email.trim().toLowerCase();

    // Validação básica de formato
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalized)) {
      return NextResponse.json({ error: "E-mail inválido." }, { status: 400 });
    }

    const { error } = await supabase
      .from("waitlist")
      .insert({ email: normalized, source: "landing" });

    if (error) {
      // Código 23505 = unique_violation — email já cadastrado
      if (error.code === "23505") {
        // Retorna sucesso mesmo assim — não revelar se email já existe
        return NextResponse.json({ ok: true });
      }
      console.error("[waitlist] Supabase error:", error);
      return NextResponse.json({ error: "Erro interno." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[waitlist] Unexpected error:", err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}