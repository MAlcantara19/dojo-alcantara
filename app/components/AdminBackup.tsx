"use client";

import { collection, getDocs } from "firebase/firestore";
import { useState } from "react";
import { getDb } from "../lib/firebase";
import { hojeISO } from "../lib/aluno";

const COLECOES = ["users", "turmas", "avisos", "avisosTurma", "eventos", "eventosInternos", "feriados", "calendariosOficiais", "chamadas", "campeonatos", "resultados", "mensalidades", "experimentais", "sugestoes", "tecnicas", "palavras", "listasPalavras", "exercicios", "simulados", "katas", "materiais", "roletas", "parcerias", "galeria", "config", "aniversarios"];
const SUB_USUARIO = ["medidas", "campeonatos", "checklist", "galeria", "simulados"];

/** Baixa um arquivo com tudo do banco (menos as imagens enviadas, que são grandes). */
export default function AdminBackup() {
  const [msg, setMsg] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function baixar() {
    setOcupado(true);
    const db = getDb();
    const tudo: Record<string, Record<string, unknown>> = {};
    try {
      for (const c of COLECOES) {
        setMsg(`Lendo ${c}…`);
        const snap = await getDocs(collection(db, c)).catch(() => null);
        if (!snap) continue;
        tudo[c] = Object.fromEntries(snap.docs.map((d) => [d.id, d.data()]));
        if (c === "campeonatos")
          for (const d of snap.docs) {
            const ins = await getDocs(collection(db, "campeonatos", d.id, "inscritos")).catch(() => null);
            if (ins) (tudo[c][d.id] as Record<string, unknown>).__inscritos = Object.fromEntries(ins.docs.map((x) => [x.id, x.data()]));
          }
      }
      const usuarios = Object.keys(tudo.users ?? {});
      for (const [i, uid] of usuarios.entries()) {
        setMsg(`Lendo dados dos alunos (${i + 1} de ${usuarios.length})…`);
        for (const s of SUB_USUARIO) {
          const snap = await getDocs(collection(db, "users", uid, s)).catch(() => null);
          if (snap && snap.size) ((tudo.users[uid] as Record<string, unknown>)["__" + s] = Object.fromEntries(snap.docs.map((d) => [d.id, d.data()])));
        }
      }
      const url = URL.createObjectURL(new Blob([JSON.stringify(tudo, null, 1)], { type: "application/json" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `copia-dojo-alcantara-${hojeISO()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 3000);
      setMsg(`Cópia baixada (${Object.keys(tudo).length} coleções, ${usuarios.length} pessoas). Guarde no Drive ou num pen drive.`);
    } catch {
      setMsg("Não consegui terminar a cópia. Tente de novo com uma internet melhor.");
    }
    setOcupado(false);
  }

  return (
    <section className="panel">
      <h2>Cópia de segurança</h2>
      <p className="lead">Baixa um arquivo com tudo: alunos, turmas, chamadas, campeonatos, resultados, conteúdos e configurações. Faça uma vez por mês e guarde em lugar seguro.</p>
      <p className="form-help">O arquivo tem dados pessoais dos alunos: não mande para ninguém. As fotos enviadas pelo celular não entram (ficariam pesadas demais); as do Drive já estão guardadas no Drive.</p>
      <button type="button" className="btn btn-primary" disabled={ocupado} onClick={() => void baixar()}>
        💾 Baixar cópia de segurança
      </button>
      {msg && (
        <p className="form-note" role="status">
          {msg}
        </p>
      )}
    </section>
  );
}
