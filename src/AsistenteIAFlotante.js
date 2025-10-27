import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, X } from "lucide-react";

export default function AsistenteIAFlotante() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [mensajes, setMensajes] = useState([
    { remitente: "bot", texto: "👋 Hola, soy el asistente del Servicio de Ingeniería Clínica. ¿En qué puedo ayudarte hoy?" },
  ]);

  const enviarMensaje = () => {
    if (!input.trim()) return;
    const nuevoMensaje = { remitente: "usuario", texto: input };
    setMensajes((prev) => [...prev, nuevoMensaje]);
    setInput("");

    // Simulación de respuesta IA
    setTimeout(() => {
      setMensajes((prev) => [
        ...prev,
        { remitente: "bot", texto: "🤖 Estoy procesando tu consulta..." },
      ]);
    }, 600);
  };

  return (
    <>
      {/* Botón flotante */}
      <motion.button
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 z-50"
        onClick={() => setOpen(!open)}
        whileTap={{ scale: 0.9 }}
      >
        {open ? <X size={24} /> : <Bot size={24} />}
      </motion.button>

      {/* Ventana del chat */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ type: "spring", stiffness: 120 }}
            className="fixed bottom-20 right-6 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col z-50"
          >
            <div className="bg-blue-600 text-white p-3 rounded-t-xl font-semibold flex items-center gap-2">
              <Bot size={18} /> Asistente IA - Ingeniería Clínica
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-80">
              {mensajes.map((m, i) => (
                <div
                  key={i}
                  className={`p-2 rounded-lg text-sm ${
                    m.remitente === "usuario"
                      ? "bg-blue-100 self-end text-right"
                      : "bg-gray-100"
                  }`}
                >
                  {m.texto}
                </div>
              ))}
            </div>

            <div className="flex border-t border-gray-200">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && enviarMensaje()}
                placeholder="Escribe tu consulta..."
                className="flex-1 p-2 text-sm outline-none"
              />
              <button
                onClick={enviarMensaje}
                className="p-2 text-blue-600 hover:text-blue-800"
              >
                <Send size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
