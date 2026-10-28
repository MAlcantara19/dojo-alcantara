"use client";

import { useEffect, useRef, useState } from "react";
import { ehRefDb, lerImagemDb } from "../lib/imagens";
import { imagemDireta } from "../lib/links";

const VAZIA = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

/** Imagem do site: aceita endereço https, arquivo /img/..., link do Drive ou foto enviada (db:…). */
export default function Img({ src, alt, className, largura = 1000, eager = false, style }: { src: string; alt: string; className?: string; largura?: number; eager?: boolean; style?: React.CSSProperties }) {
  const ref = useRef<HTMLImageElement>(null);
  const [db, setDb] = useState<{ ref: string; url: string } | null>(null);
  const [falhou, setFalhou] = useState(false);

  useEffect(() => {
    if (!ehRefDb(src)) return;
    let vivo = true;
    const buscar = () =>
      lerImagemDb(src).then((u) => {
        if (vivo && u) setDb({ ref: src, url: u });
      });
    if (eager || typeof IntersectionObserver === "undefined" || !ref.current) {
      void buscar();
      return () => {
        vivo = false;
      };
    }
    const obs = new IntersectionObserver(
      (es) => {
        if (es.some((e) => e.isIntersecting)) {
          obs.disconnect();
          void buscar();
        }
      },
      { rootMargin: "200px" },
    );
    obs.observe(ref.current);
    return () => {
      vivo = false;
      obs.disconnect();
    };
  }, [src, eager]);

  if (falhou) return null;
  const url = ehRefDb(src) ? (db && db.ref === src ? db.url : VAZIA) : imagemDireta(src, largura);
  // eslint-disable-next-line @next/next/no-img-element
  return <img ref={ref} src={url} alt={alt} className={className} style={style} loading={eager ? "eager" : "lazy"} decoding="async" referrerPolicy="no-referrer" onError={() => setFalhou(true)} />;
}

/** Para fundos (banner): devolve o endereço pronto para usar em CSS, ou "" enquanto carrega. */
export function useImagemUrl(src: string, largura = 1600): string {
  const [db, setDb] = useState<{ ref: string; url: string } | null>(null);
  useEffect(() => {
    if (!ehRefDb(src)) return;
    let vivo = true;
    void lerImagemDb(src).then((u) => {
      if (vivo && u) setDb({ ref: src, url: u });
    });
    return () => {
      vivo = false;
    };
  }, [src]);
  if (!src) return "";
  return ehRefDb(src) ? (db && db.ref === src ? db.url : "") : imagemDireta(src, largura);
}
