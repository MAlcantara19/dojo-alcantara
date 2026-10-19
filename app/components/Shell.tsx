"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ehEquipe } from "../lib/auth";
import { siglaDe, useSite } from "../lib/siteConfig";
import Abertura from "./Abertura";
import { useAuth } from "../lib/useAuth";

type Tema = "light" | "dark";

const gruposBase = [
  {
    titulo: "Dojô",
    itens: [
      { href: "/", rotulo: "Início" },
      { href: "/#avisos", rotulo: "Avisos" },
      { href: "/#calendario", rotulo: "Calendário" },
      { href: "/#galeria", rotulo: "Galeria" },
      { href: "/#sobre", rotulo: "Sobre nós" },
    ],
  },
  {
    titulo: "Estudo",
    itens: [
      { href: "/tecnicas", rotulo: "Técnicas" },
      { href: "/simulados", rotulo: "Simulados" },
      { href: "/roleta", rotulo: "Roleta" },
      { href: "/katas", rotulo: "Katas" },
      { href: "", rotulo: "Apostilas" },
    ],
  },
];

function gruposDe(logado: boolean, equipe: boolean) {
  const conta = !logado ? [{ href: "/entrar", rotulo: "Entrar" }] : equipe ? [{ href: "/admin", rotulo: "Área do professor" }] : [{ href: "/perfil", rotulo: "Área do aluno" }];
  return [...gruposBase, { titulo: logado ? "Minha conta" : "Acesso", itens: conta }];
}

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, perfil } = useAuth();
  const site = useSite();
  const equipe = ehEquipe(perfil);
  const grupos = gruposDe(Boolean(user), equipe);
  const [aberto, setAberto] = useState(false);
  const [desktop, setDesktop] = useState(false);
  const [mostrarTopo, setMostrarTopo] = useState(false);
  const menuBtn = useRef<HTMLButtonElement>(null);
  const fecharBtn = useRef<HTMLButtonElement>(null);

  // Menu fixo na tela larga, gaveta no celular
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1000px)");
    const atualizar = () => setDesktop(mq.matches);
    atualizar();
    mq.addEventListener("change", atualizar);
    return () => mq.removeEventListener("change", atualizar);
  }, []);

  // Botão de voltar ao topo
  useEffect(() => {
    const onScroll = () => setMostrarTopo(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Tema salvo
  useEffect(() => {
    try {
      const salvo = localStorage.getItem("tema");
      if (salvo === "light" || salvo === "dark") document.documentElement.setAttribute("data-theme", salvo);
    } catch {}
  }, []);

  // Efeitos ligados/desligados no painel
  useEffect(() => {
    const r = document.documentElement;
    r.dataset.movimento = site.efeitos.movimento ? "on" : "off";
    r.dataset.kanji = site.efeitos.kanji ? "on" : "off";
    r.dataset.brilho = site.efeitos.brilho ? "on" : "off";
    r.dataset.tilt = site.efeitos.tilt ? "on" : "off";
    r.dataset.rolagem = site.efeitos.rolagem ? "on" : "off";
    r.dataset.transicao = site.efeitos.transicao;
  }, [site.efeitos.movimento, site.efeitos.kanji, site.efeitos.brilho, site.efeitos.tilt, site.efeitos.rolagem, site.efeitos.transicao]);

  // Onda ao tocar em botões, cartões e categorias
  const ondinha = site.efeitos.ondinha && site.efeitos.movimento;
  useEffect(() => {
    if (!ondinha || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const alvos = ".btn, .tilt, .pill, .tabs button, .option, .resumo-card, .study-card, .shortcuts a, .drawer a, .jump a, .tlinks a";
    const h = (e: PointerEvent) => {
      if (!(e.target instanceof Element) || !e.target.closest(alvos)) return;
      const onda = document.createElement("span");
      onda.className = "ondinha";
      onda.style.left = `${e.clientX}px`;
      onda.style.top = `${e.clientY}px`;
      document.body.appendChild(onda);
      setTimeout(() => onda.remove(), 650);
    };
    document.addEventListener("pointerdown", h, { passive: true });
    return () => document.removeEventListener("pointerdown", h);
  }, [ondinha]);

  // Esc fecha a gaveta
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && aberto) {
        setAberto(false);
        menuBtn.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [aberto]);

  function alternarTema() {
    const root = document.documentElement;
    const atual: Tema =
      (root.getAttribute("data-theme") as Tema | null) ??
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const novo: Tema = atual === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", novo);
    try {
      localStorage.setItem("tema", novo);
    } catch {}
  }

  function abrir() {
    setAberto(true);
    setTimeout(() => fecharBtn.current?.focus(), 50);
  }

  const gavetaVisivel = desktop || aberto;

  return (
    <>
      <Abertura />
      <a className="skip" href="#conteudo">
        Ir para o conteúdo
      </a>

      <header className="topbar">
        <button
          ref={menuBtn}
          className="icon-btn menu-btn"
          aria-label="Abrir menu"
          aria-expanded={aberto}
          aria-controls="drawer"
          onClick={abrir}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
          </svg>
        </button>
        <span className="topbar-title">{site.nome}</span>
        <div className="top-actions">
          {user ? (
            <Link className="pill pill-conta" href={equipe ? "/admin" : "/perfil"} title={`${perfil?.nome ?? ""} ${user.email && !user.email.endsWith("@celular.dojoalcantara.app") ? user.email : ""}`.trim()}>
              <span className="pill-nome">{(perfil?.nome ?? "Minha conta").split(" ")[0]}</span>
              {user.email && !user.email.endsWith("@celular.dojoalcantara.app") && <small className="pill-email">{user.email}</small>}
              <small className="pill-papel">{perfil?.papel === "admin" ? "Administrador" : perfil?.papel === "professor" ? "Professor" : "Aluno"} · {equipe ? "Área do professor" : "Área do aluno"}</small>
            </Link>
          ) : (
            <Link className="pill pill-entrar" href="/entrar">
              Entrar
            </Link>
          )}
          <button className="icon-btn" aria-label="Alternar tema claro e escuro" onClick={alternarTema}>
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" fill="currentColor" />
            </svg>
          </button>
        </div>
      </header>

      {aberto && !desktop && <div className="scrim" onClick={() => setAberto(false)} />}

      <nav
        id="drawer"
        className={"drawer" + (aberto ? " open" : "")}
        aria-label="Menu principal"
        aria-hidden={!gavetaVisivel}
      >
        <div className="drawer-head">
          <span className="logo-mini" aria-hidden="true">
            {siglaDe(site.nome)}
          </span>
          <strong>{site.nome}</strong>
          <button ref={fecharBtn} className="icon-btn close-btn" aria-label="Fechar menu" onClick={() => setAberto(false)}>
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
            </svg>
          </button>
        </div>

        {grupos.map((g) => (
          <div className="drawer-group" key={g.titulo}>
            <p className="drawer-title">{g.titulo}</p>
            {g.itens.map((i) =>
              i.href ? (
                <Link
                  key={i.rotulo}
                  href={i.href}
                  aria-current={i.href === pathname ? "page" : undefined}
                  onClick={() => setAberto(false)}
                >
                  {i.rotulo}
                </Link>
              ) : (
                <span key={i.rotulo} className="drawer-soon">
                  {i.rotulo}
                  <small>em breve</small>
                </span>
              ),
            )}
          </div>
        ))}

        <Link href={user ? (equipe ? "/admin" : "/perfil") : "/entrar"} className="drawer-cta" onClick={() => setAberto(false)}>
          {user ? (equipe ? "Área do professor" : "Área do aluno") : "Entrar"}
        </Link>
      </nav>

      <div className="page page-anim" key={pathname}>
        {children}
      </div>

      <button
        className="to-top"
        aria-label="Voltar ao topo"
        hidden={!mostrarTopo}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      </button>
    </>
  );
}
