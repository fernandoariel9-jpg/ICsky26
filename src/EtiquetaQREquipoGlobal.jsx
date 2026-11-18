import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import QRCode from "qrcode";

const FRONTEND_PUBLICO = "https://icsky26.onrender.com";
const ESCALA_IMPRESION = 2;
const ANCHO_LOGICO = 472;  // 40 mm a 300 dpi
const ALTO_LOGICO = 591;   // 50 mm a 300 dpi
const ANCHO = ANCHO_LOGICO * ESCALA_IMPRESION; // render a ~600 dpi
const ALTO = ALTO_LOGICO * ESCALA_IMPRESION;

function obtenerSerieDesdeFicha() {
  const botones = Array.from(document.querySelectorAll("button"));
  const editar = botones.find((b) => b.textContent?.includes("Editar equipo"));
  const tarjeta = editar?.closest(".bg-white.shadow.rounded-xl");
  if (!tarjeta) return { portal: null, serie: "" };

  const parrafos = Array.from(tarjeta.querySelectorAll("p"));
  const lineaSerie = parrafos.find((p) => /^Serie:/i.test((p.textContent || "").trim()));
  const obtenerDato = (etiqueta) => {
    const linea = parrafos.find((p) => new RegExp(`^${etiqueta}:`, "i").test((p.textContent || "").trim()));
    return (linea?.textContent || "").replace(new RegExp(`^${etiqueta}:\\s*`, "i"), "").trim();
  };
  const serie = (lineaSerie?.textContent || "").replace(/^Serie:\s*/i, "").trim();
  const portal = editar?.parentElement || null;
  return { portal, serie, descripcion: obtenerDato("Equipo"), marcaModelo: obtenerDato("Marca") };
}

function cargarImagen(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function generarEtiqueta(serie, datos = {}) {
  const urlPublica = `${FRONTEND_PUBLICO}/equipo/${encodeURIComponent(serie)}`;
  const qrDataUrl = await QRCode.toDataURL(urlPublica, {
    errorCorrectionLevel: "H",
    margin: 4,
    width: 900,
    color: { dark: "#000000", light: "#ffffff" }
  });

  const qr = await cargarImagen(qrDataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = ANCHO;
  canvas.height = ALTO;
  const ctx = canvas.getContext("2d");

  ctx.imageSmoothingEnabled = false;
  ctx.scale(ESCALA_IMPRESION, ESCALA_IMPRESION);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, ANCHO_LOGICO, ALTO_LOGICO);

  // QR dominante, con zona blanca de seguridad alrededor.
  const qrTam = 438;
  const qrX = Math.round((ANCHO_LOGICO - qrTam) / 2);
  ctx.drawImage(qr, qrX, 8, qrTam, qrTam);

  // Datos identificatorios en la franja inferior.
  ctx.fillStyle = "#000000";
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";

  const dibujarLinea = (etiqueta, valor, y, tamano, negrita = false) => {
    const texto = `${etiqueta}: ${String(valor || "-").trim()}`;
    let fuente = tamano;
    do {
      ctx.font = `${negrita ? "bold " : ""}${fuente}px Arial, sans-serif`;
      if (ctx.measureText(texto).width <= ANCHO_LOGICO - 28) break;
      fuente -= 1;
    } while (fuente > 11);
    ctx.fillText(texto, 14, y, ANCHO_LOGICO - 28);
  };

  dibujarLinea("Equipo", datos.descripcion, 472, 25, true);
  dibujarLinea("Marca y modelo", datos.marcaModelo, 518, 23, true);
  dibujarLinea("N° de serie", serie, 562, 26, true);

  return canvas.toDataURL("image/png");
}

export default function EtiquetaQREquipoGlobal() {
  const [portal, setPortal] = useState(null);
  const [serie, setSerie] = useState("");
  const [datosEquipo, setDatosEquipo] = useState({ descripcion: "", marcaModelo: "" });
  const [etiqueta, setEtiqueta] = useState("");
  const [generando, setGenerando] = useState(false);

  useEffect(() => {
    const localizar = () => {
      const actual = obtenerSerieDesdeFicha();
      setPortal(actual.portal);
      setSerie(actual.serie);
      setDatosEquipo({ descripcion: actual.descripcion, marcaModelo: actual.marcaModelo });
    };

    localizar();
    const observer = new MutationObserver(localizar);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, []);

  const abrirEtiqueta = async () => {
    if (!serie) return;
    try {
      setGenerando(true);
      setEtiqueta(await generarEtiqueta(serie, datosEquipo));
    } catch (error) {
      console.error("Error generando etiqueta QR:", error);
      alert("No se pudo generar la etiqueta QR.");
    } finally {
      setGenerando(false);
    }
  };

  const descargar = () => {
    if (!etiqueta || !serie) return;
    const a = document.createElement("a");
    a.href = etiqueta;
    a.download = `etiqueta-QR-${serie}-40x50mm.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const imprimir = () => {
    if (!etiqueta) return;

    const ventana = window.open("", "_blank", "width=700,height=600");

    if (!ventana) {
      alert("El navegador bloqueó la ventana de impresión. Habilite las ventanas emergentes para Sky26.");
      return;
    }

    ventana.document.open();
    ventana.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Etiqueta ${serie}</title>
          <style>
            @page {
              size: 40mm 50mm;
              margin: 0;
            }

            html,
            body {
              margin: 0;
              padding: 0;
              width: 100%;
              height: 100%;
              background: white;
              overflow: hidden;
            }

            body {
              position: relative;
            }

            img {
              position: fixed;
              inset: 0;
              display: block;
              width: 39.8mm;
              height: 49.8mm;
              object-fit: fill;
              margin: 0;
              padding: 0;
            }
          </style>
        </head>
        <body>
          <img id="etiqueta-print" src="${etiqueta}" alt="Etiqueta QR ${serie}" />
          <script>
            const imagen = document.getElementById("etiqueta-print");

            const abrirImpresion = () => {
              window.focus();
              setTimeout(() => {
                window.print();
              }, 150);
            };

            if (imagen.complete) {
              abrirImpresion();
            } else {
              imagen.onload = abrirImpresion;
            }

            window.onafterprint = () => {
              window.close();
            };
          <\/script>
        </body>
      </html>
    `);
    ventana.document.close();
  };

  const boton = portal && serie ? createPortal(
    <button
      type="button"
      onClick={abrirEtiqueta}
      disabled={generando}
      className="bg-slate-800 hover:bg-slate-900 disabled:bg-gray-400 text-white px-4 py-2 rounded-xl w-full mt-2 font-semibold"
    >
      {generando ? "Generando QR..." : "🏷️ QR del equipo (40 × 50 mm)"}
    </button>,
    portal
  ) : null;

  return (
    <>
      {boton}
      {etiqueta && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4" onClick={() => setEtiqueta("")}>
          <div className="bg-white rounded-2xl shadow-2xl p-4 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <div>
                <h2 className="font-bold text-lg">Etiqueta QR del equipo</h2>
                <p className="text-sm text-gray-500">40 × 50 mm · alta definición · {serie}</p>
              </div>
              <button onClick={() => setEtiqueta("")} className="text-gray-500 hover:text-red-600 text-xl font-bold">✕</button>
            </div>

            <div className="bg-gray-100 p-3 rounded-xl flex justify-center">
              <img src={etiqueta} alt={`Etiqueta QR ${serie}`} className="w-[272px] h-[340px] object-contain bg-white shadow" />
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4">
              <button onClick={descargar} className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl font-semibold">⬇️ Descargar</button>
              <button onClick={imprimir} className="bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl font-semibold">🖨️ Imprimir</button>
            </div>

            <p className="text-xs text-gray-500 mt-3 text-center">El QR abre la ficha pública del equipo y también es compatible con el lector de Sky26.</p>
          </div>
        </div>
      )}
    </>
  );
}
