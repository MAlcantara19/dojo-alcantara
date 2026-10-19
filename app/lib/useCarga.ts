"use client";

import { useCallback, useEffect, useState } from "react";

/** Carrega dados (uma função assíncrona) e deixa recarregar quando precisar. */
export function useCarga<T>(carregar: () => Promise<T>, inicial: T, ativo = true) {
  const [dados, setDados] = useState<T>(inicial);
  const [carregando, setCarregando] = useState(ativo);
  const [erro, setErro] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!ativo) return;
    let vivo = true;
    carregar()
      .then((r) => {
        if (!vivo) return;
        setDados(r);
        setErro(false);
        setCarregando(false);
      })
      .catch(() => {
        if (!vivo) return;
        setErro(true);
        setCarregando(false);
      });
    return () => {
      vivo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ativo]);

  const recarregar = useCallback(() => setTick((t) => t + 1), []);
  return { dados, carregando, erro, recarregar };
}
