"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ABAS_PERFIL } from "../lib/abasPerfil";
import { ehEquipe } from "../lib/auth";
import { corDaFaixa } from "../lib/faixas";
import { siglaDe, useSite } from "../lib/siteConfig";
import Abertura from "./Abertura";
import { ParceriasLado } from "./Parcerias";
import Rodape from "./Rodape";
import Sino from "./Sino";
import { useAuth } from "../lib/useAuth";

type Tema = "light" | "dark";

type ItemMenu = { href: string; rotulo: string; filhos?: ItemMenu[] };

const dojo: ItemMenu[] = [
  { href: "/", rotulo: "Início" },
  { href: "/#avisos", rotulo: "Avisos" },
  { href: "/calendario", rotulo: "Calendário" },
  { href: "/galeria", rotulo: "Galeria" },
  { href: "/parcerias", rotulo: "Parcerias e descontos" },
  { href: "/#sobre", rotulo: "Sobre nós" },
];
const estudo: ItemMenu = {
  href: "/estudo",
  rotulo: "Estudo do Judô",
  filhos: [
    { href: "/tecnicas", rotulo: "Técnicas" },
    { href: "/simulados", rotulo: "Simulados" },
    { href: "/roleta", rotulo: "Roleta" },
    { href: "/katas", rotulo: "Katas" },
    { href: "", rotulo: "Apostilas" },
  ],
};
const minhaArea: ItemMenu = { href: "/perfil", rotulo: "Minha área", filhos: ABAS_PERFIL.map(([id, r]) => ({ href: `/perfil#${id}`, rotulo: r })) };

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, perfil } = useAuth();
  const site = useSite();
  const equipe = ehEquipe(perfil);
  const pais: ItemMenu[] = user ? [estudo, minhaArea] : [estudo];
  const router = useRouter();
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
        <Link href="/" className="topbar-title" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>{site.nome}</Link>
        <div className="top-actions">
          <Sino />
          {user ? (
            <>
              <Link className="conta" href={equipe ? "/admin" : "/perfil"} title={`${perfil?.nome ?? ""} ${user.email ?? ""}`.trim()}>
                <span className="conta-avatar" style={perfil?.faixa ? { background: corDaFaixa(perfil.faixa), color: ["Branca", "Amarela"].includes(perfil.faixa) ? "#1a1030" : "#fff" } : undefined} aria-hidden="true">
                  {(perfil?.nome ?? "?").slice(0, 1).toUpperCase()}
                </span>
                <span className="conta-textos">
                  <strong>{(perfil?.nome ?? "Minha conta").split(" ")[0]}</strong>
                  <small>
                    {perfil?.papel === "admin" ? "Administrador" : perfil?.papel === "professor" ? "Professor" : "Aluno"}
                    {perfil?.faixa ? ` · faixa ${perfil.faixa.toLowerCase()}` : ""}
                  </small>
                </span>
              </Link>
              {user.email && !user.email.endsWith("@celular.dojoalcantara.app") && <span className="conta-email">{user.email}</span>}
            </>
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
          <Link href="/" className="drawer-marca" onClick={() => (setAberto(false), window.scrollTo({ top: 0, behavior: "smooth" }))} aria-label={`${site.nome}: ir para o topo do início`}>
            <span className="logo-mini" aria-hidden="true">
              {siglaDe(site.nome)}
            </span>
            <strong>{site.nome}</strong>
          </Link>
          <button ref={fecharBtn} className="icon-btn close-btn" aria-label="Fechar menu" onClick={() => setAberto(false)}>
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
            </svg>
          </button>
        </div>

        <div className="drawer-group">
          <p className="drawer-title">Dojô</p>
          {dojo.map((i) => (
            <Link key={i.rotulo} href={i.href} aria-current={i.href === pathname ? "page" : undefined} onClick={() => setAberto(false)}>
              {i.rotulo}
            </Link>
          ))}
        </div>

        {pais.map((pai) => {
          const ativo = pathname === pai.href || (pai.filhos ?? []).some((f) => f.href && f.href.split("#")[0] === pathname);
          return (
            <details className="drawer-pai" key={pai.rotulo} open={ativo || undefined}>
              <summary>
                {pai.rotulo}
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
                </svg>
              </summary>
              {pai.href !== "/perfil" && (
                <Link href={pai.href} aria-current={pai.href === pathname ? "page" : undefined} onClick={() => setAberto(false)}>
                  Visão geral
                </Link>
              )}
              {(pai.filhos ?? []).map((f) =>
                !f.href ? (
                  <span key={f.rotulo} className="drawer-soon">
                    {f.rotulo}
                    <small>em breve</small>
                  </span>
                ) : f.href.includes("#") ? (
                  <a
                    key={f.rotulo}
                    href={f.href}
                    onClick={(e) => {
                      e.preventDefault();
                      setAberto(false);
                      const [rota, hash] = f.href.split("#");
                      if (pathname === rota) window.location.hash = hash;
                      else router.push(f.href);
                    }}
                  >
                    {f.rotulo}
                  </a>
                ) : (
                  <Link key={f.rotulo} href={f.href} aria-current={f.href === pathname ? "page" : undefined} onClick={() => setAberto(false)}>
                    {f.rotulo}
                  </Link>
                ),
              )}
            </details>
          );
        })}

        <Link href={user ? (equipe ? "/admin" : "/perfil") : "/entrar"} className="drawer-cta" onClick={() => setAberto(false)}>
          {user ? (equipe ? "Área do professor" : "Área do aluno") : "Entrar"}
        </Link>
      </nav>

      {!pathname.startsWith("/admin") && pathname !== "/entrar" && <ParceriasLado />}
      <div className={"page page-anim" + (!pathname.startsWith("/admin") && pathname !== "/entrar" ? " com-lado" : "")} key={pathname}>
        {children}
        <Rodape />
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
