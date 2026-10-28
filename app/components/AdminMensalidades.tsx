"use client";

import { useState } from "react";
import { dataBR, hojeISO, type Aluno } from "../lib/aluno";
import { lerTurmas, listarAlunos, type Turma } from "../lib/alunos";
import { mensagemErro } from "../lib/auth";
import { calcularDevido, lerMensalidadesDoMes, marcarMensalidade, mesAtual, nomeMes, real, type Mensalidade } from "../lib/mensalidades";
import { baixarPlanilha } from "../lib/planilha";
import { useSite } from "../lib/siteConfig";
import { useCarga } from "../lib/useCarga";
import Avatar from "./Avatar";
import MenuSuspenso from "./MenuSuspenso";

const VAZIO_A: Aluno[] = [];
const VAZIO_T: Turma[] = [];
const VAZIO_M: Mensalidade[] = [];

/** Só o administrador: mensalidades do mês, com data de pagamento, multa e juros por atraso. */
export default function AdminMensalidades() {
  const site = useSite();
  const [mes, setMes] = useState(mesAtual());
  const [turma, setTurma] = useState("");
  const [aberto, setAberto] = useState<string | null>(null);
  const alunos = useCarga(() => listarAlunos(null), VAZIO_A);
  const turmas = useCarga(lerTurmas, VAZIO_T);
  const pagos = useCarga(() => lerMensalidadesDoMes(mes), VAZIO_M);
  const [msg, setMsg] = useState("");
  const hoje = hojeISO();
  const regra = { valor: site.mensalidadeValor, dia: site.vencimentoDia, multaPct: site.multaPct, jurosMesPct: site.jurosMesPct };

  const lista = alunos.dados.filter((a) => !turma || (turma === "__sem" ? !a.academia : a.academia === turma));
  const doAluno = (uid: string) => pagos.dados.find((m) => m.uid === uid);
  const abertos = lista.filter((a) => !doAluno(a.uid)?.pago);
  const recebido = lista.reduce((s, a) => s + (doAluno(a.uid)?.pago ? (doAluno(a.uid)?.valorPago ?? doAluno(a.uid)?.valor ?? 0) : 0), 0);
  const devidoHoje = calcularDevido(mes, regra, hoje);
  const meses = Array.from({ length: 13 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - 10 + i);
    return mesAtual(d);
  });

  async function salvar(a: Aluno, pago: boolean, pagoEm: string, valorPago: number, obs: string) {
    try {
      await marcarMensalidade({ uid: a.uid, mes, pago, valor: regra.valor, valorPago: pago ? valorPago : 0, pagoEm: pago ? pagoEm : "", obs, turma: a.academia ?? "" });
      setMsg(pago ? `${a.apelido || a.nome}: pago em ${dataBR(pagoEm)} (${real(valorPago)}).` : `${a.apelido || a.nome}: voltou para em aberto.`);
      setAberto(null);
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
              {lista.length - abertos.length}/{lista.length}
            </b>
            <span>pagas</span>
          </div>
          <div className="resumo-card">
            <b>{abertos.length}</b>
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
          Vencimento dia {regra.dia} · {regra.valor ? real(regra.valor) : "valor não definido"} · multa {String(regra.multaPct).replace(".", ",")}% + juros {String(regra.jurosMesPct).replace(".", ",")}% ao mês por dia de atraso.
          {devidoHoje.diasAtraso > 0 && regra.valor ? ` Hoje, quem está em aberto deve ${real(devidoHoje.total)} (${devidoHoje.diasAtraso} dias de atraso).` : ""} Mude em Site → Aparência.
        </p>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() =>
            baixarPlanilha(
              `Mensalidades ${mes}`,
              ["Aluno", "Turma", "Situação", "Pago em", "Valor recebido", "Dias de atraso", "Devido hoje"],
              lista.map((a) => {
                const m = doAluno(a.uid);
                const d = calcularDevido(mes, regra, m?.pago ? m.pagoEm : hoje);
                return [a.nome, a.academia || "Sem turma", m?.pago ? "Pago" : "Em aberto", m?.pagoEm ? dataBR(m.pagoEm) : "", m?.pago ? (m.valorPago ?? m.valor) : "", d.diasAtraso, m?.pago ? "" : d.total];
              }),
            )
          }
        >
          📥 Baixar planilha do mês
        </button>
        <ul className="chamada">
          {lista.map((a) => {
            const m = doAluno(a.uid);
            const d = calcularDevido(mes, regra, hoje);
            return (
              <li key={a.uid}>
                <button type="button" className={"chamada-item" + (m?.pago ? " ok" : d.diasAtraso > 0 ? " atraso" : "")} onClick={() => setAberto(aberto === a.uid ? null : a.uid)} aria-expanded={aberto === a.uid}>
                  <Avatar url={a.foto} ajuste={a.fotoAjuste} nome={a.apelido || a.nome} faixa={a.faixa} dan={a.dan} tamanho={40} />
                  <span>
                    <strong>{a.apelido || a.nome}</strong>
                    <small>{m?.pago ? `Pago em ${dataBR(m.pagoEm)} · ${real(m.valorPago ?? m.valor)}` : d.diasAtraso > 0 && regra.valor ? `Em atraso há ${d.diasAtraso} dias · deve ${real(d.total)}` : "Em aberto"}</small>
                  </span>
                  <b className="chamada-marca">{m?.pago ? "✓" : ""}</b>
                </button>
                {aberto === a.uid && <FormPagamento m={m} mes={mes} regra={regra} onSalvar={(pago, em, v, obs) => void salvar(a, pago, em, v, obs)} />}
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}

function FormPagamento({ m, mes, regra, onSalvar }: { m?: Mensalidade; mes: string; regra: { valor: number; dia: number; multaPct: number; jurosMesPct: number }; onSalvar: (pago: boolean, pagoEm: string, valor: number, obs: string) => void }) {
  const [em, setEm] = useState(m?.pagoEm || hojeISO());
  const d = calcularDevido(mes, regra, em);
  const [valor, setValor] = useState(m?.pago ? String(m.valorPago ?? m.valor) : "");
  const valorFinal = valor ? Number(valor.replace(",", ".")) || 0 : d.total;
  return (
    <div className="form tedit pagamento">
      <div className="two">
        <div className="field">
          <label>Data do pagamento</label>
          <input type="date" value={em} max={hojeISO()} onChange={(e) => setEm(e.target.value)} />
        </div>
        <div className="field">
          <label>Valor recebido (R$)</label>
          <input type="text" inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} placeholder={String(d.total).replace(".", ",")} />
        </div>
      </div>
      <p className="form-help">
        Vencimento {dataBR(d.vencimento)}
        {d.diasAtraso > 0 ? ` · ${d.diasAtraso} dias de atraso · multa ${real(d.multa)} + juros ${real(d.juros)} = ${real(d.total)}` : ` · em dia: ${real(d.total)}`}
      </p>
      <div className="tool-actions">
        <button type="button" className="btn btn-primary" onClick={() => onSalvar(true, em, valorFinal, m?.obs ?? "")}>
          ✓ Confirmar pagamento de {real(valorFinal)}
        </button>
        {m?.pago && (
          <button type="button" className="btn btn-ghost" onClick={() => onSalvar(false, "", 0, m.obs)}>
            Voltar para em aberto
          </button>
        )}
      </div>
    </div>
  );
}
