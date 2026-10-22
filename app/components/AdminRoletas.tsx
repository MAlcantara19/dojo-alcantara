"use client";

import { useState } from "react";
import { mensagemErro } from "../lib/auth";
import { addRoleta, apagarRoleta, itensParaTexto, lerItensDoTexto, lerRoletas, salvarRoleta, type RoletaDoc } from "../lib/roletasDb";
import { useCarga } from "../lib/useCarga";
import Recolhivel from "./Recolhivel";

const VAZIO: RoletaDoc[] = [];

/** Roletas novas, criadas pelo professor, que aparecem na aba “Mais roletas” da página Roleta. */
export default function AdminRoletas() {
  const r = useCarga(lerRoletas, VAZIO);
  const [editando, setEditando] = useState<RoletaDoc | null>(null);
  const [msg, setMsg] = useState("");

  async function salvar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const titulo = String(f.get("titulo") ?? "").trim().slice(0, 60);
    const itens = lerItensDoTexto(String(f.get("itens") ?? ""));
    if (!titulo) return setMsg("Dê um nome para a roleta.");
    if (itens.length < 2) return setMsg("Coloque pelo menos 2 itens, um por linha.");
    setMsg("Salvando…");
    try {
      if (editando) await salvarRoleta(editando.id, titulo, itens);
      else await addRoleta(titulo, itens);
      setMsg(editando ? "Roleta atualizada." : "Roleta criada. Ela aparece em Roleta → Mais roletas.");
      setEditando(null);
      form.reset();
      r.recarregar();
    } catch (err) {
      setMsg(mensagemErro(err));
    }
  }

  return (
    <section className="panel" id="roletas">
      <h2>Criar nova roleta</h2>
      <p className="lead">Crie roletas com o conteúdo que quiser: comandos do árbitro, katas, golpes da semana, perguntas para a turma.</p>
      {msg && (
        <p className="form-note" role="status">
          {msg}
        </p>
      )}
      <Recolhivel titulo="Nova roleta" aberto={Boolean(editando)}>
<form className="form tedit" onSubmit={(e) => void salvar(e)} key={editando?.id ?? "nova"}>
        <strong>{editando ? `Editando “${editando.titulo}”` : "Nova roleta"}</strong>
        <div className="field">
          <label htmlFor="rl-titulo">Nome da roleta</label>
          <input id="rl-titulo" name="titulo" type="text" maxLength={60} defaultValue={editando?.titulo ?? ""} placeholder="Ex.: Comandos do árbitro" autoComplete="off" />
        </div>
        <div className="field">
          <label htmlFor="rl-itens">Itens (um por linha; para ter resposta, escreva: Item | resposta)</label>
          <textarea id="rl-itens" name="itens" rows={8} maxLength={20000} defaultValue={editando ? itensParaTexto(editando.itens) : ""} placeholder={"Hajime | Começar a luta\nMatte | Parar (esperar)\nSore-made | Fim da luta"} />
        </div>
        <div className="tool-actions">
          <button className="btn btn-primary" type="submit">
            {editando ? "Salvar alterações" : "Criar roleta"}
          </button>
          {editando && (
            <button type="button" className="btn btn-ghost" onClick={() => setEditando(null)}>
              Cancelar
            </button>
          )}
        </div>
      </form>
</Recolhivel>
      <ul className="manage">
        {r.dados.length === 0 && <li className="empty">Nenhuma roleta criada.</li>}
        {r.dados.map((x) => (
          <li key={x.id}>
            <span>
              <strong>{x.titulo}</strong>
              <small>{x.itens.length} itens</small>
            </span>
            <span className="tlinks">
              <button className="btn btn-ghost" onClick={() => setEditando(x)}>
                Editar
              </button>
              <button className="btn btn-ghost" onClick={() => window.confirm(`Apagar “${x.titulo}”?`) && void apagarRoleta(x.id).then(r.recarregar)}>
                Apagar
              </button>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
