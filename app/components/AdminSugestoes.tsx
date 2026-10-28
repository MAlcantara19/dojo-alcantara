"use client";

import { useState } from "react";
import { mensagemErro } from "../lib/auth";
import { lerSugestoes, responderSugestao, STATUS_SUGESTAO, type Sugestao } from "../lib/sugestoesDb";
import { useCarga } from "../lib/useCarga";
import Img from "./Img";
import Midia from "./Midia";
import MenuSuspenso from "./MenuSuspenso";

const VAZIO: Sugestao[] = [];

/** Só o administrador: o que alunos e professores mandaram, com status e resposta. */
export default function AdminSugestoes() {
  const s = useCarga(() => lerSugestoes(null), VAZIO);
  const [filtro, setFiltro] = useState("abertas");
  const [msg, setMsg] = useState("");
  const lista = s.dados.filter((x) => (filtro === "todas" ? true : filtro === "abertas" ? x.status !== "Feito" : x.status === filtro));

  return (
    <section className="panel">
      <h2>Sugestões e críticas ({s.dados.filter((x) => x.status === "Nova").length} novas)</h2>
      <MenuSuspenso
        id="sg-filtro"
        rotulo="Mostrar"
        valor={filtro}
        onMudar={setFiltro}
        opcoes={[["abertas", "Ainda não feitas"], ["todas", "Todas"], ...STATUS_SUGESTAO.map((st) => [st, st] as [string, string])]}
      />
      {msg && (
        <p className="form-note" role="status">
          {msg}
        </p>
      )}
      <ul className="manage">
        {lista.length === 0 && <li className="empty">Nada por aqui.</li>}
        {lista.map((x) => (
          <li key={x.id} className="coluna">
            <span>
              <strong>
                {x.tipo} · {x.nome}
              </strong>
              <small>{new Date(x.ts).toLocaleString("pt-BR")}</small>
              <small className="pre">{x.texto}</small>
            </span>
            {x.imagem && <Img className="midia-img" src={x.imagem} alt="Imagem da sugestão" largura={800} />}
            {x.video && <Midia video={x.video} alt="Vídeo da sugestão" />}
            <form
              className="form tedit"
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                void responderSugestao(x.id, String(f.get("status")), String(f.get("resposta") ?? "").trim().slice(0, 1000))
                  .then(() => (setMsg("Resposta salva. A pessoa vê na página Sugestões."), s.recarregar()))
                  .catch((err) => setMsg(mensagemErro(err)));
              }}
            >
              <div className="two">
                <div className="field">
                  <label>Situação</label>
                  <select name="status" defaultValue={x.status}>
                    {STATUS_SUGESTAO.map((st) => (
                      <option key={st}>{st}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Resposta (a pessoa vê)</label>
                  <input name="resposta" type="text" maxLength={1000} defaultValue={x.resposta} />
                </div>
              </div>
              <button className="btn btn-primary" type="submit">
                Salvar
              </button>
            </form>
          </li>
        ))}
      </ul>
    </section>
  );
}
