"use client";

import { useState } from "react";
import { mensagemErro } from "../lib/auth";
import { faixas } from "../lib/faixas";
import { addMaterial, apagarMaterial, CATEGORIAS_MATERIAL, lerMateriais, salvarMaterial, TIPOS_MATERIAL, type Material } from "../lib/materiaisDb";
import { useCarga } from "../lib/useCarga";

const VAZIO: Material[] = [];

/** PDFs, apostilas, vídeos e links de estudo (página Materiais e PDFs). */
export default function AdminMateriais() {
  const m = useCarga(lerMateriais, VAZIO);
  const [editando, setEditando] = useState<Material | null>(null);
  const [msg, setMsg] = useState("");

  async function salvar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const g = (k: string) => String(f.get(k) ?? "").trim();
    const d = { titulo: g("titulo"), descricao: g("descricao"), url: g("url"), tipo: g("tipo") || "PDF", categoria: g("categoria") || "Outros", faixa: g("faixa") };
    if (!d.titulo) return setMsg("Dê um título ao material.");
    if (!/^https:\/\//.test(d.url)) return setMsg("Cole o link do material (começa com https://). Para PDF, use o link de compartilhamento do Drive.");
    setMsg("Salvando…");
    try {
      if (editando) await salvarMaterial(editando.id, d);
      else await addMaterial(d);
      setMsg(editando ? "Material atualizado." : "Material publicado na página Materiais e PDFs.");
      setEditando(null);
      form.reset();
      m.recarregar();
    } catch (err) {
      setMsg(mensagemErro(err));
    }
  }

  return (
    <section className="panel" id="materiais">
      <h2>Materiais e PDFs</h2>
      <p className="lead">Apostilas, regras, programa de faixas, vídeos e links. Coloque o PDF no Drive, compartilhe como “Qualquer pessoa com o link” e cole o link aqui.</p>
      {msg && (
        <p className="form-note" role="status">
          {msg}
        </p>
      )}
      <form className="form tedit" onSubmit={(e) => void salvar(e)} key={editando?.id ?? "novo"}>
        <strong>{editando ? `Editando “${editando.titulo}”` : "Novo material"}</strong>
        <div className="field">
          <label htmlFor="mt-titulo">Título</label>
          <input id="mt-titulo" name="titulo" type="text" maxLength={100} defaultValue={editando?.titulo ?? ""} autoComplete="off" />
        </div>
        <div className="field">
          <label htmlFor="mt-desc">Descrição curta (opcional)</label>
          <input id="mt-desc" name="descricao" type="text" maxLength={200} defaultValue={editando?.descricao ?? ""} autoComplete="off" />
        </div>
        <div className="field">
          <label htmlFor="mt-url">Link</label>
          <input id="mt-url" name="url" type="url" inputMode="url" placeholder="https://drive.google.com/file/d/…" defaultValue={editando?.url ?? ""} />
        </div>
        <div className="two">
          <div className="field">
            <label htmlFor="mt-tipo">Tipo</label>
            <select id="mt-tipo" name="tipo" defaultValue={editando?.tipo ?? "PDF"}>
              {TIPOS_MATERIAL.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="mt-cat">Categoria</label>
            <select id="mt-cat" name="categoria" defaultValue={editando?.categoria ?? "Apostilas"}>
              {CATEGORIAS_MATERIAL.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="field">
          <label htmlFor="mt-faixa">Faixa (opcional)</label>
          <select id="mt-faixa" name="faixa" defaultValue={editando?.faixa ?? ""}>
            <option value="">Para todas as faixas</option>
            {faixas.map((f) => (
              <option key={f.nome}>{f.nome}</option>
            ))}
          </select>
        </div>
        <div className="tool-actions">
          <button className="btn btn-primary" type="submit">
            {editando ? "Salvar alterações" : "Publicar material"}
          </button>
          {editando && (
            <button type="button" className="btn btn-ghost" onClick={() => setEditando(null)}>
              Cancelar
            </button>
          )}
        </div>
      </form>
      <ul className="manage">
        {m.dados.length === 0 && <li className="empty">Nenhum material publicado.</li>}
        {m.dados.map((x) => (
          <li key={x.id}>
            <span>
              <strong>{x.titulo}</strong>
              <small>
                {x.tipo} · {x.categoria}
                {x.faixa ? ` · faixa ${x.faixa.toLowerCase()}` : ""}
              </small>
            </span>
            <span className="tlinks">
              <button className="btn btn-ghost" onClick={() => setEditando(x)}>
                Editar
              </button>
              <button className="btn btn-ghost" onClick={() => window.confirm(`Apagar “${x.titulo}”?`) && void apagarMaterial(x.id).then(m.recarregar)}>
                Apagar
              </button>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
