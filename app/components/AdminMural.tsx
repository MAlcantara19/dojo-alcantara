"use client";

import { useState } from "react";
import { hojeISO } from "../lib/aluno";
import { mensagemErro } from "../lib/auth";
import { apagar, atualizarAviso, atualizarEvento, criarAviso, criarEvento, useAvisos, useEventos, type AvisoDoc, type EventoDoc } from "../lib/conteudo";

const TIPOS = ["Campeonato", "Prova", "Festa", "Treino especial", "Outro"];

export default function AdminMural() {
  const av = useAvisos();
  const ev = useEventos();
  const [msg, setMsg] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [editAviso, setEditAviso] = useState<AvisoDoc | null>(null);
  const [editEvento, setEditEvento] = useState<EventoDoc | null>(null);

  async function rodar(acao: () => Promise<void>, ok: string, depois: () => void) {
    setOcupado(true);
    setMsg("");
    try {
      await acao();
      setMsg(ok);
      depois();
    } catch (e) {
      setMsg(mensagemErro(e));
    }
    setOcupado(false);
  }

  function salvarAviso(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const a = { titulo: String(f.get("titulo") ?? "").trim(), texto: String(f.get("texto") ?? "").trim(), data: String(f.get("data") ?? "") };
    if (!a.titulo || !a.texto || !a.data) return setMsg("Preencha título, texto e data do aviso.");
    const alvo = editAviso;
    void rodar(() => (alvo ? atualizarAviso(alvo.id, a) : criarAviso(a)), alvo ? "Aviso atualizado." : "Aviso publicado.", () => {
      form.reset();
      setEditAviso(null);
      av.recarregar();
    });
  }

  function salvarEvento(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const ev0 = {
      titulo: String(f.get("titulo") ?? "").trim(),
      data: String(f.get("data") ?? ""),
      hora: String(f.get("hora") ?? "").trim() || "A confirmar",
      local: String(f.get("local") ?? "").trim() || "A definir",
      tipo: String(f.get("tipo") ?? "Outro"),
    };
    if (!ev0.titulo || !ev0.data) return setMsg("Preencha o título e a data do evento.");
    const alvo = editEvento;
    void rodar(() => (alvo ? atualizarEvento(alvo.id, ev0) : criarEvento(ev0)), alvo ? "Evento atualizado." : "Evento publicado.", () => {
      form.reset();
      setEditEvento(null);
      ev.recarregar();
    });
  }

  function remover(nome: "avisos" | "eventos", id: string, titulo: string, depois: () => void) {
    if (!window.confirm(`Apagar “${titulo}”? Isso não pode ser desfeito.`)) return;
    void rodar(() => apagar(nome, id), "Apagado.", depois);
  }

  return (
    <>
      {msg && (
        <p className="form-note" role="status">
          {msg}
        </p>
      )}

      <section className="panel" id="avisos">
        <h2>Avisos</h2>
        <form className="form" onSubmit={salvarAviso} key={editAviso?.id ?? "novo-aviso"}>
          {editAviso && <p className="form-note">Editando “{editAviso.titulo}”.</p>}
          <div className="field">
            <label htmlFor="a-titulo">Título</label>
            <input id="a-titulo" name="titulo" type="text" maxLength={80} defaultValue={editAviso?.titulo ?? ""} />
          </div>
          <div className="field">
            <label htmlFor="a-texto">Texto</label>
            <textarea id="a-texto" name="texto" rows={3} maxLength={600} defaultValue={editAviso?.texto ?? ""} />
          </div>
          <div className="field">
            <label htmlFor="a-data">Data</label>
            <input id="a-data" name="data" type="date" defaultValue={editAviso?.data ?? hojeISO()} />
          </div>
          <div className="tool-actions">
            <button className="btn btn-primary" type="submit" disabled={ocupado}>
              {editAviso ? "Salvar alterações" : "Publicar aviso"}
            </button>
            {editAviso && (
              <button type="button" className="btn btn-ghost" onClick={() => setEditAviso(null)}>
                Cancelar
              </button>
            )}
          </div>
        </form>
        <ul className="manage">
          {av.carregando && <li className="empty">Carregando…</li>}
          {!av.carregando && av.itens.length === 0 && <li className="empty">Nenhum aviso publicado.</li>}
          {av.erro && <li className="empty">Não consegui ler o banco. Os avisos abaixo são só de exemplo.</li>}
          {av.itens.map((a) => (
            <li key={a.id}>
              <span>
                <strong>{a.titulo}</strong>
                <small>{a.data}</small>
              </span>
              {!av.erro && (
                <span className="tlinks">
                  <button className="btn btn-ghost" onClick={() => (setEditAviso(a), window.scrollTo({ top: 0, behavior: "smooth" }))}>
                    Editar
                  </button>
                  <button className="btn btn-ghost" onClick={() => remover("avisos", a.id, a.titulo, av.recarregar)} disabled={ocupado}>
                    Apagar
                  </button>
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="panel" id="eventos">
        <h2>Eventos</h2>
        <form className="form" onSubmit={salvarEvento} key={editEvento?.id ?? "novo-evento"}>
          {editEvento && <p className="form-note">Editando “{editEvento.titulo}”.</p>}
          <div className="field">
            <label htmlFor="e-titulo">Título</label>
            <input id="e-titulo" name="titulo" type="text" maxLength={80} defaultValue={editEvento?.titulo ?? ""} />
          </div>
          <div className="field">
            <label htmlFor="e-data">Data</label>
            <input id="e-data" name="data" type="date" defaultValue={editEvento?.data ?? hojeISO()} />
          </div>
          <div className="field">
            <label htmlFor="e-hora">Horário</label>
            <input id="e-hora" name="hora" type="text" placeholder="Ex.: 9h" maxLength={30} defaultValue={editEvento && editEvento.hora !== "A confirmar" ? editEvento.hora : ""} />
          </div>
          <div className="field">
            <label htmlFor="e-local">Local</label>
            <input id="e-local" name="local" type="text" maxLength={80} defaultValue={editEvento && editEvento.local !== "A definir" ? editEvento.local : ""} />
          </div>
          <div className="field">
            <label htmlFor="e-tipo">Tipo</label>
            <select id="e-tipo" name="tipo" defaultValue={editEvento?.tipo ?? "Campeonato"}>
              {TIPOS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="tool-actions">
            <button className="btn btn-primary" type="submit" disabled={ocupado}>
              {editEvento ? "Salvar alterações" : "Publicar evento"}
            </button>
            {editEvento && (
              <button type="button" className="btn btn-ghost" onClick={() => setEditEvento(null)}>
                Cancelar
              </button>
            )}
          </div>
        </form>
        <ul className="manage">
          {ev.carregando && <li className="empty">Carregando…</li>}
          {!ev.carregando && ev.itens.length === 0 && <li className="empty">Nenhum evento publicado.</li>}
          {ev.erro && <li className="empty">Não consegui ler o banco. Os eventos abaixo são só de exemplo.</li>}
          {ev.itens.map((e) => (
            <li key={e.id}>
              <span>
                <strong>{e.titulo}</strong>
                <small>
                  {e.data} · {e.tipo}
                </small>
              </span>
              {!ev.erro && (
                <span className="tlinks">
                  <button className="btn btn-ghost" onClick={() => (setEditEvento(e), window.scrollTo({ top: 0, behavior: "smooth" }))}>
                    Editar
                  </button>
                  <button className="btn btn-ghost" onClick={() => remover("eventos", e.id, e.titulo, ev.recarregar)} disabled={ocupado}>
                    Apagar
                  </button>
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
