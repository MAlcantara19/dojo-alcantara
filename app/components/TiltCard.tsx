"use client";

import { useRef } from "react";

/** Card que inclina em 3D e ganha um brilho seguindo o dedo ou o mouse. */
export default function TiltCard({ children, className = "", onClick, rotulo }: { children: React.ReactNode; className?: string; onClick?: () => void; rotulo?: string }) {
  const ref = useRef<HTMLButtonElement>(null);

  function mover(e: React.PointerEvent<HTMLButtonElement>) {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--ry", `${(x * 16).toFixed(2)}deg`);
    el.style.setProperty("--rx", `${(-y * 16).toFixed(2)}deg`);
    el.style.setProperty("--gx", `${((x + 0.5) * 100).toFixed(0)}%`);
    el.style.setProperty("--gy", `${((y + 0.5) * 100).toFixed(0)}%`);
    el.style.setProperty("--brilho", "1");
  }

  function sair() {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--brilho", "0");
  }

  return (
    <div className="tilt-wrap">
      <button ref={ref} type="button" className={"tilt " + className} onClick={onClick} onPointerMove={mover} onPointerLeave={sair} onPointerCancel={sair} aria-label={rotulo} disabled={!onClick}>
        {children}
      </button>
    </div>
  );
}
