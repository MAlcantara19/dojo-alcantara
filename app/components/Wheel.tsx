"use client";

import { useEffect, useRef, useState } from "react";

export type Fatia = { rotulo: string; cor: string };

const C = 200; // centro do desenho (viewBox 400x400)
const R = 188;

function ponto(r: number, graus: number): [number, number] {
  const a = ((graus - 90) * Math.PI) / 180;
  return [C + r * Math.cos(a), C + r * Math.sin(a)];
}

function caminho(i: number, n: number): string {
  const passo = 360 / n;
  const [x1, y1] = ponto(R, i * passo);
  const [x2, y2] = ponto(R, (i + 1) * passo);
  return `M ${C} ${C} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${R} ${R} 0 ${passo > 180 ? 1 : 0} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
}

function corDoTexto(hex: string): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return "#ffffff";
  const n = parseInt(m[1], 16);
  const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return lum > 0.6 ? "#1a1030" : "#ffffff";
}

const DURACAO = 4200;

export default function Wheel({
  fatias,
  onInicio,
  onResultado,
}: {
  fatias: Fatia[];
  onInicio?: () => void;
  onResultado: (i: number) => void;
}) {
  const [rot, setRot] = useState(0);
  const [girando, setGirando] = useState(false);
  const [animar, setAnimar] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const n = fatias.length;

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  function girar() {
    if (girando || n < 2) return;
    onInicio?.();
    const sem = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const idx = Math.floor(Math.random() * n);
    const passo = 360 / n;
    const folga = (Math.random() - 0.5) * passo * 0.7;
    const alvo = (360 - (idx * passo + passo / 2 + folga) + 720) % 360;
    const atual = ((rot % 360) + 360) % 360;
    const delta = ((alvo - atual + 360) % 360) + 360 * (5 + Math.floor(Math.random() * 3));
    setAnimar(!sem);
    setRot(rot + delta);
    if (sem) {
      onResultado(idx);
      return;
    }
    setGirando(true);
    timer.current = setTimeout(() => {
      setGirando(false);
      onResultado(idx);
    }, DURACAO + 100);
  }

  const mostrarNomes = n <= 24;
  const tamanho = n <= 8 ? 15 : n <= 14 ? 12 : 10;
  const maxChars = Math.floor((R - 12 - 58) / (0.62 * tamanho)); // não passa do botão central

  return (
    <div className="wheel-box">
      <svg className="wheel-svg" viewBox="0 0 400 400" role="img" aria-label={`Roleta com ${n} itens`}>
        <circle cx={C} cy={C} r={R + 8} fill="#1a0b36" />
        <g
          style={{
            transform: `rotate(${rot}deg)`,
            transformOrigin: `${C}px ${C}px`,
            transition: animar ? `transform ${DURACAO}ms cubic-bezier(.12,.72,.08,1)` : "none",
          }}
        >
          {n < 2 ? (
            <circle cx={C} cy={C} r={R} fill="#6a35c9" />
          ) : (
            fatias.map((f, i) => {
              const meio = (i + 0.5) * (360 / n);
              const nome = f.rotulo.length > maxChars ? f.rotulo.slice(0, maxChars - 1) + "…" : f.rotulo;
              return (
                <g key={f.rotulo + i}>
                  <path d={caminho(i, n)} fill={f.cor} stroke="rgba(255,255,255,.55)" strokeWidth={n > 40 ? 0.6 : 1.4} />
                  {mostrarNomes && (
                    <text
                      x={C + R - 12}
                      y={C}
                      transform={`rotate(${meio - 90} ${C} ${C})`}
                      textAnchor="end"
                      dominantBaseline="middle"
                      fontSize={tamanho}
                      fontWeight={700}
                      fill={corDoTexto(f.cor)}
                    >
                      {nome}
                    </text>
                  )}
                </g>
              );
            })
          )}
        </g>
        {/* ponteiro fixo no topo */}
        <path d="M 200 4 L 182 -22 L 218 -22 Z" fill="#fff" transform="translate(0 38)" />
        <path d="M 200 4 L 182 -22 L 218 -22 Z" fill="none" stroke="#1a0b36" strokeWidth="3" transform="translate(0 38)" />
        <circle cx={C} cy={C} r={46} fill="#fff" stroke="#1a0b36" strokeWidth="5" />
      </svg>
      <button className="wheel-hub" onClick={girar} disabled={girando || n < 2} aria-label="Girar a roleta">
        {girando ? "…" : "Girar"}
      </button>
    </div>
  );
}
