// src/AsistenteIA.js
import React, { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";

export default function AsistenteIA() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { sender: "bot", text: "👋 Hola, soy tu asistente técnico IA. Cuéntame qué necesitas." },
  ]);
  const [loading, setLoading] = useState(false);

  const enviarMensaje = async () => {
    if (!input.trim()) return;
    const nuevoMensaje = { sender: "user", text: input };
    setMessages((prev) => [...prev, nuevoMensaje]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("https://icsky26.onrender.com/api/ia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensaje: nuevoMensaje.text }),
      });

      if (!res.ok) throw new Error("Error al contactar la IA");
      const data = await res.json();

      setMessages((prev) => [...prev, { sender: "bot", text: data.respuesta }]);
    } catch (err) {
      console.error(err);
      toast.error("No se pudo obtener respuesta de la IA");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") enviarMensaje();
  };

  return (
    <div className="max-w-lg mx-auto bg-white shadow-xl rounded-2xl p-4 mt-6 border border-gray-200">
      <h1 className="text-xl font-bold text-center mb-3">
        🤖 Asistente de Ingeniería Clínica
      </h1>

      <div className="h-80 overflow-y-auto border rounded-lg p-3 bg-gray-50 space-y-2">
        {messages.map((msg, idx) => (
          <motion.div
            key={idx}
            className={`p-2 rounded-lg ${
              msg.sender === "user"
                ? "bg-blue-100 text-right"
                : "bg-gray-200 text-left"
            }`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {msg.text}
          </motion.div>
        ))}
        {loading && <p className="text-sm text-gray-500">⌛ Pensando...</p>}
      </div>

      <div className="flex mt-3 space-x-2">
        <input
          type="text"
          className="flex-grow border rounded-lg p-2 text-sm"
          placeholder="Describe un problema o pregunta algo..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button
          onClick={enviarMensaje}
          className="bg-blue-600 text-white px-3 py-1 rounded-lg"
          disabled={loading}
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
