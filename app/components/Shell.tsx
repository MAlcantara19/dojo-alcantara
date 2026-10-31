"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { abaLigada, ABAS_ADMIN } from "../lib/abasAdmin";
import { ABAS_PERFIL } from "../lib/abasPerfil";
import { useAcessoTecnicas } from "../lib/acesso";
import { faixas } from "../lib/faixas";
import { useMenu } from "../lib/menuConfig";
import { ehEquipe } from "../lib/auth";
import { siglaDe, useSite } from "../lib/siteConfig";
import Abertura from "./Abertura";
import { ParceriasLado } from "./Parcerias";
import { useModoLeve } from "../lib/leve";
import Avatar from "./Avatar";
import BotaoModoLeve from "./BotaoModoLeve";
import BuscaGlobal from "./BuscaGlobal";
import InstalarApp from "./InstalarApp";
import PerguntaNotificacoes from "./PerguntaNotificacoes";
import Rodape from "./Rodape";
import Sino from "./Sino";
import Toasts from "./Toasts";
import { useAuth } from "../lib/useAuth";

type Tema = "light" | "dark";

type ItemMenu = { href: string; rotulo: string; filhos?: ItemMenu[] };

const minhaArea: ItemMenu = { href: "/perfil", rotulo: "Minha área", filhos: ABAS_PERFIL.map(([id, r]) => ({ href: `/perfil#${id}`, rotulo: r })) };

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, perfil } = useAuth();
  const site = useSite();
  const leve = useModoLeve();
  const equipe = ehEquipe(perfil);
  const { menu } = useMenu();
  const [secAberta, setSecAberta] = useState<Record<string, boolean>>({});
  const [faixasAbertas, setFaixasAbertas] = useState(false);
  const acessoMenu = useAcessoTecnicas();
  const faixasDoMenu = faixas.filter((f) => acessoMenu.todas || acessoMenu.liberadas.has(f.nome));
  // Link com “#” (abre a parte certa da página, mesmo se você já estiver nela)
  const irComHash = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    setAberto(false);
    const [rota, hash] = href.split("#");
    if (pathname === rota) {
      history.pushState(null, "", "#" + hash);
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    } else router.push(href);
  };
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
    r.dataset.transicao = leve.ativo ? "nenhuma" : site.efeitos.transicao;
    r.dataset.leve = leve.ativo ? "on" : "off";
  }, [site.efeitos.movimento, site.efeitos.kanji, site.efeitos.brilho, site.efeitos.tilt, site.efeitos.rolagem, site.efeitos.transicao, leve.ativo]);

  // Onda ao tocar em botões, cartões e categorias
  const ondinha = site.efeitos.ondinha && site.efeitos.movimento && !leve.ativo;
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
      <Toasts />
      <PerguntaNotificacoes />
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
          <BuscaGlobal />
          <Sino />
          {user ? (
            <>
              <Link className="conta" href={equipe ? "/admin" : "/perfil"} title={`${perfil?.nome ?? ""} ${user.email ?? ""}`.trim()}>
                <Avatar url={perfil?.foto} ajuste={perfil?.fotoAjuste} nome={perfil?.apelido || perfil?.nome || "?"} faixa={perfil?.faixa} dan={perfil?.dan} tamanho={38} />
                <span className="conta-textos">
                  <strong>{(perfil?.nome ?? "Minha conta").split(" ")[0]}</strong>
                  <small>
                    {perfil?.papel === "admin" ? "Administrador" : perfil?.papel === "professor" ? "Professor" : "Aluno"}
                    {perfil?.faixa ? ` · ${perfil.faixa === "Preta" && perfil.dan ? `${perfil.dan}º Dan` : `faixa ${perfil.faixa.toLowerCase()}`}` : ""}
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

        {menu
          .filter((sec) => sec.estado !== "oculto")
          .map((sec) => {
            const itens = sec.itens.filter((i) => i.estado !== "oculto");
            const linha = (i: (typeof itens)[number]) =>
              i.estado === "embreve" ? (
                <span key={i.id} className="drawer-soon">
                  {i.rotulo}
                  <small>em breve</small>
                </span>
              ) : /^https?:\/\//.test(i.href) ? (
                <a key={i.id} href={i.href} target="_blank" rel="noopener noreferrer" onClick={() => setAberto(false)}>
                  {i.rotulo} ↗
                </a>
              ) : (
                <Link key={i.id} href={i.href} aria-current={i.href === pathname ? "page" : undefined} onClick={() => setAberto(false)}>
                  {i.rotulo}
                </Link>
              );
            if (sec.tipo === "lista")
              return (
                <div className="drawer-group" key={sec.id}>
                  <p className="drawer-title">{sec.titulo}</p>
                  {itens.map(linha)}
                </div>
              );
            const ativo = pathname === sec.href || itens.some((f) => f.href === pathname);
            const abertaSec = secAberta[sec.id] ?? ativo;
            return (
              <div className={"drawer-pai" + (abertaSec ? " aberto" : "")} key={sec.id}>
                {/* Tocar no nome abre a visão geral E mostra as páginas; a setinha só abre e fecha */}
                <div className="drawer-pai-cabeca">
                  <Link href={sec.href} aria-current={sec.href === pathname ? "page" : undefined} onClick={() => setSecAberta((m) => ({ ...m, [sec.id]: true }))}>
                    {sec.titulo}
                  </Link>
                  <button type="button" className="drawer-seta" aria-expanded={abertaSec} aria-label={abertaSec ? `Fechar ${sec.titulo}` : `Abrir ${sec.titulo}`} onClick={() => setSecAberta((m) => ({ ...m, [sec.id]: !abertaSec }))}>
                    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
                    </svg>
                  </button>
                </div>
                {abertaSec && (
                  <div className="drawer-sub">
                    {itens.map((i) =>
                      i.id === "tecnicas" && i.estado === "visivel" ? (
                        <div key={i.id} className="drawer-com-netos">
                          <div className="drawer-pai-cabeca neto">
                            {linha(i)}
                            {faixasDoMenu.length > 0 && (
                              <button type="button" className="drawer-seta" aria-expanded={faixasAbertas} aria-label={faixasAbertas ? "Fechar as faixas" : "Ver as técnicas por faixa"} onClick={() => setFaixasAbertas((v) => !v)}>
                                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
                                </svg>
                              </button>
                            )}
                          </div>
                          {faixasAbertas && (
                            <div className="drawer-netos">
                              {faixasDoMenu.map((f) => (
                                <a key={f.nome} href={`/tecnicas#faixa-${f.nome.toLowerCase()}`} onClick={(e) => irComHash(e, `/tecnicas#faixa-${f.nome.toLowerCase()}`)}>
                                  <i className="dot" style={{ background: f.cor }} aria-hidden="true" /> Faixa {f.nome.toLowerCase()}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        linha(i)
                      ),
                    )}
                  </div>
                )}
              </div>
            );
          })}

        {user &&
          [
            ...(equipe ? [{ rotulo: "Área do professor", rota: "/admin", filhos: ABAS_ADMIN.filter(([id, , soAdmin]) => (perfil?.papel === "admin" || !soAdmin) && !site.abasOcultas.includes(id) && abaLigada(id, site.extras)).map(([id, r]) => ({ href: `/admin#${id}`, rotulo: r })) }] : []),
            { rotulo: equipe ? "Meu perfil" : "Minha área", rota: "/perfil", filhos: minhaArea.filhos ?? [] },
          ].map((g) => (
            <details key={g.rota} className="drawer-pai" open={pathname === g.rota || undefined}>
              <summary>
                {g.rotulo}
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
                </svg>
              </summary>
              <div className="drawer-sub">
                {g.filhos.map((f) => (
                  <a
                    key={f.href}
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
                ))}
              </div>
            </details>
          ))}

        <BotaoModoLeve />
        <InstalarApp />
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
