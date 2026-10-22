"use client";

import { useState } from "react";
import { mensagemErro } from "../lib/auth";
import { lerAjuste } from "../lib/fotoAjuste";
import { enderecoOk } from "../lib/katasDb";
import { addParceria, apagarParceria, atualizarParceria, CATEGORIAS_PARCERIA, lerParcerias, type Parceria } from "../lib/parceriasDb";
import { useCarga } from "../lib/useCarga";
import Avatar from "./Avatar";
import EditorFoto from "./EditorFoto";

const VAZIO: Parceria[] = [];
const ajuste = (t: string) => {
  try {
    return lerAjuste(JSON.parse(t || "{}"));
  } catch {
    return lerAjuste({});
  }
};

/** Só o administrador: parceiros, com logo, banner, desconto, cupom, produtos e destaque. */
export default function AdminParcerias() {
  const p = useCarga(lerParcerias, VAZIO);
  const [editando, setEditando] = useState<Parceria | "novo" | null>(null);
  const [msg, setMsg] = useState("");
  const atual = editando && editando !== "novo" ? editando : null;

  async function salvar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const g = (k: string) => String(f.get(k) ?? "").trim();
    const d = {
      nome: g("nome"),
      descricao: g("descricao"),
      url: g("url"),
      logo: g("logo"),
      logoAjuste: ajuste(g("logoAjuste")),
      banner: g("banner"),
      bannerAjuste: ajuste(g("bannerAjuste")),
      desconto: g("desconto"),
      cupom: g("cupom").toUpperCase(),
      destaque: f.get("destaque") === "on",
      produtos: g("produtos")
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .slice(0, 30),
      categoria: g("categoria") || "Outro",
    };
    if (!d.nome) return setMsg("Dê um nome ao parceiro.");
    if ((d.url && !/^https:\/\//.test(d.url)) || (d.logo && !enderecoOk(d.logo)) || (d.banner && !enderecoOk(d.banner))) return setMsg("Os links precisam começar com https:// e as imagens devem ser enviadas do celular ou ser links https://");
    setMsg("Salvando…");
    try {
      if (atual) await atualizarParceria(atual.id, d);
      else await addParceria(d);
      setMsg(atual ? "Parceiro atualizado." : "Parceiro adicionado. Já aparece na página Parcerias e descontos.");
      setEditando(null);
      p.recarregar();
    } catch (err) {
      setMsg(mensagemErro(err));
    }
  }

  return (
    <section className="panel" id="parcerias-admin">
      <h2>Parcerias e descontos</h2>
      <p className="lead">Cada parceiro aparece como uma bolinha na página Parcerias; ao tocar, abre os detalhes. Os marcados como destaque aparecem primeiro, em um cartão grande.</p>
      {msg && (
        <p className="form-note" role="status">
          {msg}
        </p>
      )}
      {editando === null ? (
        <button type="button" className="btn btn-primary" onClick={() => (setEditando("novo"), setMsg(""))}>
          + Adicionar parceiro
        </button>
      ) : (
        <form className="form tedit" onSubmit={(e) => void salvar(e)} key={atual?.id ?? "novo"}>
          <strong>{atual ? `Editando ${atual.nome}` : "Novo parceiro"}</strong>
          <div className="field">
            <label htmlFor="pc-nome">Nome</label>
            <input id="pc-nome" name="nome" type="text" maxLength={60} defaultValue={atual?.nome ?? ""} autoComplete="off" />
          </div>
          <div className="two">
            <div className="field">
              <label htmlFor="pc-cat">Tipo</label>
              <select id="pc-cat" name="categoria" defaultValue={atual?.categoria ?? "Loja"}>
                {CATEGORIAS_PARCERIA.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="pc-url">Site, loja ou Instagram (opcional)</label>
              <input id="pc-url" name="url" type="url" inputMode="url" placeholder="https://…" defaultValue={atual?.url ?? ""} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="pc-desc">Sobre o parceiro (opcional)</label>
            <textarea id="pc-desc" name="descricao" rows={3} maxLength={600} defaultValue={atual?.descricao ?? ""} />
          </div>
          <div className="two">
            <div className="field">
              <label htmlFor="pc-desc2">Desconto ou vantagem</label>
              <input id="pc-desc2" name="desconto" type="text" maxLength={100} placeholder="Ex.: 5% para alunos do dojô" defaultValue={atual?.desconto ?? ""} autoComplete="off" />
            </div>
            <div className="field">
              <label htmlFor="pc-cupom">Cupom (opcional)</label>
              <input id="pc-cupom" name="cupom" type="text" maxLength={40} placeholder="Ex.: DOJO5" defaultValue={atual?.cupom ?? ""} autoComplete="off" />
            </div>
          </div>
          <div className="field">
            <label htmlFor="pc-prod">Produtos ou serviços (um por linha; para link: Nome | https://…)</label>
            <textarea id="pc-prod" name="produtos" rows={3} maxLength={4000} defaultValue={(atual?.produtos ?? []).join("\n")} placeholder={"Whey protein | https://loja.com/whey\nAula experimental grátis"} />
          </div>
          <label className="check-linha">
            <input type="checkbox" name="destaque" defaultChecked={Boolean(atual?.destaque)} /> ⭐ Destaque (aparece primeiro, em cartão grande)
          </label>
          <EditorFoto name="logo" rotulo="Logo (fica na bolinha)" valorInicial={atual?.logo ?? ""} ajusteInicial={atual?.logoAjuste} formato="redondo" nome={atual?.nome ?? ""} />
          <EditorFoto name="banner" rotulo="Banner (imagem larga, aparece no destaque e nos detalhes)" valorInicial={atual?.banner ?? ""} ajusteInicial={atual?.bannerAjuste} formato="banner" />
          <div className="tool-actions">
            <button className="btn btn-primary" type="submit">
              {atual ? "Salvar alterações" : "Adicionar parceiro"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setEditando(null)}>
              Cancelar
            </button>
          </div>
        </form>
      )}
      <ul className="manage">
        {p.dados.length === 0 && <li className="empty">Nenhum parceiro cadastrado.</li>}
        {p.dados.map((x) => (
          <li key={x.id}>
            <span className="aluno-linha">
              <Avatar url={x.logo} ajuste={x.logoAjuste} nome={x.nome} tamanho={44} />
              <span>
                <strong>
                  {x.destaque ? "⭐ " : ""}
                  {x.nome}
                </strong>
                <small>{[x.categoria, x.desconto, x.cupom && `cupom ${x.cupom}`].filter(Boolean).join(" · ")}</small>
              </span>
            </span>
            <span className="tlinks">
              <button className="btn btn-ghost" onClick={() => (setEditando(x), setMsg(""))}>
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
