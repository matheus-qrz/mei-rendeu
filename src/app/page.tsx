// src/app/page.tsx

const WHATSAPP_NUMBER = "5583999999999"; // TODO: trocar pelo número real quando o chip chegar
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Oi! Quero começar a usar o MeiRendeu.")}`;

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a1a0f] text-white font-sans overflow-x-hidden">
      {/* ── Fundo com textura sutil ── */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }}
      />

      {/* ── Nav ── */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🟢</span>
          <span className="font-black text-xl tracking-tight">MeiRendeu</span>
        </div>
        <a
          href={WHATSAPP_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-flex items-center gap-2 bg-[#c8f135] text-[#0a1a0f] font-bold text-sm px-4 py-2 rounded-full hover:bg-[#d4f94e] transition-colors"
        >
          Começar agora →
        </a>
      </nav>

      {/* ── Hero ── */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pt-16 pb-24">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-[#ffffff0f] border border-[#ffffff15] rounded-full px-4 py-1.5 text-sm text-[#c8f135] font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-[#c8f135] animate-pulse inline-block" />
            7 dias grátis. Sem cartão.
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight mb-6">
            Seu financeiro
            <br />
            <span className="text-[#c8f135]">no WhatsApp.</span>
            <br />
            Do jeito MEI.
          </h1>

          <p className="text-lg sm:text-xl text-[#a0b8a8] leading-relaxed max-w-xl mb-10">
            IA que registra suas receitas, lembra do DAS, avisa quando você tá
            chegando no teto — tudo pelo WhatsApp, sem planilha, sem app novo.
          </p>

          {/* CTA Principal */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-md">
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-[#c8f135] text-[#0a1a0f] font-bold px-8 py-4 rounded-xl hover:bg-[#d4f94e] transition-all active:scale-95 text-base"
            >
              💬 Começar pelo WhatsApp
            </a>
            <a
              href="#planos"
              className="inline-flex items-center justify-center gap-2 border border-[#1a3020] text-[#a0b8a8] font-bold px-6 py-4 rounded-xl hover:bg-[#0d200f] hover:text-white transition-colors text-base"
            >
              Ver planos
            </a>
          </div>
          <p className="text-[#4a6a55] text-xs mt-3">
            Manda um oi no nosso WhatsApp e o assistente te guia. Leva 1 minuto.
          </p>
        </div>

        {/* Mockup flutuante */}
        <div className="absolute right-0 top-16 hidden lg:block w-72 xl:w-80 opacity-90">
          <WhatsAppMockup />
        </div>
      </section>

      {/* ── Dores ── */}
      <section className="relative z-10 bg-[#0d200f] border-y border-[#1a3020] py-20">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-[#c8f135] font-bold text-sm uppercase tracking-widest mb-4">
            Você se reconhece nisso?
          </p>
          <h2 className="text-3xl sm:text-4xl font-black mb-12 max-w-xl leading-tight">
            A vida de MEI não é fácil
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {dores.map((d) => (
              <div
                key={d.texto}
                className="bg-[#0a1a0f] border border-[#1a3020] rounded-2xl p-5 flex gap-4 items-start"
              >
                <span className="text-2xl mt-0.5 shrink-0">{d.emoji}</span>
                <p className="text-[#a0b8a8] text-sm leading-relaxed">
                  {d.texto}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Como funciona ── */}
      <section className="relative z-10 py-24 max-w-5xl mx-auto px-6">
        <p className="text-[#c8f135] font-bold text-sm uppercase tracking-widest mb-4">
          Como funciona
        </p>
        <h2 className="text-3xl sm:text-4xl font-black mb-16 max-w-xl leading-tight">
          Simples do jeito que precisa ser
        </h2>
        <div className="space-y-6">
          {passos.map((p, i) => (
            <div
              key={p.titulo}
              className="flex gap-6 items-start bg-[#0d200f] border border-[#1a3020] rounded-2xl p-6 hover:border-[#2a4030] transition-colors group"
            >
              <div className="shrink-0 w-10 h-10 rounded-xl bg-[#c8f13515] border border-[#c8f13530] flex items-center justify-center text-[#c8f135] font-black text-lg">
                {i + 1}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-white text-lg mb-1.5">
                  {p.titulo}
                </h3>
                <p className="text-[#7a9a85] text-sm leading-relaxed">
                  {p.desc}
                </p>
              </div>
              <span className="text-3xl shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                {p.emoji}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Funcionalidades ── */}
      <section className="relative z-10 bg-[#0d200f] border-y border-[#1a3020] py-24">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-[#c8f135] font-bold text-sm uppercase tracking-widest mb-4">
            O que você ganha
          </p>
          <h2 className="text-3xl sm:text-4xl font-black mb-12 max-w-lg leading-tight">
            Tudo que um MEI precisa. Nada que não precisa.
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f) => (
              <div
                key={f.titulo}
                className="bg-[#0a1a0f] border border-[#1a3020] rounded-2xl p-5 flex flex-col gap-3"
              >
                <span className="text-3xl">{f.emoji}</span>
                <div>
                  <p className="font-bold text-white text-base mb-1">
                    {f.titulo}
                  </p>
                  <p className="text-[#6a8a75] text-xs leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Planos ── */}
      <section
        id="planos"
        className="relative z-10 py-24 max-w-5xl mx-auto px-6"
      >
        <p className="text-[#c8f135] font-bold text-sm uppercase tracking-widest mb-4">
          Planos
        </p>
        <h2 className="text-3xl sm:text-4xl font-black mb-4 leading-tight">
          Preço de MEI pra MEI
        </h2>
        <p className="text-[#7a9a85] text-base mb-12 max-w-lg">
          Comece grátis por 7 dias. Cancele quando quiser, sem multa.
        </p>

        <div className="grid sm:grid-cols-2 gap-5 max-w-2xl">
          {planos.map((p) => (
            <div
              key={p.id}
              className={`relative rounded-2xl p-6 border flex flex-col ${
                p.destaque
                  ? "bg-[#c8f135] text-[#0a1a0f] border-[#c8f135]"
                  : "bg-[#0d200f] text-white border-[#1a3020]"
              }`}
            >
              {p.destaque && (
                <div className="absolute -top-3 left-6 bg-[#0a1a0f] text-[#c8f135] text-xs font-bold px-3 py-1 rounded-full border border-[#c8f13540]">
                  Mais popular
                </div>
              )}
              <p
                className={`font-bold text-sm mb-1 ${p.destaque ? "text-[#3a5a1f]" : "text-[#6a8a75]"}`}
              >
                {p.nome}
              </p>
              <div className="flex items-end gap-1 mb-4">
                <span className="text-4xl font-black">{p.preco}</span>
                <span
                  className={`text-sm mb-1.5 ${p.destaque ? "text-[#4a6a2f]" : "text-[#5a7a65]"}`}
                >
                  /mês
                </span>
              </div>
              <ul className="space-y-2.5 mb-6 flex-1">
                {p.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <span
                      className={`mt-0.5 text-base ${p.destaque ? "text-[#3a5a1f]" : "text-[#c8f135]"}`}
                    >
                      ✓
                    </span>
                    <span
                      className={
                        p.destaque ? "text-[#1a3a0f]" : "text-[#a0b8a8]"
                      }
                    >
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
              <a
                href={`/assinar?plan=${p.id}`}
                className={`block text-center font-bold py-3 rounded-xl transition-all active:scale-95 ${
                  p.destaque
                    ? "bg-[#0a1a0f] text-[#c8f135] hover:bg-[#1a3020]"
                    : "bg-[#c8f135] text-[#0a1a0f] hover:bg-[#d4f94e]"
                }`}
              >
                Assinar {p.nome} →
              </a>
            </div>
          ))}
        </div>
        <p className="text-[#4a6a55] text-sm mt-6">
          * Antes de assinar, manda um oi no nosso WhatsApp para criar seu
          cadastro.
        </p>
      </section>

      {/* ── CTA Final ── */}
      <section className="relative z-10 bg-[#c8f135] py-20">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-4xl sm:text-5xl font-black text-[#0a1a0f] mb-4 leading-tight">
            Chega de susto com o DAS.
          </h2>
          <p className="text-[#2a4a1f] text-lg mb-8 max-w-md mx-auto">
            Comece agora gratuitamente. 7 dias para testar, sem cartão.
          </p>
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#0a1a0f] text-[#c8f135] font-bold px-8 py-4 rounded-full text-base hover:bg-[#1a3020] transition-colors active:scale-95"
          >
            💬 Falar com o MeiRendeu →
          </a>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 py-8 max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">🟢</span>
          <span className="font-black text-sm text-white">MeiRendeu</span>
        </div>
        <p className="text-[#3a5a45] text-xs text-center">
          Feito com ☕ em João Pessoa/PB.{" "}
          <span>Não somos contador. Somos assistente financeiro.</span>
        </p>
        <p className="text-[#3a5a45] text-xs">
          © {new Date().getFullYear()} MeiRendeu
        </p>
      </footer>
    </div>
  );
}

// ─── Componente mockup WhatsApp ──────────────────────────────
function WhatsAppMockup() {
  return (
    <div className="bg-[#0d200f] border border-[#1a3020] rounded-3xl overflow-hidden shadow-2xl">
      <div className="bg-[#128C7E] px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#c8f135] flex items-center justify-center text-[#0a1a0f] font-black text-xs">
          MR
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-none">MeiRendeu</p>
          <p className="text-[#a0d4cd] text-xs mt-0.5">online</p>
        </div>
      </div>
      <div className="p-4 space-y-3 bg-[#0a1a0f]">
        <ChatMsg from="user" text="Recebi R$850 de um cliente hoje" />
        <ChatMsg
          from="bot"
          text={
            "✅ Anotado! +R$850,00 em receitas.\n\n📊 Outubro até agora: R$4.230\n🎯 Teto MEI: 51% usado\n📅 DAS vence em 14 dias"
          }
        />
        <ChatMsg from="user" text="Quanto gastei esse mês?" />
        <ChatMsg
          from="bot"
          text={
            "💸 Despesas em outubro: R$1.240\n\n• Material: R$680\n• Transporte: R$320\n• Outros: R$240\n\n💰 Lucro estimado: R$2.990"
          }
        />
      </div>
      <div className="bg-[#0d200f] px-3 py-2 flex items-center gap-2 border-t border-[#1a3020]">
        <div className="flex-1 bg-[#1a3020] rounded-full px-4 py-2 text-[#4a6a55] text-xs">
          Digite uma mensagem...
        </div>
        <div className="w-8 h-8 rounded-full bg-[#128C7E] flex items-center justify-center text-white text-xs">
          ▶
        </div>
      </div>
    </div>
  );
}

function ChatMsg({ from, text }: { from: "user" | "bot"; text: string }) {
  const isUser = from === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed whitespace-pre-line ${
          isUser
            ? "bg-[#128C7E] text-white rounded-br-none"
            : "bg-[#1a3020] text-[#a0c8a8] rounded-bl-none"
        }`}
      >
        {text}
      </div>
    </div>
  );
}

// ─── Dados ────────────────────────────────────────────────────
const dores = [
  { emoji: "😰", texto: "Esqueceu de pagar o DAS e levou multa desnecessária" },
  {
    emoji: "📊",
    texto: "Não sabe quanto faturou no mês sem abrir várias planilhas",
  },
  {
    emoji: "🚨",
    texto: "Só descobriu que passou do teto MEI quando o contador avisou",
  },
  {
    emoji: "💸",
    texto: "Não separa pessoa física de pessoa jurídica na conta",
  },
  {
    emoji: "📱",
    texto: "Tentou apps de controle financeiro e abandonou em 2 semanas",
  },
  {
    emoji: "😤",
    texto: "Paga contador para algo que poderia resolver sozinho",
  },
];

const passos = [
  {
    titulo: "Manda um oi no WhatsApp",
    desc: "Você salva o número e manda um oi. Pronto. Sem download, sem cadastro complicado, sem tutorial.",
    emoji: "📲",
  },
  {
    titulo: "Conta o que aconteceu",
    desc: '"Vendi R$300 hoje" ou "paguei R$80 de gasolina" — escreve como você fala e o agente entende.',
    emoji: "💬",
  },
  {
    titulo: "Recebe resumos e alertas",
    desc: "DAS chegando? Você recebe aviso. Chegando no teto anual? Você sabe antes de virar problema.",
    emoji: "🔔",
  },
  {
    titulo: "Vê o relatório mensal",
    desc: "Todo início de mês, um resumo completo do que entrou, saiu e o que sobrou — sem precisar pedir.",
    emoji: "📈",
  },
];

const features = [
  {
    emoji: "💰",
    titulo: "Controle de caixa",
    desc: "Registra receitas e despesas por mensagem de texto.",
  },
  {
    emoji: "📅",
    titulo: "Lembrete do DAS",
    desc: "Aviso automático antes do vencimento todo mês.",
  },
  {
    emoji: "🚦",
    titulo: "Alerta de teto",
    desc: "Sabe quando você está perto dos R$81k anuais.",
  },
  {
    emoji: "📊",
    titulo: "Relatório mensal",
    desc: "Resumo completo todo mês, automático no WhatsApp.",
  },
  {
    emoji: "🤖",
    titulo: "IA contextual",
    desc: "Entende linguagem natural, sem precisar decorar comandos.",
  },
  {
    emoji: "📂",
    titulo: "Categorias automáticas",
    desc: "Classifica despesas sem você precisar fazer nada.",
  },
  {
    emoji: "🔒",
    titulo: "Seus dados, seu controle",
    desc: "Dados armazenados com segurança, nunca vendidos.",
  },
  {
    emoji: "⚡",
    titulo: "Resposta em segundos",
    desc: "Sem espera. Você pergunta, recebe na hora.",
  },
];

const planos = [
  {
    id: "basic" as const,
    nome: "Básico",
    preco: "R$29",
    destaque: false,
    items: [
      "Registro de receitas e despesas",
      "Lembrete do DAS",
      "Resumo mensal",
      "Alerta de teto MEI",
      "Histórico 3 meses",
    ],
  },
  {
    id: "pro" as const,
    nome: "Pro",
    preco: "R$49",
    destaque: true,
    items: [
      "Tudo do Básico",
      "Análise financeira com IA",
      "Calculadora de precificação",
      "Gerador de contratos",
      "Relatórios PDF com gráficos",
      "Histórico ilimitado",
    ],
  },
];
