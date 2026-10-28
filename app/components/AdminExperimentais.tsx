"use client";

import { useState } from "react";
import { mensagemErro } from "../lib/auth";
import { atualizarExperimental, lerExperimentais, STATUS_EXP, type Experimental } from "../lib/experimentais";
import { useCarga } from "../lib/useCarga";
import MenuSuspenso from "./MenuSuspenso";

const VAZIO: Experimental[] = [];

/** Pedidos de aula experimental: chamar no WhatsApp e acompanhar até virar aluno. */
export default function AdminExperimentais() {
  const e = useCarga(lerExperimentais, VAZIO);
  const [filtro, setFiltro] = useState("abertos");
  const [msg, setMsg] = useState("");
  const lista = e.dados.filter((x) => (filtro === "todos" ? true : filtro === "abertos" ? !["Virou aluno", "Desistiu"].includes(x.status) : x.status === filtro));

  return (
    <section className="panel">
      <h2>Aulas experimentais ({e.dados.filter((x) => x.status === "Novo").length} novos)</h2>
      <p className="lead">Pedidos feitos na página “Aula experimental”. Divulgue o link: dojo-alcantara.vercel.app/aula-experimental</p>
      <MenuSuspenso id="ex-filtro" rotulo="Mostrar" valor={filtro} onMudar={setFiltro} opcoes={[["abertos", "Em aberto"], ["todos", "Todos"], ...STATUS_EXP.map((s) => [s, s] as [string, string])]} />
      {msg && (
        <p className="form-note" role="status">
          {msg}
        </p>
      )}
      <ul className="manage">
        {lista.length === 0 && <li className="empty">Nenhum pedido aqui.</li>}
        {lista.map((x) => (
          <li key={x.id} className="coluna">
            <span>
              <strong>
                {x.nome}
                {x.idade ? ` · ${x.idade}` : ""} <em className="selo">{x.status}</em>
              </strong>
              <small>{[x.turma, x.horario, new Date(x.ts).toLocaleDateString("pt-BR")].filter(Boolean).join(" · ")}</small>
              {x.menor && (
                <small>
                  👨‍👧 Menor de idade · responsável: {x.responsavel || "não informado"}
                  {x.telResponsavel ? ` · ${x.telResponsavel}` : ""}
                </small>
              )}
              {x.mensagem && <small className="pre">{x.mensagem}</small>}
            </span>
            <span className="tlinks">
              <a className="btn btn-primary" href={`https://wa.me/55${x.telefone.replace(/^55/, "")}?text=${encodeURIComponent(`Olá, ${x.nome.split(" ")[0]}! Aqui é do Dojô Alcântara, sobre a aula experimental de judô.`)}`} target="_blank" rel="noopener noreferrer">
                💬 WhatsApp
              </a>
              <a className="btn btn-ghost" href={`tel:${x.telefone}`}>
                📞 Ligar
              </a>
            </span>
            <form
              className="form inline"
              onSubmit={(ev) => {
                ev.preventDefault();
                const f = new FormData(ev.currentTarget);
                void atualizarExperimental(x.id, String(f.get("status")), String(f.get("obs") ?? "").slice(0, 300))
                  .then(() => (setMsg("Pedido atualizado."), e.recarregar()))
                  .catch((err) => setMsg(mensagemErro(err)));
              }}
            >
              <select name="status" defaultValue={x.status} aria-label="Situação">
                {STATUS_EXP.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <input name="obs" type="text" maxLength={300} defaultValue={x.obs} placeholder="Anotação (ex.: vem quinta 19h)" aria-label="Anotação" />
              <button className="btn btn-ghost" type="submit">
                Salvar
              </button>
            </form>
          </li>
        ))}
      </ul>
    </section>
  );
}
