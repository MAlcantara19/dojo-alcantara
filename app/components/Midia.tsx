"use client";

import { descreverLink } from "../lib/links";
import Img from "./Img";
import VideoYoutube from "./VideoYoutube";

export function idYoutube(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|shorts\/))([\w-]{11})/);
  return m ? m[1] : null;
}

/** Imagem e vídeo de um aviso ou evento, vistos direto no site (vídeo do YouTube toca na própria página). */
export default function Midia({ imagem, video, alt }: { imagem?: string; video?: string; alt: string }) {
  const yt = video ? idYoutube(video) : null;
  const d = video ? descreverLink(video) : null;
  if (!imagem && !video) return null;
  return (
    <div className="midia">
      {imagem && <Img className="midia-img" src={imagem} alt={alt} largura={1000} />}
      {yt && (
        <VideoYoutube id={yt} titulo={`Vídeo: ${alt}`} />
      )}
      {video && !yt && d && (
        <a className="btn btn-ghost" href={video} target="_blank" rel="noopener noreferrer">
          {d.icone} Assistir ao vídeo ({d.rotulo})
        </a>
      )}
    </div>
  );
}
