/* Perguntas dos simulados. Para acrescentar, copie um bloco e mude.
   "correta" é a posição da resposta certa em "opcoes" (0 = primeira). */

export type Pergunta = { pergunta: string; opcoes: string[]; correta: number; explicacao: string };

export const simulados: { id: string; titulo: string; descricao: string; perguntas: Pergunta[] }[] = [
  {
    id: "basico",
    titulo: "Judô básico",
    descricao: "História, vocabulário e regras essenciais.",
    perguntas: [
      {
        pergunta: "Quem criou o judô?",
        opcoes: ["Jigoro Kano", "Mitsuyo Maeda", "Morihei Ueshiba", "Gichin Funakoshi"],
        correta: 0,
        explicacao: "Jigoro Kano criou o judô e fundou o Kodokan no Japão.",
      },
      {
        pergunta: "Em que ano o Kodokan foi fundado?",
        opcoes: ["1852", "1882", "1912", "1964"],
        correta: 1,
        explicacao: "O Kodokan foi fundado em 1882.",
      },
      {
        pergunta: "O que significa “Hajime”?",
        opcoes: ["Parem", "Comecem", "Saudação", "Fim"],
        correta: 1,
        explicacao: "Hajime é o comando do árbitro para começar a luta.",
      },
      {
        pergunta: "O que significa “Matte”?",
        opcoes: ["Esperem (interrompe a luta)", "Comecem", "Continuem", "Desclassificado"],
        correta: 0,
        explicacao: "Matte interrompe a luta temporariamente.",
      },
      {
        pergunta: "Qual pontuação encerra a luta imediatamente?",
        opcoes: ["Waza-ari", "Shido", "Ippon", "Hantei"],
        correta: 2,
        explicacao: "O ippon é o ponto completo e dá a vitória na hora.",
      },
      {
        pergunta: "Nage-waza são técnicas de…",
        opcoes: ["Estrangulamento", "Imobilização", "Chave de articulação", "Projeção"],
        correta: 3,
        explicacao: "Nage-waza são as técnicas de projeção.",
      },
      {
        pergunta: "Osaekomi-waza são técnicas de…",
        opcoes: ["Imobilização", "Projeção", "Queda", "Combinação de golpes"],
        correta: 0,
        explicacao: "Osaekomi-waza são as imobilizações, como o Kesa-gatame.",
      },
      {
        pergunta: "O que é “Ukemi”?",
        opcoes: ["Treino livre", "A arte de cair", "Uma faixa", "Um golpe de perna"],
        correta: 1,
        explicacao: "Ukemi é a arte de cair com segurança.",
      },
      {
        pergunta: "Quem executa a técnica é chamado de…",
        opcoes: ["Uke", "Sensei", "Tori", "Judoca"],
        correta: 2,
        explicacao: "Tori executa a técnica; uke é quem a recebe.",
      },
      {
        pergunta: "Kesa-gatame é um exemplo de…",
        opcoes: ["Projeção de quadril", "Estrangulamento", "Chave de braço", "Imobilização"],
        correta: 3,
        explicacao: "Kesa-gatame é uma imobilização (osaekomi-waza).",
      },
    ],
  },
];
