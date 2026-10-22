"use client";

import { useState } from "react";
import { mensagemErro } from "../lib/auth";
import { addCalendarioOficial, apagarCalendarioOficial, lerCalendariosOficiais, type CalendarioOficial } from "../lib/calendarioDb";
import { enderecoOk } from "../lib/katasDb";
import { useCarga } from "../lib/useCarga";
import CampoImagem from "./CampoImagem";
import Recolhivel from "./Recolhivel";

const VAZIO: CalendarioOficial[] = [];

/** Calendário da Confederação ou da federação, em imagem ou em PDF, para todos verem na página Calendário. */
export default function AdminCalendarios() {
  const c = useCarga(lerCalendariosOficiais, VAZIO);
  const [tipo, setTipo] = useState<"imagem" | "pdf">("imagem");
  const [msg, setMsg] = useState("");

  async function nova(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const titulo = String(f.get("titulo") ?? "").trim();
    const url = String(f.get("url") ?? "").trim();
    if (!titulo) return setMsg("Dê um título (ex.: Calendário CBJ 2026).");
    if (!url || !enderecoOk(url)) return setMsg(tipo === "pdf" ? "Cole o link do PDF (o link de compartilhamento do Drive serve)." : "Escolha a imagem do celular ou cole o link dela.");
    setMsg("Salvando…");
    try {
      await addCalendarioOficial(titulo, tipo, url);
      setMsg("Calendário publicado na página Calendário.");
      form.reset();
      c.recarregar();
    } catch (err) {
      setMsg(mensagemErro(err));
    }
  }

  return (
    <section className="panel" id="calendarios-oficiais">
      <h2>Calendários oficiais (Confederação, federação)</h2>
      <p className="lead">Publique o calendário que você recebe em imagem (print) ou em PDF. Todos veem na página Calendário.</p>
      {msg && (
        <p className="form-note" role="status">
          {msg}
        </p>
      )}
      <Recolhivel titulo="Publicar calendário oficial">
<form className="form tedit" onSubmit={(e) => void nova(e)} key={tipo}>
        <div className="field">
          <label htmlFor="co-titulo">Título</label>
          <input id="co-titulo" name="titulo" type="text" maxLength={80} autoComplete="off" />
        </div>
        <div className="field">
          <label htmlFor="co-tipo">Formato</label>
          <select id="co-tipo" value={tipo} onChange={(e) => setTipo(e.target.value as "imagem" | "pdf")}>
            <option value="imagem">Imagem (print ou foto)</option>
            <option value="pdf">PDF (link do Drive)</option>
          </select>
        </div>
        {tipo === "imagem" ? (
          <CampoImagem name="url" rotulo="Imagem do calendário" />
        ) : (
          <div className="field">
            <label htmlFor="co-url">Link do PDF</label>
            <input id="co-url" name="url" type="url" inputMode="url" placeholder="https://drive.google.com/file/d/…" />
            <p className="form-help">Coloque o PDF no Drive, compartilhe como “Qualquer pessoa com o link” e cole o link aqui.</p>
          </div>
        )}
        <button className="btn btn-primary" type="submit">
          Publicar
        </button>
      </form>
</Recolhivel>
      <ul className="manage">
        {c.dados.length === 0 && <li className="empty">Nenhum calendário oficial publicado.</li>}
        {c.dados.map((x) => (
          <li key={x.id}>
            <span>
              <strong>{x.titulo}</strong>
              <small>{x.tipo === "pdf" ? "PDF" : "Imagem"}</small>
            </span>
            <button className="btn btn-ghost" onClick={() => window.confirm(`Apagar “${x.titulo}”?`) && void apagarCalendarioOficial(x.id).then(c.recarregar)}>
              Apagar
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
