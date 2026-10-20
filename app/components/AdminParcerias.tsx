"use client";

import { useState } from "react";
import { mensagemErro } from "../lib/auth";
import { enderecoOk } from "../lib/katasDb";
import { addParceria, apagarParceria, atualizarParceria, CATEGORIAS_PARCERIA, lerParcerias, type Parceria } from "../lib/parceriasDb";
import { useCarga } from "../lib/useCarga";
import CampoImagem from "./CampoImagem";

const VAZIO: Parceria[] = [];

/** Só o administrador: parceiros que aparecem na página inicial. */
export default function AdminParcerias() {
  const p = useCarga(lerParcerias, VAZIO);
  const [editando, setEditando] = useState<Parceria | null>(null);
  const [msg, setMsg] = useState("");

  async function salvar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const g = (k: string) => String(f.get(k) ?? "").trim();
    const d = { nome: g("nome"), descricao: g("descricao"), url: g("url"), logo: g("logo"), desconto: g("desconto"), categoria: g("categoria") || "Outro" };
    if (!d.nome) return setMsg("Dê um nome ao parceiro.");
    if ((d.url && !/^https:\/\//.test(d.url)) || (d.logo && !enderecoOk(d.logo))) return setMsg("O site do parceiro precisa começar com https:// e a logo deve ser enviada do celular ou ser um link https://");
    setMsg("Salvando…");
    try {
      if (editando) await atualizarParceria(editando.id, d);
      else await addParceria(d);
      setMsg(editando ? "Parceiro atualizado." : "Parceiro adicionado. Já aparece na página inicial.");
      setEditando(null);
      form.reset();
      p.recarregar();
    } catch (err) {
      setMsg(mensagemErro(err));
    }
  }

  return (
    <section className="panel" id="parcerias-admin">
      <h2>Parcerias</h2>
      <p className="lead">Os parceiros aparecem na página “Parcerias e descontos”, na página inicial (antes do “Sobre nós”) e, no computador, numa barra à direita.</p>
      {msg && (
        <p className="form-note" role="status">
          {msg}
        </p>
      )}
      <form className="form tedit" onSubmit={(e) => void salvar(e)} key={editando?.id ?? "novo"}>
        <strong>{editando ? `Editando ${editando.nome}` : "Novo parceiro"}</strong>
        <div className="field">
          <label htmlFor="pc-nome">Nome</label>
          <input id="pc-nome" name="nome" type="text" maxLength={60} defaultValue={editando?.nome ?? ""} autoComplete="off" />
        </div>
        <div className="field">
          <label htmlFor="pc-desc">Descrição curta (opcional)</label>
          <input id="pc-desc" name="descricao" type="text" maxLength={160} defaultValue={editando?.descricao ?? ""} autoComplete="off" />
        </div>
        <div className="two">
          <div className="field">
            <label htmlFor="pc-cat">Tipo</label>
            <select id="pc-cat" name="categoria" defaultValue={editando?.categoria ?? "Loja"}>
              {CATEGORIAS_PARCERIA.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="pc-desc2">Desconto ou vantagem (opcional)</label>
            <input id="pc-desc2" name="desconto" type="text" maxLength={100} placeholder="Ex.: 5% para alunos do dojô" defaultValue={editando?.desconto ?? ""} autoComplete="off" />
          </div>
        </div>
        <div className="field">
          <label htmlFor="pc-url">Site ou Instagram do parceiro (opcional)</label>
          <input id="pc-url" name="url" type="url" inputMode="url" placeholder="https://…" defaultValue={editando?.url ?? ""} />
        </div>
        <CampoImagem name="logo" rotulo="Logo do parceiro (opcional)" valorInicial={editando?.logo ?? ""} />
        <div className="tool-actions">
          <button className="btn btn-primary" type="submit">
            {editando ? "Salvar alterações" : "Adicionar parceiro"}
          </button>
          {editando && (
            <button type="button" className="btn btn-ghost" onClick={() => setEditando(null)}>
              Cancelar
            </button>
          )}
        </div>
      </form>
      <ul className="manage">
        {p.dados.length === 0 && <li className="empty">Nenhum parceiro cadastrado.</li>}
        {p.dados.map((x) => (
          <li key={x.id}>
            <span>
              <strong>{x.nome}</strong>
              <small>{[x.categoria, x.desconto].filter(Boolean).join(" · ") || x.descricao}</small>
            </span>
            <span className="tlinks">
              <button className="btn btn-ghost" onClick={() => setEditando(x)}>
                Editar
              </button>
              <button className="btn btn-ghost" onClick={() => window.confirm(`Apagar “${x.nome}”?`) && void apagarParceria(x.id).then(p.recarregar)}>
                Apagar
              </button>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
