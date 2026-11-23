import { useEffect, useRef } from 'react';

let counter = 0;

/**
 * Hace que el botón/gesto "atrás" de Android cierre la capa (modal, hoja inferior) en lugar de
 * salir de la página o de la app — así no se pierde lo que se estaba escribiendo en un formulario.
 *
 * Al montar empuja una entrada al historial marcada con un id propio; si el usuario retrocede,
 * se llama a `onBack`. Si la capa se cierra por otro medio (X, guardar), se retira esa entrada.
 * El push se difiere un tick para que el doble montaje de StrictMode no deje entradas huérfanas.
 */
export function useBackClose(onBack: () => void) {
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;

  useEffect(() => {
    const id = `layer-${++counter}`;
    let pushed = false;
    let poppedByUser = false;

    const timer = window.setTimeout(() => {
      window.history.pushState({ ...(window.history.state ?? {}), __layer: id }, '');
      pushed = true;
    }, 0);

    const onPop = () => {
      if (!pushed) return;
      if (window.history.state?.__layer !== id) {
        poppedByUser = true;
        window.removeEventListener('popstate', onPop);
        onBackRef.current();
      }
    };
    window.addEventListener('popstate', onPop);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('popstate', onPop);
      if (pushed && !poppedByUser && window.history.state?.__layer === id) {
        window.history.back();
      }
    };
  }, []);
}
