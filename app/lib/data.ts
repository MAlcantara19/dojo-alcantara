/* ============================================================
   CONTEÚDO DO SITE — por enquanto editado aqui.
   Na próxima etapa estes dados passam a vir do Firebase,
   editados pelo painel admin. Datas no formato AAAA-MM-DD.
   ============================================================ */

export type Aviso = { titulo: string; data: string; texto: string; autor?: string; imagem?: string; video?: string; ts?: number };
export type Evento = { titulo: string; data: string; hora: string; local: string; tipo: string; autor?: string; imagem?: string; video?: string; pastaDrive?: string; descricao?: string };
export type Foto = { legenda: string; src?: string };

export const dojo = {
  nome: "Dojô Alcântara",
  slogan: "Judô para todas as idades",
  contato: {
    instagram: "", // ex.: "dojoalcantara"
    whatsapp: "", // ex.: "5524999999999"
  },
};

export const avisos: Aviso[] = [
  {
    titulo: "Bem-vindos ao novo site",
    data: "2026-10-17",
    texto:
      "Aqui você acompanha avisos, campeonatos, provas e confraternizações. Em breve, a área do aluno com materiais e simulados.",
  },
  {
    titulo: "Traga o uniforme limpo",
    data: "2026-10-17",
    texto: "Lembrete para todas as turmas: kimono limpo, unhas aparadas e garrafa de água.",
  },
];

export const eventos: Evento[] = [
  { titulo: "Campeonato", data: "2026-11-24", hora: "A confirmar", local: "A definir", tipo: "Campeonato" },
  { titulo: "Exame de faixa", data: "2026-12-12", hora: "A confirmar", local: "A definir", tipo: "Prova" },
  { titulo: "Confraternização de fim de ano", data: "2026-12-19", hora: "A confirmar", local: "A definir", tipo: "Festa" },
];

export const galeria: Foto[] = [
  { legenda: "Treino de sábado" },
  { legenda: "Roda de randori" },
  { legenda: "Entrega de faixas" },
  { legenda: "Campeonato" },
  { legenda: "Turma infantil" },
  { legenda: "Confraternização" },
  // Com foto: { legenda: "Treino", src: "/img/treino1.jpg" }  (arquivo em public/img/)
];

export const sobre: string[] = [
  "Judô é disciplina, respeito e amizade. O Dojô Alcântara reúne alunos de todas as idades e faixas para treinar, aprender e crescer juntos.",
  "Escreva aqui a história do dojô, os professores e o que cada turma vai encontrar.",
];
