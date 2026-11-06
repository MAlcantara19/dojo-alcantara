"use client";

/*
 * Ouvir a palavra em japonês: converte o romaji (Hajime, Seoi-nage, Ō-soto-gari…) para hiragana
 * e usa a voz japonesa do próprio celular ou computador (não gasta internet).
 */
const VOGAIS: Record<string, string> = { a: "あ", i: "い", u: "う", e: "え", o: "お" };
const LINHAS: Record<string, string[]> = {
  k: ["か", "き", "く", "け", "こ"], g: ["が", "ぎ", "ぐ", "げ", "ご"], s: ["さ", "し", "す", "せ", "そ"], z: ["ざ", "じ", "ず", "ぜ", "ぞ"],
  t: ["た", "ち", "つ", "て", "と"], d: ["だ", "ぢ", "づ", "で", "ど"], n: ["な", "に", "ぬ", "ね", "の"], h: ["は", "ひ", "ふ", "へ", "ほ"],
  b: ["ば", "び", "ぶ", "べ", "ぼ"], p: ["ぱ", "ぴ", "ぷ", "ぺ", "ぽ"], m: ["ま", "み", "む", "め", "も"], r: ["ら", "り", "る", "れ", "ろ"],
  y: ["や", "い", "ゆ", "いぇ", "よ"], w: ["わ", "うぃ", "う", "うぇ", "を"], f: ["ふぁ", "ふぃ", "ふ", "ふぇ", "ふぉ"], j: ["じゃ", "じ", "じゅ", "じぇ", "じょ"],
};
const ESPECIAIS: Record<string, string> = {
  shi: "し", chi: "ち", tsu: "つ", sha: "しゃ", shu: "しゅ", sho: "しょ", she: "しぇ", cha: "ちゃ", chu: "ちゅ", cho: "ちょ", che: "ちぇ",
  kya: "きゃ", kyu: "きゅ", kyo: "きょ", gya: "ぎゃ", gyu: "ぎゅ", gyo: "ぎょ", nya: "にゃ", nyu: "にゅ", nyo: "にょ", hya: "ひゃ", hyu: "ひゅ", hyo: "ひょ",
  bya: "びゃ", byu: "びゅ", byo: "びょ", pya: "ぴゃ", pyu: "ぴゅ", pyo: "ぴょ", mya: "みゃ", myu: "みゅ", myo: "みょ", rya: "りゃ", ryu: "りゅ", ryo: "りょ",
  jya: "じゃ", jyu: "じゅ", jyo: "じょ",
};

export function romajiParaKana(romaji: string): string {
  const t = romaji
    .toLowerCase()
    .replace(/ā/g, "aa").replace(/ī/g, "ii").replace(/ū/g, "uu").replace(/ē/g, "ee").replace(/ō/g, "ou")
    .replace(/[^a-z]/g, "");
  let r = "";
  let i = 0;
  while (i < t.length) {
    const c = t[i];
    const prox = t[i + 1] ?? "";
    // consoante dobrada (ippon, matte) = っ
    if (c === prox && c !== "n" && !"aeiou".includes(c)) {
      r += "っ";
      i += 1;
      continue;
    }
    if (c === "t" && prox === "c") {
      r += "っ";
      i += 1;
      continue;
    }
    const tres = t.slice(i, i + 3);
    if (ESPECIAIS[tres]) {
      r += ESPECIAIS[tres];
      i += 3;
      continue;
    }
    if (VOGAIS[c]) {
      r += VOGAIS[c];
      i += 1;
      continue;
    }
    // n (ou m antes de b/p/m) sem vogal depois = ん
    if ((c === "n" && (prox === "" || !"aeiouy".includes(prox))) || (c === "m" && prox !== "" && "bpm".includes(prox))) {
      r += "ん";
      i += 1;
      continue;
    }
    const linha = LINHAS[c];
    const v = "aiueo".indexOf(prox); // mesma ordem das linhas: a, i, u, e, o
    if (linha && v >= 0) {
      r += linha[v];
      i += 2;
      continue;
    }
    i += 1; // letra que não se encaixa: pula
  }
  return r;
}

/* Vozes: cada aparelho tem as suas. Procura uma masculina e uma feminina pelo nome; se não houver
   masculina, usa a mesma voz com tom mais grave (aparece como “simulada”). */
const MASCULINAS = /ichiro|keita|otoya|hattori|daichi|naoki|takumi|kenji|male|homem|masculin/i;
const FEMININAS = /kyoko|haruka|ayumi|nanami|mizuki|sayaka|o-ren|female|mulher|feminin|google/i;
export type Voz = "feminina" | "masculina";

function vozesJa(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
  return speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith("ja"));
}
/** Qual voz o aparelho tem de verdade (para avisar quando a masculina for simulada). */
export function temVozMasculina(): boolean {
  return vozesJa().some((v) => MASCULINAS.test(v.name));
}

export function vozJaponesaDisponivel(): boolean {
  return vozesJa().length > 0;
}

/** Fala a palavra (e, se vier, a família: “Seoi-nage. Te-waza”). Devolve false se o aparelho não falar japonês. */
export function falarJapones(romaji: string, kana?: string, voz: Voz = "feminina", extra?: string): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  const texto = (kana || romajiParaKana(romaji)) + (extra ? "。" + romajiParaKana(extra) : "");
  const u = new SpeechSynthesisUtterance(texto);
  u.lang = "ja-JP";
  u.rate = 0.85;
  const lista = vozesJa();
  const masc = lista.find((v) => MASCULINAS.test(v.name));
  const fem = lista.find((v) => FEMININAS.test(v.name) && !MASCULINAS.test(v.name)) ?? lista.find((v) => !MASCULINAS.test(v.name));
  if (voz === "masculina") {
    u.voice = masc ?? fem ?? lista[0] ?? null;
    u.pitch = masc ? 1 : 0.55; // sem voz masculina no aparelho: deixa mais grave
  } else {
    u.voice = fem ?? lista[0] ?? null;
    u.pitch = 1.05;
  }
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
  return lista.length > 0 || speechSynthesis.getVoices().length === 0;
}
