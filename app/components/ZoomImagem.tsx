"use client";

import { useEffect, useRef, useState } from "react";
import Img from "./Img";
import PorCima from "./PorCima";

/**
 * Foto em tela cheia com zoom só nela (não no site): dois dedos para aproximar, arrastar para mover,
 * toque duplo para aproximar/voltar, rodinha do mouse no computador, e setas se houver mais fotos.
 */
export default function ZoomImagem({ fotos, inicio, onFechar }: { fotos: { src: string; alt: string }[]; inicio: number; onFechar: () => void }) {
  const [i, setI] = useState(inicio);
  const [z, setZ] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const toques = useRef(new Map<number, { x: number; y: number }>());
  const base = useRef({ dist: 0, z: 1, x: 0, y: 0, px: 0, py: 0 });
  const ultimoToque = useRef(0);

  useEffect(() => {
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFechar();
      if (e.key === "ArrowRight") trocar(1);
      if (e.key === "ArrowLeft") trocar(-1);
    };
    document.addEventListener("keydown", tecla);
    return () => {
      document.body.style.overflow = antes;
      document.removeEventListener("keydown", tecla);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function trocar(d: number) {
    setI((x) => Math.max(0, Math.min(fotos.length - 1, x + d)));
    setZ(1);
    setPos({ x: 0, y: 0 });
  }
  const limitar = (v: number) => Math.max(1, Math.min(5, v));

  function baixo(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    toques.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = Array.from(toques.current.values());
    if (pts.length === 2) base.current = { ...base.current, dist: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y), z };
    else base.current = { ...base.current, px: e.clientX, py: e.clientY, x: pos.x, y: pos.y };
    if (pts.length === 1) {
      const agora = Date.now();
      if (agora - ultimoToque.current < 300) {
        setZ((v) => (v > 1 ? 1 : 2.5));
        setPos({ x: 0, y: 0 });
      }
      ultimoToque.current = agora;
    }
  }
  function mover(e: React.PointerEvent) {
    if (!toques.current.has(e.pointerId)) return;
    toques.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = Array.from(toques.current.values());
    if (pts.length === 2 && base.current.dist) setZ(limitar((base.current.z * Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)) / base.current.dist));
    else if (pts.length === 1 && z > 1) setPos({ x: base.current.x + (e.clientX - base.current.px), y: base.current.y + (e.clientY - base.current.py) });
  }
  function cima(e: React.PointerEvent) {
    const pts = toques.current.size;
    toques.current.delete(e.pointerId);
    // arrastar para o lado sem zoom troca de foto
    if (pts === 1 && z === 1) {
      const dx = e.clientX - base.current.px;
      if (Math.abs(dx) > 60) trocar(dx < 0 ? 1 : -1);
    }
    if (toques.current.size === 1) {
      const [p] = Array.from(toques.current.values());
      base.current = { ...base.current, px: p.x, py: p.y, x: pos.x, y: pos.y };
    }
  }

  const f = fotos[i];
  return (
    <PorCima>
    <div className="zoom-fundo" role="dialog" aria-modal="true" aria-label={f.alt}>
      <div className="zoom-topo">
        <span>{fotos.length > 1 ? `${i + 1} de ${fotos.length}` : ""}</span>
        <span className="zoom-botoes">
          <button type="button" onClick={() => setZ((v) => limitar(v - 0.5))} aria-label="Afastar">
            −
          </button>
          <button type="button" onClick={() => setZ((v) => limitar(v + 0.5))} aria-label="Aproximar">
            +
          </button>
          <button type="button" onClick={onFechar} aria-label="Fechar">
            ✕
          </button>
        </span>
      </div>
      <div
        className="zoom-area"
        onPointerDown={baixo}
        onPointerMove={mover}
        onPointerUp={cima}
        onPointerCancel={cima}
        onWheel={(e) => setZ((v) => limitar(v - e.deltaY * 0.002))}
      >
        <div style={{ transform: `translate(${pos.x}px, ${pos.y}px) scale(${z})` }} className="zoom-img">
          <Img key={f.src} src={f.src} alt={f.alt} largura={1600} eager />
        </div>
      </div>
      {fotos.length > 1 && (
        <>
          <button type="button" className="carrossel-seta esq zoom-seta" onClick={() => trocar(-1)} disabled={i === 0} aria-label="Foto anterior">
            ‹
          </button>
          <button type="button" className="carrossel-seta dir zoom-seta" onClick={() => trocar(1)} disabled={i === fotos.length - 1} aria-label="Próxima foto">
            ›
          </button>
        </>
      )}
      <p className="zoom-dica">Dois dedos para aproximar · toque duplo para ampliar · arraste para o lado para trocar</p>
    </div>
    </PorCima>
  );
}
