"use client";

import { descreverLink } from "../lib/links";
import Img from "./Img";
import { useFichas } from "../lib/fichas";
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
              <Img src={im.url} alt={im.legenda || `${k.nome}, imagem ${i + 1}`} largura={600} />
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
  const fichas = useFichas();
  // Fichas do Drive (imagem ou PDF com o nome do kata) entram junto com o que foi cadastrado no painel.
  const katas = montarKatas(dados).map((k) => {
    const f = fichas.mapa["kata:" + k.id];
    if (!f) return k;
    return { ...k, imagens: [...k.imagens, ...(f.imagem ? [{ legenda: "Ficha", url: f.imagem }] : [])], videos: [...k.videos, ...(f.pdf ? [{ titulo: "Ficha em PDF", url: f.pdf }] : [])] };
  });

  return (
    <>
      <div className="stack full">
        {katas.map((k) => {
          const series = k.series;
          return (
            <article className="card" key={k.id}>
              <h3>{k.nome}</h3>
              <p className="tmeta">{k.dan}</p>
              <p>{k.resumo}</p>
              <Midia k={k} />
              {series.length > 0 && (
                <details className="series">
                  <summary>Ver as técnicas, série por série</summary>
                  {series.map((s) => (
                    <div key={s.titulo} className="serie">
                      <h4>{s.titulo}</h4>
                      <ol>
                        {s.tecnicas.map((t, i) => (
                          <li key={i}>
                            <strong>{t.nome}</strong>
                            {t.desc && <small> · {t.desc}</small>}
                          </li>
                        ))}
                      </ol>
                    </div>
                  ))}
                </details>
              )}
            </article>
          );
        })}
      </div>
    </>
  );
}
