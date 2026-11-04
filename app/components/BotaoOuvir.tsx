"use client";

import { useState } from "react";
import { falarJapones } from "../lib/falar";

/** 🔊 Ouvir a pronúncia em japonês (voz do próprio aparelho). */
export default function BotaoOuvir({ texto, kana, grande = false }: { texto: string; kana?: string; grande?: boolean }) {
  const [aviso, setAviso] = useState("");
  return (
    <span className="ouvir">
      <button
        type="button"
        className={"btn btn-ghost mini" + (grande ? " grande" : "")}
        onClick={() => {
          const ok = falarJapones(texto, kana);
          setAviso(ok ? "" : "Seu aparelho não tem voz em japonês. No celular: Configurações > Idioma > Conversão de texto em voz > instale o japonês.");
        }}
        aria-label={`Ouvir a pronúncia de ${texto}`}
      >
        🔊 Ouvir
      </button>
      {aviso && <small>{aviso}</small>}
    </span>
  );
}
