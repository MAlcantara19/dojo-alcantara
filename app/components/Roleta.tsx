"use client";

import { useEffect, useRef, useState } from "react";
import { ampliada, basica, type Palavra } from "../lib/palavras";

const listas = { basica, ampliada };
type Chave = keyof typeof listas;

export default function Roleta() {
  const [chave, setChave] = useState<Chave>("basica");
  const [atual, setAtual] = useState<Palavra | null>(null);
  const [girando, setGirando] = useState(false);
  const [mostrar, setMostrar] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function sortear(): Palavra {
    const l = listas[chave];
    return l[Math.floor(Math.random() * l.length)];
  }

  function girar() {
    if (girando) return;
    setMostrar(false);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setAtual(sortear());
      return;
    }
    setGirando(true);
    let passo = 0;
    const total = 22;
    const tick = () => {
      setAtual(sortear());
      passo += 1;
      if (passo >= total) {
        setGirando(false);
        return;
      }
      timer.current = setTimeout(tick, 50 + passo * passo * 0.9);
    };
    tick();
  }

  function trocar(c: Chave) {
    if (girando) return;
    setChave(c);
    setAtual(null);
    setMostrar(false);
  }

  return (
    <div className="tool">
      <div className="tabs" role="tablist" aria-label="Escolha a roleta">
        <button role="tab" aria-selected={chave === "basica"} onClick={() => trocar("basica")}>
          Roleta das {basica.length}
        </button>
        <button role="tab" aria-selected={chave === "ampliada"} onClick={() => trocar("ampliada")}>
          Roleta ampliada ({ampliada.length})
        </button>
      </div>

      <div className={"reel" + (girando ? " spinning" : "")} aria-live="polite">
        <span key={`${atual?.termo ?? "vazio"}-${girando}`} className="reel-word">
          {atual ? atual.termo : "Toque em girar"}
        </span>
        {atual && !girando && mostrar && <span className="reel-meaning">{atual.significado}</span>}
      </div>

      <div className="tool-actions">
        <button className="btn btn-primary" onClick={girar} disabled={girando}>
          {girando ? "Girando…" : "Girar"}
        </button>
        <button className="btn btn-ghost" onClick={() => setMostrar(true)} disabled={!atual || girando || mostrar}>
          Ver significado
        </button>
      </div>
      <p className="form-help">Diga o que a palavra significa antes de tocar em “Ver significado”.</p>
    </div>
  );
}
