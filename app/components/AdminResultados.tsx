"use client";

import RespostasSimulado from "./RespostasSimulado";
import { useState } from "react";
import { dataBR } from "../lib/aluno";
import type { ResultadoEquipe } from "../lib/alunos";

type Props = { itens: ResultadoEquipe[]; carregando: boolean; erro: boolean; visto: number; marcarVisto: () => void };

export default function AdminResultados({ itens, carregando, erro, visto, marcarVisto }: Props) {
  const [turma, setTurma] = useState("");
  const turmas = Array.from(new Set(itens.map((r) => r.academia).filter(Boolean))).sort((a, b) => a.localeCompare(b, "pt-BR"));
  const lista = itens.filter((r) => !turma || r.academia === turma);
  const novos = itens.filter((r) => r.ts > visto).length;

  return (
    <section className="panel" id="resultados">
      <h2>Resultados dos simulados</h2>
      <p className="lead">Sempre que um aluno logado termina um simulado, o resultado aparece aqui.</p>
      <div className="two">
        <div className="field">
          <label htmlFor="r-turma">Turma</label>
          <select id="r-turma" value={turma} onChange={(e) => setTurma(e.target.value)}>
            <option value="">Todas</option>
            {turmas.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <button className="btn btn-ghost alinhar" onClick={marcarVisto} disabled={novos === 0}>
          Marcar tudo como visto {novos > 0 ? `(${novos})` : ""}
        </button>
      </div>
      {erro && <p className="empty">Não consegui ler os resultados.</p>}
      <ul className="manage">
        {!carregando && !erro && lista.length === 0 && <li className="empty">Nenhum resultado ainda.</li>}
        {lista.slice(0, 50).map((r) => (
          <li key={r.id} className={r.ts > visto ? "novo-item" : undefined}>
            <span>
              <strong>
                {r.apelido || r.nome} {r.ts > visto && <em className="selo">novo</em>}
              </strong>
              <small>
                {r.titulo} · {r.acertos} de {r.total} ({Math.round((r.acertos / r.total) * 100)}%)
              </small>
              <small>
                {r.academia || "sem turma"} · {dataBR(r.data)}
              </small>
              <details className="resp-detalhe">
                <summary>Ver as questões</summary>
                <RespostasSimulado respostas={r.respostas} voce={false} />
              </details>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
