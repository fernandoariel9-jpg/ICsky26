// src/RegistroUsuario.js
import React, { useState } from "react";

function RegistroUsuario({ onRegister }) {
  const [form, setForm] = useState({
    nombre: "",
    servicio: "",
    movil: "",
    mail: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) return alert("El nombre es obligatorio");
    // Aquí deberías enviar el form al backend (POST /usuarios)
    console.log("Usuario registrado:", form);
    onRegister(form.nombre); // queda logueado
  };

  return (
    <div className="p-4 max-w-md mx-auto mt-20">
      <h1 className="text-2xl font-bold text-center mb-4">Registro de Usuario</h1>
      <form onSubmit={handleSubmit} className="flex flex-col space-y-3">
        <input
          type="text"
          placeholder="Nombre"
          className="w-full p-2 border rounded"
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Servicio"
          className="w-full p-2 border rounded"
          value={form.servicio}
          onChange={(e) => setForm({ ...form, servicio: e.target.value })}
        />
        <input
          type="text"
          placeholder="Móvil"
          className="w-full p-2 border rounded"
          value={form.movil}
          onChange={(e) => setForm({ ...form, movil: e.target.value })}
        />
        <input
          type="email"
          placeholder="Correo"
          className="w-full p-2 border rounded"
          value={form.mail}
          onChange={(e) => setForm({ ...form, mail: e.target.value })}
        />
        <button type="submit" className="bg-green-500 text-white p-2 rounded-xl">
          Registrarse
        </button>
      </form>
    </div>
  );
}

export default RegistroUsuario;
