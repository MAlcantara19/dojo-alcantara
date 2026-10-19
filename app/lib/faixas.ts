/* Ordem das faixas no dojô. "cor" aceita cor ou degradê (CSS). */
export const faixas = [
  { nome: "Branca", cor: "#f4f1ff" },
  { nome: "Azul", cor: "#2b6cd8" },
  { nome: "Amarela", cor: "#f2d23c" },
  { nome: "Laranja", cor: "#f08a24" },
  { nome: "Verde", cor: "#2f9e5b" },
  { nome: "Roxa", cor: "#8a4bd6" },
  { nome: "Marrom", cor: "#7a4a2a" },
  { nome: "Preta", cor: "#111111" },
];

/* Graus mais altos, só para a barra decorativa do início. */
export const faixasAltas = [
  { nome: "Vermelha e branca", cor: "repeating-linear-gradient(90deg,#d9334a 0 12px,#ffffff 12px 24px)" },
  { nome: "Vermelha", cor: "#d9334a" },
];

export const corDaFaixa = (nome?: string) => faixas.find((f) => f.nome === nome)?.cor;
