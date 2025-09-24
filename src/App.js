// App.js
import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = "https://sky26.onrender.com/tareas";

// ---------- Componente Login de Usuario ----------
function UsuarioLogin({ onLogin }) {
  const [usuario, setUsuario] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    if (!usuario.trim()) return toast.error("Debes ingresar un nombre de usuario");
    localStorage.setItem("usuario", usuario);
    onLogin(usuario);
    toast.success(`Bienvenido, ${usuario} ✅`);
  };

  return (
    <div className="p-4 max-w-md mx-auto mt-20">
      <h1 className="text-2xl font-bold text-center mb-4">Login de Usuario</h1>
      <form onSubmit={handleLogin} className="flex flex-col space-y-3">
        <input
          type="text"
          placeholder="Nombre de usuario"
          className="w-full p-2 border rounded"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          required
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded-xl">Ingresar</button>
      </form>
    </div>
  );
}

// ---------- Componente Login de Panel de Supervisión ----------
function PanelLogin({ onLogin }) {
  const [password, setPassword] = useState("");
  const PASS = "super123"; // Cambiar contraseña aquí

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === PASS) {
      onLogin(true);
      toast.success("Acceso concedido ✅");
    } else {
      toast.error("Contraseña incorrecta ❌");
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto mt-20">
      <h1 className="text-2xl font-bold text-center mb-4">🔒 Acceso Panel de Supervisión</h1>
      <form onSubmit={handleSubmit} className="flex flex-col space-y-3">
        <input
          type="password"
          placeholder="Contraseña"
          className="w-full p-2 border rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" className="bg-green-500 text-white p-2 rounded-xl">Ingresar</button>
      </form>
    </div>
  );
}

// ---------- Componente Formulario de Usuario ----------
function FormularioUsuario({ usuario }) {
  const [tareas, setTareas] = useState([]);
  const [form, setForm] = useState({ tarea: "", fin: false, imagen: null });
  const [editTask, setEditTask] = useState(null);
  const [modalImagen, setModalImagen] = useState(null);

  useEffect(() => { fetchTareas(); }, []);

  const fetchTareas = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setTareas(data.sort((a,b)=> new Date(b.fecha) - new Date(a.fecha)));
    } catch { toast.error("Error al cargar tareas"); }
  };

  const handleImagen = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(event) {
      const img = new Image();
      img.onload = function() {
        const canvas = document.createElement("canvas");
        const max = 300;
        let width = img.width;
        let height = img.height;
        if(width>height){ if(width>max){height=Math.round(height*max/width); width=max;} } 
        else { if(height>max){width=Math.round(width*max/height); height=max;} }
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d").drawImage(img,0,0,width,height);
        const base64 = canvas.toDataURL("image/jpeg",0.4).split(",")[1];
        if(editTask) setEditTask({...editTask, imagen: base64});
        else setForm({...form, imagen: base64});
      }
      img.src = event.target.result;
    }
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = editTask ? editTask : {...form, usuario};
    try {
      if(!editTask){
        const res = await fetch(API_URL,{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload) });
        const newTask = await res.json();
        setTareas([newTask, ...tareas]);
        setForm({tarea:"",fin:false,imagen:null});
        toast.success("Tarea creada ✅");
      } else {
        if(editTask.fin) return toast.error("Tarea finalizada, no se puede editar ❌");
        const res = await fetch(`${API_URL}/${editTask.id}`, { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify(editTask)});
        const updated = await res.json();
        setTareas(prev=>prev.map(t=>t.id===updated.id?updated:t));
        setEditTask(null);
        toast.success("Tarea actualizada ✅");
      }
    } catch { toast.error("Error al guardar tarea"); }
  };

  const handleToggleFin = async (task,newFin) => {
    if(task.fin) return toast.info("La tarea ya está finalizada 🔒");
    try {
      const res = await fetch(`${API_URL}/${task.id}`, { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify({...task,fin:newFin})});
      const updated = await res.json();
      setTareas(prev=>prev.map(t=>t.id===updated.id?updated:t));
      toast.success("Estado de tarea actualizado ✅");
    } catch { toast.error("Error al actualizar tarea"); }
  };

  const handleCloseEdit = () => { setEditTask(null); setForm({tarea:"",fin:false,imagen:null}); };

  const tareasFiltradas = tareas.filter(t=>t.usuario===usuario);
  const pendientes = tareasFiltradas.filter(t=>!t.fin).length;

  const abrirModal = (img) => setModalImagen(img);
  const cerrarModal = () => setModalImagen(null);

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-bold">📋 Solicitud de servicio RIC01</h1>
      </div>
      <div className="text-center mb-4">
        <p className="text-lg font-semibold text-red-600">Solicitudes pendientes: {pendientes}</p>
      </div>
