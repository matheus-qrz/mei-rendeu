import type { Metadata } from "next";
import { Syne } from "next/font/google";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-syne",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MEI Certo — Seu financeiro no WhatsApp",
  description:
    "Agente financeiro com IA para MEIs brasileiros via WhatsApp. Registre receitas, controle despesas, receba alertas do DAS e do teto MEI — sem planilha, sem app novo.",
  keywords: [
    "MEI",
    "microempreendedor",
    "financeiro",
    "WhatsApp",
    "DAS",
    "controle financeiro",
    "MEI Certo",
  ],
  authors: [{ name: "MEI Certo" }],
  creator: "MEI Certo",
  metadataBase: new URL("https://meicerto.com.br"),
  openGraph: {
    title: "MEI Certo — Seu financeiro no WhatsApp",
    description:
      "IA que registra suas receitas, lembra do DAS e avisa quando você tá chegando no teto — tudo pelo WhatsApp.",
    url: "https://meicerto.com.br",
    siteName: "MEI Certo",
    locale: "pt_BR",
    type: "website",
    // images: [{ url: "/og-image.png", width: 1200, height: 630 }], // TODO: adicionar OG image
  },
  twitter: {
    card: "summary_large_image",
    title: "MEI Certo — Seu financeiro no WhatsApp",
    description:
      "IA que registra suas receitas, lembra do DAS e avisa quando você tá chegando no teto.",
    // images: ["/og-image.png"], // TODO: adicionar OG image
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={syne.variable}>
      <body className={`${syne.variable} font-syne antialiased`}>
        {children}
      </body>
    </html>
  );
}
