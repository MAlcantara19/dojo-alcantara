"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import { useEffect, useState } from "react";
import { getAuthInstance } from "./firebase";
import { lerPerfil, type Perfil } from "./auth";

export type EstadoAuth = { carregando: boolean; user: User | null; perfil: Perfil | null };

export function useAuth(): EstadoAuth {
  const [estado, setEstado] = useState<EstadoAuth>({ carregando: true, user: null, perfil: null });

  useEffect(() => {
    return onAuthStateChanged(getAuthInstance(), async (user) => {
      if (!user) {
        setEstado({ carregando: false, user: null, perfil: null });
        return;
      }
      let perfil: Perfil | null = null;
      try {
        perfil = await lerPerfil(user.uid);
      } catch {
        perfil = null;
      }
      setEstado({ carregando: false, user, perfil });
    });
  }, []);

  return estado;
}
