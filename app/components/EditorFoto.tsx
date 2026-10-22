"use client";

import { useState } from "react";
import { estiloFoto, lerAjuste, type Ajuste } from "../lib/fotoAjuste";
import Avatar from "./Avatar";
import CampoImagem from "./CampoImagem";
import Img from "./Img";

/**
 * Escolher a foto e ajustar zoom e enquadramento, vendo como fica.
 * Envia dois campos no formulário: `name` (a foto) e `name + "Ajuste"` (o enquadramento, em JSON).
 */
export default function EditorFoto({ name, rotulo, valorInicial = "", ajusteInicial, formato, faixa, nome = "", semZoom = false }: { name: string; rotulo: string; valorInicial?: string; ajusteInicial?: Partial<Ajuste>; formato: "redondo" | "banner"; faixa?: string; nome?: string; semZoom?: boolean }) {
  const [url, setUrl] = useState(valorInicial);
  const [aj, setAj] = useState<Ajuste>(lerAjuste(ajusteInicial));
  const mudar = (k: keyof Ajuste, v: number) => setAj((a) => ({ ...a, [k]: v }));

  return (
    <div className="editor-foto">
      <CampoImagem name={name} rotulo={rotulo} valorInicial={valorInicial} onMudar={setUrl} />
      <input type="hidden" name={name + "Ajuste"} value={JSON.stringify(aj)} />
      {url && (
        <div className={"editor-foto-area " + formato}>
          <div className="editor-previa">
            {formato === "redondo" ? (
              <Avatar url={url} ajuste={aj} nome={nome} faixa={faixa} tamanho={120} />
            ) : (
              <div className="banner-previa">
                <Img src={url} alt="" largura={1200} style={estiloFoto(semZoom ? { ...aj, z: 1 } : aj)} />
              </div>
            )}
          </div>
          <div className="editor-controles">
            {!semZoom && (
              <label>
                Zoom
                <input type="range" min={1} max={3} step={0.05} value={aj.z} onChange={(e) => mudar("z", Number(e.target.value))} />
              </label>
            )}
            <label>
              Esquerda ↔ direita
              <input type="range" min={0} max={100} step={1} value={aj.x} onChange={(e) => mudar("x", Number(e.target.value))} />
            </label>
            <label>
              Cima ↕ baixo
              <input type="range" min={0} max={100} step={1} value={aj.y} onChange={(e) => mudar("y", Number(e.target.value))} />
            </label>
            <button type="button" className="link-btn" onClick={() => setAj({ z: 1, x: 50, y: 50 })}>
              Centralizar de novo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
