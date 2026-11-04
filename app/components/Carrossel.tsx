"use client";

import { useRef, useState } from "react";
import { descreverLink } from "../lib/links";
import Img from "./Img";
import ZoomImagem from "./ZoomImagem";
import VideoYoutube from "./VideoYoutube";
import { idYoutube } from "./Midia";

export type ItemMidia = { src: string; alt: string };
const ehVideo = (s: string) => Boolean(idYoutube(s)) || /\.(mp4|webm)(\?|$)/i.test(s) || /drive\.google\.com\/file/.test(s) && /video/i.test(s);

/** Imagens e vídeos lado a lado: arraste para o lado ou use as setas. Se for um só, mostra sem setas. */
export default function Carrossel({ itens }: { itens: ItemMidia[] }) {
  const trilho = useRef<HTMLDivElement>(null);
  const [atual, setAtual] = useState(0);
  const [zoom, setZoom] = useState<number | null>(null);
  const soFotos = itens.filter((it) => !idYoutube(it.src) && !ehVideo(it.src));
  if (!itens.length) return null;

  const ir = (i: number) => {
    const t = trilho.current;
    if (!t) return;
    const alvo = Math.max(0, Math.min(itens.length - 1, i));
    t.scrollTo({ left: alvo * t.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="carrossel">
      <div className="carrossel-trilho" ref={trilho} onScroll={(e) => setAtual(Math.round(e.currentTarget.scrollLeft / Math.max(1, e.currentTarget.clientWidth)))}>
        {itens.map((it, i) => {
          const yt = idYoutube(it.src);
          return (
            <div className="carrossel-item" key={i} aria-label={`${i + 1} de ${itens.length}`}>
              {yt ? (
                <VideoYoutube id={yt} titulo={it.alt} />
              ) : ehVideo(it.src) ? (
                <a className="carrossel-link" href={it.src} target="_blank" rel="noopener noreferrer">
                  {descreverLink(it.src).icone} Assistir ao vídeo
                </a>
              ) : (
                <button type="button" className="carrossel-abrir" onClick={() => setZoom(Math.max(0, soFotos.indexOf(it)))} aria-label={`Abrir ${it.alt} em tela cheia`}>
                  <Img className="carrossel-img" src={it.src} alt={it.alt} largura={1200} eager={i === 0} />
                  <span className="carrossel-lupa" aria-hidden="true">
                    🔍
                  </span>
                </button>
              )}
            </div>
          );
        })}
      </div>
      {zoom !== null && <ZoomImagem fotos={soFotos} inicio={zoom} onFechar={() => setZoom(null)} />}
      {itens.length > 1 && (
        <>
          <button type="button" className="carrossel-seta esq" onClick={() => ir(atual - 1)} disabled={atual === 0} aria-label="Anterior">
            ‹
          </button>
          <button type="button" className="carrossel-seta dir" onClick={() => ir(atual + 1)} disabled={atual === itens.length - 1} aria-label="Próximo">
            ›
          </button>
          <div className="carrossel-pontos" aria-hidden="true">
            {itens.map((_, i) => (
              <button key={i} type="button" tabIndex={-1} className={i === atual ? "ativo" : ""} onClick={() => ir(i)} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
