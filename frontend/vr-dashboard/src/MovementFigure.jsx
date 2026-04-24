import React from "react";
import punchGif    from "./animations/punch.gif";
import uppercutGif from "./animations/uppercut.gif";
import squatGif    from "./animations/squat.gif";

const MOVEMENT_CONFIG = {
  punch: {
    gif:        punchGif,
    angleLabel: "Sapma Açısı",
    goodRange:  (a) => a <= 15,
    description: "Yumruk hedefe doğru ilerlemelidir."
  },
  uppercut: {
    gif:        uppercutGif,
    angleLabel: "Dirsek Açısı",
    goodRange:  (a) => a >= 30 && a <= 70,
    description: "Dirsek 30-70° arasında olmalıdır."
  },
  squat: {
    gif:        squatGif,
    angleLabel: "Diz Açısı",
    goodRange:  (a) => a >= 80 && a <= 100,
    description: "Diz 80-100° arasında olmalıdır."
  }
};

export default function MovementFigure({ movement, angle, speed, duration }) {
  const config     = MOVEMENT_CONFIG[movement];
  const angleOk    = config.goodRange(angle);
  const speedOk    = movement === "squat" ? speed >= 1.5 : speed >= 2.5;
  const angleColor = angleOk  ? "#22c55e" : "#ef4444";
  const speedColor = speedOk  ? "#22c55e" : "#ef4444";

  return (
    <div style={{
      background:    "#0f172a",
      borderRadius:  "12px",
      border:        "1px solid #334155",
      padding:       "16px",
      marginTop:     "16px",
      display:       "flex",
      flexDirection: "column",
      alignItems:    "center",
      gap:           "12px"
    }}>
      <p style={{ fontSize: "12px", color: "#64748b" }}>
        Hareket Görselleştirmesi
      </p>

      {/* GIF */}
      <div style={{
        width:          "100%",
        borderRadius:   "8px",
        overflow:       "hidden",
        background:     "#ffffff",
        display:        "flex",
        justifyContent: "center",
        alignItems:     "center",
        minHeight:      "160px"
      }}>
        <img   /*arka planı karıştırma modu ile kaldıralım.*/
            src={config.gif}
            alt={movement}
          style={{
          width:        "100%",
          maxHeight:    "180px",
          objectFit:    "contain",
          borderRadius: "8px",
          mixBlendMode: "darken",
          background:   "transparent"
        }}
            />
      </div>

      {/* Metrikler */}
      <div style={{
        display:             "grid",
        gridTemplateColumns: "1fr 1fr",
        gap:                 "8px",
        width:               "100%"
      }}>
        <div style={{
          background:    "#1e293b",
          borderRadius:  "8px",
          padding:       "10px",
          textAlign:     "center",
          border:        `1px solid ${angleColor}33`
        }}>
          <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "4px" }}>
            {config.angleLabel}
          </div>
          <div style={{ fontSize: "20px", fontWeight: "700", color: angleColor }}>
            {angle}°
          </div>
          <div style={{ fontSize: "11px", color: angleColor }}>
            {angleOk ? "✅ Doğru" : "❌ Yanlış"}
          </div>
        </div>

        <div style={{
          background:   "#1e293b",
          borderRadius: "8px",
          padding:      "10px",
          textAlign:    "center",
          border:       `1px solid ${speedColor}33`
        }}>
          <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "4px" }}>
            Hız
          </div>
          <div style={{ fontSize: "20px", fontWeight: "700", color: speedColor }}>
            {speed} m/s
          </div>
          <div style={{ fontSize: "11px", color: speedColor }}>
            {speedOk ? "✅ İyi" : "❌ Düşük"}
          </div>
        </div>
      </div>

      {/* Açıklama */}
      <p style={{
        fontSize:  "11px",
        color:     "#475569",
        textAlign: "center",
        margin:    "0"
      }}>
        {config.description}
      </p>
    </div>
  );
}