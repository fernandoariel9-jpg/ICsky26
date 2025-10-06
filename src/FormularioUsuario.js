// src/FormularioUsuario.js
import React, { useEffect, useState, useRef } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion, AnimatePresence } from "framer-motion";
import { API_URL } from "./config";
import jsQR from "jsqr";

const API_TAREAS = API_URL.Tareas;

export default function FormularioUsuario({ usuario, onLogout }) {
  const [tareas, setTareas] = useState([]);
  const [modalImagen, setModalImagen] = useState(null);
  const [nuevaTarea, setNuevaTarea] = useState("");
  const [nuevaImagen, setNuevaImagen] = useState(null);
  const [previewImagen, setPreviewImagen] = useState(null);
  const [loading, setLoading] = useState(false);

  const [qrModalOpen, setQrModalOpen] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [qrScanActive, setQrScanActive] = useState(false);

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
    } catch {
      toast.error("Error al cargar tareas ❌");
    } finally {
      setLoading(false);
    }
  };

  // ------------------- QR Scanner con cámara trasera -------------------
  const startQrScanner = async () => {
    setQrModalOpen(true);
    setQrScanActive(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { exact: "environment" } }, // 🔹 cámara trasera
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", true); // necesario en iOS
        await videoRef.current.play();
        requestAnimationFrame(scanFrame);
      }
    } catch (err) {
      console.error(err);
      toast.error("No se pudo acceder a la cámara trasera ❌");
      setQrModalOpen(false);
    }
  };

  const stopQrScanner = () => {
    setQrScanActive(false);
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    }
    setQrModalOpen(false);
  };

  const scanFrame = () => {
    if (!qrScanActive || !videoRef.current || videoRef.current.readyState !== 4) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code) {
      stopQrScanner();
      crearTareaDesdeQR(code.data);
      return;
    }

    requestAnimationFrame(scanFrame);
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

      const payload = await res.json();
      setTareas((prev) => [payload, ...prev]);
      toast.success("✅ Tarea creada automáticamente desde QR");
    } catch (err) {
      toast.error("❌ Error al crear tarea: " + (err.message || ""));
    } finally {
      setLoading(false);
    }
  };

  // ------------------- resto de tu código existente -------------------
  // handleFinalizar, handleImagenChange, quitarImagen, handleCrearTarea, etc.
  // se mantiene exactamente igual que antes

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <img src="/logosmall.png" alt="Logo" className="mx-auto mb-4 w-12 h-auto" />
      <h1 className="text-2xl font-bold mb-4 text-center">
        📌 Pedidos de tareas de {usuario?.nombre || usuario?.mail || "Usuario"}{" "}
        <p>
          <button onClick={fetchTareas} className="bg-blue-400 text-white px-3 py-1 rounded-xl text-sm">🔄 Actualizar lista</button>
          <button onClick={onLogout} className="bg-red-500 text-white px-3 py-1 rounded-xl text-sm ml-2">Cerrar sesión</button>
          <button onClick={startQrScanner} className="bg-purple-600 text-white px-3 py-1 rounded-xl text-sm ml-2">📷 Escanear QR</button>
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
            className="fixed inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-50"
          >
            <video ref={videoRef} className="rounded-xl shadow-lg w-72 h-72 object-cover" />
            <canvas ref={canvasRef} style={{ display: "none" }} />
            <button
              onClick={stopQrScanner}
              className="mt-4 text-white bg-red-600 px-4 py-2 rounded-xl"
            >
              Cerrar
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Aquí sigue tu formulario de creación de tareas manual y lista de tareas */}
      {/* ... se mantiene igual que antes ... */}

      <ToastContainer position="bottom-right" autoClose={2000} />
    </div>
  );
}
