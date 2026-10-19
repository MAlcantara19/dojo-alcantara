"use client";

import { useState } from "react";
import type { Aluno } from "../lib/aluno";
import { mudarTurmaLote, type Turma } from "../lib/alunos";
import { mensagemErro } from "../lib/auth";
import { corDaFaixa } from "../lib/faixas";

/** Dentro da turma: ver quem está nela, tirar alunos e adicionar outros (primeiro os sem turma). */
export default function GerenciarAlunos({ turma, turmas, alunos, onFeito }: { turma: Turma; turmas: Turma[]; alunos: Aluno[]; onFeito: () => void }) {
  const [aba, setAba] = useState("__sem");
  const [marcados, setMarcados] = useState<string[]>([]);
  const [msg, setMsg] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const nestaTurma = alunos.filter((a) => a.academia === turma.nome);
  const semTurma = alunos.filter((a) => !a.academia);
  const outras = turmas.filter((t) => t.nome !== turma.nome);
  const fonte = aba === "__sem" ? semTurma : alunos.filter((a) => a.academia === aba);
  const alternar = (uid: string) => setMarcados((m) => (m.includes(uid) ? m.filter((x) => x !== uid) : [...m, uid]));
  const trocarAba = (a: string) => (setAba(a), setMarcados([]));

  async function mover(uids: string[], destino: string, ok: string) {
    setOcupado(true);
    setMsg("Salvando…");
    try {
      await mudarTurmaLote(uids, destino);
      setMsg(ok);
      setMarcados([]);
      onFeito();
    } catch (e) {
      setMsg(mensagemErro(e));
    }
    setOcupado(false);
  }

  return (
    <div className="gerenciar">
      <h3 className="sub">Alunos desta turma ({nestaTurma.length})</h3>
      <ul className="manage">
        {nestaTurma.length === 0 && <li className="empty">Ainda não há alunos nesta turma. Adicione abaixo.</li>}
        {nestaTurma.map((a) => (
          <li key={a.uid}>
            <span>
              <strong>{a.apelido ? `${a.apelido} · ${a.nome}` : a.nome}</strong>
              <small>
                <i className="dot" style={{ background: corDaFaixa(a.faixa) }} aria-hidden="true" /> Faixa {a.faixa.toLowerCase()}
              </small>
            </span>
            <button type="button" className="btn btn-ghost" disabled={ocupado} onClick={() => void mover([a.uid], "", `${a.apelido || a.nome} saiu da turma e ficou sem turma.`)}>
              Tirar da turma
            </button>
          </li>
        ))}
      </ul>

      <h3 className="sub">Adicionar alunos a esta turma</h3>
      <div className="tabs tabs-scroll" role="tablist" aria-label="De onde adicionar">
        <button type="button" role="tab" aria-selected={aba === "__sem"} onClick={() => trocarAba("__sem")}>
          Sem turma ({semTurma.length})
        </button>
        {outras.map((t) => (
          <button type="button" key={t.id} role="tab" aria-selected={aba === t.nome} onClick={() => trocarAba(t.nome)}>
            {t.apelido || t.nome} ({alunos.filter((a) => a.academia === t.nome).length})
          </button>
        ))}
      </div>
      <ul className="manage">
        {fonte.length === 0 && <li className="empty">{aba === "__sem" ? "Todos os alunos já têm turma." : "Não há alunos nesta aba."}</li>}
        {fonte.map((a) => (
          <li key={a.uid}>
            <label className="check-linha">
              <input type="checkbox" checked={marcados.includes(a.uid)} onChange={() => alternar(a.uid)} />
              <span>
                <strong>{a.apelido ? `${a.apelido} · ${a.nome}` : a.nome}</strong>
                <small>
                  <i className="dot" style={{ background: corDaFaixa(a.faixa) }} aria-hidden="true" /> Faixa {a.faixa.toLowerCase()}
                </small>
              </span>
            </label>
          </li>
        ))}
      </ul>
      {fonte.length > 0 && (
        <div className="tool-actions">
          <button type="button" className="btn btn-ghost" onClick={() => setMarcados(marcados.length === fonte.length ? [] : fonte.map((a) => a.uid))}>
            {marcados.length === fonte.length ? "Desmarcar todos" : "Marcar todos"}
          </button>
          <button type="button" className="btn btn-primary" disabled={ocupado || marcados.length === 0} onClick={() => void mover(marcados, turma.nome, `${marcados.length} ${marcados.length === 1 ? "aluno adicionado" : "alunos adicionados"} à turma.`)}>
            Adicionar {marcados.length > 0 ? `${marcados.length} ` : ""}à turma
          </button>
        </div>
      )}
      {msg && (
        <p className="form-note" role="status">
          {msg}
        </p>
      )}
    </div>
  );
}
