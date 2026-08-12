import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Garante que toda navegação entre rotas (ex.: abrir a página de um produto a
 * partir de uma lista rolada) comece sempre do topo, em vez de manter a
 * posição de scroll da página anterior (o que fazia a nova página abrir já
 * mostrando o footer). Usa `document.documentElement`/`body` diretamente para
 * pular o `scroll-behavior: smooth` global e o salto ser instantâneo.
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0; // Safari
  }, [pathname]);

  return null;
}