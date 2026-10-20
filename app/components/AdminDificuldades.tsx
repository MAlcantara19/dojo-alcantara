"use client";

import type { Aluno } from "../lib/aluno";
import { listarAlunos, type Escopo } from "../lib/alunos";
import { lerDesempenhoEquipe, type Desempenho } from "../lib/desempenho";
import { useCarga } from "../lib/useCarga";

const VAZIO_D: Desempenho[] = [];
const VAZIO_A: Aluno[] = [];

/** Onde os alunos mais erram na roleta de palavras (por palavra e por aluno). */
export default function AdminDificuldades({ escopo }: { escopo: Escopo }) {
  const d = useCarga(() => lerDesempenhoEquipe(escopo), VAZIO_D);
  const alunos = useCarga(() => listarAlunos(escopo), VAZIO_A);

  const porPalavra = new Map<string, { acertos: number; erros: number }>();
  const porAluno = new Map<string, { acertos: number; erros: number }>();
  d.dados.forEach((x) => {
    const p = porPalavra.get(x.termo) ?? { acertos: 0, erros: 0 };
    porPalavra.set(x.termo, { acertos: p.acertos + x.acertos, erros: p.erros + x.erros });
    const a = porAluno.get(x.uid) ?? { acertos: 0, erros: 0 };
    porAluno.set(x.uid, { acertos: a.acertos + x.acertos, erros: a.erros + x.erros });
  });
  const dificeis = Array.from(porPalavra.entries())
    .map(([termo, v]) => ({ termo, ...v, total: v.acertos + v.erros }))
    .filter((x) => x.total >= 2 && x.erros > 0)
    .sort((x, y) => y.erros / y.total - x.erros / x.total || y.erros - x.erros)
    .slice(0, 12);
  const nomeDe = (uid: string) => {
    const a = alunos.dados.find((x) => x.uid === uid);
    return a ? a.apelido || a.nome : "Aluno";
  };
  const alunosLista = Array.from(porAluno.entries())
    .map(([uid, v]) => ({ uid, ...v, total: v.acertos + v.erros }))
    .sort((x, y) => y.total - x.total)
    .slice(0, 15);

  return (
    <section className="panel" id="dificuldades">
      <h2>Dificuldades na roleta de palavras</h2>
      <p className="lead">Cada resposta dos alunos logados fica guardada. Aqui você vê o que a turma mais erra e quem está praticando.</p>
      {d.erro && <p className="empty">Não consegui ler o desempenho.</p>}
      <h3 className="sub">Palavras mais erradas</h3>
      <ul className="manage">
        {!d.carregando && dificeis.length === 0 && <li className="empty">Ainda não há dados suficientes (uma palavra precisa de pelo menos 2 respostas).</li>}
        {dificeis.map((x) => (
          <li key={x.termo}>
            <span>
              <strong>{x.termo}</strong>
              <small>
                {Math.round((x.erros / x.total) * 100)}% de erro · {x.erros} erros em {x.total} respostas
              </small>
            </span>
          </li>
        ))}
      </ul>
      <h3 className="sub">Quem está praticando</h3>
      <ul className="manage">
        {alunosLista.length === 0 && <li className="empty">Nenhuma resposta registrada ainda.</li>}
        {alunosLista.map((x) => (
          <li key={x.uid}>
            <span>
              <strong>{nomeDe(x.uid)}</strong>
              <small>
                {x.acertos} acertos e {x.erros} erros ({Math.round((x.acertos / x.total) * 100)}% de acerto)
              </small>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
