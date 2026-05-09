"use client";

import { useState, useMemo } from "react";
import { calcular, type Inputs } from "@/lib/calcular";
import type { User } from "@/types";

// ─── Formatação ───────────────────────────────────────────
function fmt(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  });
}

interface Props {
  user: User;
}

export function CalculadoraWrapper({ user }: Props) {
  // Pré-preenche renda líquida com base no faturamento YTD se disponível
  const rendaInicial = useMemo(() => {
    if (user.monthly_revenue_ytd > 0) {
      const mediaAnual =
        user.monthly_revenue_ytd / new Date().getMonth() + 1 || 1;
      return Math.round(Math.min(mediaAnual * 0.7, 15_000) / 100) * 100;
    }
    return 5_000;
  }, [user.monthly_revenue_ytd]);

  const [inputs, setInputs] = useState<Inputs>({
    regime: "mei",
    rendaLiquida: rendaInicial,
    horasPorSemana: 40,
    semanasFeriasPorAno: 4,
    despesasMensais: 500,
    inadimplenciaPct: 0.1,
    margemLucroPct: 0.2,
  });

  const resultado = useMemo(() => calcular(inputs), [inputs]);

  function set<K extends keyof Inputs>(key: K) {
    return (value: Inputs[K]) =>
      setInputs((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="space-y-6">
      {/* Regime toggle */}
      <div className="flex gap-2">
        {(["mei", "autonomo"] as const).map((r) => (
          <button
            key={r}
            onClick={() => set("regime")(r)}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
              inputs.regime === r
                ? "bg-[#c8f135] text-[#0a1a0f]"
                : "bg-[#1a3020] text-[#7a9a85] hover:bg-[#243828]"
            }`}
          >
            {r === "mei" ? "MEI" : "Autônomo PF"}
          </button>
        ))}
      </div>

      {/* Inputs */}
      <div className="space-y-4">
        <SliderInput
          label="Renda líquida desejada"
          hint={fmt(inputs.rendaLiquida) + "/mês"}
          value={inputs.rendaLiquida}
          min={1000}
          max={30000}
          step={500}
          onChange={set("rendaLiquida")}
          display={fmt(inputs.rendaLiquida)}
        />
        <SliderInput
          label="Horas trabalhadas por semana"
          value={inputs.horasPorSemana}
          min={10}
          max={60}
          step={1}
          onChange={set("horasPorSemana")}
          display={`${inputs.horasPorSemana}h`}
        />
        <SliderInput
          label="Semanas de férias por ano"
          value={inputs.semanasFeriasPorAno}
          min={0}
          max={8}
          step={1}
          onChange={set("semanasFeriasPorAno")}
          display={`${inputs.semanasFeriasPorAno} sem`}
        />
        <SliderInput
          label="Despesas mensais (internet, software...)"
          value={inputs.despesasMensais}
          min={0}
          max={5000}
          step={100}
          onChange={set("despesasMensais")}
          display={fmt(inputs.despesasMensais)}
        />
        <SliderInput
          label="Margem de inadimplência"
          value={Math.round(inputs.inadimplenciaPct * 100)}
          min={0}
          max={30}
          step={1}
          onChange={(v) => set("inadimplenciaPct")(v / 100)}
          display={`${Math.round(inputs.inadimplenciaPct * 100)}%`}
        />
        <SliderInput
          label="Margem de lucro"
          value={Math.round(inputs.margemLucroPct * 100)}
          min={0}
          max={60}
          step={5}
          onChange={(v) => set("margemLucroPct")(v / 100)}
          display={`${Math.round(inputs.margemLucroPct * 100)}%`}
        />
      </div>

      {/* Alerta teto MEI */}
      {resultado.alertaTeto && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3 text-yellow-400 text-sm">
          ⚠️ Com esse faturamento você pode ultrapassar o teto do MEI
          (R$81k/ano). Considere migrar para Simples Nacional.
        </div>
      )}

      {/* Resultados */}
      <div className="bg-[#0d200f] border border-[#1a3020] rounded-2xl p-5 space-y-4">
        <p className="text-[#c8f135] text-xs font-bold uppercase tracking-widest">
          Seu custo hora real
        </p>

        <div className="flex items-end gap-2">
          <span className="text-4xl font-black text-white">
            {fmt(resultado.custoHora)}
          </span>
          <span className="text-[#5a7a65] text-sm mb-1">/hora</span>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-2 border-t border-[#1a3020]">
          {(
            [
              ["Mínimo", resultado.sugestoes.minimo],
              ["Ideal", resultado.sugestoes.ideal],
              ["Premium", resultado.sugestoes.premium],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="text-center">
              <p className="text-[#5a7a65] text-xs mb-1">{label}</p>
              <p className="text-white font-bold text-sm">{fmt(value)}/h</p>
            </div>
          ))}
        </div>

        <div className="space-y-2 pt-2 border-t border-[#1a3020]">
          <p className="text-[#5a7a65] text-xs font-bold uppercase tracking-widest mb-3">
            Breakdown mensal
          </p>
          {(
            [
              ["Renda desejada", resultado.breakdown.rendaBruta],
              ["Impostos", resultado.breakdown.impostos],
              ["Férias + 13º", resultado.breakdown.ferias13],
              ["Despesas", resultado.breakdown.despesas],
              ["Reserva inadimplência", resultado.breakdown.inadimplencia],
              ["Margem de lucro", resultado.breakdown.lucro],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-[#7a9a85]">{label}</span>
              <span className="text-white font-medium">{fmt(value)}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm pt-2 border-t border-[#1a3020]">
            <span className="text-[#c8f135] font-bold">
              Faturamento necessário
            </span>
            <span className="text-[#c8f135] font-bold">
              {fmt(resultado.valorRetainerMensal)}/mês
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#1a3020]">
          <div className="bg-[#0a1a0f] rounded-xl p-3 text-center">
            <p className="text-[#5a7a65] text-xs mb-1">Projeto 40h</p>
            <p className="text-white font-bold">
              {fmt(resultado.valorProjeto40h)}
            </p>
          </div>
          <div className="bg-[#0a1a0f] rounded-xl p-3 text-center">
            <p className="text-[#5a7a65] text-xs mb-1">Retainer mensal</p>
            <p className="text-white font-bold">
              {fmt(resultado.valorRetainerMensal)}
            </p>
          </div>
        </div>
      </div>

      <p className="text-[#3a5a45] text-xs text-center">
        Valores estimados. Consulte um contador para decisões fiscais.
      </p>
    </div>
  );
}

// ─── Componente slider interno ────────────────────────────
function SliderInput({
  label,
  hint,
  value,
  min,
  max,
  step,
  onChange,
  display,
}: {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  display: string;
}) {
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1.5">
        <label className="text-[#a0b8a8] text-sm">{label}</label>
        <span className="text-white text-sm font-bold">{display}</span>
      </div>
      {hint && <p className="text-[#5a7a65] text-xs mb-1.5">{hint}</p>}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[#c8f135]"
      />
    </div>
  );
}
