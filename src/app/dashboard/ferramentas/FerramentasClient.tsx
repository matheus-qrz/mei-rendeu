"use client";

import { useState } from "react";
import type { User } from "@/types";
import { CalculadoraWrapper } from "@/components/tools/CalculadoraWrapper";
import { ContratoWizard } from "@/components/tools/ContratoWizard";

type Tab = "calculadora" | "contrato";

export function FerramentasClient({ user }: { user: User }) {
  const [tab, setTab] = useState<Tab>("calculadora");

  return (
    <div className="min-h-screen bg-[#0a1a0f] text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <p className="text-[#c8f135] text-xs font-bold uppercase tracking-widest mb-2">
            Ferramentas Pro
          </p>
          <h1 className="text-2xl font-black">
            Precifique e formalize seus serviços
          </h1>
          <p className="text-[#7a9a85] text-sm mt-1">
            Calculadora de preço e gerador de contrato com seus dados
            pré-preenchidos.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-[#0d200f] p-1 rounded-xl border border-[#1a3020]">
          <button
            onClick={() => setTab("calculadora")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
              tab === "calculadora"
                ? "bg-[#c8f135] text-[#0a1a0f]"
                : "text-[#7a9a85] hover:text-white"
            }`}
          >
            💰 Calculadora
          </button>
          <button
            onClick={() => setTab("contrato")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
              tab === "contrato"
                ? "bg-[#c8f135] text-[#0a1a0f]"
                : "text-[#7a9a85] hover:text-white"
            }`}
          >
            📄 Contrato
          </button>
        </div>

        {/* Conteúdo */}
        {tab === "calculadora" && <CalculadoraWrapper user={user} />}
        {tab === "contrato" && <ContratoWizard user={user} />}
      </div>
    </div>
  );
}
