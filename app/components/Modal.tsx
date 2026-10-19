"use client";

import { useEffect, useRef } from "react";

/** Janela por cima da página (para ver a foto grande ou os detalhes da técnica). */
export default function Modal({ titulo, onFechar, children }: { titulo: string; onFechar: () => void; children: React.ReactNode }) {
  const fechar = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null;
    fechar.current?.focus();
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onFechar();
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = antes;
      anterior?.focus();
    };
  }, [onFechar]);

  return (
    <div className="modal-fundo" onClick={onFechar}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={titulo} onClick={(e) => e.stopPropagation()}>
        <button ref={fechar} className="icon-btn modal-x" aria-label="Fechar" onClick={onFechar}>
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
          </svg>
        </button>
        {children}
      </div>
    </div>
  );
}
