"use client";

import { useMemo } from "react";
import { galeria as galeriaPadrao } from "./data";
import { lerGaleria, lerPastaDrive, type FotoDoc, type FotoSite } from "./galeriaDb";
import { enderecoOk } from "./katasDb";
import { ehRefDb } from "./imagens";
import { idDaPastaDrive, imagemDireta, urlParaBaixar } from "./links";
import { useSite } from "./siteConfig";
import { useCarga } from "./useCarga";

const VAZIO_DB: FotoDoc[] = [];
const VAZIO_DRIVE: FotoSite[] = [];

/** Fotos do site: as cadastradas no painel + as da pasta do Drive (mais novas primeiro). */
export function useFotos() {
  const site = useSite();
  const db = useCarga(lerGaleria, VAZIO_DB);
  const pasta = idDaPastaDrive(site.drivePasta);
  const usaDrive = Boolean(pasta && site.driveChave);
  const drive = useCarga(() => lerPastaDrive(pasta, site.driveChave), VAZIO_DRIVE, usaDrive);

  const fotos = useMemo<FotoSite[]>(() => {
    const doBanco: FotoSite[] = db.dados
      .filter((f) => enderecoOk(f.url) && !/\/folders\//.test(f.url))
      .map((f) => ({ id: f.id, legenda: f.legenda, src: ehRefDb(f.url) ? f.url : imagemDireta(f.url), baixar: ehRefDb(f.url) ? undefined : urlParaBaixar(f.url), ts: f.ts }));
    const todas = [...doBanco, ...(usaDrive ? drive.dados : [])];
    if (todas.length === 0) return galeriaPadrao.map((f, i) => ({ id: "p" + i, legenda: f.legenda }));
    return todas.sort((a, b) => (b.ts ?? 0) - (a.ts ?? 0));
  }, [db.dados, drive.dados, usaDrive]);

  return { fotos, site, erroDrive: usaDrive && drive.erro };
}
