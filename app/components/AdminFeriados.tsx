"use client";

import { useState } from "react";
import { dataBR, hojeISO } from "../lib/aluno";
import { mensagemErro } from "../lib/auth";
import { addFeriadoLocal, apagarFeriadoLocal, lerFeriadosLocais, type FeriadoLocal } from "../lib/calendarioDb";
import { useCarga } from "../lib/useCarga";

const VAZIO: FeriadoLocal[] = [];

/** Feriados da cidade (os nacionais já entram sozinhos). */
export default function AdminFeriados() {
  const f = useCarga(lerFeriadosLocais, VAZIO);
  const [msg, setMsg] = useState("");

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
      <form className="form inline" onSubmit={(e) => void nova(e)}>
        <input name="data" type="date" defaultValue={hojeISO()} aria-label="Data do feriado" />
        <input name="nome" type="text" maxLength={60} placeholder="Ex.: Aniversário da cidade" aria-label="Nome do feriado" autoComplete="off" />
        <button className="btn btn-primary" type="submit">
          Adicionar
        </button>
      </form>
      <ul className="manage">
        {f.dados.length === 0 && <li className="empty">Nenhum feriado local cadastrado.</li>}
        {f.dados.map((x) => (
          <li key={x.id}>
            <span>
              <strong>{x.nome}</strong>
              <small>{dataBR(x.data)}</small>
            </span>
            <button className="btn btn-ghost" onClick={() => window.confirm(`Apagar “${x.nome}”?`) && void apagarFeriadoLocal(x.id).then(f.recarregar)}>
              Apagar
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
