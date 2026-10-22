"use client";

import { useState } from "react";
import { hojeISO } from "../lib/aluno";
import { addAvisoTurma, type Turma } from "../lib/alunos";
import { mensagemErro } from "../lib/auth";
import { apagar, atualizarAviso, atualizarEvento, criarAviso, criarEvento, lerEventosInternos, useAvisos, useEventos, type AvisoDoc, type EventoDoc } from "../lib/conteudo";
import { useCarga } from "../lib/useCarga";
import { enderecoOk } from "../lib/katasDb";
import AdminAgenda from "./AdminAgenda";
import AdminCalendarios from "./AdminCalendarios";
import AdminFeriados from "./AdminFeriados";
import CampoImagem from "./CampoImagem";
import MenuSuspenso from "./MenuSuspenso";
import Recolhivel from "./Recolhivel";

const VAZIO_EV: EventoDoc[] = [];
const TIPOS = ["Campeonato", "Prova", "Festa", "Treino especial", "Aula", "Outro"];

export default function AdminMural({ turmas, autor, ehAdmin }: { turmas: Turma[]; autor: string; ehAdmin: boolean }) {
  const av = useAvisos();
  const ev = useEventos();
  const internos = useCarga(lerEventosInternos, VAZIO_EV);
  const todosEventos = [...(ev.erro ? [] : ev.itens), ...internos.dados].sort((a, b) => b.data.localeCompare(a.data));
  const [msg, setMsg] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [editAviso, setEditAviso] = useState<AvisoDoc | null>(null);
  const [editEvento, setEditEvento] = useState<EventoDoc | null>(null);
  const [destino, setDestino] = useState<"publico" | "turmas">("publico");
  const [noCalendario, setNoCalendario] = useState(false);
  const [sec, setSec] = useState<"avisos" | "eventos" | "feriados" | "oficiais" | "agenda">("avisos");

  async function rodar(acao: () => Promise<void>, ok: string, depois: () => void) {
    setOcupado(true);
    setMsg("Salvando…");
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
    const g = (k: string) => String(f.get(k) ?? "").trim();
    const video = g("video");
    const imagem = g("imagem");
    const a = { titulo: g("titulo"), texto: g("texto"), data: g("data"), autor, imagem, video };
    if (!a.titulo || !a.texto || !a.data) return setMsg("Preencha título, texto e data do aviso.");
    if ((video && !/^https:\/\//.test(video)) || (imagem && !enderecoOk(imagem))) return setMsg("O link do vídeo precisa começar com https:// e a imagem deve ser enviada do celular ou ser um link https://.");
    const alvo = editAviso;
    const evento = !alvo && noCalendario ? { titulo: a.titulo, data: g("ev-data") || a.data, hora: g("ev-hora") || "A confirmar", local: g("ev-local") || "A definir", tipo: g("ev-tipo") || "Outro", descricao: a.texto.slice(0, 400), imagem, video, pastaDrive: "", autor } : null;
    if (!alvo && destino === "turmas") {
      const escolhidas = f.getAll("turmas").map(String);
      if (escolhidas.length === 0) return setMsg("Marque pelo menos uma turma, ou escolha “Todos”.");
      return void rodar(
        async () => {
          for (const t of escolhidas) await addAvisoTurma({ turma: t, titulo: a.titulo, texto: a.texto, data: a.data, autor, imagem, video });
          if (evento) await criarEvento(evento, g("ev-cal") === "alunos");
        },
        `Aviso enviado para ${escolhidas.length} ${escolhidas.length === 1 ? "turma" : "turmas"}${evento ? " e marcado no calendário" : ""}.`,
        () => (form.reset(), setNoCalendario(false), ev.recarregar()),
      );
    }
    void rodar(
      async () => {
        if (alvo) await atualizarAviso(alvo.id, { ...a, autor: alvo.autor ?? autor });
        else {
          await criarAviso(a);
          if (evento) await criarEvento(evento, g("ev-cal") === "alunos");
        }
      },
      alvo ? "Aviso atualizado." : evento ? "Aviso publicado e marcado no calendário." : "Aviso publicado no site.",
      () => {
        form.reset();
        setEditAviso(null);
        setNoCalendario(false);
        av.recarregar();
        ev.recarregar();
      },
    );
  }

  function salvarEvento(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const g = (k: string) => String(f.get(k) ?? "").trim();
    const dados = {
      titulo: g("titulo"),
      data: g("data"),
      hora: g("hora") || "A confirmar",
      local: g("local") || "A definir",
      tipo: g("tipo") || "Outro",
      descricao: g("descricao"),
      imagem: g("imagem"),
      video: g("video"),
      pastaDrive: g("pasta"),
      autor,
    };
    if (!dados.titulo || !dados.data) return setMsg("Preencha o título e a data do evento.");
    if ((dados.video && !/^https:\/\//.test(dados.video)) || (dados.pastaDrive && !/^https:\/\/|^[\w-]{10,}$/.test(dados.pastaDrive)) || (dados.imagem && !enderecoOk(dados.imagem))) return setMsg("Confira os links: vídeo e pasta do Drive precisam começar com https://");
    const alvo = editEvento;
    const interno = alvo ? Boolean(alvo.interno) : g("calendario") === "alunos";
    void rodar(() => (alvo ? atualizarEvento(alvo.id, { ...dados, autor: alvo.autor ?? autor }, interno) : criarEvento(dados, interno)), alvo ? "Evento atualizado." : interno ? "Evento publicado no calendário dos alunos." : "Evento publicado no calendário geral.", () => {
      form.reset();
      setEditEvento(null);
      ev.recarregar();
      internos.recarregar();
    });
  }

  function remover(nome: "avisos" | "eventos" | "eventosInternos", id: string, titulo: string, depois: () => void) {
    if (!window.confirm(`Apagar “${titulo}”? Isso não pode ser desfeito.`)) return;
    void rodar(() => apagar(nome, id), "Apagado.", depois);
  }

  return (
    <>
      <MenuSuspenso
        id="sub-mural"
        rotulo="O que você quer publicar ou ver?"
        valor={sec}
        onMudar={(v) => (setSec(v), setMsg(""))}
        opcoes={[
          ["avisos", `Avisos (${av.itens.length})`],
          ["eventos", `Eventos do calendário (${todosEventos.length})`],
          ["feriados", "Feriados locais"],
          ...(ehAdmin
            ? ([
                ["oficiais", "Calendários oficiais (PDF ou imagem)"],
                ["agenda", "Agenda do Google"],
              ] as ["oficiais" | "agenda", string][])
            : []),
        ]}
      />
      {msg && (
        <p className="form-note" role="status">
          {msg}
        </p>
      )}

      {sec === "avisos" && (
      <section className="panel" id="avisos">
        <h2>Avisos</h2>
        <Recolhivel titulo="Novo aviso" aberto={Boolean(editAviso)}>
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
          <CampoImagem name="imagem" rotulo="Imagem (opcional)" valorInicial={editAviso?.imagem ?? ""} />
          <div className="field">
            <label htmlFor="a-video">Vídeo (opcional): link do YouTube ou do Drive</label>
            <input id="a-video" name="video" type="url" inputMode="url" placeholder="https://…" defaultValue={editAviso?.video ?? ""} />
          </div>
          {!editAviso && (
            <fieldset className="passo">
              <legend>Calendário</legend>
              <label className="check-linha">
                <input type="checkbox" checked={noCalendario} onChange={(e) => setNoCalendario(e.target.checked)} /> Marcar também no calendário (vira evento, sem precisar cadastrar duas vezes)
              </label>
              {noCalendario && (
                <>
                  <div className="two">
                    <div className="field">
                      <label htmlFor="ev-data">Data no calendário</label>
                      <input id="ev-data" name="ev-data" type="date" defaultValue={hojeISO()} />
                    </div>
                    <div className="field">
                      <label htmlFor="ev-tipo">Tipo</label>
                      <select id="ev-tipo" name="ev-tipo" defaultValue="Outro">
                        {TIPOS.map((t) => (
                          <option key={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="two">
                    <div className="field">
                      <label htmlFor="ev-hora">Horário (opcional)</label>
                      <input id="ev-hora" name="ev-hora" type="text" maxLength={30} />
                    </div>
                    <div className="field">
                      <label htmlFor="ev-local">Local (opcional)</label>
                      <input id="ev-local" name="ev-local" type="text" maxLength={80} />
                    </div>
                  </div>
                  <div className="field">
                    <label htmlFor="ev-cal">Em qual calendário?</label>
                    <select id="ev-cal" name="ev-cal" defaultValue="geral">
                      <option value="geral">Calendário geral (todo mundo vê)</option>
                      <option value="alunos">Só no calendário dos alunos</option>
                    </select>
                  </div>
                </>
              )}
            </fieldset>
          )}
          {!editAviso && (
            <fieldset className="passo">
              <legend>Quem recebe</legend>
              <label className="check-linha">
                <input type="radio" name="destino" checked={destino === "publico"} onChange={() => setDestino("publico")} /> Todos (aparece na página inicial do site)
              </label>
              <label className="check-linha">
                <input type="radio" name="destino" checked={destino === "turmas"} onChange={() => setDestino("turmas")} /> Só algumas turmas (aparece na área dos alunos delas)
              </label>
              {destino === "turmas" && (
                <div className="checks">
                  <label>
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        e.currentTarget.form?.querySelectorAll<HTMLInputElement>('input[name="turmas"]').forEach((i) => (i.checked = e.currentTarget.checked));
                      }}
                    />{" "}
                    <b>Todas as turmas</b>
                  </label>
                  {turmas.length === 0 && <small>Você ainda não tem turmas disponíveis.</small>}
                  {turmas.map((t) => (
                    <label key={t.id}>
                      <input type="checkbox" name="turmas" value={t.nome} /> {t.apelido || t.nome}
                    </label>
                  ))}
                </div>
              )}
            </fieldset>
          )}
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
</Recolhivel>
        <ul className="manage">
          {av.carregando && <li className="empty">Carregando…</li>}
          {!av.carregando && av.itens.length === 0 && <li className="empty">Nenhum aviso publicado.</li>}
          {av.erro && <li className="empty">Não consegui ler o banco. Os avisos abaixo são só de exemplo.</li>}
          {av.itens.map((a) => (
            <li key={a.id}>
              <span>
                <strong>{a.titulo}</strong>
                <small>
                  {a.data}
                  {a.autor ? ` · por ${a.autor}` : ""}
                </small>
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
      )}

      {sec === "eventos" && (
      <section className="panel" id="eventos">
        <h2>Eventos do calendário</h2>
        <Recolhivel titulo="Novo evento" aberto={Boolean(editEvento)}>
<form className="form" onSubmit={salvarEvento} key={editEvento?.id ?? "novo-evento"}>
          {editEvento && <p className="form-note">Editando “{editEvento.titulo}”.</p>}
          <div className="field">
            <label htmlFor="e-titulo">Título</label>
            <input id="e-titulo" name="titulo" type="text" maxLength={80} defaultValue={editEvento?.titulo ?? ""} />
          </div>
          <div className="two">
            <div className="field">
              <label htmlFor="e-data">Data</label>
              <input id="e-data" name="data" type="date" defaultValue={editEvento?.data ?? hojeISO()} />
            </div>
            <div className="field">
              <label htmlFor="e-tipo">Tipo</label>
              <select id="e-tipo" name="tipo" defaultValue={editEvento?.tipo ?? "Campeonato"}>
                {TIPOS.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="two">
            <div className="field">
              <label htmlFor="e-hora">Horário</label>
              <input id="e-hora" name="hora" type="text" placeholder="Ex.: 9h" maxLength={30} defaultValue={editEvento && editEvento.hora !== "A confirmar" ? editEvento.hora : ""} />
            </div>
            <div className="field">
              <label htmlFor="e-local">Local</label>
              <input id="e-local" name="local" type="text" maxLength={80} defaultValue={editEvento && editEvento.local !== "A definir" ? editEvento.local : ""} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="e-desc">Descrição (opcional)</label>
            <textarea id="e-desc" name="descricao" rows={2} maxLength={400} defaultValue={editEvento?.descricao ?? ""} />
          </div>
          {!editEvento && (
            <div className="field">
              <label htmlFor="e-cal">Em qual calendário?</label>
              <select id="e-cal" name="calendario" defaultValue="geral">
                <option value="geral">Calendário geral (todo mundo vê: campeonatos, início e volta às aulas, dias sem aula…)</option>
                <option value="alunos">Só no calendário dos alunos (quem está cadastrado)</option>
              </select>
            </div>
          )}
          <CampoImagem name="imagem" rotulo="Imagem do evento (opcional)" valorInicial={editEvento?.imagem ?? ""} />
          <div className="field">
            <label htmlFor="e-video">Vídeo (opcional): link do YouTube ou do Drive</label>
            <input id="e-video" name="video" type="url" inputMode="url" placeholder="https://…" defaultValue={editEvento?.video ?? ""} />
          </div>
          <div className="field">
            <label htmlFor="e-pasta">Pasta do Drive com as fotos do evento (opcional)</label>
            <input id="e-pasta" name="pasta" type="text" inputMode="url" placeholder="https://drive.google.com/drive/folders/…" defaultValue={editEvento?.pastaDrive ?? ""} />
            <p className="form-help">As fotos dessa pasta aparecem dentro do evento, no calendário. A pasta precisa estar compartilhada como “Qualquer pessoa com o link”.</p>
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
</Recolhivel>
        <ul className="manage">
          {ev.carregando && <li className="empty">Carregando…</li>}
          {!ev.carregando && todosEventos.length === 0 && <li className="empty">Nenhum evento publicado.</li>}
          {ev.erro && <li className="empty">Não consegui ler o banco. Os eventos abaixo são só de exemplo.</li>}
          {todosEventos.map((e) => (
            <li key={(e.interno ? "i" : "g") + e.id}>
              <span>
                <strong>
                  {e.titulo} {e.interno && <em className="selo">só alunos</em>}
                </strong>
                <small>
                  {e.data} · {e.tipo}
                  {e.autor ? ` · por ${e.autor}` : ""}
                </small>
              </span>
              {!ev.erro && (
                <span className="tlinks">
                  <button className="btn btn-ghost" onClick={() => (setEditEvento(e), window.scrollTo({ top: 0, behavior: "smooth" }))}>
                    Editar
                  </button>
                  <button className="btn btn-ghost" onClick={() => remover(e.interno ? "eventosInternos" : "eventos", e.id, e.titulo, () => (ev.recarregar(), internos.recarregar()))} disabled={ocupado}>
                    Apagar
                  </button>
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>
      )}

      {sec === "feriados" && <AdminFeriados />}
      {sec === "oficiais" && ehAdmin && <AdminCalendarios />}
      {sec === "agenda" && ehAdmin && <AdminAgenda />}
    </>
  );
}
