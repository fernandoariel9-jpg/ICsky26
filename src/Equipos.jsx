import { useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

export default function Equipos({ setVista }) {
  const [serie, setSerie] = useState("");
  const [escaneando, setEscaneando] = useState(false);

  const iniciarEscaneo = async () => {
    setEscaneando(true);

    const scanner = new Html5Qrcode("reader");

    try {
      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: 250,
        },
        (decodedText) => {
          setSerie(decodedText);
          scanner.stop();
          setEscaneando(false);
        },
        (error) => {
          // ignoramos errores de lectura continua
        }
      );
    } catch (err) {
      console.error("Error al iniciar cámara", err);
      setEscaneando(false);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">🔧 Búsqueda de Equipos</h1>

      {/* 🔍 Input manual */}
      <input
        type="text"
        placeholder="Número de serie"
        value={serie}
        onChange={(e) => setSerie(e.target.value)}
        className="w-full border p-2 rounded-xl mb-3"
      />

      {/* 📷 Botón escaneo */}
      <button
        onClick={iniciarEscaneo}
        className="bg-blue-500 text-white px-4 py-2 rounded-xl w-full mb-3"
      >
        📷 Escanear código
      </button>

      {/* 📷 Cámara */}
      {escaneando && (
        <div
          id="reader"
          className="w-full mt-4 border rounded-xl overflow-hidden"
        />
      )}

      {/* 🔙 Volver */}
      <button
        onClick={() => setVista("tareas")}
        className="bg-gray-400 text-white px-4 py-2 rounded-xl w-full mt-4"
      >
        ← Volver
      </button>
    </div>
  );
}
