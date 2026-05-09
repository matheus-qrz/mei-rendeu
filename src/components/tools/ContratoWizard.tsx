"use client";

import { useState } from "react";
import type { User } from "@/types";
import type {
  ContratoInput,
  CamposPrestacaoServico,
  Parte,
} from "@/types/contrato";

// ─── Importa o gerador do packages/core ──────────────────
// Caminho relativo ao monorepo. Se não tiver o packages/core instalado,
// cole o arquivo prestacao-servico.ts em src/lib/contratos/ e ajuste.
// import { gerarPrestacaoServico } from "@freelancer-br/core"
// Por ora, importamos de um lib local (ver instrução abaixo):
import { gerarPrestacaoServico } from "@/lib/contratos/prestacao-servico";

interface Props {
  user: User;
}

type Step = "tipo" | "contratante" | "contratado" | "servico" | "preview";

export function ContratoWizard({ user }: Props) {
  const [step, setStep] = useState<Step>("tipo");
  const [contratoTexto, setContratoTexto] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // ─── Estado do wizard ───────────────────────────────────
  const [contratante, setContratante] = useState<Parte>({
    nome: user.name,
    cpfCnpj: user.cnpj ?? "",
    endereco: "",
    cidade: "João Pessoa",
    estado: "PB",
    email: "",
  });

  const [contratado, setContratado] = useState<Parte>({
    nome: "",
    cpfCnpj: "",
    endereco: "",
    cidade: "",
    estado: "",
    email: "",
  });

  const [campos, setCampos] = useState<CamposPrestacaoServico>({
    descricaoServico: "",
    dataInicio: new Date().toISOString().split("T")[0],
    dataFim: "",
    prazoIndeterminado: false,
    valorTotal: 0,
    formaPagamento: "avista",
    numeroParcelas: 2,
    diaVencimento: 10,
    multaAtraso: 1,
    incluiPropriedadeIntelectual: true,
    incluiSigiloInformacoes: true,
    incluiNaoAliciamento: false,
    prazoNaoAliciamentoMeses: 12,
    foro: "João Pessoa",
  });

  function gerarContrato() {
    const input: ContratoInput<CamposPrestacaoServico> = {
      tipo: "prestacao-servico",
      contratante,
      contratado,
      campos,
      dataAssinatura: new Date().toISOString().split("T")[0],
      localAssinatura: campos.foro,
    };
    const texto = gerarPrestacaoServico(input);
    setContratoTexto(texto);
    setStep("preview");
  }

  async function copiar() {
    if (!contratoTexto) return;
    await navigator.clipboard.writeText(contratoTexto);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function baixarTxt() {
    if (!contratoTexto) return;
    const blob = new Blob([contratoTexto], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contrato-prestacao-servico-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ─── Steps ──────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Progress */}
      <div className="flex gap-2">
        {(["contratante", "contratado", "servico", "preview"] as Step[]).map(
          (s, i) => (
            <div
              key={s}
              className={`flex-1 h-1 rounded-full transition-colors ${
                ["contratante", "contratado", "servico", "preview"].indexOf(
                  step,
                ) >= i
                  ? "bg-[#c8f135]"
                  : "bg-[#1a3020]"
              }`}
            />
          ),
        )}
      </div>

      {/* Step: Seus dados (contratante = o MEI) */}
      {step === "contratante" && (
        <div className="space-y-4">
          <h3 className="text-white font-bold text-lg">Seus dados</h3>
          <p className="text-[#7a9a85] text-sm">
            Pré-preenchido com seu cadastro. Confira e complete.
          </p>
          <ParteForm value={contratante} onChange={setContratante} />
          <button
            onClick={() => setStep("contratado")}
            disabled={!contratante.nome || !contratante.cpfCnpj}
            className="w-full bg-[#c8f135] text-[#0a1a0f] font-bold py-3 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#d4f94e] transition-colors"
          >
            Próximo →
          </button>
        </div>
      )}

      {/* Step: tipo — apenas prestação por ora */}
      {step === "tipo" && (
        <div className="space-y-4">
          <h3 className="text-white font-bold text-lg">Tipo de contrato</h3>
          <button
            onClick={() => setStep("contratante")}
            className="w-full bg-[#0d200f] border border-[#c8f13540] rounded-2xl p-4 text-left hover:border-[#c8f135] transition-colors group"
          >
            <p className="text-white font-bold group-hover:text-[#c8f135] transition-colors">
              📄 Prestação de Serviços
            </p>
            <p className="text-[#7a9a85] text-sm mt-1">
              Freelancer → Cliente. Escopo, prazo, valor, PI opcional.
            </p>
          </button>
          <div className="bg-[#0a1a0f] border border-[#1a3020] rounded-2xl p-4 opacity-40 cursor-not-allowed">
            <p className="text-white font-bold">🤝 NDA</p>
            <p className="text-[#7a9a85] text-sm mt-1">Em breve</p>
          </div>
          <div className="bg-[#0a1a0f] border border-[#1a3020] rounded-2xl p-4 opacity-40 cursor-not-allowed">
            <p className="text-white font-bold">🤜 Parceria Comercial</p>
            <p className="text-[#7a9a85] text-sm mt-1">Em breve</p>
          </div>
        </div>
      )}

      {/* Step: dados do cliente (contratado) */}
      {step === "contratado" && (
        <div className="space-y-4">
          <h3 className="text-white font-bold text-lg">Dados do cliente</h3>
          <ParteForm value={contratado} onChange={setContratado} />
          <div className="flex gap-3">
            <button
              onClick={() => setStep("contratante")}
              className="flex-1 border border-[#1a3020] text-[#7a9a85] font-bold py-3 rounded-xl hover:bg-[#1a3020] transition-colors"
            >
              ← Voltar
            </button>
            <button
              onClick={() => setStep("servico")}
              disabled={!contratado.nome || !contratado.cpfCnpj}
              className="flex-1 bg-[#c8f135] text-[#0a1a0f] font-bold py-3 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#d4f94e] transition-colors"
            >
              Próximo →
            </button>
          </div>
        </div>
      )}

      {/* Step: detalhes do serviço */}
      {step === "servico" && (
        <div className="space-y-4">
          <h3 className="text-white font-bold text-lg">Detalhes do serviço</h3>

          <Field label="Descrição do serviço">
            <textarea
              value={campos.descricaoServico}
              onChange={(e) =>
                setCampos((p) => ({ ...p, descricaoServico: e.target.value }))
              }
              rows={3}
              placeholder="Ex: Desenvolvimento de landing page em Next.js com integração de pagamento..."
              className="w-full bg-[#1a3020] border border-[#2a4030] rounded-xl px-4 py-3 text-white placeholder:text-[#4a6a55] focus:outline-none focus:border-[#c8f13580] text-sm resize-none"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Data de início">
              <input
                type="date"
                value={campos.dataInicio}
                onChange={(e) =>
                  setCampos((p) => ({ ...p, dataInicio: e.target.value }))
                }
                className={inputClass}
              />
            </Field>
            <Field label="Data de entrega">
              <input
                type="date"
                value={campos.dataFim}
                disabled={campos.prazoIndeterminado}
                onChange={(e) =>
                  setCampos((p) => ({ ...p, dataFim: e.target.value }))
                }
                className={inputClass + " disabled:opacity-40"}
              />
            </Field>
          </div>

          <label className="flex items-center gap-2 text-[#a0b8a8] text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={campos.prazoIndeterminado}
              onChange={(e) =>
                setCampos((p) => ({
                  ...p,
                  prazoIndeterminado: e.target.checked,
                }))
              }
              className="accent-[#c8f135]"
            />
            Prazo indeterminado
          </label>

          <Field label="Valor total (R$)">
            <input
              type="number"
              min={0}
              step={100}
              value={campos.valorTotal || ""}
              onChange={(e) =>
                setCampos((p) => ({
                  ...p,
                  valorTotal: Number(e.target.value),
                }))
              }
              placeholder="5000"
              className={inputClass}
            />
          </Field>

          <Field label="Forma de pagamento">
            <select
              value={campos.formaPagamento}
              onChange={(e) =>
                setCampos((p) => ({
                  ...p,
                  formaPagamento: e.target
                    .value as CamposPrestacaoServico["formaPagamento"],
                }))
              }
              className={inputClass}
            >
              <option value="avista">À vista</option>
              <option value="parcelado">Parcelado</option>
              <option value="recorrente">Recorrente (mensal)</option>
            </select>
          </Field>

          {campos.formaPagamento === "parcelado" && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Parcelas">
                <input
                  type="number"
                  min={2}
                  max={12}
                  value={campos.numeroParcelas}
                  onChange={(e) =>
                    setCampos((p) => ({
                      ...p,
                      numeroParcelas: Number(e.target.value),
                    }))
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Dia de vencimento">
                <input
                  type="number"
                  min={1}
                  max={28}
                  value={campos.diaVencimento}
                  onChange={(e) =>
                    setCampos((p) => ({
                      ...p,
                      diaVencimento: Number(e.target.value),
                    }))
                  }
                  className={inputClass}
                />
              </Field>
            </div>
          )}

          <div className="space-y-2 pt-2">
            <p className="text-[#7a9a85] text-sm font-bold">
              Cláusulas opcionais
            </p>
            {(
              [
                ["incluiPropriedadeIntelectual", "Propriedade Intelectual"],
                ["incluiSigiloInformacoes", "Sigilo e Confidencialidade"],
                ["incluiNaoAliciamento", "Não Aliciamento"],
              ] as const
            ).map(([key, label]) => (
              <label
                key={key}
                className="flex items-center gap-2 text-[#a0b8a8] text-sm cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={campos[key]}
                  onChange={(e) =>
                    setCampos((p) => ({ ...p, [key]: e.target.checked }))
                  }
                  className="accent-[#c8f135]"
                />
                {label}
              </label>
            ))}
          </div>

          <Field label="Foro (cidade para disputas)">
            <input
              type="text"
              value={campos.foro}
              onChange={(e) =>
                setCampos((p) => ({ ...p, foro: e.target.value }))
              }
              placeholder="João Pessoa"
              className={inputClass}
            />
          </Field>

          <div className="flex gap-3">
            <button
              onClick={() => setStep("contratado")}
              className="flex-1 border border-[#1a3020] text-[#7a9a85] font-bold py-3 rounded-xl hover:bg-[#1a3020] transition-colors"
            >
              ← Voltar
            </button>
            <button
              onClick={gerarContrato}
              disabled={!campos.descricaoServico || !campos.valorTotal}
              className="flex-1 bg-[#c8f135] text-[#0a1a0f] font-bold py-3 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#d4f94e] transition-colors"
            >
              Gerar contrato →
            </button>
          </div>
        </div>
      )}

      {/* Step: preview */}
      {step === "preview" && contratoTexto && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-bold text-lg">Contrato gerado</h3>
            <button
              onClick={() => setStep("servico")}
              className="text-[#7a9a85] text-sm hover:text-white"
            >
              ← Editar
            </button>
          </div>
          <div className="bg-[#0d200f] border border-[#1a3020] rounded-2xl p-4 max-h-64 overflow-y-auto">
            <pre className="text-[#a0b8a8] text-xs leading-relaxed whitespace-pre-wrap font-mono">
              {contratoTexto}
            </pre>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={copiar}
              className="flex-1 border border-[#c8f13540] text-[#c8f135] font-bold py-3 rounded-xl hover:bg-[#c8f13510] transition-colors text-sm"
            >
              {copied ? "✅ Copiado!" : "📋 Copiar texto"}
            </button>
            <button
              onClick={baixarTxt}
              className="flex-1 bg-[#c8f135] text-[#0a1a0f] font-bold py-3 rounded-xl hover:bg-[#d4f94e] transition-colors text-sm"
            >
              ⬇️ Baixar .txt
            </button>
          </div>
          <p className="text-[#3a5a45] text-xs text-center">
            Modelo de referência. Não substitui assessoria jurídica. Assine
            digitalmente via Gov.br, ClickSign ou DocuSign.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Componentes auxiliares ───────────────────────────────

const inputClass =
  "w-full bg-[#1a3020] border border-[#2a4030] rounded-xl px-4 py-2.5 text-white placeholder:text-[#4a6a55] focus:outline-none focus:border-[#c8f13580] text-sm";

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

function ParteForm({
  value,
  onChange,
}: {
  value: Parte;
  onChange: (p: Parte) => void;
}) {
  function set(key: keyof Parte) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      onChange({ ...value, [key]: e.target.value });
  }

  return (
    <div className="space-y-3">
      <Field label="Nome completo / Razão social">
        <input
          type="text"
          value={value.nome}
          onChange={set("nome")}
          placeholder="João Silva"
          className={inputClass}
        />
      </Field>
      <Field label="CPF / CNPJ">
        <input
          type="text"
          value={value.cpfCnpj}
          onChange={set("cpfCnpj")}
          placeholder="000.000.000-00"
          className={inputClass}
        />
      </Field>
      <Field label="Endereço">
        <input
          type="text"
          value={value.endereco}
          onChange={set("endereco")}
          placeholder="Rua das Flores, 123"
          className={inputClass}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Cidade">
          <input
            type="text"
            value={value.cidade}
            onChange={set("cidade")}
            placeholder="João Pessoa"
            className={inputClass}
          />
        </Field>
        <Field label="Estado">
          <input
            type="text"
            value={value.estado}
            onChange={set("estado")}
            placeholder="PB"
            maxLength={2}
            className={inputClass}
          />
        </Field>
      </div>
      <Field label="E-mail">
        <input
          type="email"
          value={value.email}
          onChange={set("email")}
          placeholder="joao@email.com"
          className={inputClass}
        />
      </Field>
    </div>
  );
}
