"use client";

import { useState } from "react";
import type { Aluno } from "../lib/aluno";
import { listarAdmins, listarProfessores, salvarTurmasProfessor, type Turma } from "../lib/alunos";
import { mensagemErro } from "../lib/auth";
import { useCarga } from "../lib/useCarga";
import Avatar from "./Avatar";

const VAZIO: Aluno[] = [];
const lerEquipe = async () => [...(await listarProfessores()), ...(await listarAdmins())];

/** Quem dá aula nesta turma (professores e também administradores que dão aula). */
export default function ProfessoresDaTurma({ turma }: { turma: Turma }) {
  const equipe = useCarga(lerEquipe, VAZIO);
  const [msg, setMsg] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function salvar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const marcados = new FormData(e.currentTarget).getAll("prof").map(String);
    setOcupado(true);
    setMsg("Salvando…");
    try {
      for (const p of equipe.dados) {
        const tem = (p.turmas ?? []).includes(turma.nome);
        const quer = marcados.includes(p.uid);
        if (tem !== quer) await salvarTurmasProfessor(p.uid, quer ? [...(p.turmas ?? []), turma.nome] : (p.turmas ?? []).filter((t) => t !== turma.nome));
      }
      setMsg("Professores da turma salvos.");
      equipe.recarregar();
    } catch (err) {
      setMsg(mensagemErro(err));
    }
    setOcupado(false);
  }

  const daTurma = equipe.dados.filter((p) => (p.turmas ?? []).includes(turma.nome));
  return (
    <form className="form tedit" onSubmit={(e) => void salvar(e)} key={equipe.dados.map((p) => p.uid + (p.turmas ?? []).join()).join()}>
      <strong>Professores desta turma: {daTurma.length ? daTurma.map((p) => p.apelido || p.nome).join(", ") : "nenhum"}</strong>
      <div className="checks">
        {equipe.dados.map((p) => (
          <label key={p.uid} className="check-linha">
            <input type="checkbox" name="prof" value={p.uid} defaultChecked={(p.turmas ?? []).includes(turma.nome)} />
            <Avatar url={p.foto} ajuste={p.fotoAjuste} nome={p.nome} faixa={p.faixa} dan={p.dan} tamanho={28} />
            <span>
              {p.nome} <small>({p.papel === "admin" ? "administrador" : "professor"})</small>
            </span>
          </label>
        ))}
      </div>
      <button className="btn btn-primary" type="submit" disabled={ocupado}>
        Salvar professores
      </button>
      {msg && (
        <p className="form-note" role="status">
          {msg}
        </p>
      )}
    </form>
  );
}
