"use client";

import { useSyncExternalStore } from "react";
import { siglaDe, useSite } from "../lib/siteConfig";
import { estiloFoto } from "../lib/fotoAjuste";
import { modoLeveAtivo } from "../lib/leve";
import Img from "./Img";

const CHAVE = "dojoAbertura";
const ouvintes = new Set<() => void>();
const assinar = (cb: () => void) => {
  ouvintes.add(cb);
  return () => void ouvintes.delete(cb);
};
const visto = () => {
  try {
    return sessionStorage.getItem(CHAVE) ?? "";
  } catch {
    return "1";
  }
};

/** Tela de abertura: logo e nome aparecem por um instante, uma vez por visita. */
export default function Abertura() {
  const site = useSite();
  const jaVisto = useSyncExternalStore(assinar, visto, () => "1");
  if (!site.efeitos.intro || !site.efeitos.movimento || jaVisto || modoLeveAtivo()) return null;

  function fim() {
    try {
      sessionStorage.setItem(CHAVE, "1");
    } catch {}
    ouvintes.forEach((f) => f());
  }

  return (
    <div className="abertura" aria-hidden="true" onAnimationEnd={fim}>
      <div className="abertura-conteudo">
        <div className="logo" style={{ width: 120, height: 120 }}>
          {site.logoUrl ? <Img src={site.logoUrl} alt="" largura={300} eager style={estiloFoto(site.logoAjuste)} /> : <span>{siglaDe(site.nome)}</span>}
        </div>
        <strong>{site.nome}</strong>
        <span className="abertura-faixas">
          {["#f4f1ff", "#2b6cd8", "#f2d23c", "#f08a24", "#2f9e5b", "#8a4bd6", "#7a4a2a", "#111111"].map((c) => (
            <i key={c} style={{ background: c }} />
          ))}
        </span>
      </div>
    </div>
  );
}
