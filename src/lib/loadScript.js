/**
 * Cargador de scripts legacy (jsPDF, d3, pdfGenerator, Manual, etc.).
 *
 * ¿Por qué existe? En la versión AppScript cada página HTML cargaba sus
 * propias versiones por <script> (el Test usa jsPDF 3.0.3 y el Informe 2.5.1,
 * que no pueden convivir). En la SPA replicamos ese comportamiento cargando
 * cada set de scripts al entrar a la página y limpiándolos al salir,
 * sin modificar los JS originales.
 */

const loaded = new Map(); // src → Promise

export function loadScript(src) {
  if (loaded.has(src)) return loaded.get(src);
  const p = new Promise((resolve, reject) => {
    const el = document.createElement('script');
    el.src = src;
    el.async = false; // respeta el orden, igual que <script> clásico
    el.dataset.legacy = 'true';
    el.onload = () => resolve(src);
    el.onerror = () => {
      loaded.delete(src);
      el.remove();
      reject(new Error(`No se pudo cargar ${src}`));
    };
    document.body.appendChild(el);
  });
  loaded.set(src, p);
  return p;
}

/** Carga una lista en orden estricto. */
export async function loadScripts(list) {
  for (const src of list) await loadScript(src);
}

/**
 * Quita del documento los scripts legacy y los globales que registran,
 * para poder cargar otra versión (ej. jsPDF 2.5.1 vs 3.0.3) en otra página.
 */
export function unloadLegacyScripts(globals = []) {
  document.querySelectorAll('script[data-legacy="true"]').forEach((el) => el.remove());
  loaded.clear();
  for (const g of globals) {
    try {
      delete window[g];
    } catch {
      window[g] = undefined;
    }
  }
}
