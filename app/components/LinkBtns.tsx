import { descreverLink, type LinkItem } from "../lib/links";
import { linkVideo } from "../lib/tecnicas";
import type { ConfigTecnica } from "../lib/conteudo";

/** Botões da técnica: PDF, vídeo principal e outros links, cada um com o ícone do tipo (YouTube, Drive…). */
export default function LinkBtns({ nome, cfg }: { nome: string; cfg?: ConfigTecnica }) {
  const itens: LinkItem[] = [];
  if (cfg?.pdf) itens.push({ titulo: "", url: cfg.pdf });
  if (cfg?.video) itens.push({ titulo: "", url: cfg.video });
  (cfg?.links ?? []).forEach((l) => itens.push(l));
  const sem = itens.length === 0;
  return (
    <div className="tlinks">
      {itens.map((l, i) => {
        const d = descreverLink(l.url);
        return (
          <a key={i} href={l.url} target="_blank" rel="noopener noreferrer">
            {d.icone} {l.titulo || d.rotulo}
          </a>
        );
      })}
      {sem && (
        <a href={linkVideo(nome)} target="_blank" rel="noopener noreferrer">
          ▶ Buscar vídeo
        </a>
      )}
    </div>
  );
}
