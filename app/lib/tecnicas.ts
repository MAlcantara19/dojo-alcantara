/* Técnicas do Kodokan. A faixa de cada técnica você define aqui (campo "faixa").
   Para ligar material: pdf: "https://…", video: "https://youtube.com/…", imagem: "/img/kesa.jpg"
   Sem vídeo, o site mostra um botão que busca a técnica no YouTube. */

export type Categoria = "Nage-waza" | "Osaekomi-waza";
export type Tecnica = {
  nome: string;
  categoria: Categoria;
  grupo: string;
  faixa?: string;
  pdf?: string;
  video?: string;
  imagem?: string;
};

const gokyo: [string, string[]][] = [
  ["1º grupo (Dai-ikkyo)", ["De-ashi-harai", "Hiza-guruma", "Sasae-tsurikomi-ashi", "Uki-goshi", "O-soto-gari", "O-goshi", "O-uchi-gari", "Seoi-nage"]],
  ["2º grupo (Dai-nikyo)", ["Kosoto-gari", "Kouchi-gari", "Koshi-guruma", "Tsurikomi-goshi", "Okuri-ashi-harai", "Tai-otoshi", "Harai-goshi", "Uchi-mata"]],
  ["3º grupo (Dai-sankyo)", ["Kosoto-gake", "Tsuri-goshi", "Yoko-otoshi", "Ashi-guruma", "Hane-goshi", "Harai-tsurikomi-ashi", "Tomoe-nage", "Kata-guruma"]],
  ["4º grupo (Dai-yonkyo)", ["Sumi-gaeshi", "Tani-otoshi", "Hane-makikomi", "Sukui-nage", "Utsuri-goshi", "O-guruma", "Soto-makikomi", "Uki-otoshi"]],
  ["5º grupo (Dai-gokyo)", ["Osoto-guruma", "Uki-waza", "Yoko-wakare", "Yoko-guruma", "Ushiro-goshi", "Ura-nage", "Sumi-otoshi", "Yoko-gake"]],
];

export const tecnicas: Tecnica[] = [
  ...gokyo.flatMap(([grupo, nomes]) => nomes.map((nome): Tecnica => ({ nome, categoria: "Nage-waza", grupo }))),
  ...["Kesa-gatame", "Kata-gatame", "Kami-shiho-gatame", "Yoko-shiho-gatame", "Kuzure-kami-shiho-gatame", "Kuzure-kesa-gatame"].map(
    (nome): Tecnica => ({ nome, categoria: "Osaekomi-waza", grupo: "Imobilizações" }),
  ),
];
