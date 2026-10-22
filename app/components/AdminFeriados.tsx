"use client";

import { useState } from "react";
import { dataBR, hojeISO } from "../lib/aluno";
import { mensagemErro } from "../lib/auth";
import { addFeriadoLocal, apagarFeriadoLocal, lerFeriadosLocais, salvarFeriadoLocal, type FeriadoLocal } from "../lib/calendarioDb";
import { useCarga } from "../lib/useCarga";
import Recolhivel from "./Recolhivel";

const VAZIO: FeriadoLocal[] = [];

/** Feriados da cidade (os nacionais já entram sozinhos). */
export default function AdminFeriados() {
  const f = useCarga(lerFeriadosLocais, VAZIO);
  const [msg, setMsg] = useState("");
  const [editando, setEditando] = useState<string | null>(null);

  async function nova(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const d = new FormData(form);
    const data = String(d.get("data") ?? "");
    const nome = String(d.get("nome") ?? "").trim();
    if (!data || !nome) return setMsg("Preencha a data e o nome do feriado.");
    setMsg("Salvando…");
    try {
      await addFeriadoLocal(data, nome);
      setMsg("Feriado adicionado. Ele aparece no calendário e no planejamento de aulas.");
      form.reset();
      f.recarregar();
    } catch (err) {
      setMsg(mensagemErro(err));
    }
  }

  return (
    <section className="panel" id="feriados">
      <h2>Feriados locais</h2>
      <p className="lead">Os feriados nacionais já aparecem sozinhos no calendário e no planejamento de aulas. Aqui você acrescenta os da sua cidade.</p>
      {msg && (
        <p className="form-note" role="status">
          {msg}
        </p>
      )}
      <Recolhivel titulo="Adicionar feriado local">
<form className="form inline" onSubmit={(e) => void nova(e)}>
        <input name="data" type="date" defaultValue={hojeISO()} aria-label="Data do feriado" />
        <input name="nome" type="text" maxLength={60} placeholder="Ex.: Aniversário da cidade" aria-label="Nome do feriado" autoComplete="off" />
        <button className="btn btn-primary" type="submit">
          Adicionar
        </button>
      </form>
</Recolhivel>
      <ul className="manage">
        {f.dados.length === 0 && <li className="empty">Nenhum feriado local cadastrado.</li>}
        {f.dados.map((x) =>
          editando === x.id ? (
            <li key={x.id} className="coluna">
              <form
                className="form inline"
                onSubmit={(e) => {
                  e.preventDefault();
                  const d = new FormData(e.currentTarget);
                  const data = String(d.get("data") ?? "");
                  const nome = String(d.get("nome") ?? "").trim();
                  if (!data || !nome) return setMsg("Preencha a data e o nome do feriado.");
                  void salvarFeriadoLocal(x.id, data, nome)
                    .then(() => (setMsg("Feriado atualizado."), setEditando(null), f.recarregar()))
                    .catch((err) => setMsg(mensagemErro(err)));
                }}
              >
                <input name="data" type="date" defaultValue={x.data} aria-label="Data do feriado" />
                <input name="nome" type="text" maxLength={60} defaultValue={x.nome} aria-label="Nome do feriado" />
                <button className="btn btn-primary" type="submit">
                  Salvar
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setEditando(null)}>
                  Cancelar
                </button>
              </form>
            </li>
          ) : (
            <li key={x.id}>
              <span>
                <strong>{x.nome}</strong>
                <small>{dataBR(x.data)}</small>
              </span>
              <span className="tlinks">
                <button className="btn btn-ghost" onClick={() => setEditando(x.id)}>
                  Editar
                </button>
                <button className="btn btn-ghost" onClick={() => window.confirm(`Apagar “${x.nome}”?`) && void apagarFeriadoLocal(x.id).then(f.recarregar)}>
                  Apagar
                </button>
              </span>
            </li>
          ),
        )}
      </ul>
    </section>
  );
}
