"use client";

import { useEffect, useState } from "react";

type EventoInstalar = Event & { prompt: () => Promise<void> };

/** Botão “Instalar o app”: no Android aparece quando o navegador permite; no iPhone mostra como fazer. */
export default function InstalarApp() {
  const [evento, setEvento] = useState<EventoInstalar | null>(null);
  const [dicaIphone, setDicaIphone] = useState(false);
  const [instalado, setInstalado] = useState(false);

  useEffect(() => {
    const pegar = (e: Event) => {
      e.preventDefault();
      setEvento(e as EventoInstalar);
    };
    const feito = () => setInstalado(true);
    window.addEventListener("beforeinstallprompt", pegar);
    window.addEventListener("appinstalled", feito);
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    const iphone = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const t = setTimeout(() => {
      setInstalado(standalone);
      setDicaIphone(iphone && !standalone);
    }, 0);
    return () => {
      clearTimeout(t);
      window.removeEventListener("beforeinstallprompt", pegar);
      window.removeEventListener("appinstalled", feito);
    };
  }, []);

  if (instalado) return null;
  if (evento)
    return (
      <button type="button" className="drawer-instalar" onClick={() => void evento.prompt().then(() => setEvento(null))}>
        📲 Instalar o app no celular
      </button>
    );
  if (dicaIphone) return <p className="drawer-dica">📲 Para instalar: toque em Compartilhar (□↑) e depois em “Adicionar à Tela de Início”.</p>;
  return null;
}
