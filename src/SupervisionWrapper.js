import React, { useState } from "react";
import PanelLogin from "./PanelLogin";
import Supervisor from "./Supervisor";

export default function SupervisionWrapper() {
  const [loggedIn, setLoggedIn] = useState(false);

  return loggedIn ? (
    <Supervisor />
  ) : (
    <PanelLogin onLogin={setLoggedIn} />
  );
}
