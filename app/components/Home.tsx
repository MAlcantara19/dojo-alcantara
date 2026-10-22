"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { ehEquipe } from "../lib/auth";
import { useAuth } from "../lib/useAuth";
import { siglaDe, useSite } from "../lib/siteConfig";
import { DestaqueFotos, GaleriaGrid } from "./Galeria";
import Img, { useImagemUrl } from "./Img";
import { estiloFoto } from "../lib/fotoAjuste";
import Midia from "./Midia";
import EstudoCards from "./EstudoCards";
import Parcerias from "./Parcerias";
import { enderecoOk } from "../lib/katasDb";
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
  const site = useSite();
  const banner = useImagemUrl(site.bannerUrl, 1600);
  const { user, perfil } = useAuth();
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
      <section
        className="hero"
        id="inicio"
        style={banner ? { backgroundImage: `linear-gradient(165deg, rgba(11,4,20,.88), rgba(43,15,87,.62) 55%, rgba(106,53,201,.5)), url(${banner})`, backgroundSize: "cover", backgroundPosition: `center, ${site.bannerAjuste.x}% ${site.bannerAjuste.y}%` } : undefined}
      >
        <span className="kanji" aria-hidden="true">
          柔道
        </span>
        <div className="hero-inner">
          <div className="logo" aria-label={`Logo do ${site.nome}`}>
            {enderecoOk(site.logoUrl) ? (
              <Img src={site.logoUrl} alt="" largura={400} eager style={estiloFoto(site.logoAjuste)} />
            ) : (
              <span>{siglaDe(site.nome)}</span>
            )}
          </div>
          <h1>{site.nome}</h1>
          <p className="slogan">{site.slogan}</p>

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

          <Link className="btn btn-entrar" href={user ? (ehEquipe(perfil) ? "/admin" : "/perfil") : "/entrar"}>
            {user ? (ehEquipe(perfil) ? "Abrir a área do professor" : "Abrir a minha área") : "Entrar"}
          </Link>
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

      <DestaqueFotos />

      <section className="block" id="estudo">
        <h2>Estudo do Judô</h2>
        <p className="lead">Ferramentas para treinar em casa e se preparar para a prova.</p>
        <EstudoCards limite={4} />
      </section>

      <div className="duo alt">
      <section className="block" id="avisos">
        <h2>Avisos</h2>
        <p className="lead">O que você precisa saber antes do próximo treino.</p>
        <div className="stack">
          {av.carregando && <p className="empty">Carregando avisos…</p>}
          {!av.carregando && av.itens.length === 0 && <p className="empty">Nenhum aviso por enquanto.</p>}
          {av.itens.map((a) => (
            <article className="card" key={a.id}>
              <h3>{a.titulo}</h3>
              <time dateTime={a.data}>{dataLonga(parseData(a.data))}</time>
              <p className="pre">{a.texto}</p>
              <Midia imagem={a.imagem} video={a.video} alt={a.titulo} />
              {a.autor && <p className="form-help">Publicado por {a.autor}</p>}
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
        <p className="tool-actions">
          <Link href="/calendario" className="btn btn-primary">
            Abrir o calendário completo
          </Link>
        </p>
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
      </div>

      <section className="block alt" id="galeria">
        <h2>Galeria</h2>
        <p className="lead">Momentos dos treinos e eventos.</p>
        <GaleriaGrid porVez={9} />
        <p className="tool-actions">
          <Link href="/galeria" className="btn btn-primary">
            Ver a galeria completa
          </Link>
        </p>
      </section>

      <Parcerias />

      <div className="duo">
      <section className="block" id="sobre">
        <h2>Sobre nós</h2>
        <div className="prose">
          {site.sobre.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      </section>

      <section className="block" id="entrar">
        <div className="login-card">
          <h2>{user ? "Sua conta" : "Entrar"}</h2>
          {user ? (
            <>
              <p>Você está conectado como {perfil?.papel === "admin" ? "administrador" : perfil?.papel === "professor" ? "professor" : "aluno"}{perfil?.nome ? `: ${perfil.nome}` : ""}.</p>
              <Link href={ehEquipe(perfil) ? "/admin" : "/perfil"} className="btn">
                {ehEquipe(perfil) ? "Abrir a área do professor" : "Abrir a minha área"}
              </Link>
            </>
          ) : (
            <>
              <p>Materiais da sua faixa, treinos, simulados e avisos da turma. Alunos e professores entram pelo mesmo lugar.</p>
              <Link href="/entrar" className="btn">
                Entrar
              </Link>
            </>
          )}
        </div>
      </section>
      </div>

    </main>
  );
}
