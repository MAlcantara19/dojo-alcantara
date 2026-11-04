"use client";

import type { Chamada } from "../lib/chamadas";
import { MEDALHAS, nomesDasChamadas, rankingPresenca, type Destaque } from "../lib/destaques";
import { nomeMes } from "../lib/mensalidades";

/** Destaques do mês: quem mais treinou (com empates) e as competições internas. */
export default function PainelDestaques({ chamadas, destaques, mes, nomesExtra = {}, onApagar }: { chamadas: Chamada[]; destaques: Destaque[]; mes: string; nomesExtra?: Record<string, string>; onApagar?: (id: string) => void }) {
  const ranking = rankingPresenca(chamadas, mes);
  const nomes = { ...nomesDasChamadas(chamadas), ...nomesExtra };
  const titulos = Array.from(new Set(destaques.map((d) => d.titulo)));
  if (!ranking.length && !destaques.length) return <p className="empty">Ainda não há destaques em {nomeMes(mes)}.</p>;
  return (
    <div className="destaques-mes">
      {ranking.length > 0 && (
        <section>
          <h3 className="sub">📋 Presença nos treinos</h3>
          <ol className="podio">
            {ranking.map((p) => (
              <li key={p.lugar}>
                <span className="podio-medalha" aria-label={`${p.lugar}º lugar`}>
                  {p.medalha}
                </span>
                <span>
                  <strong>{p.uids.map((u) => nomes[u] ?? "Aluno").join(", ")}</strong>
                  <small>
                    {p.lugar}º lugar{p.uids.length > 1 ? " (empatados)" : ""} · {p.treinos} {p.treinos === 1 ? "treino" : "treinos"}
                  </small>
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}
      {titulos.map((t) => (
        <section key={t}>
          <h3 className="sub">🏃 {t}</h3>
          <ol className="podio">
            {destaques
              .filter((d) => d.titulo === t)
              .map((d) => (
                <li key={d.id}>
                  <span className="podio-medalha" aria-label={`${d.posicao}º lugar`}>
                    {MEDALHAS[d.posicao - 1] ?? "🏅"}
                  </span>
                  <span>
                    <strong>{d.aluno}</strong>
                    <small>{[`${d.posicao}º lugar`, d.resultado, d.obs].filter(Boolean).join(" · ")}</small>
                  </span>
                  {onApagar && (
                    <button type="button" className="link-btn" onClick={() => window.confirm("Apagar este destaque?") && onApagar(d.id)}>
                      Apagar
                    </button>
                  )}
                </li>
              ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
