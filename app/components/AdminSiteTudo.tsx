"use client";

import { useState } from "react";
import AdminBackup from "./AdminBackup";
import AdminMenu from "./AdminMenu";
import AdminSite from "./AdminSite";
import MenuSuspenso from "./MenuSuspenso";

type Secao = "aparencia" | "menu" | "backup";

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
          ["backup", "Cópia de segurança"],
        ]}
      />
      {s === "aparencia" && <AdminSite />}
      {s === "menu" && <AdminMenu />}
      {s === "backup" && <AdminBackup />}
    </>
  );
}
