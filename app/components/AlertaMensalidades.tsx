"use client";

import Link from "next/link";
import type { Aluno } from "../lib/aluno";
import { hojeISO } from "../lib/aluno";
import { listarAlunos } from "../lib/alunos";
import { calcularDevido, lerMensalidadesDoMes, mesAtual, nomeMes, real, type Mensalidade } from "../lib/mensalidades";
import { useSite } from "../lib/siteConfig";
import { useCarga } from "../lib/useCarga";

const VAZIO_A: Aluno[] = [];
const VAZIO_M: Mensalidade[] = [];

/** Aviso para o administrador: mensalidades em aberto depois de X dias do vencimento. */
export default function AlertaMensalidades() {
  const site = useSite();
  const usa = site.mensalidadeValor > 0 && !site.abasOcultas.includes("mensalidades");
  const mes = mesAtual();
  const alunos = useCarga(() => listarAlunos(null), VAZIO_A, usa);
  const pagos = useCarga(() => lerMensalidadesDoMes(mes), VAZIO_M, usa);
  if (!usa || alunos.carregando || pagos.carregando) return null;
  const d = calcularDevido(mes, { valor: site.mensalidadeValor, dia: site.vencimentoDia, multaPct: site.multaPct, jurosMesPct: site.jurosMesPct }, hojeISO());
  if (d.diasAtraso < Math.max(1, site.avisoAtrasoDias)) return null;
  const devendo = alunos.dados.filter((a) => !pagos.dados.find((m) => m.uid === a.uid)?.pago);
  if (!devendo.length) return null;
  return (
    <div className="alerta-mens" role="note">
      <p>
        💳 <b>{devendo.length}</b> {devendo.length === 1 ? "mensalidade" : "mensalidades"} de {nomeMes(mes)} em aberto há {d.diasAtraso} dias do vencimento (hoje: {real(d.total)} cada).
      </p>
      <small>{devendo.slice(0, 8).map((a) => a.apelido || a.nome).join(", ")}{devendo.length > 8 ? "…" : ""}</small>
      <Link className="btn btn-primary" href="/admin#mensalidades">
        Ver mensalidades
      </Link>
    </div>
  );
}
