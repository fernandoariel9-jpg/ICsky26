import React, { useEffect, useRef } from "react";
import {
  BrowserMultiFormatReader,
  NotFoundException
} from "@zxing/browser";

export default function LectorQR({
  abierto,
  onCerrar,
  onDetectar
}) {

  const videoRef = useRef(null);
  const readerRef = useRef(null);

  useEffect(() => {

    if (!abierto) return;

    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    let activo = true;

    async function iniciar() {

      try {

        const dispositivos =
          await BrowserMultiFormatReader.listVideoInputDevices();

        if (!dispositivos.length) {
          alert("No se encontró ninguna cámara.");
          return;
        }

        // Buscar primero la cámara trasera
        let deviceId = dispositivos[0].deviceId;

        const trasera = dispositivos.find(d =>
          /back|rear|environment|trasera/i.test(d.label)
        );

        if (trasera) {
          deviceId = trasera.deviceId;
        }

        await reader.decodeFromVideoDevice(
          deviceId,
          videoRef.current,
          (result, err) => {

            if (!activo) return;

            if (result) {

              const texto = result.getText();

              onDetectar(texto);

              reader.reset();

              onCerrar();

            }

            if (
              err &&
              !(err instanceof NotFoundException)
            ) {
              console.error(err);
            }

          }
        );

      } catch (err) {

        console.error(err);

      }

    }

    iniciar();

    return () => {

      activo = false;

      if (readerRef.current) {
        readerRef.current.reset();
      }

    };

  }, [abierto, onCerrar, onDetectar]);

  if (!abierto) return null;

  return (

    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

      <div className="bg-white rounded-xl p-4 w-[380px]">

        <h2 className="text-lg font-bold mb-3">
          Escanear código
        </h2>

        <video
          ref={videoRef}
          className="w-full rounded"
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
