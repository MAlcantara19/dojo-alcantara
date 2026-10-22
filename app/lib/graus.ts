/* Graus pela chamada: a cada N aulas com presença na faixa atual, 1 grau. Com todos os graus, o aluno fica pronto para avaliação. */
export type Graus = { aulas: number; graus: number; faltam: number; pronto: boolean; porGrau: number; total: number };

export function calcularGraus(datasPresenca: string[], faixaDesde: string | undefined, porGrau: number, grausPorFaixa: number): Graus {
  const aulas = datasPresenca.filter((d) => !faixaDesde || d >= faixaDesde).length;
  const graus = Math.min(grausPorFaixa, Math.floor(aulas / Math.max(1, porGrau)));
  const pronto = graus >= grausPorFaixa;
  return { aulas, graus, faltam: pronto ? 0 : porGrau - (aulas % porGrau), pronto, porGrau, total: grausPorFaixa };
}
