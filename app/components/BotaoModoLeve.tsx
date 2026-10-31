"use client";

import { definirPrefLeve, internetLenta, useModoLeve, type PrefLeve } from "../lib/leve";

/** Escolha do modo leve no menu lateral. */
export default function BotaoModoLeve() {
  const { pref, ativo } = useModoLeve();
  const proximo: Record<PrefLeve, PrefLeve> = { auto: "on", on: "off", off: "auto" };
  const texto = pref === "on" ? "ligado" : pref === "off" ? "desligado" : `automático${ativo ? " (ligado: internet lenta)" : ""}`;
  return (
    <button type="button" className="drawer-leve" onClick={() => definirPrefLeve(proximo[pref])} title={internetLenta() ? "Sua internet parece lenta agora" : ""}>
      📶 Economizar dados: <b>{texto}</b>
    </button>
  );
}
