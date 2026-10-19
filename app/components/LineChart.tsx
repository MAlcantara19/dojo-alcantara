"use client";

import { useState } from "react";

export type Ponto = { rotulo: string; valor: number; completo?: string };

const fmt = (v: number) => v.toFixed(1).replace(".", ",").replace(/,0$/, "");

/** Gráfico de linha com grade, datas, valores nos pontos e ponto selecionável (toque ou mouse). */
export default function LineChart({ titulo, unidade, pontos }: { titulo: string; unidade: string; pontos: Ponto[] }) {
  const [ativo, setAtivo] = useState<number | null>(null);

  if (pontos.length < 2) {
    return (
      <div className="chart">
        <h3>{titulo}</h3>
        <p className="form-help">{pontos.length === 1 ? `Primeira medida: ${fmt(pontos[0].valor)} ${unidade} em ${pontos[0].completo ?? pontos[0].rotulo}. ` : ""}Registre pelo menos duas medidas para ver o gráfico.</p>
      </div>
    );
  }

  const W = 340;
  const H = 210;
  const L = 46;
  const R = 16;
  const T = 22;
  const B = 40;
  const vals = pontos.map((p) => p.valor);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const folga = Math.max((max - min) * 0.15, max * 0.01, 0.2);
  const bruto = (max + folga - (min - folga)) / 4;
  const passoTick = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50].find((v) => v >= bruto) ?? 50;
  const lo = Math.floor((min - folga) / passoTick) * passoTick;
  const hi = Math.ceil((max + folga) / passoTick) * passoTick;
  const x = (i: number) => L + (i * (W - L - R)) / (pontos.length - 1);
  const y = (v: number) => H - B - ((v - lo) / (hi - lo)) * (H - T - B);
  const ticks: number[] = [];
  for (let v = lo; v <= hi + 1e-9; v += passoTick) ticks.push(Number(v.toFixed(2)));
  const linha = pontos.map((p, i) => `${x(i).toFixed(1)},${y(p.valor).toFixed(1)}`).join(" ");
  const area = `${L},${H - B} ${linha} ${x(pontos.length - 1).toFixed(1)},${H - B}`;
  const sel = ativo ?? pontos.length - 1;
  const p = pontos[sel];
  const ant = sel > 0 ? pontos[sel - 1] : null;
  const dif = ant ? p.valor - ant.valor : null;
  const passo = pontos.length <= 6 ? 1 : Math.ceil(pontos.length / 6);
  const mostrarValores = pontos.length <= 8;
  const gid = `g-${titulo.replace(/\W/g, "")}`;

  function achar(e: React.PointerEvent<SVGSVGElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    let melhor = 0;
    pontos.forEach((_, i) => {
      if (Math.abs(x(i) - px) < Math.abs(x(melhor) - px)) melhor = i;
    });
    setAtivo(melhor);
  }

  return (
    <div className="chart">
      <h3>
        {titulo} <small>{fmt(pontos[0].valor)} → {fmt(pontos[pontos.length - 1].valor)} {unidade}</small>
      </h3>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${titulo}: ${pontos.map((q) => `${q.completo ?? q.rotulo} ${fmt(q.valor)} ${unidade}`).join(", ")}`} onPointerMove={achar} onPointerDown={achar} style={{ touchAction: "pan-y" }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--bright)" stopOpacity=".35" />
            <stop offset="1" stopColor="var(--bright)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((v, i) => (
          <g key={i}>
            <line x1={L} y1={y(v)} x2={W - R} y2={y(v)} stroke="var(--line)" strokeDasharray={i === 0 ? undefined : "3 4"} />
            <text x={L - 6} y={y(v) + 4} textAnchor="end" fontSize="10.5" fill="var(--muted)">
              {fmt(v)}
            </text>
          </g>
        ))}
        <text x={4} y={12} fontSize="10.5" fill="var(--muted)">
          {unidade}
        </text>
        <polygon points={area} fill={`url(#${gid})`} />
        <polyline points={linha} fill="none" stroke="var(--bright)" strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" />
        {/* linhas-guia do ponto selecionado */}
        <line x1={x(sel)} y1={T - 6} x2={x(sel)} y2={H - B} stroke="var(--accent)" strokeWidth="1.2" strokeDasharray="4 3" />
        <line x1={L} y1={y(p.valor)} x2={x(sel)} y2={y(p.valor)} stroke="var(--accent)" strokeWidth="1.2" strokeDasharray="4 3" />
        {pontos.map((q, i) => (
          <g key={i}>
            <circle cx={x(i)} cy={y(q.valor)} r={i === sel ? 7 : 4.5} fill={i === sel ? "var(--accent)" : "var(--bright)"} stroke="var(--surface)" strokeWidth={i === sel ? 3 : 1.5} />
            {(mostrarValores || i === sel) && (
              <text x={x(i)} y={y(q.valor) - 12} textAnchor="middle" fontSize="10.5" fontWeight={i === sel ? 800 : 600} fill="var(--text)">
                {fmt(q.valor)}
              </text>
            )}
            {i % passo === 0 || i === pontos.length - 1 ? (
              <text x={x(i)} y={H - B + 16} textAnchor="middle" fontSize="10.5" fontWeight={i === sel ? 800 : 500} fill={i === sel ? "var(--text)" : "var(--muted)"}>
                {q.rotulo}
              </text>
            ) : null}
          </g>
        ))}
      </svg>
      <p className="chart-sel" aria-live="polite">
        <b>{p.completo ?? p.rotulo}</b>: {fmt(p.valor)} {unidade}
        {dif !== null && <span className={dif === 0 ? "" : dif > 0 ? "sobe" : "desce"}> ({dif === 0 ? "igual à anterior" : `${dif > 0 ? "+" : "−"}${fmt(Math.abs(dif))} ${unidade} desde a anterior`})</span>}
      </p>
      <details className="chart-tabela">
        <summary>Ver todas as medidas</summary>
        <table>
          <tbody>
            {[...pontos].reverse().map((q, i) => (
              <tr key={i}>
                <td>{q.completo ?? q.rotulo}</td>
                <td>
                  {fmt(q.valor)} {unidade}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
