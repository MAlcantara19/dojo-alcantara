/* Katas por graduação, como o dojô pratica (confira sempre o regulamento da sua federação). */
export const katas = [
  { nome: "Nage-no-kata", dan: "Faixa marrom para o 1º dan", resumo: "Forma das projeções: 15 técnicas em 5 séries de 3." },
  { nome: "Katame-no-kata", dan: "2º dan", resumo: "Forma dos controles no solo: imobilizações, estrangulamentos e chaves (15 técnicas)." },
  { nome: "Ju-no-kata", dan: "3º dan", resumo: "Forma da flexibilidade: 15 movimentos em 3 séries de 5." },
  { nome: "Kime-no-kata", dan: "4º dan", resumo: "Forma da decisão: defesa pessoal, em 20 técnicas (de joelhos e em pé)." },
  { nome: "Kodokan Goshin-jutsu", dan: "5º dan", resumo: "Método de defesa pessoal do Kodokan (21 técnicas)." },
];

export const nageNoKata: { serie: string; tecnicas: string[] }[] = [
  { serie: "1ª série · Te-waza", tecnicas: ["Uki-otoshi", "Seoi-nage", "Kata-guruma"] },
  { serie: "2ª série · Koshi-waza", tecnicas: ["Uki-goshi", "Harai-goshi", "Tsurikomi-goshi"] },
  { serie: "3ª série · Ashi-waza", tecnicas: ["Okuri-ashi-harai", "Sasae-tsurikomi-ashi", "Uchi-mata"] },
  { serie: "4ª série · Ma-sutemi-waza", tecnicas: ["Tomoe-nage", "Ura-nage", "Sumi-gaeshi"] },
  { serie: "5ª série · Yoko-sutemi-waza", tecnicas: ["Yoko-gake", "Yoko-guruma", "Uki-waza"] },
];
