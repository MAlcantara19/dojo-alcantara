"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useFotos } from "../lib/fotos";
import { idDaPastaDrive } from "../lib/links";
import { lerPastaDrive } from "../lib/galeriaDb";
import { useSite } from "../lib/siteConfig";
import { useCarga } from "../lib/useCarga";
import type { FotoSite } from "../lib/galeriaDb";
import Img from "./Img";
import TiltCard from "./TiltCard";

const DIA = 86400000;
const semAssinatura = () => () => {};
// Hora atual arredondada: vazia no servidor, valor real no navegador (evita erro de hidratação).
const agoraNoNavegador = () => Math.floor(Date.now() / 3600000) * 3600000;

function Foto({ f }: { f: FotoSite }) {
  return <>{f.src && <Img src={f.src} alt="Foto da galeria" largura={500} />}</>;
}

/** Foto em tela cheia, com anterior/próxima (botões, setas do teclado ou deslizar o dedo). */
function Visualizador({ fotos, inicio, onFechar }: { fotos: FotoSite[]; inicio: number; onFechar: () => void }) {
  const [i, setI] = useState(inicio);
  const [toque, setToque] = useState<number | null>(null);
  const f = fotos[i];
  const ir = (d: number) => setI((x) => (x + d + fotos.length) % fotos.length);

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFechar();
      if (e.key === "ArrowRight") setI((x) => (x + 1) % fotos.length);
      if (e.key === "ArrowLeft") setI((x) => (x - 1 + fotos.length) % fotos.length);
    };
    document.addEventListener("keydown", tecla);
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", tecla);
      document.body.style.overflow = antes;
    };
  }, [fotos.length, onFechar]);

  if (!f) return null;
  return (
    <div
      className="visualizador"
      role="dialog"
      aria-modal="true"
      aria-label={`Foto ${i + 1} de ${fotos.length}`}
      onClick={(e) => e.target === e.currentTarget && onFechar()}
      onTouchStart={(e) => setToque(e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (toque === null) return;
        const dx = e.changedTouches[0].clientX - toque;
        if (Math.abs(dx) > 50) ir(dx < 0 ? 1 : -1);
        setToque(null);
      }}
    >
      <div className="vis-topo">
        <span>
          {i + 1} de {fotos.length}
        </span>
        <span className="vis-acoes">
          {f.baixar && (
            <a href={f.baixar} target="_blank" rel="noopener noreferrer" download aria-label="Baixar a foto">
              ⬇
            </a>
          )}
          <button type="button" onClick={onFechar} aria-label="Fechar">
            ✕
          </button>
        </span>
      </div>
      {f.src && <Img key={f.id} className="vis-img" src={f.src} alt={`Foto ${i + 1} de ${fotos.length}`} largura={1600} eager />}
      {fotos.length > 1 && (
        <>
          <button type="button" className="vis-seta esq" onClick={() => ir(-1)} aria-label="Foto anterior">
            ‹
          </button>
          <button type="button" className="vis-seta dir" onClick={() => ir(1)} aria-label="Próxima foto">
            ›
          </button>
        </>
      )}
    </div>
  );
}

/** Grade de miniaturas quadradas (3 por linha no celular), sem títulos, com “Ver mais”. */
export function GradeFotos({ fotos, porVez = 24 }: { fotos: FotoSite[]; porVez?: number }) {
  const [mostrar, setMostrar] = useState(porVez);
  const [aberta, setAberta] = useState<number | null>(null);
  const comImagem = fotos.filter((f) => f.src);
  return (
    <>
      <div className="galeria-grade">
        {comImagem.slice(0, mostrar).map((f, k) => (
          <button key={f.id} type="button" className="galeria-mini" onClick={() => setAberta(k)} aria-label={`Abrir a foto ${k + 1}`}>
            <Foto f={f} />
          </button>
        ))}
      </div>
      {comImagem.length > mostrar && (
        <p className="tool-actions">
          <button type="button" className="btn btn-ghost" onClick={() => setMostrar((m) => m + porVez)}>
            Ver mais fotos ({comImagem.length - mostrar})
          </button>
        </p>
      )}
      {aberta !== null && <Visualizador fotos={comImagem} inicio={aberta} onFechar={() => setAberta(null)} />}
    </>
  );
}

/** Fotos postadas nos últimos dias, em destaque no começo da página. */
export function DestaqueFotos() {
  const { fotos, site } = useFotos();
  const [aberta, setAberta] = useState<number | null>(null);
  const agora = useSyncExternalStore(semAssinatura, agoraNoNavegador, () => 0);
  const limite = agora - site.diasDestaque * DIA;
  const novas = fotos.filter((f) => f.src && (f.ts ?? 0) > limite).slice(0, 8);
  if (agora === 0 || novas.length === 0) return null;
  return (
    <section className="block destaque" id="novidades">
      <h2>Fotos novas</h2>
      <p className="lead">Postadas nos últimos {site.diasDestaque} dias.</p>
      <div className="carrossel">
        {novas.map((f, k) => (
          <TiltCard key={f.id} className="foto-card" onClick={() => setAberta(k)} rotulo={`Abrir a foto nova ${k + 1}`}>
            <em className="selo">novo</em>
            <Foto f={f} />
          </TiltCard>
        ))}
      </div>
      {aberta !== null && <Visualizador fotos={novas} inicio={aberta} onFechar={() => setAberta(null)} />}
    </section>
  );
}

export function GaleriaGrid({ porVez = 24 }: { porVez?: number }) {
  const { fotos, erroDrive } = useFotos();
  return (
    <>
      <GradeFotos fotos={fotos} porVez={porVez} />
      {erroDrive && <p className="form-help">Não consegui carregar a pasta do Drive agora.</p>}
    </>
  );
}

const VAZIO_F: FotoSite[] = [];
const cachePasta = new Map<string, Promise<FotoSite[]>>();
function fotosDaPasta(pasta: string, chave: string) {
  const k = pasta + "|" + chave;
  let p = cachePasta.get(k);
  if (!p) {
    p = lerPastaDrive(pasta, chave);
    p.catch(() => cachePasta.delete(k));
    cachePasta.set(k, p);
  }
  return p;
}

/** Fotos de uma pasta do Drive (por exemplo, o álbum de uma aula ou de um campeonato). */
export function FotosDaPasta({ pasta, vazio = "Ainda não há fotos nesta pasta." }: { pasta: string; vazio?: string }) {
  const site = useSite();
  const id = idDaPastaDrive(pasta);
  const usa = Boolean(id && site.driveChave);
  const c = useCarga(() => fotosDaPasta(id, site.driveChave), VAZIO_F, usa);
  if (!id) return null;
  if (!site.driveChave) return <p className="form-help">As fotos aparecem aqui quando o administrador ligar o Google Drive na aba Site.</p>;
  return (
    <>
      {c.carregando && <p className="form-help">Carregando fotos…</p>}
      {c.erro && <p className="form-help">Não consegui carregar as fotos agora.</p>}
      {!c.carregando && !c.erro && c.dados.length === 0 && <p className="form-help">{vazio}</p>}
      <GradeFotos fotos={c.dados} />
    </>
  );
}
