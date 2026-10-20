"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { siglaDe, useSite } from "../lib/siteConfig";
import Img from "./Img";

/** Rodapé do site: marca, atalhos, contato e selos de confiança. */
export default function Rodape() {
  const site = useSite();
  const ano = useSyncExternalStore(
    () => () => {},
    () => new Date().getFullYear(),
    () => 2026,
  );
  return (
    <footer className="rodape">
      <div className="rodape-grade">
        <div className="rodape-marca">
          <div className="logo logo-sm" aria-hidden="true">
            {site.logoUrl ? <Img src={site.logoUrl} alt="" largura={200} /> : <span>{siglaDe(site.nome)}</span>}
          </div>
          <strong>{site.nome}</strong>
          <p>{site.slogan}</p>
        </div>
        <nav aria-label="Atalhos do rodapé">
          <h3>Navegar</h3>
          <Link href="/">Início</Link>
          <Link href="/calendario">Calendário</Link>
          <Link href="/galeria">Galeria</Link>
          <Link href="/estudo">Estudo do Judô</Link>
          <Link href="/entrar">Entrar</Link>
        </nav>
        <div>
          <h3>Contato</h3>
          {site.whatsapp && (
            <a href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noopener noreferrer">
              💬 WhatsApp
            </a>
          )}
          {site.instagram && (
            <a href={`https://instagram.com/${site.instagram}`} target="_blank" rel="noopener noreferrer">
              📷 Instagram
            </a>
          )}
          {site.emailContato && <a href={`mailto:${site.emailContato}`}>✉️ {site.emailContato}</a>}
          {!site.whatsapp && !site.instagram && !site.emailContato && <small>Em breve.</small>}
        </div>
        <div>
          <h3>Segurança</h3>
          <ul className="selos">
            <li>🔒 Conexão segura (HTTPS)</li>
            <li>🛡️ Dados protegidos e acesso por senha</li>
            <li>👨‍👩‍👧 Cuidado com os dados de crianças</li>
          </ul>
          <Link href="/privacidade">Política de privacidade (LGPD)</Link>
        </div>
      </div>
      <p className="rodape-fim">
        © {ano} {site.nome}. Todos os direitos reservados.
      </p>
    </footer>
  );
}
