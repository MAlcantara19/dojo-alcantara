"use client";

import { useState } from "react";

/**
 * Vídeo do YouTube “leve”: mostra só a capa (poucos KB). O player (pesado) só carrega quando a pessoa toca.
 * Economiza muito dado em internet fraca e deixa a página abrir mais rápido.
 */
export default function VideoYoutube({ id, titulo }: { id: string; titulo: string }) {
  const [tocar, setTocar] = useState(false);
  return (
    <div className="midia-video">
      {tocar ? (
        <iframe src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1`} title={titulo} allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
      ) : (
        <button type="button" className="video-capa" onClick={() => setTocar(true)} aria-label={`Assistir: ${titulo}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" decoding="async" />
          <span className="video-play" aria-hidden="true">
            ▶
          </span>
        </button>
      )}
    </div>
  );
}
