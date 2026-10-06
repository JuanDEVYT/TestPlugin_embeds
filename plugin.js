// Plugin de prueba para Kino: un solo enlace, resuelto con el navegador oculto.
// IMPORTANTE: la forma exacta de las filas/items de home() es una suposición
// (no pude leer /contract/). Corre `node sdk/validate.mjs .` y ajusta lo que
// el validador diga que Kino descartaría.

const EMBED =
  "https://bintv-sources.pages.dev/?id=aHR0cHM6Ly9ncmFuZGVteC5vcmcvYmludHYvcDU1NjJid20tMzI4NQ";

const CANAL = {
  id: "bintv-1",
  ref: "bintv-1",
  title: "BinTV (prueba)",
};

export async function home() {
  return [
    {
      title: "Prueba",
      items: [CANAL],
    },
  ];
}

export async function resolve(ref) {
  // Un solo canal: cualquier ref resuelve el mismo enlace.
  let page;
  try {
    page = await kino.browser.capture(EMBED, {
      timeoutMs: 22000,
      // match por defecto: .m3u8, .mpd, .mp4, master.txt, videoplayback, /hls/
    });
  } catch (e) {
    if (e && e.code === "blocked") {
      // La página pidió una persona (captcha) o no pasó la revisión.
      throw kino.error("unavailable", "blocked: el reproductor pide verificación");
    }
    if (e && e.code === "timeout") {
      throw kino.error("unavailable", "timeout: no apareció ninguna petición de video");
    }
    if (e && e.code === "browser_unavailable") {
      throw kino.error("unavailable", "este dispositivo no tiene navegador oculto");
    }
    throw e;
  }

  const media = page && page.media ? page.media : [];
  if (media.length === 0) {
    throw kino.error("not_found", "la página no pidió ningún video");
  }

  // Primero manifiestos (HLS/DASH), luego MP4: ya vienen ordenados.
  const [first, ...rest] = media;
  return {
    url: first.url,
    headers: first.headers, // Referer, Origin, User-Agent, Cookie...: devolverlos tal cual
    alternatives: rest.slice(0, 4).map((m) => ({
      url: m.url,
      headers: m.headers,
    })),
  };
}
