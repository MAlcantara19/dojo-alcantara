"use client";

import { useState } from "react";
import { hojeISO, type Aluno } from "../lib/aluno";
import { lerTurmas, listarAlunos, type Turma } from "../lib/alunos";
import { mensagemErro } from "../lib/auth";
import { lerMensalidadesDoMes, marcarMensalidade, mesAtual, nomeMes, type Mensalidade } from "../lib/mensalidades";
import { baixarPlanilha } from "../lib/planilha";
import { useSite } from "../lib/siteConfig";
import { useCarga } from "../lib/useCarga";
import Avatar from "./Avatar";
import MenuSuspenso from "./MenuSuspenso";

const VAZIO_A: Aluno[] = [];
const VAZIO_T: Turma[] = [];
const VAZIO_M: Mensalidade[] = [];
const real = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Só o administrador: quem pagou a mensalidade do mês. */
export default function AdminMensalidades() {
  const site = useSite();
  const [mes, setMes] = useState(mesAtual());
  const [turma, setTurma] = useState("");
  const alunos = useCarga(() => listarAlunos(null), VAZIO_A);
  const turmas = useCarga(lerTurmas, VAZIO_T);
  const pagos = useCarga(() => lerMensalidadesDoMes(mes), VAZIO_M);
  const [msg, setMsg] = useState("");

  const lista = alunos.dados.filter((a) => !turma || (turma === "__sem" ? !a.academia : a.academia === turma));
  const doAluno = (uid: string) => pagos.dados.find((m) => m.uid === uid);
  const qtdPagos = lista.filter((a) => doAluno(a.uid)?.pago).length;
  const recebido = lista.reduce((s, a) => s + (doAluno(a.uid)?.pago ? (doAluno(a.uid)?.valor ?? 0) : 0), 0);
  const meses = Array.from({ length: 13 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - 10 + i);
    return mesAtual(d);
  });

  async function alternar(a: Aluno) {
    const atual = doAluno(a.uid);
    const pago = !atual?.pago;
    try {
      await marcarMensalidade({ uid: a.uid, mes, pago, valor: atual?.valor || site.mensalidadeValor, pagoEm: pago ? hojeISO() : "", obs: atual?.obs ?? "", turma: a.academia ?? "" });
      pagos.recarregar();
    } catch (e) {
      setMsg(mensagemErro(e));
    }
  }

  return (
    <>
      <div className="two">
        <MenuSuspenso id="mens-mes" rotulo="Mês" valor={mes} onMudar={setMes} opcoes={meses.map((m) => [m, nomeMes(m)])} />
        <MenuSuspenso id="mens-turma" rotulo="Turma" valor={turma} onMudar={setTurma} opcoes={[["", "Todas"], ["__sem", "Sem turma"], ...turmas.dados.map((t) => [t.nome, t.apelido || t.nome] as [string, string])]} />
      </div>
      {msg && (
        <p className="form-note" role="status">
          {msg}
        </p>
      )}
      <section className="panel">
        <h2>Mensalidades de {nomeMes(mes)}</h2>
        <div className="resumo-cards">
          <div className="resumo-card">
            <b>
              {qtdPagos}/{lista.length}
            </b>
            <span>pagas</span>
          </div>
          <div className="resumo-card">
            <b>{lista.length - qtdPagos}</b>
            <span>em aberto</span>
          </div>
          {recebido > 0 && (
            <div className="resumo-card">
              <b>{real(recebido)}</b>
              <span>recebido</span>
            </div>
          )}
        </div>
        <p className="form-help">
          Toque no aluno para marcar como pago (ou desmarcar). Valor padrão: {site.mensalidadeValor ? real(site.mensalidadeValor) : "não definido"} · vencimento dia {site.vencimentoDia}. Mude em Site → Aparência. O aluno vê só a dele, na área dele.
        </p>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() =>
            baixarPlanilha(
              `Mensalidades ${mes}`,
              ["Aluno", "Turma", "Situação", "Valor", "Pago em"],
              lista.map((a) => {
                const m = doAluno(a.uid);
                return [a.nome, a.academia || "Sem turma", m?.pago ? "Pago" : "Em aberto", m?.pago ? m.valor : "", m?.pagoEm ? m.pagoEm.split("-").reverse().join("/") : ""];
              }),
            )
          }
        >
          📥 Baixar planilha do mês
        </button>
        <ul className="chamada">
          {lista.map((a) => {
            const m = doAluno(a.uid);
            return (
              <li key={a.uid}>
                <button type="button" className={"chamada-item" + (m?.pago ? " ok" : "")} onClick={() => void alternar(a)} aria-pressed={Boolean(m?.pago)}>
                  <Avatar url={a.foto} ajuste={a.fotoAjuste} nome={a.apelido || a.nome} faixa={a.faixa} dan={a.dan} tamanho={40} />
                  <span>
                    <strong>{a.apelido || a.nome}</strong>
                    <small>{m?.pago ? `Pago em ${m.pagoEm.split("-").reverse().join("/")}${m.valor ? ` · ${real(m.valor)}` : ""}` : "Em aberto"}</small>
                  </span>
                  <b className="chamada-marca">{m?.pago ? "✓" : ""}</b>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
