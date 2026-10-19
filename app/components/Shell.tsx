"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ehEquipe } from "../lib/auth";
import { siglaDe, useSite } from "../lib/siteConfig";
import { useAuth } from "../lib/useAuth";

type Tema = "light" | "dark";

const grupos = [
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
  {
    titulo: "Área do aluno",
    itens: [{ href: "/perfil", rotulo: "Meu perfil · Entrar" }],
  },
  {
    titulo: "Atalhos",
    itens: [{ href: "/admin", rotulo: "Painel do professor" }],
  },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, perfil } = useAuth();
  const site = useSite();
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
  }, [site.efeitos.movimento, site.efeitos.kanji, site.efeitos.brilho]);

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
            ehEquipe(perfil) ? (
              <Link className="pill" href="/admin">
                Painel
              </Link>
            ) : (
              <Link className="pill" href="/perfil">
                Meu perfil
              </Link>
            )
          ) : (
            <>
              <Link className="pill" href="/perfil">
                Aluno
              </Link>
              <Link className="pill" href="/admin">
                Professor
              </Link>
            </>
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

        <Link href="/perfil" className="drawer-cta" onClick={() => setAberto(false)}>
          Meu perfil
        </Link>
      </nav>

      <div className="page">{children}</div>

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
