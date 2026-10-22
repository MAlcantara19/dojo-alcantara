"use client";

import { useState } from "react";
import AdminMenu from "./AdminMenu";
import AdminParcerias from "./AdminParcerias";
import AdminSite from "./AdminSite";
import MenuSuspenso from "./MenuSuspenso";

type Secao = "aparencia" | "menu" | "parcerias";

export default function AdminSiteTudo() {
  const [s, setS] = useState<Secao>("aparencia");
  return (
    <>
      <MenuSuspenso
        id="sub-site"
        rotulo="O que você quer editar?"
        valor={s}
        onMudar={setS}
        opcoes={[
          ["aparencia", "Aparência, contatos, fotos e Drive"],
          ["menu", "Menu lateral"],
          ["parcerias", "Parcerias e descontos"],
        ]}
      />
      {s === "aparencia" && <AdminSite />}
      {s === "menu" && <AdminMenu />}
      {s === "parcerias" && <AdminParcerias />}
    </>
  );
}
