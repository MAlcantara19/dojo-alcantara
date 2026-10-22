"use client";

import Link from "next/link";
import { useState } from "react";
import type { Aluno } from "../lib/aluno";
import { lerTurmas, listarAdmins, listarProfessores, salvarTurmasProfessor, type Turma } from "../lib/alunos";
import { mensagemErro } from "../lib/auth";
import { useCarga } from "../lib/useCarga";
import { useAuth } from "../lib/useAuth";
import AcoesConta from "./AcoesConta";
import Avatar from "./Avatar";
import FormCadastro, { semCel } from "./FormCadastro";
import MenuSuspenso from "./MenuSuspenso";

const VAZIO_A: Aluno[] = [];
const VAZIO_T: Turma[] = [];
type Secao = "professores" | "admins" | "novoProf" | "novoAdmin";

/** Só o administrador: professores e as turmas de cada um, administradores e cadastros. */
export default function AdminEquipe() {
  const { user } = useAuth();
  const professores = useCarga(listarProfessores, VAZIO_A);
  const admins = useCarga(listarAdmins, VAZIO_A);
  const turmas = useCarga(lerTurmas, VAZIO_T);
  const [s, setS] = useState<Secao>("professores");
  const [prof, setProf] = useState("");
  const [aviso, setAviso] = useState("");
  const p = professores.dados.find((x) => x.uid === prof) ?? professores.dados[0];

  async function guardar(e: React.FormEvent<HTMLFormElement>, x: Aluno) {
    e.preventDefault();
    const marcadas = new FormData(e.currentTarget).getAll("turmas").map(String);
    setAviso("Salvando…");
    try {
      await salvarTurmasProfessor(x.uid, marcadas);
      setAviso(`Turmas de ${x.nome} salvas.`);
      professores.recarregar();
    } catch (err) {
      setAviso(mensagemErro(err));
    }
  }

  return (
    <>
      <MenuSuspenso
        id="sub-equipe"
        rotulo="O que você quer ver?"
        valor={s}
        onMudar={(v) => (setS(v), setAviso(""))}
        opcoes={[
          ["professores", `Professores e suas turmas (${professores.dados.length})`],
          ["admins", `Administradores (${admins.dados.length})`],
          ["novoProf", "Cadastrar professor"],
          ["novoAdmin", "Cadastrar administrador"],
        ]}
      />
      {aviso && (
        <p className="form-note" role="status">
          {aviso}
        </p>
      )}

      {s === "professores" && (
        <section className="panel" id="professores">
          <h2>Professores e suas turmas</h2>
          <p className="lead">Cada professor vê só os alunos, os resultados e os avisos das turmas marcadas.</p>
          {professores.dados.length === 0 ? (
            <p className="empty">Nenhum professor cadastrado ainda. Use “Cadastrar professor” no menu acima.</p>
          ) : (
            <>
              <MenuSuspenso id="sel-prof" rotulo="Professor" valor={p?.uid ?? ""} onMudar={setProf} opcoes={professores.dados.map((x) => [x.uid, `${x.nome} (${(x.turmas ?? []).length} turmas)`])} />
              {p && (
                <form key={p.uid + (p.turmas ?? []).join()} className="tedit" onSubmit={(e) => void guardar(e, p)}>
                  <span className="aluno-linha">
                    <Avatar url={p.foto} ajuste={p.fotoAjuste} nome={p.nome} faixa={p.faixa} tamanho={48} />
                    <span>
                      <strong>{p.nome}</strong>
                      <small>Login: {semCel(p.login)}</small>
                      <small>Ligado a: {(p.turmas ?? []).join(", ") || "nenhuma turma"}</small>
                    </span>
                  </span>
                  <div className="checks">
                    <strong>Turmas deste professor</strong>
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
              )}
            </>
          )}
        </section>
      )}

      {s === "admins" && (
        <section className="panel" id="administradores">
          <h2>Administradores</h2>
          <p className="lead">
            Quem pode tudo no site. Para mudar o seu nome, foto ou celular, use{" "}
            <Link href="/perfil#conta" className="link-btn">
              Meu cadastro
            </Link>
            .
          </p>
          <ul className="manage">
            {admins.dados.map((x) => (
              <li key={x.uid} className="coluna">
                <span className="aluno-linha">
                  <Avatar url={x.foto} ajuste={x.fotoAjuste} nome={x.nome} faixa={x.faixa} tamanho={44} />
                  <span>
                    <strong>
                      {x.nome}
                      {x.uid === user?.uid ? " (você)" : ""}
                    </strong>
                    <small>Login: {semCel(x.login)}</small>
                  </span>
                </span>
                {x.uid !== user?.uid && <AcoesConta uid={x.uid} nome={x.nome} onApagada={admins.recarregar} />}
              </li>
            ))}
          </ul>
        </section>
      )}

      {s === "novoProf" && (
        <section className="panel" id="cadastro-prof">
          <h2>Cadastrar professor</h2>
          <FormCadastro tipo="professor" turmas={turmas.dados} onCriado={professores.recarregar} />
        </section>
      )}
      {s === "novoAdmin" && (
        <section className="panel" id="cadastro-admin">
          <h2>Cadastrar administrador</h2>
          <FormCadastro tipo="admin" turmas={turmas.dados} onCriado={admins.recarregar} />
        </section>
      )}
    </>
  );
}
