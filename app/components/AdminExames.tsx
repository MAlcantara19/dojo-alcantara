"use client";

import { useState } from "react";
import { dataBR, hojeISO } from "../lib/aluno";
import { lerTurmas, type Turma } from "../lib/alunos";
import { mensagemErro } from "../lib/auth";
import { addExame, apagarExame, lerExames, type Exame } from "../lib/exames";
import { useCarga } from "../lib/useCarga";
import Recolhivel from "./Recolhivel";

const VAZIO_E: Exame[] = [];
const VAZIO_T: Turma[] = [];

/** Exames de faixa (em preparação): marque a data; os alunos das turmas veem na área deles. */
export default function AdminExames() {
  const e = useCarga(lerExames, VAZIO_E);
  const turmas = useCarga(lerTurmas, VAZIO_T);
  const [msg, setMsg] = useState("");
  const hoje = hojeISO();

  async function salvar(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const form = ev.currentTarget;
    const f = new FormData(form);
    const data = String(f.get("data") ?? "");
    if (!data) return setMsg("Escolha a data do exame.");
    try {
      await addExame({ data, turmas: f.getAll("turmas").map(String), local: String(f.get("local") ?? "").trim(), obs: String(f.get("obs") ?? "").trim() });
      setMsg("Exame marcado. Os alunos das turmas veem na área deles, com o que revisar.");
      form.reset();
      e.recarregar();
    } catch (err) {
      setMsg(mensagemErro(err));
    }
  }

  return (
    <section className="panel">
      <h2>Exames de faixa</h2>
      <p className="lead">Marque a data do exame. Na área do aluno aparece a contagem de dias e o atalho para o checklist e os graus.</p>
      {msg && (
        <p className="form-note" role="status">
          {msg}
        </p>
      )}
      <Recolhivel titulo="Marcar exame">
        <form className="form tedit" onSubmit={(ev) => void salvar(ev)}>
          <div className="two">
            <div className="field">
              <label>Data</label>
              <input name="data" type="date" min={hoje} />
            </div>
            <div className="field">
              <label>Local</label>
              <input name="local" type="text" maxLength={100} />
            </div>
          </div>
          <div className="checks">
            <strong>Turmas (nenhuma marcada = todas)</strong>
            {turmas.dados.map((t) => (
              <label key={t.id}>
                <input type="checkbox" name="turmas" value={t.nome} /> {t.apelido || t.nome}
              </label>
            ))}
          </div>
          <div className="field">
            <label>Observações (o que levar, horário…)</label>
            <textarea name="obs" rows={2} maxLength={500} />
          </div>
          <button className="btn btn-primary" type="submit">
            Marcar exame
          </button>
        </form>
      </Recolhivel>
      <ul className="manage">
        {e.dados.length === 0 && <li className="empty">Nenhum exame marcado.</li>}
        {e.dados.map((x) => (
          <li key={x.id}>
            <span>
              <strong>
                {dataBR(x.data)}
                {x.data < hoje ? " (já passou)" : ""}
              </strong>
              <small>{[x.turmas.length ? x.turmas.join(", ") : "Todas as turmas", x.local].filter(Boolean).join(" · ")}</small>
              {x.obs && <small className="pre">{x.obs}</small>}
            </span>
            <button className="btn btn-ghost" onClick={() => window.confirm("Apagar este exame?") && void apagarExame(x.id).then(e.recarregar)}>
              Apagar
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
