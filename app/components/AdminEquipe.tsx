"use client";

import { useState } from "react";
import type { Aluno } from "../lib/aluno";
import { lerTurmas, listarProfessores, salvarTurmasProfessor, type Turma } from "../lib/alunos";
import { mensagemErro } from "../lib/auth";
import { useCarga } from "../lib/useCarga";
import AcoesConta from "./AcoesConta";
import FormCadastro, { semCel } from "./FormCadastro";

const VAZIO_A: Aluno[] = [];
const VAZIO_T: Turma[] = [];

/** Só para o administrador: professores, as turmas de cada um e as contas deles. */
export default function AdminEquipe() {
  const professores = useCarga(listarProfessores, VAZIO_A);
  const turmas = useCarga(lerTurmas, VAZIO_T);
  const [aviso, setAviso] = useState("");

  async function guardar(e: React.FormEvent<HTMLFormElement>, p: Aluno) {
    e.preventDefault();
    const marcadas = new FormData(e.currentTarget).getAll("turmas").map(String);
    setAviso("Salvando…");
    try {
      await salvarTurmasProfessor(p.uid, marcadas);
      setAviso(`Turmas de ${p.nome} salvas.`);
      professores.recarregar();
    } catch (err) {
      setAviso(mensagemErro(err));
    }
  }

  return (
    <>
      <section className="panel" id="professores">
        <h2>Professores e suas turmas</h2>
        <p className="lead">Cada professor vê só os alunos, os resultados e os avisos das turmas marcadas aqui. O administrador (você) vê tudo.</p>
        {aviso && (
          <p className="form-note" role="status">
            {aviso}
          </p>
        )}
        {professores.dados.length === 0 && <p className="empty">Nenhum professor cadastrado ainda. Crie a conta dele na seção abaixo.</p>}
        {professores.dados.map((p) => (
          <form key={p.uid + (p.turmas ?? []).join()} className="tedit" onSubmit={(e) => void guardar(e, p)}>
            <strong>{p.nome}</strong>
            <small>Login: {semCel(p.login)}</small>
            <div className="checks">
              {turmas.dados.length === 0 && <small>Crie turmas na aba Turmas para poder marcá-las aqui.</small>}
              {turmas.dados.map((t) => (
                <label key={t.id}>
                  <input type="checkbox" name="turmas" value={t.nome} defaultChecked={(p.turmas ?? []).includes(t.nome)} /> {t.apelido || t.nome}
                </label>
              ))}
            </div>
            <button className="btn btn-primary" type="submit">
              Salvar turmas
            </button>
            <AcoesConta uid={p.uid} nome={p.nome} onApagada={professores.recarregar} />
          </form>
        ))}
      </section>

      <section className="panel" id="cadastro-prof">
        <h2>Cadastrar professor</h2>
        <FormCadastro tipo="professor" turmas={turmas.dados} onCriado={professores.recarregar} />
      </section>
    </>
  );
}
