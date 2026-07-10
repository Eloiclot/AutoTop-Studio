import { useState } from 'react'

export default function OpcionsGlobals({ 
  topTitol, setTopTitol, 
  topOrdre, setTopOrdre, 
  ordrePersonalitzat, setOrdrePersonalitzat,
  topNomSortida, setTopNomSortida,
  estilGlobal, setEstilGlobal
}) {
  const [mostrarEstilGlobal, setMostrarEstilGlobal] = useState(false)

  return (
    <>
      <div style={{ display: "flex", gap: "15px", marginBottom: "15px", alignItems: "flex-end" }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: "block", color: "#9ca3af", marginBottom: "5px" }}>Títol Global del Vídeo:</label>
          <div style={{ display: "flex", gap: "10px" }}>
            <input type="text" value={topTitol} onChange={e => setTopTitol(e.target.value)} placeholder="Ex: Top 5 Dades curioses" style={{ flex: 1, padding: "12px", borderRadius: "6px", backgroundColor: "#333", color: "white", border: "1px solid #555" }} />
            <button onClick={() => setMostrarEstilGlobal(!mostrarEstilGlobal)} style={{ padding: "0 20px", backgroundColor: mostrarEstilGlobal ? "#6b7280" : "#4b5563", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>
              🎨 Modificar text
            </button>
          </div>
        </div>
        <div>
          <label style={{ display: "block", color: "#9ca3af", marginBottom: "5px" }}>Ordre:</label>
          <div style={{ display: "flex", gap: "10px" }}>
            <select value={topOrdre} onChange={e => setTopOrdre(e.target.value)} style={{ width: "130px", padding: "12px", borderRadius: "6px", backgroundColor: "#333", color: "white", border: "1px solid #555" }}>
              <option value="ascendent">Ascendent</option>
              <option value="descendent">Descendent</option>
              <option value="personalitzat">Personalitzat</option>
            </select>
            
            {topOrdre === "personalitzat" && (
              <input 
                type="text" 
                value={ordrePersonalitzat} 
                onChange={e => setOrdrePersonalitzat(e.target.value)} 
                placeholder="Ex: 5,4,2,1,3" 
                title="Introdueix l'ordre desitjat separat per comes"
                style={{ width: "120px", padding: "12px", borderRadius: "6px", backgroundColor: "#333", color: "white", border: "1px solid #555" }} 
              />
            )}
          </div>
        </div>
        <div>
          <label style={{ display: "block", color: "#9ca3af", marginBottom: "5px" }}>Arxiu final (.mp4):</label>
          <input type="text" value={topNomSortida} onChange={e => setTopNomSortida(e.target.value)} placeholder="video_final" style={{ width: "180px", padding: "12px", borderRadius: "6px", backgroundColor: "#333", color: "white", border: "1px solid #555" }} />
        </div>
      </div>

      {mostrarEstilGlobal && (
        <div style={{ backgroundColor: "#252525", padding: "20px", borderRadius: "12px", marginBottom: "10px", border: "1px dashed #eab308" }}>
          <h4 style={{ margin: "0 0 15px 0", color: "#eab308" }}>🎨 Edició Títol Global</h4>
          <div style={{ display: "flex", gap: "15px", flexWrap: "wrap", alignItems: "center" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "#9ca3af" }}>Font:</label>
              <select value={estilGlobal.font} onChange={e => setEstilGlobal({...estilGlobal, font: e.target.value})} style={{ padding: "8px", borderRadius: "6px", backgroundColor: "#333", color: "white", border: "none" }}>
                <option value="Arial">Arial</option> <option value="Verdana">Verdana</option> <option value="Impact">Impact</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "#9ca3af" }}>Color Text:</label>
              <input type="color" value={estilGlobal.color} onChange={e => setEstilGlobal({...estilGlobal, color: e.target.value})} style={{ padding: "0", cursor: "pointer", height: "35px", width: "40px", border: "none" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "#9ca3af" }}>Color Vora:</label>
              <input type="color" value={estilGlobal.stroke_color} onChange={e => setEstilGlobal({...estilGlobal, stroke_color: e.target.value})} style={{ padding: "0", cursor: "pointer", height: "35px", width: "40px", border: "none" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "#9ca3af" }}>Gruix Vora:</label>
              <input type="number" min="0" value={estilGlobal.stroke_width} onChange={e => setEstilGlobal({...estilGlobal, stroke_width: parseInt(e.target.value) || 0})} style={{ width: "60px", padding: "8px", borderRadius: "6px", backgroundColor: "#333", color: "white", border: "none" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "#9ca3af" }}>Mida:</label>
              <input type="number" value={estilGlobal.font_size} onChange={e => setEstilGlobal({...estilGlobal, font_size: parseInt(e.target.value) || 10})} style={{ width: "70px", padding: "8px", borderRadius: "6px", backgroundColor: "#333", color: "white", border: "none" }} />
            </div>
            
            <div style={{ borderLeft: "1px solid #444", paddingLeft: "15px", display: "flex", gap: "15px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#eab308" }}>Pos X:</label>
                <select value={estilGlobal.pos_x} onChange={e => setEstilGlobal({...estilGlobal, pos_x: e.target.value})} style={{ padding: "8px", borderRadius: "6px", backgroundColor: "#333", color: "white", border: "1px solid #eab308" }}>
                  <option value="left">Esquerra</option>
                  <option value="center">Centre</option>
                  <option value="right">Dreta</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#eab308" }}>Pos Y ({estilGlobal.pos_y}px):</label>
                <input type="range" min="0" max="300" step="10" value={estilGlobal.pos_y} onChange={e => setEstilGlobal({...estilGlobal, pos_y: parseInt(e.target.value) || 0})} style={{ cursor: "pointer", marginTop: "8px" }} />
              </div>
            </div>
            
            <div style={{ borderLeft: "1px solid #444", paddingLeft: "15px", marginLeft: "15px", display: "flex", gap: "15px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#60a5fa" }}>Llista Pos X:</label>
                <input type="number" value={estilGlobal.list_x} onChange={e => setEstilGlobal({...estilGlobal, list_x: parseInt(e.target.value) || 0})} style={{ width: "70px", padding: "8px", borderRadius: "6px", backgroundColor: "#333", color: "white", border: "1px solid #60a5fa" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#60a5fa" }}>Llista Inici Y:</label>
                <input type="number" value={estilGlobal.list_start_y} onChange={e => setEstilGlobal({...estilGlobal, list_start_y: parseInt(e.target.value) || 0})} style={{ width: "70px", padding: "8px", borderRadius: "6px", backgroundColor: "#333", color: "white", border: "1px solid #60a5fa" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#60a5fa" }}>Separació Y:</label>
                <input type="number" value={estilGlobal.list_gap_y} onChange={e => setEstilGlobal({...estilGlobal, list_gap_y: parseInt(e.target.value) || 0})} style={{ width: "70px", padding: "8px", borderRadius: "6px", backgroundColor: "#333", color: "white", border: "1px solid #60a5fa" }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}