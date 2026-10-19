import { doc, getDoc } from "firebase/firestore";
import { getDb } from "./firebase";

export type Papel = "admin" | "professor" | "aluno";
export type Perfil = { papel: Papel; nome?: string; faixa?: string; academia?: string; turmas?: string[] };

/** Celular vira um e-mail interno (não precisa existir caixa de entrada). */
export function paraEmail(entrada: string): string {
  const t = entrada.trim().toLowerCase();
  if (t.includes("@")) return t;
  const digitos = t.replace(/\D/g, "");
  return digitos ? `${digitos}@celular.dojoalcantara.app` : "";
}

export async function lerPerfil(uid: string): Promise<Perfil | null> {
  const snap = await getDoc(doc(getDb(), "users", uid));
  if (!snap.exists()) return null;
  const d = snap.data() as Partial<Perfil>;
  const turmas = Array.isArray(d.turmas) ? d.turmas.filter((t): t is string => typeof t === "string") : [];
  if (d.papel !== "admin" && d.papel !== "professor" && d.papel !== "aluno") return null;
  return { papel: d.papel, nome: d.nome, faixa: d.faixa, academia: d.academia, turmas };
}

export function ehEquipe(p: Perfil | null): boolean {
  return p?.papel === "admin" || p?.papel === "professor";
}

export function mensagemErro(e: unknown): string {
  const code = typeof e === "object" && e && "code" in e ? String((e as { code: unknown }).code) : "";
  if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found" || code === "auth/invalid-email")
    return "E-mail ou celular, ou senha, incorretos.";
  if (code === "auth/too-many-requests") return "Muitas tentativas. Espere alguns minutos e tente de novo.";
  if (code === "auth/network-request-failed") return "Sem conexão com a internet. Tente de novo.";
  if (code === "permission-denied" || code === "firestore/permission-denied") return "Sem permissão para isso. Se você acabou de atualizar o site, publique as regras novas (arquivo firestore.rules) em Firebase → Firestore → Regras.";
  return "Algo deu errado. Tente de novo.";
}
