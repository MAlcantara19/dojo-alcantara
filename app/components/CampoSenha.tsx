"use client";

import { useState } from "react";

/** Campo de senha com olhinho para ver o que digitou e aviso de Caps Lock ligado. */
export default function CampoSenha({ id, name, rotulo, autoComplete = "current-password", placeholder }: { id: string; name: string; rotulo: string; autoComplete?: string; placeholder?: string }) {
  const [ver, setVer] = useState(false);
  const [caps, setCaps] = useState(false);
  const checar = (e: React.KeyboardEvent<HTMLInputElement>) => setCaps(e.getModifierState("CapsLock"));

  return (
    <div className="field">
      <label htmlFor={id}>{rotulo}</label>
      <div className="senha-wrap">
        <input id={id} name={name} type={ver ? "text" : "password"} autoComplete={autoComplete} autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder={placeholder} onKeyDown={checar} onKeyUp={checar} onBlur={() => setCaps(false)} />
        <button type="button" className="olho" aria-label={ver ? "Ocultar a senha" : "Mostrar a senha"} aria-pressed={ver} onClick={() => setVer((v) => !v)}>
          {ver ? (
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <path d="M3 3l18 18M10.6 6.1A10.7 10.7 0 0 1 12 6c5 0 8.6 4 9.7 6-.5 1-1.6 2.5-3.2 3.8M6.5 7.6C4.4 9 3 11 2.3 12c1 2 4.7 6 9.7 6 1.3 0 2.5-.3 3.6-.7M9.9 10a3 3 0 0 0 4.1 4.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <path d="M2.3 12C3.4 10 7 6 12 6s8.6 4 9.7 6c-1.1 2-4.7 6-9.7 6S3.4 14 2.3 12Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" fill="none" />
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" fill="none" />
            </svg>
          )}
        </button>
      </div>
      {caps && (
        <p className="aviso-caps" role="status">
          ⚠ O Caps Lock está ligado: as letras estão saindo em maiúsculo.
        </p>
      )}
    </div>
  );
}
