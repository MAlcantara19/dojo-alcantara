export type Ponto = { rotulo: string; valor: number };

export default function LineChart({ titulo, unidade, pontos }: { titulo: string; unidade: string; pontos: Ponto[] }) {
  if (pontos.length < 2) {
    return (
      <div className="chart">
        <h3>{titulo}</h3>
        <p className="form-help">Registre pelo menos duas medidas para ver o gráfico.</p>
      </div>
    );
  }
  const W = 320;
  const H = 150;
  const PX = 34;
  const PY = 18;
  const vals = pontos.map((p) => p.valor);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const folga = (max - min || 1) * 0.15;
  const lo = min - folga;
  const hi = max + folga;
  const x = (i: number) => PX + (i * (W - PX - 10)) / (pontos.length - 1);
  const y = (v: number) => H - PY - ((v - lo) / (hi - lo)) * (H - PY * 2);
  const linha = pontos.map((p, i) => `${x(i).toFixed(1)},${y(p.valor).toFixed(1)}`).join(" ");
  const ultimo = pontos[pontos.length - 1];
  const primeiro = pontos[0];
  const dif = ultimo.valor - primeiro.valor;
  const resumo = `${titulo}: de ${primeiro.valor} ${unidade} em ${primeiro.rotulo} para ${ultimo.valor} ${unidade} em ${ultimo.rotulo}.`;

  return (
    <div className="chart">
      <h3>
        {titulo} <small>{dif === 0 ? "sem variação" : `${dif > 0 ? "+" : ""}${dif.toFixed(1).replace(".", ",")} ${unidade}`}</small>
      </h3>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={resumo}>
        <line x1={PX} y1={H - PY} x2={W - 6} y2={H - PY} stroke="var(--line)" />
        <line x1={PX} y1={PY} x2={PX} y2={H - PY} stroke="var(--line)" />
        <text x={PX - 4} y={y(max) + 4} textAnchor="end" fontSize="10" fill="var(--muted)">
          {max}
        </text>
        <text x={PX - 4} y={y(min) + 4} textAnchor="end" fontSize="10" fill="var(--muted)">
          {min}
        </text>
        <polyline points={linha} fill="none" stroke="var(--bright)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {pontos.map((p, i) => (
          <circle key={i} cx={x(i)} cy={y(p.valor)} r={3.5} fill="var(--bright)" />
        ))}
        <text x={PX} y={H - 3} fontSize="10" fill="var(--muted)">
          {primeiro.rotulo}
        </text>
        <text x={W - 6} y={H - 3} textAnchor="end" fontSize="10" fill="var(--muted)">
          {ultimo.rotulo}
        </text>
      </svg>
    </div>
  );
}
