"use client";

import { apagarAtividade, lerAtividades, type Atividade } from "../lib/atividades";
import type { Escopo } from "../lib/alunos";
import { useCarga } from "../lib/useCarga";

const VAZIO: Atividade[] = [];

/** Só o administrador: o que os alunos mudaram no site (apelido, cadastro, senha, fotos…). */
export default function AdminAtividades({ escopo = null }: { escopo?: Escopo }) {
  const a = useCarga(() => lerAtividades(escopo), VAZIO);
  const ehAdmin = escopo === null;
  return (
    <section className="panel" id="atividades">
      <h2>Atividades ({a.dados.length})</h2>
      <p className="lead">{ehAdmin ? "O que os alunos mudam no perfil e o que os professores mudam nos alunos." : "O que os alunos das suas turmas mudaram."}</p>
      {a.erro && <p className="empty">Não consegui ler as atividades. Publique as regras novas do Firestore.</p>}
      <ul className="manage">
        {!a.carregando && !a.erro && a.dados.length === 0 && <li className="empty">Nada por enquanto.</li>}
        {a.dados.map((x) => (
          <li key={x.id}>
            <span>
              <strong>{x.nome}</strong>
              <small>{x.texto}</small>
              <small>{new Date(x.ts).toLocaleString("pt-BR")}</small>
            </span>
            {ehAdmin && (
              <button className="btn btn-ghost" onClick={() => void apagarAtividade(x.id).then(a.recarregar)}>
                Visto
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
