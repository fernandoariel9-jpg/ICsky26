import { API_URL } from "./config";
import ProtocoloChecklist from "./protocolos/ProtocoloChecklist";

const configRIC56 = {
  codigo: "RIC56",
  tituloCorto: "MP Equipo RX Móvil",
  tituloEtapa: "1. Verificación funcional",
  defaultDescripcion: "EQUIPO DE RX MÓVIL",
  endpoint: API_URL.Ric56,
  nombreIdRespuesta: "ric56_id",
  borradorPrefijo: "preventivo:ric56",
  requiereEnUso: true,
  mensajeConforme: "Todos los puntos verificados se encuentran conformes o fueron indicados como no aplicables.",
  puntos: [
    "Inspección visual",
    "Limpieza mesa",
    "Limpieza mural",
    "Inspección de comando",
    "Estado de frenos",
    "Chasis a tierra",
    "Tensión de alimentación",
    "Colimado mecánico",
    "Colimado luz",
    "Disparo remoto",
    "Movimiento de ruedas y brazo",
    "Calibración flat panel",
    "Funcionamiento general"
  ]
};

export default function RIC56({ setVista, personal }) {
  return <ProtocoloChecklist config={configRIC56} setVista={setVista} personal={personal} />;
}
