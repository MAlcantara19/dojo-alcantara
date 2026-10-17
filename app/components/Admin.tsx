"use client";

import { signOut } from "firebase/auth";
import { useState } from "react";
import { ehEquipe, mensagemErro } from "../lib/auth";
import { apagar, criarAviso, criarEvento, useAvisos, useEventos } from "../lib/conteudo";
import { getAuthInstance } from "../lib/firebase";
import { useAuth } from "../lib/useAuth";
import LoginForm from "./LoginForm";

const TIPOS = ["Campeonato", "Prova", "Festa", "Treino especial", "Outro"];

function hojeISO(): string {
  const h = new Date();
  const m = String(h.getMonth() + 1).padStart(2, "0");
  const d = String(h.getDate()).padStart(2, "0");
  return `${h.getFullYear()}-${m}-${d}`;
}

export default function Admin() {
  const { carregando, user, perfil } = useAuth();

  if (carregando) return <p className="form-help">Verificando seu acesso…</p>;

  if (!user) {
    return (
      <>
        <p className="lead">Entre com a conta de professor para editar o site.</p>
        <LoginForm destino="/admin" />
      </>
    );
  }

  if (!ehEquipe(perfil)) {
    return (
      <>
        <p className="notice" role="alert">
          Esta conta não tem permissão de professor. Se isso é um engano, peça ao administrador para liberar o seu acesso.
        </p>
        <button className="btn btn-ghost" onClick={() => signOut(getAuthInstance())}>
          Sair
        </button>
      </>
    );
  }

  return <Painel nome={perfil?.nome ?? user.email ?? "professor"} />;
}

function Painel({ nome }: { nome: string }) {
  const av = useAvisos();
  const ev = useEventos();
  const [msg, setMsg] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function executar(acao: () => Promise<void>, ok: string, depois: () => void) {
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

  function novoAviso(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const titulo = String(f.get("titulo") ?? "").trim();
    const texto = String(f.get("texto") ?? "").trim();
    const data = String(f.get("data") ?? "");
    if (!titulo || !texto || !data) return setMsg("Preencha título, texto e data do aviso.");
    void executar(() => criarAviso({ titulo, texto, data }), "Aviso publicado.", () => {
      form.reset();
      av.recarregar();
    });
  }

  function novoEvento(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const titulo = String(f.get("titulo") ?? "").trim();
    const data = String(f.get("data") ?? "");
    const hora = String(f.get("hora") ?? "").trim() || "A confirmar";
    const local = String(f.get("local") ?? "").trim() || "A definir";
    const tipo = String(f.get("tipo") ?? "Outro");
    if (!titulo || !data) return setMsg("Preencha o título e a data do evento.");
    void executar(() => criarEvento({ titulo, data, hora, local, tipo }), "Evento publicado.", () => {
      form.reset();
      ev.recarregar();
    });
  }

  function remover(nomeColecao: "avisos" | "eventos", id: string, titulo: string, depois: () => void) {
    if (!window.confirm(`Apagar “${titulo}”? Isso não pode ser desfeito.`)) return;
    void executar(() => apagar(nomeColecao, id), "Apagado.", depois);
  }

  return (
    <>
      <div className="admin-top">
        <p className="lead">Olá, {nome}. O que você publicar aparece no site na hora.</p>
        <button className="btn btn-ghost" onClick={() => signOut(getAuthInstance())}>
          Sair
        </button>
      </div>

      {msg && (
        <p className="form-note" role="status">
          {msg}
        </p>
      )}

      <section className="panel">
        <h2>Avisos</h2>
        <form className="form" onSubmit={novoAviso}>
          <div className="field">
            <label htmlFor="a-titulo">Título</label>
            <input id="a-titulo" name="titulo" type="text" maxLength={80} />
          </div>
          <div className="field">
            <label htmlFor="a-texto">Texto</label>
            <textarea id="a-texto" name="texto" rows={3} maxLength={600} />
          </div>
          <div className="field">
            <label htmlFor="a-data">Data</label>
            <input id="a-data" name="data" type="date" defaultValue={hojeISO()} />
          </div>
          <button className="btn btn-primary" type="submit" disabled={ocupado}>
            Publicar aviso
          </button>
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
                <button className="btn btn-ghost" onClick={() => remover("avisos", a.id, a.titulo, av.recarregar)} disabled={ocupado}>
                  Apagar
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <h2>Eventos</h2>
        <form className="form" onSubmit={novoEvento}>
          <div className="field">
            <label htmlFor="e-titulo">Título</label>
            <input id="e-titulo" name="titulo" type="text" maxLength={80} />
          </div>
          <div className="field">
            <label htmlFor="e-data">Data</label>
            <input id="e-data" name="data" type="date" defaultValue={hojeISO()} />
          </div>
          <div className="field">
            <label htmlFor="e-hora">Horário</label>
            <input id="e-hora" name="hora" type="text" placeholder="Ex.: 9h" maxLength={30} />
          </div>
          <div className="field">
            <label htmlFor="e-local">Local</label>
            <input id="e-local" name="local" type="text" maxLength={80} />
          </div>
          <div className="field">
            <label htmlFor="e-tipo">Tipo</label>
            <select id="e-tipo" name="tipo" defaultValue="Campeonato">
              {TIPOS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <button className="btn btn-primary" type="submit" disabled={ocupado}>
            Publicar evento
          </button>
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
                <button className="btn btn-ghost" onClick={() => remover("eventos", e.id, e.titulo, ev.recarregar)} disabled={ocupado}>
                  Apagar
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <h2>Em breve</h2>
        <p className="lead">Alunos, materiais por faixa, academias e turmas entram nas próximas etapas.</p>
      </section>
    </>
  );
}
