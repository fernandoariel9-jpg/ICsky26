import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion, AnimatePresence } from "framer-motion";
import { API_URL } from "./config";
import QrReader from "react-qr-scanner";

const API_TAREAS = API_URL.Tareas;

export default function FormularioUsuario({ usuario, onLogout }) {
  const [tareas, setTareas] = useState([]);
  const [modalImagen, setModalImagen] = useState(null);
  const [nuevaTarea, setNuevaTarea] = useState("");
  const [nuevaImagen, setNuevaImagen] = useState(null);
  const [previewImagen, setPreviewImagen] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [filtro, setFiltro] = useState("pendientes");

  // 🆕 Estados para popup de calificación
  const [showCalificacion, setShowCalificacion] = useState(false);
  const [tareaCalificar, setTareaCalificar] = useState(null);
  const [rating, setRating] = useState(0);

  useEffect(() => {
    fetchTareas();
    window.addEventListener("online", enviarTareasPendientes);
    return () => window.removeEventListener("online", enviarTareasPendientes);
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

  const abrirModal = (img) => setModalImagen(img);
  const cerrarModal = () => setModalImagen(null);

  const handleFinalizar = async (id) => {
    try {
      const res = await fetch(`${API_TAREAS}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fin: true }),
      });
      if (!res.ok) throw new Error("Error HTTP " + res.status);

      setTareas((prev) =>
        prev.map((t) => (t.id === id ? { ...t, fin: true } : t))
      );
      toast.success("✅ Tarea finalizada");

      // 🆕 Mostrar popup de calificación
      setTareaCalificar(id);
      setShowCalificacion(true);
    } catch {
      toast.error("❌ No se pudo finalizar la tarea");
    }
  };

  const handleEnviarCalificacion = async () => {
    if (!rating || rating < 1 || rating > 5) {
      toast.error("Seleccione una calificación válida");
      return;
    }

    try {
      const res = await fetch(`${API_TAREAS}/${tareaCalificar}/calificacion`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ calificacion: rating }),
      });

      if (!res.ok) throw new Error("Error HTTP " + res.status);

      setTareas((prev) =>
        prev.map((t) =>
          t.id === tareaCalificar ? { ...t, calificacion: rating } : t
        )
      );
      toast.success("⭐ Calificación registrada");
    } catch {
      toast.error("❌ No se pudo guardar la calificación");
    } finally {
      setShowCalificacion(false);
      setTareaCalificar(null);
      setRating(0);
    }
  };

  const handleImagenChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const MAX_WIDTH = 800;
        const scale = Math.min(1, MAX_WIDTH / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.6);
        const base64Data = compressedDataUrl.split(",")[1];

        setNuevaImagen(base64Data);
        setPreviewImagen(compressedDataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const quitarImagen = () => {
    setNuevaImagen(null);
    setPreviewImagen(null);
  };

  const handleCrearTarea = async (e) => {
    e.preventDefault();
    if (!nuevaTarea.trim()) return toast.error("Ingrese una descripción de tarea");
    if (!usuario) return toast.error("Usuario no disponible");

    const userIdentifier =
      typeof usuario === "string"
        ? usuario
        : usuario.nombre || usuario.mail || String(usuario);

    const bodyToSend = {
      usuario: userIdentifier,
      tarea: nuevaTarea,
      area: usuario?.area ?? null,
      servicio: usuario?.servicio ?? null,
      subservicio: usuario?.subservicio ?? null,
      imagen: nuevaImagen,
      fin: false,
    };

    setLoading(true);
    try {
      if (!navigator.onLine) throw new Error("offline");
      const res = await fetch(API_TAREAS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyToSend),
      });
      if (!res.ok) throw new Error("Error HTTP " + res.status);

      const data = await res.json();
      setTareas((prev) => [data, ...prev]);
      setNuevaTarea("");
      setNuevaImagen(null);
      setPreviewImagen(null);
      toast.success("✅ Tarea creada");
    } catch {
      let pendientes = JSON.parse(localStorage.getItem("tareasPendientes") || "[]");
      pendientes.push(bodyToSend);
      localStorage.setItem("tareasPendientes", JSON.stringify(pendientes));
      toast.info("⚠️ Sin conexión: tarea guardada localmente");
    } finally {
      setLoading(false);
    }
  };

  const enviarTareasPendientes = async () => {
    let pendientes = JSON.parse(localStorage.getItem("tareasPendientes") || "[]");
    if (!pendientes.length) return;
    for (const tarea of pendientes) {
      try {
        await fetch(API_TAREAS, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(tarea),
        });
      } catch {
        toast.error("❌ No se pudieron enviar algunas tareas");
        return;
      }
    }
    localStorage.removeItem("tareasPendientes");
    toast.success("✅ Tareas pendientes enviadas");
    fetchTareas();
  };

  const handleScan = (data) => {
    if (data) {
      let qrData;
      try {
        qrData = JSON.parse(data.text || data);
      } catch {
        qrData = { info: data.text || data };
      }
      setNuevaTarea(
        `Solicitud automática de asistencia para: ${qrData.marca || qrData.info} - ${qrData.numeroSerie || ""} - ${qrData.servicio || ""}`
      );
      toast.success("QR leído ✅ Tarea generada automáticamente");
      setShowQR(false);
    }
  };

  const handleError = (err) => {
    console.error(err);
    toast.error("Error al leer QR ❌");
  };

  const pendientes = tareas.filter((t) => !t.solucion && !t.fin);
  const enProceso = tareas.filter((t) => t.solucion && !t.fin);
  const finalizadas = tareas.filter((t) => t.fin);
  const tareasFiltradas =
    filtro === "pendientes"
      ? pendientes
      : filtro === "enProceso"
      ? enProceso
      : finalizadas;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <img src="/logosmall.png" alt="Logo" className="mx-auto mb-4 w-12 h-auto" />
      <h1 className="text-2xl font-bold mb-4 text-center">
        📌 Pedidos de tareas de{" "}
        <span className="text-blue-700">
          {typeof usuario === "string"
            ? usuario
            : usuario?.nombre || usuario?.mail || "Usuario"}
        </span>
      </h1>

      {/* ... resto del contenido sin cambios ... */}

      <AnimatePresence>
        {/* Modal Imagen */}
        {modalImagen && (
          <motion.div
            key="modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
            onClick={cerrarModal}
          >
            <motion.img
              src={modalImagen}
              alt="Ampliada"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="max-w-full max-h-full rounded-xl shadow-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}

        {/* 🆕 Popup de Calificación */}
        {showCalificacion && (
          <motion.div
            key="popupCalificacion"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
          >
            <div className="bg-white p-6 rounded-xl shadow-lg text-center max-w-sm">
              <h2 className="text-xl font-semibold mb-3">
                ⭐ Califique la solución
              </h2>
              <div className="flex justify-center space-x-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    onClick={() => setRating(star)}
                    className={`cursor-pointer text-3xl ${
                      star <= rating ? "text-yellow-400" : "text-gray-300"
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
              <button
                onClick={handleEnviarCalificacion}
                className="bg-blue-500 text-white px-4 py-2 rounded-xl mr-2"
              >
                Enviar
              </button>
              <button
                onClick={() => setShowCalificacion(false)}
                className="bg-gray-300 text-black px-4 py-2 rounded-xl"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ToastContainer position="bottom-right" autoClose={2000} />
    </div>
  );
}