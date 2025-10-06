import React from "react";
import QrScanner from "react-qr-scanner";

export default function TestQR() {
  const handleScan = (data) => {
    if (data) console.log("QR detectado:", data.text);
  };

  const handleError = (err) => {
    console.error("Error:", err);
  };

  return (
    <div className="p-4 text-center">
      <h2 className="text-xl font-bold mb-4">📷 Lector QR</h2>
      <QrScanner
        delay={300}
        onError={handleError}
        onScan={handleScan}
        style={{ width: "100%" }}
      />
    </div>
  );
}
