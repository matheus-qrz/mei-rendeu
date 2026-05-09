// src/app/dashboard/ferramentas/page.tsx
// Rota protegida — só para usuários com plano Pro

import { redirect } from "next/navigation";
import { getUserByPhone } from "@/lib/supabase/queries";
import { FerramentasClient } from "./FerramentasClient";

// TODO: substituir pela função real de auth quando o dashboard estiver pronto
// Por ora, recebe o userId via searchParams para facilitar testes
export default async function FerramentasPage({
  searchParams,
}: {
  searchParams: { phone?: string };
}) {
  const phone = searchParams.phone;

  if (!phone) {
    redirect("/");
  }

  const user = await getUserByPhone(phone);

  if (!user) {
    redirect("/");
  }

  if (user.plan !== "pro") {
    redirect("/dashboard/upgrade");
  }

  return <FerramentasClient user={user} />;
}
