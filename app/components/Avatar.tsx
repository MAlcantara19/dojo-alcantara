"use client";

import { corComDan } from "../lib/faixas";
import { estiloFoto, type Ajuste } from "../lib/fotoAjuste";
import Img from "./Img";

/** Foto redonda com borda de 2px na cor da faixa (ou roxa, se não tiver faixa). Sem foto, mostra a inicial. */
export default function Avatar({ url, ajuste, nome, faixa, dan, tamanho = 44, className }: { url?: string; ajuste?: Partial<Ajuste>; nome: string; faixa?: string; dan?: number; tamanho?: number; className?: string }) {
  const cor = (faixa && corComDan(faixa, dan)) || "linear-gradient(160deg, var(--bright), var(--deep))";
  return (
    <span className={"avatar" + (className ? " " + className : "")} style={{ width: tamanho, height: tamanho, background: cor }} aria-hidden="true">
      <span className="avatar-in" style={{ fontSize: Math.max(12, tamanho * 0.42) }}>
        {url ? <Img src={url} alt="" largura={Math.max(160, tamanho * 3)} style={estiloFoto(ajuste)} /> : (nome || "?").slice(0, 1).toUpperCase()}
      </span>
    </span>
  );
}
