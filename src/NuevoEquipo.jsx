import { useState, useEffect, useRef } from "react";
import { API_URL } from "./config";

export default function NuevoEquipo({ setVista }) {

  //====================================================
  // DATOS DEL EQUIPO
  //====================================================

  const [descripcion, setDescripcion] = useState("");
  const [marcaModelo, setMarcaModelo] = useState("");
  const [numeroSerie, setNumeroSerie] = useState("");

  const [estado, setEstado] = useState("Activo");

  const [imagen, setImagen] = useState(null);

  //====================================================
  // UBICACIÓN
  //====================================================

  const [areas, setAreas] = useState([]);
  const [servicios, setServicios] = useState([]);

  const [area, setArea] = useState("");
  const [servicio, setServicio] = useState("");
  const [subServicio, setSubServicio] = useState("");
  const [encargado, setEncargado] = useState("");

  //====================================================
  // OTROS
  //====================================================

  const [guardando, setGuardando] = useState(false);

  const inputImagenRef = useRef(null);

  //====================================================
  // CARGAR DATOS
  //====================================================

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [resAreas, resServicios] = await Promise.all([
        fetch(API_URL.Areas),
        fetch(API_URL.Servicios)
      ]);
      const datosAreas = await resAreas.json();
      const datosServicios = await resServicios.json();
      setAreas(datosAreas);
      setServicios(datosServicios);
    } catch (err) {
      console.error(err);
      alert("Error cargando áreas y servicios");
    }
  };

  //====================================================
  // GUARDAR EQUIPO
  //====================================================

  const guardarEquipo = async () => {

    if (!descripcion.trim()) {
      alert("Ingrese la descripción.");
      return;
    }
    if (!numeroSerie.trim()) {
      alert("Ingrese el número de serie.");
      return;
    }
    if (!area) {
      alert("Seleccione un área.");
      return;
    }
    if (!servicio) {
      alert("Seleccione un servicio.");
      return;
    }
    if (!subServicio) {
      alert("Seleccione un subservicio.");
      return;
    }
    try {

      setGuardando(true);
      const res = await fetch(API_URL.Equipos, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          numero_serie: numeroSerie.toUpperCase().trim(),
          descripcion,
          marca_modelo: marcaModelo,
          servicio,
          sub_servicio: subServicio,
          encargado,
          area,
          periodo: null,
          ultimo_mant: null,
          fecha_baja: null,
          estado,
          imagen
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error);
      }
      alert("Equipo creado correctamente.");
      setVista("equipos");
    } catch (err) {
      alert(err.message);
    } finally {
      setGuardando(false);
    }
  };

  //====================================================
  // TOMAR FOTO
  //====================================================

  const subirImagen = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const MAX = 800;
      let { width, height } = img;
      if (width > height) {
        if (width > MAX) {
          height *= MAX / width;
          width = MAX;
        }
      } else {
        if (height > MAX) {
          width *= MAX / height;
          height = MAX;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      setImagen(
        canvas.toDataURL(
          "image/jpeg",
          0.70
        )
      );
    };
  };
