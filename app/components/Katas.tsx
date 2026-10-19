"use client";

import { descreverLink, imagemDireta } from "../lib/links";
import { nageNoKata } from "../lib/katas";
import { enderecoOk, lerKatasDb, montarKatas, type KataDoc } from "../lib/katasDb";
import { useCarga } from "../lib/useCarga";

const VAZIO: Record<string, never> = {};

function Midia({ k }: { k: KataDoc }) {
  const videos = k.videos.filter((v) => enderecoOk(v.url));
  const imagens = k.imagens.filter((i) => enderecoOk(i.url));
  if (!videos.length && !imagens.length) return null;
  return (
    <>
      {videos.length > 0 && (
        <div className="tlinks vids">
          {videos.map((v, i) => (
            <a key={i} href={v.url} target="_blank" rel="noopener noreferrer">
              {descreverLink(v.url).icone} {v.titulo || `${descreverLink(v.url).rotulo} ${i + 1}`}
            </a>
          ))}
        </div>
      )}
      {imagens.length > 0 && (
        <div className="kata-imgs">
          {imagens.map((im, i) => (
            <a key={i} href={im.url} target="_blank" rel="noopener noreferrer" title="Abrir a imagem inteira">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagemDireta(im.url, 600)} referrerPolicy="no-referrer" alt={im.legenda || `${k.nome}, imagem ${i + 1}`} loading="lazy" />
              {im.legenda && <small>{im.legenda}</small>}
            </a>
          ))}
        </div>
      )}
    </>
  );
}

export default function Katas() {
  const { dados } = useCarga(lerKatasDb, VAZIO as Record<string, never>);
  const katas = montarKatas(dados);
  const nage = katas.find((k) => k.nome === "Nage-no-kata");

  return (
    <>
      <div className="stack full">
        {katas.map((k) => (
          <article className="card" key={k.id}>
            <h3>{k.nome}</h3>
            <p className="tmeta">{k.dan}</p>
            <p>{k.resumo}</p>
            <Midia k={k} />
          </article>
        ))}
      </div>

      <h2 className="kata-title">Nage-no-kata, série por série</h2>
      <div className="stack full">
        {nage && (nage.videos.length > 0 || nage.imagens.length > 0) && (
          <article className="card">
            <h3>Vídeos e imagens do Nage-no-kata</h3>
            <Midia k={nage} />
          </article>
        )}
        {nageNoKata.map((s) => (
          <article className="card" key={s.serie}>
            <h3>{s.serie}</h3>
            <p>{s.tecnicas.join(" · ")}</p>
          </article>
        ))}
      </div>
    </>
  );
}
