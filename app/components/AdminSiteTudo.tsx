"use client";

import { useState } from "react";
import AdminMenu from "./AdminMenu";
import AdminSite from "./AdminSite";
import MenuSuspenso from "./MenuSuspenso";

type Secao = "aparencia" | "menu";

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
        ]}
      />
      {s === "aparencia" && <AdminSite />}
      {s === "menu" && <AdminMenu />}
    </>
  );
}
