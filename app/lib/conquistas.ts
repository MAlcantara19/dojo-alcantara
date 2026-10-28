/* Conquistas do aluno, calculadas com o que já existe no site (presença, simulados, graus, campeonatos). */
export type Conquista = { icone: string; nome: string; desc: string; ok: boolean };

export function calcularConquistas(d: { presencas: number; simulados: { acertos: number; total: number }[]; graus: number; grausTotal: number; checklist100: boolean; campeonatos: { colocacao: string }[] }): Conquista[] {
  const perfeitos = d.simulados.filter((s) => s.total > 0 && s.acertos === s.total).length;
  const medalhas = d.campeonatos.filter((c) => /^[123]/.test(c.colocacao)).length;
  return [
    { icone: "🥋", nome: "Primeiro treino", desc: "1 presença registrada", ok: d.presencas >= 1 },
    { icone: "🔥", nome: "Firme no tatame", desc: "10 presenças", ok: d.presencas >= 10 },
    { icone: "💪", nome: "Dedicação", desc: "25 presenças", ok: d.presencas >= 25 },
    { icone: "🏯", nome: "Samurai do dojô", desc: "50 presenças", ok: d.presencas >= 50 },
    { icone: "🐉", nome: "Lenda do dojô", desc: "100 presenças", ok: d.presencas >= 100 },
    { icone: "📝", nome: "Estudioso", desc: "1º simulado feito", ok: d.simulados.length >= 1 },
    { icone: "📚", nome: "Mestre dos simulados", desc: "10 simulados feitos", ok: d.simulados.length >= 10 },
    { icone: "🎯", nome: "Gabaritou", desc: "Acertou tudo num simulado", ok: perfeitos >= 1 },
    { icone: "⭐", nome: "Primeiro grau", desc: "1 grau pela chamada", ok: d.graus >= 1 },
    { icone: "🎖️", nome: "Pronto para o exame", desc: "Todos os graus da faixa", ok: d.grausTotal > 0 && d.graus >= d.grausTotal },
    { icone: "✅", nome: "Faixa revisada", desc: "Checklist da faixa completo", ok: d.checklist100 },
    { icone: "🏆", nome: "Competidor", desc: "Participou de um campeonato", ok: d.campeonatos.length >= 1 },
    { icone: "🥇", nome: "No pódio", desc: "Medalha em campeonato", ok: medalhas >= 1 },
  ];
}
