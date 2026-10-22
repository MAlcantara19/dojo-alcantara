"use client";

import { useState } from "react";
import { dataBR } from "../lib/aluno";
import type { Escopo } from "../lib/alunos";
import type { useResultadosEquipe } from "../lib/resultados";
import AdminDificuldades from "./AdminDificuldades";
import AdminResultados from "./AdminResultados";
import MenuSuspenso from "./MenuSuspenso";
import RespostasSimulado from "./RespostasSimulado";

type Secao = "ultimos" | "aluno" | "questoes" | "roleta";
type Res = ReturnType<typeof useResultadosEquipe>;

/** Resultados em partes: últimos, por aluno, questões que mais erram e roleta de palavras. */
export default function AdminResultadosTudo({ escopo, res }: { escopo: Escopo; res: Res }) {
  const [s, setS] = useState<Secao>("ultimos");
  const [uid, setUid] = useState("");
  const alunos = Array.from(new Map(res.dados.map((r) => [r.uid, r.apelido || r.nome])).entries()).sort((a, b) => a[1].localeCompare(b[1], "pt-BR"));
  const doAluno = res.dados.filter((r) => r.uid === (uid || alunos[0]?.[0]));

  // Questões que mais erram (somando todos os resultados que guardaram as questões)
  const porQuestao = new Map<string, { erros: number; total: number; simulado: string; certa: string }>();
  res.dados.forEach((r) =>
    (r.respostas ?? []).forEach((q) => {
      const k = r.titulo + "¦" + q.pergunta;
      const v = porQuestao.get(k) ?? { erros: 0, total: 0, simulado: r.titulo, certa: q.correta };
      porQuestao.set(k, { ...v, erros: v.erros + (q.acertou ? 0 : 1), total: v.total + 1 });
    }),
  );
  const piores = Array.from(porQuestao.entries())
    .filter(([, v]) => v.erros > 0)
    .sort((a, b) => b[1].erros / b[1].total - a[1].erros / a[1].total || b[1].erros - a[1].erros)
    .slice(0, 20);

  return (
    <>
      <MenuSuspenso
        id="sub-resultados"
        rotulo="O que você quer ver?"
        valor={s}
        onMudar={setS}
        opcoes={[
          ["ultimos", res.novos ? `Últimos simulados (${res.novos} novos)` : "Últimos simulados"],
          ["aluno", "Por aluno"],
          ["questoes", "Questões que mais erram"],
          ["roleta", "Roleta de palavras"],
        ]}
      />
      {s === "ultimos" && <AdminResultados itens={res.dados} carregando={res.carregando} erro={res.erro} visto={res.visto} marcarVisto={res.marcarVisto} />}
      {s === "aluno" && (
        <section className="panel">
          <h2>Simulados por aluno</h2>
          {alunos.length === 0 ? (
            <p className="empty">Nenhum aluno fez simulado ainda.</p>
          ) : (
            <>
              <MenuSuspenso id="res-aluno" rotulo="Aluno" valor={uid || alunos[0][0]} onMudar={setUid} opcoes={alunos.map(([id, n]) => [id, `${n} (${res.dados.filter((r) => r.uid === id).length})`])} />
              <p className="lead">
                Média: {Math.round((doAluno.reduce((s, r) => s + r.acertos / r.total, 0) / Math.max(1, doAluno.length)) * 100)}% em {doAluno.length} {doAluno.length === 1 ? "simulado" : "simulados"}.
              </p>
              <ul className="manage">
                {doAluno.map((r) => (
                  <li key={r.id} className="coluna">
                    <span>
                      <strong>
                        {r.titulo} · {r.acertos} de {r.total} ({Math.round((r.acertos / r.total) * 100)}%)
                      </strong>
                      <small>{dataBR(r.data)}</small>
                    </span>
                    <RespostasSimulado respostas={r.respostas} voce={false} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}
      {s === "questoes" && (
        <section className="panel">
          <h2>Questões que mais erram</h2>
          <p className="lead">Somando os simulados das suas turmas. Bom para saber o que reforçar no treino.</p>
          <ul className="manage">
            {piores.length === 0 && <li className="empty">Ainda não há erros registrados (os simulados antigos não guardaram as questões).</li>}
            {piores.map(([k, v]) => (
              <li key={k}>
                <span>
                  <strong>{k.split("¦")[1]}</strong>
                  <small>
                    {v.simulado} · errada {v.erros} de {v.total} vezes ({Math.round((v.erros / v.total) * 100)}%) · certa: {v.certa}
                  </small>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
      {s === "roleta" && <AdminDificuldades escopo={escopo} />}
    </>
  );
}
