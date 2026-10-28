"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ABAS_ADMIN } from "../lib/abasAdmin";
import { ABAS_PERFIL } from "../lib/abasPerfil";
import { podeVer, useAcessoTecnicas } from "../lib/acesso";
import { lerTurmas, listarAlunos, type Turma } from "../lib/alunos";
import type { Aluno } from "../lib/aluno";
import { ehEquipe } from "../lib/auth";
import { useAvisos, useEventos, useTecnicas } from "../lib/conteudo";
import { lerPalavras, lerSimulados, simuladosOuPadrao, type PalavraDoc, type SimuladoDoc } from "../lib/estudoDb";
import { lerKatasDb, montarKatas } from "../lib/katasDb";
import { lerMateriais, type Material } from "../lib/materiaisDb";
import { MENU_PADRAO } from "../lib/menuConfig";
import { faixaEfetiva } from "../lib/tecnicas";
import { useAuth } from "../lib/useAuth";
import { useCarga } from "../lib/useCarga";

type Resultado = { id: string; grupo: string; titulo: string; detalhe?: string; ir: () => void };
const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const VAZIO_P: PalavraDoc[] = [];
const VAZIO_S: SimuladoDoc[] = [];
const VAZIO_M: Material[] = [];
const VAZIO_A: Aluno[] = [];
const VAZIO_T: Turma[] = [];

/** Lupa no topo: procura em tudo o que a pessoa pode ver (Ctrl+K ou “/” também abrem). */
export default function BuscaGlobal() {
  const [aberta, setAberta] = useState(false);

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      const digitando = e.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
      if ((e.key === "k" && (e.ctrlKey || e.metaKey)) || (e.key === "/" && !digitando)) {
        e.preventDefault();
        setAberta(true);
      }
    };
    document.addEventListener("keydown", tecla);
    return () => document.removeEventListener("keydown", tecla);
  }, []);

  return (
    <>
      <button type="button" className="icon-btn" aria-label="Buscar no site" onClick={() => setAberta(true)}>
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.9" fill="none" />
          <path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
        </svg>
      </button>
      {aberta && <Painel onFechar={() => setAberta(false)} />}
    </>
  );
}

function Painel({ onFechar }: { onFechar: () => void }) {
  const router = useRouter();
  const { user, perfil } = useAuth();
  const equipe = ehEquipe(perfil);
  const [termo, setTermo] = useState("");
  const campo = useRef<HTMLInputElement>(null);
  const { lista, mapa } = useTecnicas();
  const acesso = useAcessoTecnicas();
  const palavras = useCarga(lerPalavras, VAZIO_P);
  const simulados = useCarga(lerSimulados, VAZIO_S);
  const katas = useCarga(lerKatasDb, {});
  const materiais = useCarga(lerMateriais, VAZIO_M);
  const avisos = useAvisos();
  const eventos = useEventos();
  const alunos = useCarga(() => listarAlunos(null), VAZIO_A, equipe);
  const turmas = useCarga(lerTurmas, VAZIO_T, equipe);

  useEffect(() => {
    campo.current?.focus();
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onFechar();
    document.addEventListener("keydown", esc);
    return () => {
      document.body.style.overflow = antes;
      document.removeEventListener("keydown", esc);
    };
  }, [onFechar]);

  const ir = (href: string) => () => {
    onFechar();
    router.push(href);
  };

  const todos = useMemo<Resultado[]>(() => {
    const r: Resultado[] = [];
    // Páginas do site
    MENU_PADRAO.flatMap((s) => s.itens).forEach((i) => r.push({ id: "pg" + i.id, grupo: "Páginas", titulo: i.rotulo, ir: ir(i.href) }));
    r.push({ id: "pg-estudo", grupo: "Páginas", titulo: "Estudo do Judô", ir: ir("/estudo") });
    if (user) ABAS_PERFIL.forEach(([id, rot]) => r.push({ id: "pf" + id, grupo: "Minha área", titulo: rot, ir: ir(`/perfil#${id}`) }));
    if (equipe) ABAS_ADMIN.filter(([, , soAdmin]) => perfil?.papel === "admin" || !soAdmin).forEach(([id, rot]) => r.push({ id: "ad" + id, grupo: "Painel", titulo: rot, detalhe: "Área do professor", ir: ir(`/admin#${id}`) }));
    // Técnicas (só as liberadas)
    lista
      .filter((t) => podeVer(acesso, faixaEfetiva(t, mapa[t.id]).faixa))
      .forEach((t) => {
        const fx = faixaEfetiva(t, mapa[t.id]).faixa;
        r.push({ id: "t" + t.id, grupo: "Técnicas", titulo: t.nome, detalhe: [t.familia ?? "Nage-waza", fx && `faixa ${fx.toLowerCase()}`].filter(Boolean).join(" · "), ir: ir(`/tecnicas#tec-${t.id}`) });
      });
    // Palavras (mostra o significado direto)
    palavras.dados.forEach((p) => r.push({ id: "w" + p.id, grupo: "Palavras", titulo: p.termo, detalhe: p.significado, ir: ir("/roleta") }));
    // Katas, simulados, materiais
    montarKatas(katas.dados).forEach((k) => r.push({ id: "k" + k.id, grupo: "Katas", titulo: k.nome, detalhe: k.dan, ir: ir("/katas") }));
    simuladosOuPadrao(simulados.dados).forEach((s) => r.push({ id: "s" + s.id, grupo: "Simulados", titulo: s.titulo, detalhe: `${s.perguntas.length} perguntas`, ir: ir("/simulados") }));
    materiais.dados.forEach((m) =>
      r.push({
        id: "m" + m.id,
        grupo: "Materiais",
        titulo: m.titulo,
        detalhe: [m.tipo, m.categoria].join(" · "),
        ir: () => {
          onFechar();
          window.open(m.url, "_blank", "noopener");
        },
      }),
    );
    // Avisos e eventos
    if (!avisos.erro) avisos.itens.forEach((a) => r.push({ id: "av" + a.id, grupo: "Avisos", titulo: a.titulo, detalhe: a.texto.slice(0, 80), ir: ir("/#avisos") }));
    if (!eventos.erro) eventos.itens.forEach((e) => r.push({ id: "ev" + e.id, grupo: "Calendário", titulo: e.titulo, detalhe: [e.data.split("-").reverse().join("/"), e.local].join(" · "), ir: ir("/calendario") }));
    // Equipe: alunos e turmas
    alunos.dados.forEach((a) =>
      r.push({
        id: "al" + a.uid,
        grupo: "Alunos",
        titulo: a.apelido ? `${a.apelido} · ${a.nome}` : a.nome,
        detalhe: [a.faixa && `faixa ${a.faixa.toLowerCase()}`, a.academia || "sem turma"].filter(Boolean).join(" · "),
        ir: () => {
          try {
            sessionStorage.setItem("dojo-busca-aluno", a.nome);
          } catch {}
          ir("/admin#alunos")();
        },
      }),
    );
    turmas.dados.forEach((t) => r.push({ id: "tu" + t.id, grupo: "Turmas", titulo: t.apelido || t.nome, detalhe: t.localNome, ir: ir("/admin#turmas") }));
    return r;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lista, mapa, acesso, palavras.dados, simulados.dados, katas.dados, materiais.dados, avisos.itens, eventos.itens, alunos.dados, turmas.dados, user, equipe, perfil?.papel]);

  const partes = norm(termo).split(/\s+/).filter(Boolean);
  const achados = partes.length ? todos.filter((x) => partes.every((p) => norm(x.titulo + " " + (x.detalhe ?? "")).includes(p))) : [];
  const grupos = Array.from(new Set(achados.map((x) => x.grupo)));
  const sugestoes = ["Técnicas", "Calendário", "Simulados", "Roleta", ...(user ? ["Checklist da faixa"] : []), ...(equipe ? ["Chamada"] : [])];

  return (
    <div className="busca-fundo" onClick={onFechar}>
      <div className="busca" role="dialog" aria-modal="true" aria-label="Buscar no site" onClick={(e) => e.stopPropagation()}>
        <div className="busca-campo">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.9" fill="none" />
            <path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
          </svg>
          <input
            ref={campo}
            type="search"
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            placeholder={equipe ? "Técnica, palavra, aluno, turma, aviso…" : "Técnica, palavra, kata, aviso…"}
            aria-label="O que você procura?"
            onKeyDown={(e) => e.key === "Enter" && achados[0]?.ir()}
          />
          <button type="button" className="link-btn" onClick={onFechar}>
            Fechar
          </button>
        </div>
        <div className="busca-lista">
          {!partes.length && (
            <div className="busca-dicas">
              <p className="form-help">Digite parte do nome. Sem acento também funciona (ex.: “seoi”, “calendario”, “hajime”).</p>
              <div className="tlinks">
                {sugestoes.map((s) => (
                  <button key={s} type="button" className="btn btn-ghost mini" onClick={() => setTermo(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {partes.length > 0 && achados.length === 0 && <p className="empty">Nada encontrado para “{termo}”.</p>}
          {grupos.map((g) => (
            <section key={g}>
              <h3>{g}</h3>
              <ul>
                {achados
                  .filter((x) => x.grupo === g)
                  .slice(0, 6)
                  .map((x) => (
                    <li key={x.id}>
                      <button type="button" onClick={x.ir}>
                        <strong>{x.titulo}</strong>
                        {x.detalhe && <small>{x.detalhe}</small>}
                      </button>
                    </li>
                  ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
