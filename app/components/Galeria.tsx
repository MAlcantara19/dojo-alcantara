"use client";

import { useState, useSyncExternalStore } from "react";
import { useFotos } from "../lib/fotos";
import type { FotoSite } from "../lib/galeriaDb";
import Modal from "./Modal";
import TiltCard from "./TiltCard";

const DIA = 86400000;
const semAssinatura = () => () => {};
// Hora atual arredondada: vazia no servidor, valor real no navegador (evita erro de hidratação).
const agoraNoNavegador = () => Math.floor(Date.now() / 3600000) * 3600000;

function Foto({ f }: { f: FotoSite }) {
  return (
    <>
      {f.src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={f.src} alt={f.legenda} loading="lazy" referrerPolicy="no-referrer" onError={(e) => (e.currentTarget.style.display = "none")} />
      )}
      <span className="tile-cap">{f.legenda}</span>
    </>
  );
}

function Ampliada({ f, onFechar }: { f: FotoSite; onFechar: () => void }) {
  return (
    <Modal titulo={f.legenda} onFechar={onFechar}>
      {f.src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="modal-img" src={f.src} alt={f.legenda} referrerPolicy="no-referrer" />
      )}
      <h3 className="modal-titulo">{f.legenda}</h3>
      {f.baixar && (
        <a className="btn btn-primary" href={f.baixar} target="_blank" rel="noopener noreferrer" download>
          Baixar a foto
        </a>
      )}
    </Modal>
  );
}

/** Fotos postadas nos últimos dias, em destaque no começo da página. */
export function DestaqueFotos() {
  const { fotos, site } = useFotos();
  const [aberta, setAberta] = useState<FotoSite | null>(null);
  const agora = useSyncExternalStore(semAssinatura, agoraNoNavegador, () => 0);
  const limite = agora - site.diasDestaque * DIA;
  const novas = fotos.filter((f) => f.src && (f.ts ?? 0) > limite).slice(0, 8);
  if (agora === 0 || novas.length === 0) return null;
  return (
    <section className="block destaque" id="novidades">
      <h2>Fotos novas</h2>
      <p className="lead">Postadas nos últimos {site.diasDestaque} dias.</p>
      <div className="carrossel">
        {novas.map((f) => (
          <TiltCard key={f.id} className="foto-card" onClick={() => setAberta(f)} rotulo={`Abrir a foto ${f.legenda}`}>
            <em className="selo">novo</em>
            <Foto f={f} />
          </TiltCard>
        ))}
      </div>
      {aberta && <Ampliada f={aberta} onFechar={() => setAberta(null)} />}
    </section>
  );
}

export function GaleriaGrid() {
  const { fotos, erroDrive } = useFotos();
  const [aberta, setAberta] = useState<FotoSite | null>(null);
  return (
    <>
      <div className="grid">
        {fotos.map((f) => (
          <TiltCard key={f.id} className="foto-card" onClick={f.src ? () => setAberta(f) : undefined} rotulo={f.src ? `Abrir a foto ${f.legenda}` : undefined}>
            <Foto f={f} />
          </TiltCard>
        ))}
      </div>
      {erroDrive && <p className="form-help">Não consegui carregar a pasta do Drive agora.</p>}
      {aberta && <Ampliada f={aberta} onFechar={() => setAberta(null)} />}
    </>
  );
}
