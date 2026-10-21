"use client";

import Link from "next/link";
import { useMenu } from "../lib/menuConfig";

const TEXTOS: Record<string, string> = {
  "/tecnicas": "As técnicas do Kodokan, por grupo, família e faixa, com imagem, ficha, PDF e vídeo.",
  "/katas": "As formas de cada graduação, com as técnicas de cada série e vídeos.",
  "/simulados": "Perguntas para treinar para a prova, com explicação de cada resposta.",
  "/roleta": "Palavras, técnicas e exercícios para treinar de um jeito divertido.",
  "/materiais": "Apostilas, regras, programa de faixas, vídeos e links para estudar.",
};

/** Cartões do Estudo do Judô, seguindo o menu lateral (escondido some; “em breve” aparece apagado). */
export default function EstudoCards({ limite }: { limite?: number }) {
  const { menu } = useMenu();
  const secao = menu.find((s) => s.id === "estudo");
  const itens = (secao?.itens ?? []).filter((i) => i.estado !== "oculto").slice(0, limite);
  return (
    <div className={limite ? "study" : "study full"}>
      {itens.map((i) =>
        i.estado === "embreve" ? (
          <div key={i.id} className="study-card em-breve" aria-disabled="true">
            <h3>
              {i.rotulo} <small className="selo-breve">em breve</small>
            </h3>
            <p>{TEXTOS[i.href] ?? "Em preparação."}</p>
          </div>
        ) : /^https?:\/\//.test(i.href) ? (
          <a key={i.id} href={i.href} className="study-card" target="_blank" rel="noopener noreferrer">
            <h3>{i.rotulo} ↗</h3>
            <p>{TEXTOS[i.href] ?? "Abre em outra aba."}</p>
          </a>
        ) : (
          <Link key={i.id} href={i.href} className="study-card">
            <h3>{i.rotulo}</h3>
            <p>{TEXTOS[i.href] ?? ""}</p>
          </Link>
        ),
      )}
    </div>
  );
}

/** Para páginas que podem estar “em breve” no menu. */
export function EmBreve({ href, children }: { href: string; children: React.ReactNode }) {
  const { menu, carregando } = useMenu();
  if (carregando) return <p className="form-help">Carregando…</p>;
  const item = menu.flatMap((s) => s.itens).find((i) => i.href === href);
  if (item && item.estado !== "visivel") return <p className="empty em-breve-pagina">🚧 Em breve. Estamos preparando esta parte.</p>;
  return <>{children}</>;
}
