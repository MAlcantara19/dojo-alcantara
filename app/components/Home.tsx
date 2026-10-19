"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { dojo, galeria, sobre } from "../lib/data";
import { useAvisos, useEventos } from "../lib/conteudo";
import { faixas, faixasAltas } from "../lib/faixas";
import { linkGoogleAgenda } from "../lib/ics";

const MESES_CURTOS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

function parseData(s: string): Date {
  const [a, m, d] = s.split("-").map(Number);
  return new Date(a, m - 1, d);
}
function dataLonga(d: Date): string {
  return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

const semAssinatura = () => () => {};
const hojeTexto = () => {
  const h = new Date();
  return `${h.getFullYear()}-${h.getMonth() + 1}-${h.getDate()}`;
};

export default function Home() {
  // Vazio no servidor; no navegador vira a data de hoje (evita erro de hidratação)
  const hojeStr = useSyncExternalStore(semAssinatura, hojeTexto, () => "");
  const hoje = hojeStr ? parseData(hojeStr) : null;

  const av = useAvisos();
  const ev = useEventos();
  const eventos = ev.itens;

  const futuros = hoje
    ? eventos.filter((e) => parseData(e.data) >= hoje).sort((a, b) => parseData(a.data).getTime() - parseData(b.data).getTime())
    : eventos;

  const proximo = hoje && futuros.length ? futuros[0] : null;
  let contagem = "";
  if (hoje && proximo) {
    const dias = Math.round((parseData(proximo.data).getTime() - hoje.getTime()) / 86400000);
    contagem = dias === 0 ? "É hoje!" : dias === 1 ? "Falta 1 dia" : `Faltam ${dias} dias`;
  }

  return (
    <main id="conteudo">
      <section className="hero" id="inicio">
        <span className="kanji" aria-hidden="true">
          柔道
        </span>
        <div className="hero-inner">
          <div className="logo" aria-label="Espaço para a logo do dojô">
            <span>DA</span>
          </div>
          <h1>{dojo.nome}</h1>
          <p className="slogan">{dojo.slogan}</p>

          {proximo && (
            <div className="next">
              <span className="next-label">Próximo evento</span>
              <strong className="next-title">{proximo.titulo}</strong>
              <span className="next-meta">
                {dataLonga(parseData(proximo.data))}
                {proximo.local && proximo.local !== "A definir" ? ` · ${proximo.local}` : ""}
              </span>
              <span className="next-count">{contagem}</span>
            </div>
          )}

          <div className="shortcuts">
            <Link href="/#avisos">Avisos</Link>
            <Link href="/#calendario">Calendário</Link>
            <Link href="/tecnicas">Técnicas</Link>
            <Link href="/simulados">Simulados</Link>
            <Link href="/roleta">Roleta</Link>
          </div>
        </div>
        <div className="belts" aria-hidden="true">
          {[...faixas, ...faixasAltas].map((f) => (
            <i key={f.nome} title={f.nome} style={{ background: f.cor }} />
          ))}
        </div>
      </section>

      <section className="block" id="estudo">
        <h2>Estude judô</h2>
        <p className="lead">Ferramentas para treinar em casa e se preparar para a prova.</p>
        <div className="study">
          <Link href="/tecnicas" className="study-card">
            <h3>Técnicas</h3>
            <p>Todas as técnicas do Kodokan, com PDF e vídeo.</p>
          </Link>
          <Link href="/simulados" className="study-card">
            <h3>Simulados</h3>
            <p>Perguntas para testar o que você já sabe.</p>
          </Link>
          <Link href="/roleta" className="study-card">
            <h3>Roleta</h3>
            <p>Gire e diga o que a palavra do judô significa.</p>
          </Link>
        </div>
      </section>

      <section className="block alt" id="avisos">
        <h2>Avisos</h2>
        <p className="lead">O que você precisa saber antes do próximo treino.</p>
        <div className="stack">
          {av.carregando && <p className="empty">Carregando avisos…</p>}
          {!av.carregando && av.itens.length === 0 && <p className="empty">Nenhum aviso por enquanto.</p>}
          {av.itens.map((a) => (
            <article className="card" key={a.id}>
              <h3>{a.titulo}</h3>
              <time dateTime={a.data}>{dataLonga(parseData(a.data))}</time>
              <p>{a.texto}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="block" id="calendario">
        <h2>Calendário</h2>
        <p className="lead">Campeonatos, provas de faixa e confraternizações.</p>
        <div className="subscribe">
          <a href="https://calendar.google.com/calendar/r?cid=webcal://dojo-alcantara.vercel.app/calendario.ics" target="_blank" rel="noopener noreferrer">
            Assinar no Google Agenda
          </a>
          <a href="webcal://dojo-alcantara.vercel.app/calendario.ics">Assinar no iPhone</a>
        </div>
        <ol className="events">
          {ev.carregando && <li className="empty">Carregando eventos…</li>}
          {!ev.carregando && futuros.length === 0 && <li className="empty">Nenhum evento marcado. Volte em breve.</li>}
          {futuros.map((e) => {
            const d = parseData(e.data);
            return (
              <li className="event" key={e.id}>
                <div className="date">
                  <b>{d.getDate()}</b>
                  <span>{MESES_CURTOS[d.getMonth()]}</span>
                </div>
                <div>
                  <h3>{e.titulo}</h3>
                  <p>{[e.hora, e.local].filter(Boolean).join(" · ")}</p>
                  <span className="tag">{e.tipo}</span>
                  <a className="add-cal" href={linkGoogleAgenda(e)} target="_blank" rel="noopener noreferrer">
                    + Adicionar ao meu calendário
                  </a>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="block alt" id="galeria">
        <h2>Galeria</h2>
        <p className="lead">Momentos dos treinos e eventos.</p>
        <div className="grid">
          {galeria.map((f) => (
            <figure className="tile" key={f.legenda}>
              {f.src && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={f.src} alt={f.legenda} loading="lazy" />
              )}
              <figcaption>{f.legenda}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="block" id="sobre">
        <h2>Sobre nós</h2>
        <div className="prose">
          {sobre.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      </section>

      <section className="block alt" id="entrar">
        <div className="login-card">
          <h2>Área do aluno</h2>
          <p>Materiais da sua faixa, treinos e simulados ficam aqui, com login e senha criados pelo professor.</p>
          <Link href="/login" className="btn">
            Entrar
          </Link>
        </div>
      </section>

      <footer className="foot">
        <p>© {hoje ? hoje.getFullYear() : 2026} Dojô Alcântara</p>
        <p className="foot-links">
          <Link href="/privacidade">Privacidade</Link>
          {dojo.contato.instagram && (
            <a href={`https://instagram.com/${dojo.contato.instagram}`} target="_blank" rel="noopener noreferrer">
              Instagram
            </a>
          )}
          {dojo.contato.whatsapp && (
            <a href={`https://wa.me/${dojo.contato.whatsapp}`} target="_blank" rel="noopener noreferrer">
              WhatsApp
            </a>
          )}
        </p>
      </footer>
    </main>
  );
}
