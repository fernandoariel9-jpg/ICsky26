import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import QRCode from "qrcode";

const FRONTEND_PUBLICO = "https://icsky26.onrender.com";
const ANCHO = 472;  // 40 mm a 300 dpi
const ALTO = 591;   // 50 mm a 300 dpi

function obtenerSerieDesdeFicha() {
  const botones = Array.from(document.querySelectorAll("button"));
  const editar = botones.find((b) => b.textContent?.includes("Editar equipo"));
  const tarjeta = editar?.closest(".bg-white.shadow.rounded-xl");
  if (!tarjeta) return { portal: null, serie: "" };

  const parrafos = Array.from(tarjeta.querySelectorAll("p"));
  const lineaSerie = parrafos.find((p) => /^Serie:/i.test((p.textContent || "").trim()));
  const serie = (lineaSerie?.textContent || "").replace(/^Serie:\s*/i, "").trim();
  const portal = editar?.parentElement || null;
  return { portal, serie };
}

function cargarImagen(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function generarEtiqueta(serie) {
  const urlPublica = `${FRONTEND_PUBLICO}/equipo/${encodeURIComponent(serie)}`;
  const qrDataUrl = await QRCode.toDataURL(urlPublica, {
    errorCorrectionLevel: "M",
    margin: 4,
    width: 330,
    color: { dark: "#000000", light: "#ffffff" }
  });

  const qr = await cargarImagen(qrDataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = ANCHO;
  canvas.height = ALTO;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, ANCHO, ALTO);

  ctx.strokeStyle = "black";
  ctx.lineWidth = 5;
  ctx.strokeRect(9, 9, ANCHO - 18, ALTO - 18);

  ctx.fillStyle = "black";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.font = "bold 34px Arial, sans-serif";
  ctx.fillText("INGENIERÍA CLÍNICA", ANCHO / 2, 48);

  ctx.font = "bold 17px Arial, sans-serif";
  ctx.fillText("Escanear para información del equipo", ANCHO / 2, 82);

  const qrTam = 330;
  ctx.drawImage(qr, (ANCHO - qrTam) / 2, 103, qrTam, qrTam);

  ctx.font = "bold 45px Arial, sans-serif";
  ctx.fillText(`N/S ${serie}`, ANCHO / 2, 486);

  ctx.font = "bold 22px Arial, sans-serif";
  ctx.fillText("Sky26", ANCHO / 2, 536);

  return canvas.toDataURL("image/png");
}

export default function EtiquetaQREquipoGlobal() {
  const [portal, setPortal] = useState(null);
  const [serie, setSerie] = useState("");
  const [etiqueta, setEtiqueta] = useState("");
  const [generando, setGenerando] = useState(false);

  useEffect(() => {
    const localizar = () => {
      const actual = obtenerSerieDesdeFicha();
      setPortal(actual.portal);
      setSerie(actual.serie);
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
      setEtiqueta(await generarEtiqueta(serie));
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
    const ventana = window.open("", "_blank", "noopener,noreferrer");
    if (!ventana) return alert("El navegador bloqueó la ventana de impresión.");
    ventana.document.write(`<!doctype html><html><head><title>Etiqueta ${serie}</title><style>@page{size:40mm 50mm;margin:0}html,body{margin:0;padding:0;width:40mm;height:50mm}img{display:block;width:40mm;height:50mm}</style></head><body><img src="${etiqueta}" onload="window.print();window.close();"></body></html>`);
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
                <p className="text-sm text-gray-500">40 × 50 mm · 300 dpi · N/S {serie}</p>
              </div>
              <button onClick={() => setEtiqueta("")} className="text-gray-500 hover:text-red-600 text-xl font-bold">✕</button>
            </div>

            <div className="bg-gray-100 p-3 rounded-xl flex justify-center">
              <img src={etiqueta} alt={`Etiqueta QR ${serie}`} className="w-[240px] h-[300px] object-contain bg-white shadow" />
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
