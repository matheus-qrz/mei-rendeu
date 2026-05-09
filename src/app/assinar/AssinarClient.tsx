"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

const PLANOS = {
  basic: {
    nome: "Básico",
    preco: "R$29",
    desc: "Controle financeiro completo no WhatsApp",
  },
  pro: {
    nome: "Pro",
    preco: "R$49",
    desc: "Tudo do Básico + IA + contratos + relatórios",
  },
} as const;

export function AssinarClient() {
  const searchParams = useSearchParams();
  const phoneFromUrl = searchParams.get("phone") ?? "";
  const planFromUrl = (searchParams.get("plan") ?? "pro") as "basic" | "pro";

  const [plan, setPlan] = useState<"basic" | "pro">(planFromUrl);
  const [phone, setPhone] = useState(phoneFromUrl);
  const [name, setName] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (phoneFromUrl) setPhone(phoneFromUrl);
  }, [phoneFromUrl]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.replace(/\D/g, ""),
          plan,
          name,
          cpfCnpj: cpfCnpj.replace(/\D/g, ""),
          email,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao processar. Tenta de novo.");
        return;
      }

      // Redireciona direto para o link de pagamento do Asaas
      window.location.href = data.paymentUrl;
    } catch {
      setError("Sem conexão. Tenta de novo.");
    } finally {
      setLoading(false);
    }
  }

  const plano = PLANOS[plan];

  return (
    <div className="min-h-screen bg-[#0a1a0f] text-white font-sans">
      <div className="max-w-md mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center gap-2 mb-8">
          <span className="text-2xl">🟢</span>
          <span className="font-black text-xl tracking-tight">MeiRendeu</span>
        </div>

        <h1 className="text-3xl font-black mb-2 leading-tight">
          Falta pouco para começar
        </h1>
        <p className="text-[#a0b8a8] text-sm mb-8">
          Preencha os dados e escolha como pagar (PIX, cartão ou boleto).
        </p>

        {/* Seletor de plano */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          {(["basic", "pro"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPlan(p)}
              className={`p-4 rounded-2xl border text-left transition-all ${
                plan === p
                  ? "bg-[#c8f135] border-[#c8f135] text-[#0a1a0f]"
                  : "bg-[#0d200f] border-[#1a3020] text-white hover:border-[#2a4030]"
              }`}
            >
              <p
                className={`text-xs font-bold mb-1 ${
                  plan === p ? "text-[#3a5a1f]" : "text-[#5a7a65]"
                }`}
              >
                {PLANOS[p].nome.toUpperCase()}
              </p>
              <p className="text-xl font-black">
                {PLANOS[p].preco}
                <span
                  className={`text-xs font-medium ${
                    plan === p ? "text-[#3a5a1f]" : "text-[#5a7a65]"
                  }`}
                >
                  /mês
                </span>
              </p>
            </button>
          ))}
        </div>

        <p className="text-[#7a9a85] text-xs mb-6">{plano.desc}</p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Nome completo">
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="João Silva"
              className={inputClass}
            />
          </Field>

          <Field label="CPF ou CNPJ">
            <input
              type="text"
              required
              value={cpfCnpj}
              onChange={(e) => setCpfCnpj(e.target.value)}
              placeholder="000.000.000-00"
              className={inputClass}
            />
          </Field>

          <Field label="E-mail">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className={inputClass}
            />
          </Field>

          <Field label="WhatsApp (com DDD)">
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="83999999999"
              className={inputClass}
            />
          </Field>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#c8f135] text-[#0a1a0f] font-bold py-4 rounded-xl hover:bg-[#d4f94e] disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            {loading
              ? "Gerando link de pagamento..."
              : `Assinar ${plano.nome} — ${plano.preco}/mês →`}
          </button>

          <p className="text-[#3a5a45] text-xs text-center">
            Você será redirecionado para o pagamento seguro do Asaas. Pague com
            PIX, cartão ou boleto.
          </p>
        </form>
      </div>
    </div>
  );
}

const inputClass =
  "w-full bg-[#0d200f] border border-[#1a3020] rounded-xl px-4 py-3 text-white placeholder:text-[#4a6a55] focus:outline-none focus:border-[#c8f13580] transition-colors text-sm";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-[#a0b8a8] text-xs font-medium mb-1.5 block">
        {label}
      </label>
      {children}
    </div>
  );
}
