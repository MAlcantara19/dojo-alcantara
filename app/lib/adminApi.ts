import { getAuthInstance } from "./firebase";

export type RespostaAdmin = { ok: boolean; mensagem: string };

/** Chama o servidor do site para o que o navegador não pode fazer sozinho (trocar senha, apagar conta). */
export async function chamarAdmin(acao: "senha" | "apagar" | "email", dados: Record<string, string>): Promise<RespostaAdmin> {
  const u = getAuthInstance().currentUser;
  if (!u) return { ok: false, mensagem: "Entre de novo para continuar." };
  try {
    const token = await u.getIdToken();
    const r = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ acao, ...dados }) });
    const j = (await r.json().catch(() => ({}))) as { mensagem?: string };
    return { ok: r.ok, mensagem: j.mensagem ?? (r.ok ? "Feito." : `O servidor respondeu com erro ${r.status}.`) };
  } catch {
    return { ok: false, mensagem: "Não consegui falar com o servidor do site. Confira a internet e tente de novo." };
  }
}
