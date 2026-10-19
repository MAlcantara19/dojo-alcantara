export type LinkItem = { titulo: string; url: string };

/** Escolhe o ícone e o nome padrão do botão conforme o endereço (YouTube, Drive, PDF…). */
export function descreverLink(url: string): { icone: string; rotulo: string } {
  let host = "";
  try {
    host = new URL(url, "https://exemplo.local").hostname.replace(/^www\./, "");
  } catch {}
  if (/(^|\.)youtube\.com$|^youtu\.be$/.test(host)) return { icone: "▶", rotulo: "YouTube" };
  if (/(^|\.)drive\.google\.com$|(^|\.)docs\.google\.com$/.test(host)) return { icone: "📁", rotulo: "Drive" };
  if (/\.pdf($|\?)/i.test(url)) return { icone: "📄", rotulo: "PDF" };
  return { icone: "🔗", rotulo: "Link" };
}

/** "Título | https://…" por linha (ou só o endereço) vira lista de links. */
export function lerLinksDoTexto(texto: string): LinkItem[] {
  return texto
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [a, b] = l.includes("|") ? [l.slice(0, l.indexOf("|")).trim(), l.slice(l.indexOf("|") + 1).trim()] : ["", l];
      return { titulo: a, url: b };
    });
}

export const linksParaTexto = (links: LinkItem[] | undefined) => (links ?? []).map((l) => (l.titulo ? `${l.titulo} | ${l.url}` : l.url)).join("\n");

/* ---------- Imagens do Google Drive ---------- */
/** Extrai o código do arquivo de um link de compartilhamento do Drive. */
export function idDoDrive(url: string): string | null {
  const m = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:[^#]*&)?id=|thumbnail\?(?:[^#]*&)?id=)([\w-]{10,})/);
  return m ? m[1] : null;
}

/** Link de compartilhamento do Drive vira um endereço que o navegador consegue exibir como imagem. */
export function imagemDireta(url: string, largura = 1000): string {
  const id = idDoDrive(url);
  return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w${largura}` : url;
}

export function urlParaBaixar(url: string): string {
  const id = idDoDrive(url);
  return id ? `https://drive.google.com/uc?export=download&id=${id}` : url;
}

/** Aceita o link da pasta ou só o código dela. */
export function idDaPastaDrive(entrada: string): string {
  const m = entrada.match(/folders\/([\w-]+)/) ?? entrada.match(/[?&]id=([\w-]+)/);
  return (m ? m[1] : entrada).trim();
}
