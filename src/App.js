import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

// Apunta al backend en Render mediante variable de entorno
const API_URL = process.env.REACT_APP_API_URL || "https://tu-backend.onrender.com";

function App() {
  const [usuario, setUsuario] = useState(localStorage.getItem("usuario") || "");
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem("usuario"));
  const [tareas, setTareas] = useState([]);
  const [form, setForm] = useState({ tarea: "", fin: false, imagen: null });
  const [editTask, setEditTask] = useState(null);

  useEffect(() => { if (loggedIn) fetchTareas(); }, [loggedIn]);

  const fetchTareas = async () => {
    try {
      const res = await fetch(`${API_URL}/tareas`);
      const data = await res.json();
      setTareas(data.sort((a,b)=>new Date(b.fecha)-new Date(a.fecha)));
    } catch { toast.error("Error al cargar tareas"); }
  };

  // Manejo login
  const handleLogin = (e) => { e.preventDefault(); if(!usuario.trim()) return toast.error("Debes ingresar un nombre de usuario"); localStorage.setItem("usuario", usuario); setLoggedIn(true); toast.success(`Bienvenido, ${usuario} ✅`); }
  const handleLogout = () => { localStorage.removeItem("usuario"); setUsuario(""); setLoggedIn(false); }

  // Imagen reducida
  const handleImagen = (e) => { /* mismo código que tenés */ }

  // Crear / actualizar tarea
  const handleSubmit = async (e) => { /* mismo código que tenés */ }

  const handleToggleFin = async (task,newFin) => { /* mismo código que tenés */ }

  const handleCloseEdit = () => { setEditTask(null); setForm({ tarea:"", fin:false, imagen:null }); }

  const tareasFiltradas = tareas.filter(t => t.usuario === usuario);
  const pendientes = tareasFiltradas.filter(t => !t.fin).length;

  // --- Componentes de cada pantalla ---

  const LoginForm = () => (
    <div className="p-4 max-w-md mx-auto mt-20">
      <h1 className="text-2xl font-bold text-center mb-4">Login de Usuario</h1>
      <form onSubmit={handleLogin} className="flex flex-col space-y-3">
        <input type="text" placeholder="Nombre de usuario" className="w-full p-2 border rounded" value={usuario} onChange={e => setUsuario(e.target.value)} required />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded-xl">Ingresar</button>
      </form>
    </div>
  );

  const SolicitudForm = () => (
    <div className="p-4 max-w-md mx-auto">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-bold">📋 Solicitud de servicio RIC01</h1>
        <div>
          <button onClick={handleLogout} className="bg-red-500 text-white px-3 py-1 rounded-xl text-sm mr-2">Logout</button>
          <Link to="/supervision" className="bg-green-500 text-white px-3 py-1 rounded-xl text-sm">Panel de supervisión</Link>
        </div>
      </div>
      <div className="text-center mb-4"><p className="text-lg font-semibold text-red-600">Solicitudes pendientes: {pendientes}</p></div>

      <form onSubmit={handleSubmit} className="bg-white p-4 rounded-2xl shadow mb-6 flex flex-col space-y-3">
        <p>Usuario: <b>{usuario}</b></p>
        <input type="text" placeholder="Tarea solicitada" className="w-full p-2 border rounded" value={editTask ? editTask.tarea : form.tarea} onChange={e => editTask ? setEditTask({...editTask, tarea:e.target.value}) : setForm({...form, tarea:e.target.value})} required />
        <label className="flex items-center space-x-2">
          <input type="checkbox" checked={editTask ? editTask.fin : form.fin} onChange={e => editTask ? setEditTask({...editTask, fin:e.target.checked}) : setForm({...form, fin:e.target.checked})} disabled={editTask?.fin} />
          <span>Finalizada</span>
        </label>

        <input type="file" accept="image/*" capture="environment" onChange={handleImagen} />
        {editTask?.imagen && <img src={`data:image/jpeg;base64,${editTask.imagen}`} alt="Foto" className="mt-2 w-24 h-24 rounded-full object-cover" />}
        {!editTask?.imagen && form.imagen && <img src={`data:image/jpeg;base64,${form.imagen}`} alt="Foto" className="mt-2 w-24 h-24 rounded-full object-cover" />}

        <div className="flex space-x-2">
          <button type="submit" className="flex-1 bg-blue-500 text-white p-2 rounded-xl">{editTask ? "Actualizar" : "Enviar solicitud"}</button>
          {editTask && <button type="button" className="flex-1 bg-gray-400 text-white p-2 rounded-xl" onClick={handleCloseEdit}>Cerrar edición</button>}
        </div>
      </form>

      <ul className="space-y-3">
        {tareasFiltradas.map(t => (
          <li key={t.id} className={`p-3 rounded-xl shadow-sm flex items-center justify-between ${t.fin ? "bg-green-200":"bg-blue-100"}`}>
            <div className="flex items-center space-x-3">
              {t.imagen && <img src={`data:image/jpeg;base64,${t.imagen}`} alt="Foto" className="w-12 h-12 rounded-full object-cover" />}
              <div>
                <p className={t.fin ? "line-through text-gray-600":"text-black"}><span className="font-bold text-gray-700">#{t.id}</span> {t.usuario}: {t.tarea} {t.fin ? "✅":"🔹"}</p>
                <p className="text-sm text-gray-500">Fecha: {new Date(t.fecha).toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <label className="flex items-center space-x-1">
                <input type="checkbox" checked={t.fin} onChange={e=>{e.stopPropagation(); handleToggleFin(t,e.target.checked);}} disabled={t.fin} />
                <span>Finalizada</span>
              </label>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );

  const PanelSupervision = () => {
    const pendientesGlobales = tareas.filter(t => !t.fin);
    return (
      <div className="p-4 max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">🛠 Panel de supervisión</h1>
          <Link to="/" className="bg-blue-500 text-white px-3 py-1 rounded-xl text-sm">Volver</Link>
        </div>
        <ul className="space-y-3">
          {pendientesGlobales.map(t => (
            <li key={t.id} className="p-3 rounded-xl shadow-sm bg-yellow-100 flex items-center space-x-3">
              {t.imagen && <img src={`data:image/jpeg;base64,${t.imagen}`} alt="Foto" className="w-12 h-12 rounded-full object-cover" />}
              <div>
                <p><span className="font-bold text-gray-700">#{t.id}</span> {t.usuario}: {t.tarea}</p>
                <p className="text-sm text-gray-500">Fecha: {new Date(t.fecha).toLocaleString()}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  if (!loggedIn) return <LoginForm />;

  return (
    <Router>
      <Routes>
        <Route path="/" element={<SolicitudForm />} />
        <Route path="/supervision" element={<PanelSupervision />} />
      </Routes>
      <ToastContainer position="bottom-right" autoClose={2000} hideProgressBar={false} />
    </Router>
  );
}

export default App;
