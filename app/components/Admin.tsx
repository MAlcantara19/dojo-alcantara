"use client";

import { signOut } from "firebase/auth";
import { useState } from "react";
import { ehEquipe } from "../lib/auth";
import { getAuthInstance } from "../lib/firebase";
import { useResultadosEquipe } from "../lib/resultados";
import { useAuth } from "../lib/useAuth";
import AdminAlunos from "./AdminAlunos";
import AdminAulas from "./AdminAulas";
import AdminEstudo from "./AdminEstudo";
import AdminGaleria from "./AdminGaleria";
import AdminKatas from "./AdminKatas";
import AdminMural from "./AdminMural";
import AdminResultados from "./AdminResultados";
import AdminTecnicas from "./AdminTecnicas";
import LoginForm from "./LoginForm";

type Aba = "mural" | "alunos" | "aulas" | "conteudo" | "estudo" | "resultados";

export default function Admin() {
  const { carregando, user, perfil } = useAuth();

  if (carregando) return <p className="form-help">Verificando seu acesso…</p>;

  if (!user) {
    return (
      <>
        <p className="lead">Entre com a conta de professor para editar o site.</p>
        <LoginForm destino="/admin" />
      </>
    );
  }

  if (!ehEquipe(perfil)) {
    return (
      <>
        <p className="notice" role="alert">
          Esta conta não tem permissão de professor. Se isso é um engano, peça ao administrador para liberar o seu acesso.
        </p>
        <button className="btn btn-ghost" onClick={() => signOut(getAuthInstance())}>
          Sair
        </button>
      </>
    );
  }

  return <Painel nome={perfil?.nome ?? user.email ?? "professor"} uid={user.uid} ehAdmin={perfil?.papel === "admin"} />;
}

function Painel({ nome, uid, ehAdmin }: { nome: string; uid: string; ehAdmin: boolean }) {
  const [aba, setAba] = useState<Aba>("mural");
  const res = useResultadosEquipe();

  const abas: [Aba, string][] = [
    ["mural", "Mural"],
    ["alunos", "Alunos"],
    ["aulas", "Aulas"],
    ["conteudo", "Conteúdo"],
    ["estudo", "Estudo"],
    ["resultados", res.novos > 0 ? `Resultados (${res.novos})` : "Resultados"],
  ];

  return (
    <>
      <div className="admin-top">
        <p className="lead">Olá, {nome}. O que você publicar aparece no site na hora.</p>
        <button className="btn btn-ghost" onClick={() => signOut(getAuthInstance())}>
          Sair
        </button>
      </div>

      {res.novos > 0 && aba !== "resultados" && (
        <button className="aviso-novo" onClick={() => setAba("resultados")}>
          🔔 {res.novos} {res.novos === 1 ? "simulado novo foi concluído" : "simulados novos foram concluídos"}. Ver resultados
        </button>
      )}

      <div className="tabs tabs-scroll" role="tablist" aria-label="Seções do painel">
        {abas.map(([k, r]) => (
          <button key={k} role="tab" aria-selected={aba === k} onClick={() => setAba(k)}>
            {r}
          </button>
        ))}
      </div>

      <div className="aba" key={aba}>
        {aba === "mural" && <AdminMural />}
        {aba === "alunos" && <AdminAlunos ehAdmin={ehAdmin} />}
        {aba === "aulas" && <AdminAulas uid={uid} />}
        {aba === "conteudo" && (
          <>
            <AdminTecnicas />
            <AdminKatas />
            <AdminGaleria />
          </>
        )}
        {aba === "estudo" && <AdminEstudo />}
        {aba === "resultados" && <AdminResultados itens={res.dados} carregando={res.carregando} erro={res.erro} visto={res.visto} marcarVisto={res.marcarVisto} />}
      </div>
    </>
  );
}
