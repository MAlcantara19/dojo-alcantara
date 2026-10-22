"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { dataBR, hojeISO } from "../lib/aluno";
import { lerCalendariosOficiais, lerFeriadosLocais, type CalendarioOficial, type FeriadoLocal } from "../lib/calendarioDb";
import { lerCampeonatosDojo, lerInscritos, type CampeonatoDojo, type Inscrito } from "../lib/campeonatosDojo";
import { lerEventosInternos, useEventos, type EventoDoc } from "../lib/conteudo";
import { feriadosNacionais, type Feriado } from "../lib/feriados";
import { linkGoogleAgenda } from "../lib/ics";
import { descreverLink, idDoDrive } from "../lib/links";
import { useAgendaGoogle } from "../lib/agendaGoogle";
import { lerAniversarios, type Aniversario } from "../lib/aniversarios";
import { useAuth } from "../lib/useAuth";
import { useCarga } from "../lib/useCarga";
import { FotosDaPasta } from "./Galeria";
import Img from "./Img";
import Midia from "./Midia";
import Modal from "./Modal";

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const DIAS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const VAZIO_F: FeriadoLocal[] = [];
const VAZIO_C: CalendarioOficial[] = [];
const VAZIO_AN: Aniversario[] = [];
const VAZIO_EV: EventoDoc[] = [];
const VAZIO_CAMP: CampeonatoDojo[] = [];
const VAZIO_INS: Inscrito[] = [];

/** Arquivos do campeonato e, no calendário dos alunos, quem vai competir. */
function ArquivosEInscritos({ id, camps, mostrarInscritos }: { id: string; camps: CampeonatoDojo[]; mostrarInscritos: boolean }) {
  const c = camps.find((x) => x.id === id);
  const insc = useCarga(() => lerInscritos(id), VAZIO_INS, mostrarInscritos);
  if (!c) return null;
  return (
    <>
      {c.arquivos.length > 0 && (
        <div className="tlinks">
          {c.arquivos.map((a, i) =>
            a.url.startsWith("db:") ? (
              <Img key={i} className="midia-img" src={a.url} alt={a.titulo} largura={1200} />
            ) : (
              <a key={i} className="btn btn-ghost" href={a.url} target="_blank" rel="noopener noreferrer">
                📄 {a.titulo}
              </a>
            ),
          )}
        </div>
      )}
      {mostrarInscritos && (
        <>
          <h4>Quem vai competir ({insc.dados.length})</h4>
          {insc.dados.length === 0 ? (
            <p className="form-help">Ainda sem inscritos.</p>
          ) : (
            <ul className="inscritos">
              {insc.dados.map((i) => (
                <li key={i.uid}>
                  <strong>{i.nome}</strong> <small>{[i.classe, i.categoria].filter(Boolean).join(" · ")}</small>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </>
  );
}
const iso = (a: number, m: number, d: number) => `${a}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

const semAssinatura = () => () => {};

/** Espera o navegador dizer que dia é hoje (no servidor não se sabe), para abrir no mês certo. */
export default function Calendario() {
  const hoje = useSyncExternalStore(semAssinatura, hojeISO, () => "");
  if (!hoje) return <p className="form-help">Carregando o calendário…</p>;
  return <CalendarioInterno hojeStr={hoje} />;
}

function CalendarioInterno({ hojeStr }: { hojeStr: string }) {
  const evSite = useEventos();
  const agenda = useAgendaGoogle();
  const { user } = useAuth();
  const [vista, setVista] = useState<"geral" | "alunos">("geral");
  const doAluno = Boolean(user) && vista === "alunos";
  const internos = useCarga(lerEventosInternos, VAZIO_EV, Boolean(user));
  const camps = useCarga(() => lerCampeonatosDojo(Boolean(user)), VAZIO_CAMP);
  const ev = useMemo(() => {
    const campsEv: EventoDoc[] = camps.dados
      .filter((x) => doAluno || x.publico)
      .map((x) => ({ id: "camp-" + x.id, titulo: "🏆 " + x.nome, data: x.data, hora: "A confirmar", local: x.local || "A definir", tipo: "Campeonato", descricao: x.descricao, autor: x.autor, interno: !x.publico }));
    return { itens: [...evSite.itens, ...agenda, ...campsEv, ...(doAluno ? internos.dados : [])] };
  }, [evSite.itens, agenda, camps.dados, internos.dados, doAluno]);
  const locais = useCarga(lerFeriadosLocais, VAZIO_F);
  const oficiais = useCarga(lerCalendariosOficiais, VAZIO_C);
  const anivs = useCarga(lerAniversarios, VAZIO_AN, Boolean(user));
  const anivPorDia = useMemo(() => {
    const m = new Map<string, string[]>();
    if (doAluno) anivs.dados.forEach((a) => m.set(a.mmdd, [...(m.get(a.mmdd) ?? []), a.nome]));
    return m;
  }, [anivs.dados, doAluno]);
  const [ano, setAno] = useState(Number(hojeStr.slice(0, 4)));
  const [mes, setMes] = useState(Number(hojeStr.slice(5, 7)) - 1);
  const [dia, setDia] = useState(hojeStr);
  const [foto, setFoto] = useState<string | null>(null);

  const feriados = useMemo(() => {
    const m = new Map<string, Feriado[]>();
    [...feriadosNacionais(ano - 1), ...feriadosNacionais(ano), ...feriadosNacionais(ano + 1), ...locais.dados].forEach((f) => m.set(f.data, [...(m.get(f.data) ?? []), f]));
    return m;
  }, [ano, locais.dados]);
  const eventos = useMemo(() => {
    const m = new Map<string, EventoDoc[]>();
    ev.itens.forEach((e) => m.set(e.data, [...(m.get(e.data) ?? []), e]));
    return m;
  }, [ev.itens]);

  const primeiro = new Date(ano, mes, 1).getDay();
  const total = new Date(ano, mes + 1, 0).getDate();
  const celulas: (number | null)[] = [...Array(primeiro).fill(null), ...Array.from({ length: total }, (_, i) => i + 1)];

  function mover(delta: number) {
    const d = new Date(ano, mes + delta, 1);
    setAno(d.getFullYear());
    setMes(d.getMonth());
  }
  function hoje() {
    setAno(Number(hojeStr.slice(0, 4)));
    setMes(Number(hojeStr.slice(5, 7)) - 1);
    setDia(hojeStr);
  }

  const doDia = eventos.get(dia) ?? [];
  const feriadosDoDia = feriados.get(dia) ?? [];
  const anos = Array.from({ length: 7 }, (_, i) => Number(hojeStr.slice(0, 4)) - 2 + i);

  return (
    <div className="calendario">
      {user && (
        <div className="tabs" role="tablist" aria-label="Qual calendário">
          <button role="tab" aria-selected={vista === "geral"} onClick={() => setVista("geral")}>
            Calendário geral
          </button>
          <button role="tab" aria-selected={vista === "alunos"} onClick={() => setVista("alunos")}>
            Calendário dos alunos
          </button>
        </div>
      )}
      <p className="form-help">
        {doAluno ? "Tudo do calendário geral, mais o que é só para alunos: eventos internos, campeonatos com os inscritos e aniversários." : "Campeonatos, início e volta das aulas, dias sem aula e outros compromissos do dojô."}
      </p>
      <div className="cal-topo">
        <button type="button" className="cal-seta" onClick={() => mover(-1)} aria-label="Mês anterior">
          ‹
        </button>
        <div className="cal-titulo">
          <strong>{MESES[mes]}</strong>
          <select aria-label="Ano" value={ano} onChange={(e) => setAno(Number(e.target.value))}>
            {anos.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </div>
        <button type="button" className="cal-seta" onClick={() => mover(1)} aria-label="Próximo mês">
          ›
        </button>
      </div>
      <div className="cal-grade-grande" role="grid" aria-label={`Calendário de ${MESES[mes]} de ${ano}`}>
        {DIAS.map((d) => (
          <span key={d} className="cal-cab">
            {d}
          </span>
        ))}
        {celulas.map((d, i) => {
          if (d === null) return <span key={"v" + i} />;
          const k = iso(ano, mes, d);
          const e = eventos.get(k);
          const f = feriados.get(k);
          return (
            <button key={k} type="button" className={"cal-celula" + (k === dia ? " sel" : "") + (k === hojeStr ? " hoje" : "") + (f?.some((x) => !x.facultativo) ? " feriado" : "") + (e ? " tem" : "")} onClick={() => setDia(k)} aria-pressed={k === dia} aria-label={`${d} de ${MESES[mes]}${e ? `, evento: ${e.map((x) => x.titulo).join(", ")}` : ""}${f ? `, ${f.map((x) => x.nome).join(", ")}` : ""}`}>
              <b>{d}</b>
              <span className="cal-marcas" aria-hidden="true">
                {anivPorDia.has(k.slice(5)) && <span className="m-aniv">🎂</span>}
                {e && <i className="m-evento" />}
                {f && <i className={f.some((x) => !x.facultativo) ? "m-feriado" : "m-facult"} />}
              </span>
              {e && <small className="cal-nome">{e[0].titulo}</small>}
            </button>
          );
        })}
      </div>
      <div className="cal-legenda">
        <span>
          <i className="m-evento" /> Evento do dojô
        </span>
        <span>
          <i className="m-feriado" /> Feriado
        </span>
        <span>
          <i className="m-facult" /> Ponto facultativo
        </span>
        {user && <span>🎂 Aniversário</span>}
        <button type="button" className="link-btn" onClick={hoje}>
          Voltar para hoje
        </button>
      </div>

      <section className="cal-dia-painel" aria-live="polite">
        <h2>{dataBR(dia)}</h2>
        {feriadosDoDia.map((f, i) => (
          <p key={i} className={"cal-feriado" + (f.facultativo ? " facult" : "")}>
            🗓 {f.nome}
            {f.local ? " (feriado local)" : ""}
          </p>
        ))}
        {(anivPorDia.get(dia.slice(5)) ?? []).map((n) => (
          <p key={n} className="cal-aniv">
            🎂 Aniversário de {n}
          </p>
        ))}
        {doDia.length === 0 && feriadosDoDia.length === 0 && !anivPorDia.has(dia.slice(5)) && <p className="form-help">Nenhum evento neste dia.</p>}
        {doDia.map((e) => (
          <article key={e.id} className="cal-evento">
            <h3>{e.titulo}</h3>
            <p className="tmeta">
              {[e.tipo, e.hora, e.local].filter((x) => x && x !== "A confirmar" && x !== "A definir").join(" · ") || e.tipo}
            </p>
            {e.descricao && <p>{e.descricao}</p>}
            <Midia imagem={e.imagem} video={e.video} alt={e.titulo} />
            {e.pastaDrive && (
              <>
                <h4>Fotos deste evento</h4>
                <FotosDaPasta pasta={e.pastaDrive} vazio="Ainda não há fotos deste evento." />
              </>
            )}
            {e.id.startsWith("camp-") && <ArquivosEInscritos id={e.id.slice(5)} camps={camps.dados} mostrarInscritos={doAluno} />}
            {e.interno && <p className="form-help">Só para alunos.</p>}
            {e.autor && <p className="form-help">Publicado por {e.autor}</p>}
            <div className="tool-actions">
              <a className="btn btn-ghost" href={linkGoogleAgenda(e)} target="_blank" rel="noopener noreferrer">
                + Adicionar ao meu calendário
              </a>
            </div>
          </article>
        ))}
      </section>

      <section className="cal-assinar">
        <h2>Receber no seu celular</h2>
        <div className="subscribe">
          <a href="https://calendar.google.com/calendar/r?cid=webcal://dojo-alcantara.vercel.app/calendario.ics" target="_blank" rel="noopener noreferrer">
            Assinar no Google Agenda
          </a>
          <a href="webcal://dojo-alcantara.vercel.app/calendario.ics">Assinar no iPhone</a>
        </div>
      </section>

      <section className="cal-oficiais">
        <h2>Calendários oficiais</h2>
        {oficiais.dados.length === 0 && <p className="form-help">O calendário da federação aparece aqui quando o professor publicar.</p>}
        <div className="oficiais">
          {oficiais.dados.map((c) =>
            c.tipo === "imagem" ? (
              <button key={c.id} type="button" className="oficial" onClick={() => setFoto(c.id)} aria-label={`Ampliar ${c.titulo}`}>
                <Img src={c.url} alt={c.titulo} largura={600} />
                <strong>{c.titulo}</strong>
              </button>
            ) : (
              <a key={c.id} className="oficial pdf" href={idDoDrive(c.url) ? `https://drive.google.com/file/d/${idDoDrive(c.url)}/view` : c.url} target="_blank" rel="noopener noreferrer">
                <span aria-hidden="true">{descreverLink(c.url).icone === "📁" ? "📁" : "📄"}</span>
                <strong>{c.titulo}</strong>
                <small>Abrir o PDF</small>
              </a>
            ),
          )}
        </div>
      </section>
      {foto && (
        <Modal titulo="Calendário oficial" onFechar={() => setFoto(null)}>
          {(() => {
            const c = oficiais.dados.find((x) => x.id === foto);
            return c ? <Img className="modal-img" src={c.url} alt={c.titulo} largura={1600} eager /> : null;
          })()}
        </Modal>
      )}
    </div>
  );
}
