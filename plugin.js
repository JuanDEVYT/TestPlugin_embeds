// Plugin de prueba para Kino: un solo canal en vivo, resuelto con el navegador oculto.

const EMBED =
  "https://bintv-sources.pages.dev/?id=aHR0cHM6Ly9ncmFuZGVteC5vcmcvYmludHYvcDU1NjJid20tMzI4NQ";

const CANAL = { id: "bintv-1", title: "BinTV (prueba)", number: 1 };

// Fila en Inicio (ítem kind: "live", apiVersion 6).
export async function home() {
  return [
    {
      id: "en-vivo",
      title: "En vivo",
      items: [{ id: CANAL.id, ref: CANAL.id, title: CANAL.title, kind: "live" }],
    },
  ];
}

// Pestaña En vivo (capacidad "channels", apiVersion 3).
export async function liveCategories() {
  return [{ id: "prueba", title: "Prueba" }];
}

export async function liveChannels({ categoryId }) {
  if (categoryId !== "prueba") return { items: [] };
  return {
    items: [
      {
        id: CANAL.id,
        title: CANAL.title,
        number: CANAL.number,
        categoryId: "prueba",
        ref: CANAL.id,
      },
    ],
  };
}

// Un solo canal: cualquier ref resuelve el mismo enlace.
export async function resolve(ref) {
  let page;
  try {
    page = await kino.browser.capture(EMBED, { timeoutMs: 22000 });
  } catch (e) {
    if (e && e.code === "blocked") {
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

  const [first] = media; // manifiestos (HLS/DASH) primero
  return {
    url: first.url,
    headers: first.headers, // Referer, Origin, User-Agent, Cookie: tal cual
  };
}
