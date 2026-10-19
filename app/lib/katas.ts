/* Katas por graduação, como o dojô pratica (confira sempre o regulamento da sua federação).
   As técnicas de cada série seguem as listas do Kodokan; as traduções são resumidas. */

export type TecnicaKata = { nome: string; desc?: string };
export type SerieKata = { titulo: string; tecnicas: TecnicaKata[] };
export type KataBase = { nome: string; dan: string; resumo: string; series: SerieKata[] };

const t = (nome: string, desc?: string): TecnicaKata => ({ nome, desc });

export const katas: KataBase[] = [
  {
    nome: "Nage-no-kata",
    dan: "Faixa marrom para o 1º dan",
    resumo: "Forma das projeções: 15 técnicas em 5 séries de 3.",
    series: [
      { titulo: "1ª série · Te-waza", tecnicas: [t("Uki-otoshi"), t("Seoi-nage"), t("Kata-guruma")] },
      { titulo: "2ª série · Koshi-waza", tecnicas: [t("Uki-goshi"), t("Harai-goshi"), t("Tsurikomi-goshi")] },
      { titulo: "3ª série · Ashi-waza", tecnicas: [t("Okuri-ashi-harai"), t("Sasae-tsurikomi-ashi"), t("Uchi-mata")] },
      { titulo: "4ª série · Ma-sutemi-waza", tecnicas: [t("Tomoe-nage"), t("Ura-nage"), t("Sumi-gaeshi")] },
      { titulo: "5ª série · Yoko-sutemi-waza", tecnicas: [t("Yoko-gake"), t("Yoko-guruma"), t("Uki-waza")] },
    ],
  },
  {
    nome: "Katame-no-kata",
    dan: "2º dan",
    resumo: "Forma dos controles no solo: 15 técnicas em 3 séries de 5.",
    series: [
      { titulo: "1ª série · Osaekomi-waza (imobilizações)", tecnicas: [t("Kesa-gatame"), t("Kata-gatame"), t("Kami-shiho-gatame"), t("Yoko-shiho-gatame"), t("Kuzure-kami-shiho-gatame")] },
      { titulo: "2ª série · Shime-waza (estrangulamentos)", tecnicas: [t("Kata-juji-jime"), t("Hadaka-jime"), t("Okuri-eri-jime"), t("Kataha-jime"), t("Gyaku-juji-jime")] },
      { titulo: "3ª série · Kansetsu-waza (chaves de articulação)", tecnicas: [t("Ude-garami"), t("Ude-hishigi-juji-gatame"), t("Ude-hishigi-ude-gatame"), t("Ude-hishigi-hiza-gatame"), t("Ashi-garami")] },
    ],
  },
  {
    nome: "Ju-no-kata",
    dan: "3º dan",
    resumo: "Forma da flexibilidade: 15 movimentos em 3 séries de 5, em ritmo lento.",
    series: [
      {
        titulo: "1ª série · Dai-ikkyo",
        tecnicas: [t("Tsuki-dashi", "golpe com a mão"), t("Kata-oshi", "empurrar o ombro"), t("Ryote-dori", "segurar as duas mãos"), t("Kata-mawashi", "girar o ombro"), t("Ago-oshi", "empurrar o queixo")],
      },
      {
        titulo: "2ª série · Dai-nikyo",
        tecnicas: [t("Kiri-oroshi", "corte para baixo"), t("Ryokata-oshi", "empurrar os dois ombros"), t("Naname-uchi", "golpe em diagonal"), t("Katate-dori", "segurar uma mão"), t("Katate-age", "levantar uma mão")],
      },
      {
        titulo: "3ª série · Dai-sankyo",
        tecnicas: [t("Obi-tori", "agarrar o cinto"), t("Mune-oshi", "empurrar o peito"), t("Tsuki-age", "golpe de baixo para cima"), t("Uchi-oroshi", "golpe para baixo"), t("Ryogan-tsuki", "golpe nos dois olhos")],
      },
    ],
  },
  {
    nome: "Kime-no-kata",
    dan: "4º dan",
    resumo: "Forma da decisão: defesa pessoal em 20 técnicas, 8 de joelhos (idori) e 12 em pé (tachiai).",
    series: [
      {
        titulo: "1ª série · Idori (de joelhos, 8 técnicas)",
        tecnicas: [t("Ryote-dori", "segurar as duas mãos"), t("Tsukkake", "soco no estômago"), t("Suri-age", "empurrão na testa"), t("Yoko-uchi", "golpe lateral"), t("Ushiro-dori", "segurar por trás"), t("Tsukkomi", "estocada de adaga no estômago"), t("Kiri-komi", "corte para baixo"), t("Yoko-tsuki", "estocada lateral de adaga")],
      },
      {
        titulo: "2ª série · Tachiai (em pé, 12 técnicas)",
        tecnicas: [
          t("Ryote-dori", "segurar as duas mãos"),
          t("Sode-tori", "agarrar a manga"),
          t("Tsukkake", "soco no rosto"),
          t("Tsuki-age", "soco de baixo para cima"),
          t("Suri-age", "empurrão na testa"),
          t("Yoko-uchi", "golpe lateral"),
          t("Ke-age", "chute na virilha"),
          t("Ushiro-dori", "segurar por trás"),
          t("Tsuki-komi", "estocada de adaga"),
          t("Kiri-komi", "corte com adaga"),
          t("Nuki-kake", "sacar a espada"),
          t("Kiri-oroshi", "corte para baixo com espada"),
        ],
      },
    ],
  },
  {
    nome: "Kodokan Goshin-jutsu",
    dan: "5º dan",
    resumo: "Método de defesa pessoal do Kodokan, de 1956: 21 técnicas, 12 sem armas e 9 com armas.",
    series: [
      {
        titulo: "Sem armas · quando seguram (7)",
        tecnicas: [t("Ryote-dori", "segurar as duas mãos"), t("Hidari-eri-dori", "segurar a gola esquerda"), t("Migi-eri-dori", "segurar a gola direita"), t("Kataude-dori", "segurar um braço"), t("Ushiro-eri-dori", "segurar a gola por trás"), t("Ushiro-jime", "estrangulamento por trás"), t("Kakae-dori", "abraço por trás")],
      },
      {
        titulo: "Sem armas · quando atacam à distância (5)",
        tecnicas: [t("Naname-uchi", "golpe em diagonal"), t("Ago-tsuki", "golpe no queixo"), t("Ganmen-tsuki", "soco no rosto"), t("Mae-geri", "chute frontal"), t("Yoko-geri", "chute lateral")],
      },
      { titulo: "Com armas · faca (3)", tecnicas: [t("Tsukkake", "estocada"), t("Choku-tsuki", "estocada reta"), t("Naname-tsuki", "estocada diagonal")] },
      { titulo: "Com armas · bastão (3)", tecnicas: [t("Furi-age", "golpe de baixo para cima"), t("Furi-oroshi", "golpe de cima para baixo"), t("Morote-tsuki", "estocada com as duas mãos")] },
      { titulo: "Com armas · pistola (3)", tecnicas: [t("Shomen-zuke", "pistola no abdômen, pela frente"), t("Koshi-gamae", "pistola na cintura, de lado"), t("Haimen-zuke", "pistola nas costas")] },
    ],
  },
];
