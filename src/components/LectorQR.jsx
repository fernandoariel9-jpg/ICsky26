import React from "react";
import QrReader from "react-qr-scanner";

export default function LectorQR({
  abierto,
  onCerrar,
  onDetectar
}) {

  if (!abierto) return null;

  const handleScan = (data) => {

    if (!data) return;

    onDetectar(data.text || data);

    onCerrar();
  };

  const handleError = (err) => {
    console.error(err);
  };

  return (

    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
    >

      <div className="bg-white rounded-xl p-4 w-[360px]">

        <h2 className="text-lg font-bold mb-3">
          Escanear código
        </h2>

        <QrReader
          delay={300}
          onError={handleError}
          onScan={handleScan}
          style={{ width: "100%" }}
        />

        <button
          onClick={onCerrar}
          className="mt-4 w-full bg-red-600 text-white rounded py-2"
        >
          Cancelar
        </button>

      </div>

    </div>

  );
}
