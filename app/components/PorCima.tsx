"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

const nada = () => () => {};
/** Coloca a janela direto no corpo da página: abre sempre por cima de tudo, no topo da tela (inclusive no celular). */
export default function PorCima({ children }: { children: React.ReactNode }) {
  const noNavegador = useSyncExternalStore(nada, () => true, () => false);
  return noNavegador ? createPortal(children, document.body) : null;
}
