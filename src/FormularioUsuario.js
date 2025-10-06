// src/FormularioUsuario.js
import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion, AnimatePresence } from "framer-motion";
import { API_URL } from "./config";
import QrScanner from "react-qr-scanner";

const API_TAREAS = API_URL.Tareas;

export default function FormularioUsuario({ usuario, onLogout }) {
  const [tareas, setTareas] = useState([]);
  const [modalImagen, setModalImagen] = useState(null);
  const [nuevaTarea, setNuevaTarea] = useState("");
  const [nuevaImagen, setNuevaImagen] = useState(null); // base64
  const [previewImagen, setPreviewImagen] = useState(null); // para vista previa
  const [loading, setLoading] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false); // 🔹 estado modal QR
  const [qrScanResult, setQrScanResult] = useState(null);

  useEffect(() => {
    fetchTareas();
  }, []);

  const fetchTareas = async () => {
    setLoading(true);
    try {
      if (!usuario) return;

      const areaParam = encodeURIComponent(usuario.area || "");
      const url = areaParam ? `${API_TAREAS}/${areaParam}` : API_TAREAS;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Error HTTP " + res.status);

      const data = await res.json();
      const userIdentifier =
        typeof usuario === "string"
          ? usuario
          : usuario.nombre || usuario.mail || String(usuario);

      setTareas(
        data
          .filter((t) => t.usuario === userIdentifier)
          .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
      );
    } catch (err) {
      toast.error("Error al cargar tareas ❌");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- QR Scanner ----------------
  const handleQrScan = async (data) => {
    if (data) {
      setQrScanResult(data.text);
      setQrModalOpen(false);
      crearTareaDesdeQR(data.text);
    }
  };

  const crearTareaDesdeQR = async (qrData) => {
    if (!usuario) return;
    let userIdentifier =
      typeof usuario === "string"
        ? usuario
        : usuario.nombre || usuario.mail || String(usuario);

    const areaValor = typeof usuario === "object" ? usuario.area || null : null;

    const bodyToSend = {
      usuario: userIdentifier,
      tarea: `Solicitud de asistencia para equipo: ${qrData}`,
      area: areaValor,
      imagen: null,
      fin: false,
    };

    setLoading(true);
    try {
      const res = await fetch(API_TAREAS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyToSend),
      });

      const text = await res.text();
      let payload;
      try {
        payload = text ? JSON.parse(text) : null;
      } catch {
        payload = text;
      }

      if (!res.ok) {
        const serverMsg =
          payload && typeof payload === "object" && payload.error
            ? payload.error
            : typeof payload === "string"
            ? payload
            : `HTTP ${res.status}`;
        toast.error("❌ Error al crear tarea: " + serverMsg);
        return;
      }

      setTareas((prev) => [payload, ...prev]);
      toast.success("✅ Tarea creada automáticamente desde QR");
    } catch (err) {
      toast.error("❌ Error al crear tarea: " + (err.message || ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <img src="/logosmall.png" alt="Logo" className="mx-auto mb-4 w-12 h-auto" />
      <h1 className="text-2xl font-bold mb-4 text-center">
        📌 Pedidos de tareas de {usuario?.nombre || usuario?.mail || "Usuario"}{" "}
        <p>
          <button onClick={fetchTareas} className="bg-blue-400 text-white px-3 py-1 rounded-xl text-sm">🔄 Actualizar lista</button>
          <button onClick={onLogout} className="bg-red-500 text-white px-3 py-1 rounded-xl text-sm">Cerrar sesión</button>
          <button onClick={() => setQrModalOpen(true)} className="bg-purple-600 text-white px-3 py-1 rounded-xl text-sm ml-2">📷 Escanear QR</button>
        </p>
      </h1>

      {/* Modal QR */}
      <AnimatePresence>
        {qrModalOpen && (
          <motion.div
            key="qr-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
          >
            <QrScanner
              delay={300}
              onError={(err) => console.error(err)}
              onScan={handleQrScan}
              style={{ width: "300px", height: "300px" }}
              facingMode="environment" // 🔹 cámara trasera
            />
            <button
              onClick={() => setQrModalOpen(false)}
              className="absolute top-5 right-5 text-white bg-red-600 p-2 rounded"
            >
              Cerrar
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Formulario de creación de tarea manual */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (nuevaTarea.trim() === "") return toast.error("Ingrese una descripción");
          setNuevaTarea(nuevaTarea); // opcional, ya está
        }}
        className="mb-6 bg-gray-50 p-4 rounded-xl shadow space-y-3"
      >
        {/* Aquí va tu textarea y subida de imagen sin cambios */}
      </form>

      {/* Lista de tareas */}
      <ul className="space-y-4">
        {tareas.map((tarea) => (
          <motion.li key={tarea.id} className="border p-4 rounded-xl shadow bg-white">
            <p className="font-semibold">📝 {tarea.tarea}</p>
            {tarea.imagen && (
              <img
                src={`data:image/jpeg;base64,${tarea.imagen}`}
                alt="tarea"
                className="w-32 h-32 object-cover mt-2 cursor-pointer rounded"
                onClick={() => setModalImagen(`data:image/jpeg;base64,${tarea.imagen}`)}
              />
            )}
            {!tarea.fin ? (
              <button
                onClick={() => {}} // tu handleFinalizar
                className="bg-green-600 text-white px-3 py-1 rounded mt-2"
              >
                ✅ Finalizar
              </button>
            ) : (
              <p className="text-green-600 font-bold mt-2">✔️ Tarea finalizada</p>
            )}
          </motion.li>
        ))}
      </ul>

      <ToastContainer position="bottom-right" autoClose={2000} />
    </div>
  );
}
