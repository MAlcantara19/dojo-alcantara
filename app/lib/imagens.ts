import { addDoc, collection, doc, getDoc } from "firebase/firestore";
import { getDb } from "./firebase";

/* Imagens enviadas pelo celular ficam no próprio banco (coleção "imagens"), já reduzidas.
   No site elas aparecem como "db:CÓDIGO" no lugar do endereço da imagem. */

export const ehRefDb = (v: string | undefined | null): v is string => typeof v === "string" && /^db:[A-Za-z0-9]{8,40}$/.test(v);

const LIMITE = 700000; // caracteres do arquivo já reduzido (o Firestore aceita até ~1 MB por registro)

function carregar(file: File): Promise<HTMLImageElement> {
  return new Promise((ok, erro) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      ok(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      erro(new Error("imagem-invalida"));
    };
    img.src = url;
  });
}

/** Reduz a foto (lado maior até 1200 px, JPEG) até caber no limite. */
export async function prepararImagem(file: File, maxLado = 1200): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("nao-e-imagem");
  const img = await carregar(file);
  let lado = maxLado;
  for (let tentativa = 0; tentativa < 5; tentativa++) {
    const escala = Math.min(1, lado / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(img.width * escala));
    c.height = Math.max(1, Math.round(img.height * escala));
    const ctx = c.getContext("2d");
    if (!ctx) throw new Error("sem-canvas");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0, c.width, c.height);
    for (const q of [0.82, 0.7, 0.58]) {
      const dados = c.toDataURL("image/jpeg", q);
      if (dados.length <= LIMITE) return dados;
    }
    lado = Math.round(lado * 0.75);
  }
  throw new Error("muito-grande");
}

export async function enviarImagem(dados: string): Promise<string> {
  const r = await addDoc(collection(getDb(), "imagens"), { dados, ts: Date.now() });
  return `db:${r.id}`;
}

const cache = new Map<string, Promise<string | null>>();
/** Lê a imagem do banco uma vez só por visita (ela fica guardada na memória). */
export function lerImagemDb(ref: string): Promise<string | null> {
  let p = cache.get(ref);
  if (!p) {
    p = getDoc(doc(getDb(), "imagens", ref.slice(3)))
      .then((s) => (s.exists() ? String((s.data() as { dados?: string }).dados ?? "") || null : null))
      .catch(() => null);
    cache.set(ref, p);
  }
  return p;
}

export function mensagemUpload(e: unknown): string {
  const m = e instanceof Error ? e.message : "";
  if (m === "nao-e-imagem") return "Esse arquivo não é uma imagem.";
  if (m === "muito-grande") return "A imagem ficou grande demais mesmo depois de reduzir. Escolha outra.";
  if (m === "imagem-invalida") return "Não consegui abrir essa imagem. Tente outra (JPG ou PNG).";
  const code = typeof e === "object" && e && "code" in e ? String((e as { code: unknown }).code) : "";
  if (code === "permission-denied") return "Sem permissão para enviar. Publique as regras novas (firestore.rules) no Firebase.";
  return "Não consegui enviar a imagem. Confira a internet e tente de novo.";
}
