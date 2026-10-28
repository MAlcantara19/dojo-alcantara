"use client";

import { useState } from "react";
import AdminEstudo from "./AdminEstudo";
import AdminFichas from "./AdminFichas";
import AdminIA from "./AdminIA";
import AdminKatas from "./AdminKatas";
import AdminMateriais from "./AdminMateriais";
import AdminRoletas from "./AdminRoletas";
import AdminTecnicas from "./AdminTecnicas";
import MenuSuspenso from "./MenuSuspenso";

type Secao = "ia" | "tecnicas" | "fichas" | "katas" | "materiais" | "palavras" | "exercicios" | "simulados" | "roletas";
const OPCOES: [Secao, string][] = [
  ["tecnicas", "Técnicas"],
  ["fichas", "Fichas do Drive"],
  ["katas", "Katas"],
  ["materiais", "Materiais e PDFs"],
  ["palavras", "Palavras da roleta"],
  ["exercicios", "Exercícios físicos"],
  ["simulados", "Simulados"],
  ["ia", "✨ Gerar simulado com IA"],
  ["roletas", "Criar nova roleta"],
];

/** Tudo do Estudo do Judô, uma parte por vez. */
export default function AdminEstudoTudo() {
  const [s, setS] = useState<Secao>("tecnicas");
  return (
    <>
      <MenuSuspenso id="sub-estudo" rotulo="O que você quer editar?" valor={s} opcoes={OPCOES} onMudar={setS} />
      {s === "tecnicas" && <AdminTecnicas />}
      {s === "fichas" && <AdminFichas />}
      {s === "katas" && <AdminKatas />}
      {s === "materiais" && <AdminMateriais />}
      {(s === "palavras" || s === "exercicios" || s === "simulados") && <AdminEstudo secao={s} />}
      {s === "roletas" && <AdminRoletas />}
      {s === "ia" && <AdminIA />}
    </>
  );
}
