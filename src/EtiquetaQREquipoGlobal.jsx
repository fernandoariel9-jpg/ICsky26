import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import QRCode from "qrcode";

const FRONTEND_PUBLICO = "https://icsky26.onrender.com";
const ANCHO = 591;  // 50 mm a 300 dpi
const ALTO = 472;   // 40 mm a 300 dpi

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
    margin: 3,
    width: 250,
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
  ctx.textBaseline = "middle";

  ctx.textAlign = "center";
  ctx.font = "bold 28px Arial, sans-serif";
  ctx.fillText("INGENIERÍA CLÍNICA", ANCHO / 2, 34);

  ctx.font = "bold 15px Arial, sans-serif";
  ctx.fillText("Escanear para información del equipo", ANCHO / 2, 62);

  const qrTam = 245;
  const qrX = 24;
  const qrY = 102;
  ctx.drawImage(qr, qrX, qrY, qrTam, qrTam);

  const textoX = 300;
  ctx.textAlign = "left";

  ctx.font = "bold 20px Arial, sans-serif";
  ctx.fillText("EQUIPO", textoX, 135);

  ctx.font = "bold 34px Arial, sans-serif";
  ctx.fillText(`N/S ${serie}`, textoX, 185);

  ctx.font = "16px Arial, sans-serif";
  ctx.fillText("Compatible con Sky26", textoX, 235);
  ctx.fillText("y con cámara del celular", textoX, 263);

  ctx.font = "bold 22px Arial, sans-serif";
  ctx.fillText("Sky26", textoX, 330);

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
    a.download = `etiqueta-QR-${serie}-50x40mm.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const imprimir = () => {
    if (!etiqueta) return;
    const ventana = window.open("", "_blank", "noopener,noreferrer");
    if (!ventana) return alert("El navegador bloqueó la ventana de impresión.");
    ventana.document.write(`<!doctype html><html><head><title>Etiqueta ${serie}</title><style>@page{size:50mm 40mm;margin:0}html,body{margin:0;padding:0;width:50mm;height:40mm}img{display:block;width:50mm;height:40mm}</style></head><body><img src="${etiqueta}" onload="window.print();window.close();"></body></html>`);
    ventana.document.close();
  };

  const boton = portal && serie ? createPortal(
    <button
      type="button"
      onClick={abrirEtiqueta}
      disabled={generando}
      className="bg-slate-800 hover:bg-slate-900 disabled:bg-gray-400 text-white px-4 py-2 rounded-xl w-full mt-2 font-semibold"
    >
      {generando ? "Generando QR..." : "🏷️ QR del equipo (50 × 40 mm)"}
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
                <p className="text-sm text-gray-500">50 × 40 mm · 300 dpi · N/S {serie}</p>
              </div>
              <button onClick={() => setEtiqueta("")} className="text-gray-500 hover:text-red-600 text-xl font-bold">✕</button>
            </div>

            <div className="bg-gray-100 p-3 rounded-xl flex justify-center">
              <img src={etiqueta} alt={`Etiqueta QR ${serie}`} className="w-[300px] h-[240px] object-contain bg-white shadow" />
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
