"use client";

import { useState, useSyncExternalStore } from "react";
import { useFotos } from "../lib/fotos";
import { idDaPastaDrive } from "../lib/links";
import { lerPastaDrive } from "../lib/galeriaDb";
import { useSite } from "../lib/siteConfig";
import { useCarga } from "../lib/useCarga";
import type { FotoSite } from "../lib/galeriaDb";
import Img from "./Img";
import Modal from "./Modal";
import TiltCard from "./TiltCard";

const DIA = 86400000;
const semAssinatura = () => () => {};
// Hora atual arredondada: vazia no servidor, valor real no navegador (evita erro de hidratação).
const agoraNoNavegador = () => Math.floor(Date.now() / 3600000) * 3600000;

function Foto({ f }: { f: FotoSite }) {
  return (
    <>
      {f.src && <Img src={f.src} alt={f.legenda} largura={700} />}
      <span className="tile-cap">{f.legenda}</span>
    </>
  );
}

function Ampliada({ f, onFechar }: { f: FotoSite; onFechar: () => void }) {
  return (
    <Modal titulo={f.legenda} onFechar={onFechar}>
      {f.src && <Img className="modal-img" src={f.src} alt={f.legenda} largura={1400} eager />}
      <h3 className="modal-titulo">{f.legenda}</h3>
      {f.baixar && (
        <a className="btn btn-primary" href={f.baixar} target="_blank" rel="noopener noreferrer" download>
          Baixar a foto
        </a>
      )}
      {!f.baixar && f.src?.startsWith("db:") && <p className="form-help">Foto do painel: para guardar, toque e segure na imagem.</p>}
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
  const [aberta, setAberta] = useState<FotoSite | null>(null);
  if (!id) return null;
  if (!site.driveChave) return <p className="form-help">As fotos aparecem aqui quando o administrador ligar o Google Drive na aba Site.</p>;
  return (
    <>
      {c.carregando && <p className="form-help">Carregando fotos…</p>}
      {c.erro && <p className="form-help">Não consegui carregar as fotos agora.</p>}
      {!c.carregando && !c.erro && c.dados.length === 0 && <p className="form-help">{vazio}</p>}
      <div className="grid">
        {c.dados.map((f) => (
          <TiltCard key={f.id} className="foto-card" onClick={() => setAberta(f)} rotulo={`Abrir a foto ${f.legenda}`}>
            <Foto f={f} />
          </TiltCard>
        ))}
      </div>
      {aberta && <Ampliada f={aberta} onFechar={() => setAberta(null)} />}
    </>
  );
}
