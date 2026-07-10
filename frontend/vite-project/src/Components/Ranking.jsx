import { useState } from 'react'

export default function Ranking({ 
  topClips, setTopClips, arxius, carpetaActual, 
  previewClipId, setPreviewClipId, estilPerDefecteClip, setPreviewSrc,
  topTitol, topOrdre, topNomSortida, estilGlobal, carregarExplorador
}) {
  const [renderitzantTop, setRenderitzantTop] = useState(false)
  const [missatgeTop, setMissatgeTop] = useState("")

  const afegirSlotClip = () => {
    setTopClips([...topClips, { id: Date.now(), posicio: topClips.length + 1, arxiu: "", subtitol: "", mostrarEstil: false, estil: { ...estilPerDefecteClip } }]);
  };
  
  const actualitzarSlot = (id, camp, valor) => {
    setTopClips(topClips.map(clip => clip.id === id ? { ...clip, [camp]: valor } : clip));
  };

  const actualitzarEstilClip = (id, camp, valor) => {
    setTopClips(topClips.map(clip => clip.id === id ? { ...clip, estil: { ...clip.estil, [camp]: valor } } : clip));
  };
  
  const treureSlot = (id) => {
    setTopClips(topClips.filter(clip => clip.id !== id));
    if (previewClipId === id) {
      setPreviewSrc(null);
      setPreviewClipId(null);
    }
  };

  const generarTopFinal = async () => {
    if (!topTitol) { setMissatgeTop("❌ Posa-hi un títol global primer."); return; }
    if (topClips.some(c => c.arxiu === "")) { setMissatgeTop("❌ Tens slots sense vídeo assignat."); return; }
    let nomFinal = topNomSortida.trim() !== "" ? topNomSortida.trim() : `TOP_${Math.floor(Date.now() / 1000)}`;
    setRenderitzantTop(true); setMissatgeTop("⏳ Muntant el vídeo complet. Això trigarà força...");
    try {
      const res = await fetch("http://localhost:8000/render-top", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titol_global: topTitol, ordre: topOrdre, clips: topClips, output_name: nomFinal, estil_global: estilGlobal })
      });
      if (res.ok) { setMissatgeTop(`✅ TOP Generat perfectament a Tops_Finals!`); carregarExplorador(carpetaActual); } 
      else { const err = await res.json(); setMissatgeTop(`❌ ${err.detail}`); }
    } catch (e) { setMissatgeTop("❌ Error de connexió"); }
    setRenderitzantTop(false);
  }

  return (
    <div style={{ backgroundColor: "#2d2d2d", padding: "20px", borderRadius: "12px", width: "100%", boxSizing: "border-box" }}>
      <h3 style={{ margin: "0 0 20px 0" }}>Llista de Clips</h3>
      
      {topClips.map((clip, index) => (
        <div key={clip.id} style={{ marginBottom: "15px", backgroundColor: previewClipId === clip.id ? "#374151" : "#1a1a1a", borderRadius: "8px", border: previewClipId === clip.id ? "1px solid #3b82f6" : "1px solid transparent" }}>
          
          <div style={{ display: "flex", gap: "10px", alignItems: "center", padding: "10px" }}>
            <div style={{ width: "50px" }}>
              <input type="number" value={clip.posicio} onChange={e => actualitzarSlot(clip.id, "posicio", parseInt(e.target.value) || 0)} style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #444", backgroundColor: "#333", color: "white" }} title="Posició" />
            </div>
            <div style={{ width: "140px" }}>
              <select value={clip.arxiu} onChange={e => actualitzarSlot(clip.id, "arxiu", e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #444", backgroundColor: "#333", color: "white" }}>
                <option value="">Vídeo...</option>
                {carpetaActual === "" && arxius.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <input type="text" value={clip.subtitol} onChange={e => actualitzarSlot(clip.id, "subtitol", e.target.value)} placeholder="Subtítol del clip..." style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #444", backgroundColor: "#333", color: "white" }} />
            </div>

            <button onClick={() => actualitzarSlot(clip.id, "mostrarEstil", !clip.mostrarEstil)} style={{ padding: "8px 12px", backgroundColor: clip.mostrarEstil ? "#6b7280" : "#4b5563", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
              🎨 Modificar
            </button>
            
            <button 
              onClick={() => setPreviewClipId(clip.id)} 
              disabled={previewClipId === clip.id || !clip.arxiu}
              style={{ 
                padding: "8px 12px", 
                backgroundColor: !clip.arxiu ? "#4b5563" : (previewClipId === clip.id ? "#10b981" : "#3b82f6"), 
                color: !clip.arxiu ? "#9ca3af" : "white", 
                border: "none", 
                borderRadius: "4px", 
                cursor: !clip.arxiu ? "not-allowed" : (previewClipId === clip.id ? "default" : "pointer") 
              }}>
              {previewClipId === clip.id ? "👁️ Mostrant" : "👁️ Veure"}
            </button>
            
            <button onClick={() => treureSlot(clip.id)} style={{ padding: "8px 12px", backgroundColor: "#ef4444", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>X</button>
          </div>

          {clip.mostrarEstil && (
            <div style={{ backgroundColor: "#252525", padding: "15px", borderTop: "1px solid #444", display: "flex", gap: "15px", flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ fontSize: "0.8rem", color: "#eab308", fontWeight: "bold", marginRight: "10px" }}>Estil Clip {clip.posicio}:</div>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", color: "#9ca3af" }}>Font:</label>
                <select value={clip.estil.font} onChange={e => actualitzarEstilClip(clip.id, "font", e.target.value)} style={{ padding: "6px", borderRadius: "4px", backgroundColor: "#333", color: "white", border: "none" }}>
                  <option value="Arial">Arial</option> <option value="Verdana">Verdana</option> <option value="Impact">Impact</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", color: "#9ca3af" }}>Text:</label>
                <input type="color" value={clip.estil.color} onChange={e => actualitzarEstilClip(clip.id, "color", e.target.value)} style={{ padding: "0", cursor: "pointer", height: "30px", width: "35px", border: "none" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", color: "#9ca3af" }}>Vora:</label>
                <input type="color" value={clip.estil.stroke_color} onChange={e => actualitzarEstilClip(clip.id, "stroke_color", e.target.value)} style={{ padding: "0", cursor: "pointer", height: "30px", width: "35px", border: "none" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", color: "#9ca3af" }}>Gruix:</label>
                <input type="number" min="0" value={clip.estil.stroke_width} onChange={e => actualitzarEstilClip(clip.id, "stroke_width", parseInt(e.target.value) || 0)} style={{ width: "50px", padding: "6px", borderRadius: "4px", backgroundColor: "#333", color: "white", border: "none" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", color: "#9ca3af" }}>Mida:</label>
                <input type="number" value={clip.estil.font_size} onChange={e => actualitzarEstilClip(clip.id, "font_size", parseInt(e.target.value) || 10)} style={{ width: "60px", padding: "6px", borderRadius: "4px", backgroundColor: "#333", color: "white", border: "none" }} />
              </div>
            </div>
          )}
        </div>
      ))}
      <button onClick={afegirSlotClip} style={{ padding: "10px 20px", backgroundColor: "#4b5563", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>+ Afegir Slot Buit</button>

      {/* BOTÓ DE RENDER */}
      <div style={{ textAlign: "center", marginTop: "30px", paddingTop: "25px", borderTop: "1px solid #444" }}>
        <button onClick={generarTopFinal} disabled={renderitzantTop} style={{ width: "100%", padding: "15px 40px", fontSize: "1.3rem", backgroundColor: renderitzantTop ? "#555" : "#eab308", color: renderitzantTop ? "white" : "black", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
          {renderitzantTop ? "⚙️ Processant tot l'arxiu..." : "🚀 Generar Top Final"}
        </button>
        {missatgeTop && <p style={{ color: "#4ade80", marginTop: "15px", fontSize: "1.1rem" }}>{missatgeTop}</p>}
      </div>
    </div>
  )
}