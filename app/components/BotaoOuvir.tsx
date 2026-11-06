"use client";

import { useState } from "react";
import { falarJapones, temVozMasculina, type Voz } from "../lib/falar";

/** 🔊 Ouvir a pronúncia em japonês com voz feminina ou masculina (voz do próprio aparelho). */
export default function BotaoOuvir({ texto, kana, grande = false, familia }: { texto: string; kana?: string; grande?: boolean; familia?: string }) {
  const [aviso, setAviso] = useState("");
  const [comFamilia, setComFamilia] = useState(false);
  const ouvir = (v: Voz) => {
    const ok = falarJapones(texto, kana, v, comFamilia ? familia : undefined);
    if (!ok) setAviso("Seu aparelho não tem voz em japonês. No celular: Configurações > Idioma > Conversão de texto em voz > instale o japonês.");
    else if (v === "masculina" && !temVozMasculina()) setAviso("Seu aparelho só tem voz feminina em japonês; a masculina está simulada (mais grave).");
    else setAviso("");
  };
  return (
    <span className="ouvir">
      <span className="ouvir-botoes">
        <button type="button" className={"btn btn-ghost mini" + (grande ? " grande" : "")} onClick={() => ouvir("feminina")} aria-label={`Ouvir ${texto} com voz feminina`}>
          🔊 Voz feminina
        </button>
        <button type="button" className={"btn btn-ghost mini" + (grande ? " grande" : "")} onClick={() => ouvir("masculina")} aria-label={`Ouvir ${texto} com voz masculina`}>
          🔊 Voz masculina
        </button>
        {familia && (
          <label className="ouvir-familia">
            <input type="checkbox" checked={comFamilia} onChange={(e) => setComFamilia(e.target.checked)} /> ler também a família ({familia})
          </label>
        )}
      </span>
      {aviso && <small>{aviso}</small>}
    </span>
  );
}
