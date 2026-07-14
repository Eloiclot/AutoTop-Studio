import { useState } from 'react'

export default function Ranking({ 
  topClips, setTopClips, totsElsArxius, carpetaActual, 
  previewClipId, setPreviewClipId, estilPerDefecteClip, setPreviewSrc,
  topTitol, topOrdre, ordrePersonalitzat, topNomSortida, estilGlobal, carregarExplorador
}) {
  const [renderitzantTop, setRenderitzantTop] = useState(false)
  const [missatgeTop, setMissatgeTop] = useState("")
  const [progres, setProgres] = useState(0) 
  const [videoAcabat, setVideoAcabat] = useState(null)

  const afegirSlotClip = () => {
    setTopClips([...topClips, { id: Date.now(), posicio: topClips.length + 1, arxiu: "", subtitol: "", mostrarEstil: false, estil: { ...estilPerDefecteClip } }]);
  };
  
  const actualitzarSlot = (id, camp, valor) => {
    setTopClips(topClips.map(clip => clip.id === id ? { ...clip, [camp]: valor } : clip));
  };

  const actualitzarEstilClip = (id, camp, valor) => {
    setTopClips(topClips.map(clip => clip.id === id ? { ...clip, estil: { ...clip.estil, [camp]: valor } } : clip));
  };

  const canviarPosicio = (id, novaPosicioStr) => {
    const posNova = parseInt(novaPosicioStr);
    const clipMogut = topClips.find(c => c.id === id);
    const posAntiga = clipMogut.posicio;

    const nousClips = topClips.map(clip => {
      if (clip.id === id) return { ...clip, posicio: posNova };
      if (clip.posicio === posNova) return { ...clip, posicio: posAntiga };
      return clip;
    });

    nousClips.sort((a, b) => a.posicio - b.posicio);
    setTopClips(nousClips);
  };
  
  const treureSlot = (id) => {
    const filtrats = topClips.filter(clip => clip.id !== id);
    const normalitzats = filtrats.map((clip, index) => ({ ...clip, posicio: index + 1 }));
    setTopClips(normalitzats);
    
    if (previewClipId === id) {
      setPreviewSrc(null);
      setPreviewClipId(null);
    }
  };

  const cancelarRender = async () => {
    try {
      await fetch("http://localhost:8000/cancel-render", { method: "POST" });
      setMissatgeTop("⚠️ Cancel·lant la renderització...");
    } catch (e) {
      console.error("Error cancel·lant", e);
    }
  };

  // NOVA FUNCIÓ: Neteja l'estat local sense recarregar la pàgina
  const netejarTop = () => {
    setTopClips([]); 
    setPreviewClipId(null);
    setPreviewSrc(null);
    setVideoAcabat(null);
    setMissatgeTop("");
    setProgres(0);
  };

  const generarTopFinal = async () => {
    if (!topTitol) { setMissatgeTop("❌ Posa-hi un títol global primer."); return; }
    if (topClips.some(c => c.arxiu === "")) { setMissatgeTop("❌ Tens slots sense vídeo assignat."); return; }
    
    if (topOrdre === "personalitzat" && !ordrePersonalitzat.trim()) {
      setMissatgeTop("❌ Has de posar la seqüència (ex: 3,5,1,2,4)"); return;
    }

    let nomFinal = topNomSortida.trim() !== "" ? topNomSortida.trim() : `TOP_${Math.floor(Date.now() / 1000)}`;
    setRenderitzantTop(true); 
    setMissatgeTop("⏳ Muntant el vídeo complet...");
    setProgres(0);
    setVideoAcabat(null); 

    const intervalProgres = setInterval(async () => {
      try {
        const res = await fetch("http://localhost:8000/progress");
        const data = await res.json();
        setProgres(data.percent);
      } catch (e) {}
    }, 500);

    try {
      const res = await fetch("http://localhost:8000/render-top", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          titol_global: topTitol, 
          ordre: topOrdre, 
          ordre_personalitzat: ordrePersonalitzat, 
          clips: topClips, 
          output_name: nomFinal, 
          estil_global: estilGlobal,
          global_has_bg: estilGlobal.has_bg,
          global_bg_color: estilGlobal.bg_color
        })
      });
      
      const data = await res.json();
      
      if (res.ok) { 
        setProgres(100);
        setMissatgeTop(""); 
        setVideoAcabat(data.file); 
        carregarExplorador(carpetaActual); 
      } else { 
        if (data.detail && data.detail.includes("CANCELLED_BY_USER")) {
          setMissatgeTop("🛑 Renderització cancel·lada per l'usuari.");
        } else {
          setMissatgeTop(`❌ ${data.detail}`); 
        }
      }
    } catch (e) { 
      setMissatgeTop("❌ Error de connexió amb el servidor"); 
    } finally {
      clearInterval(intervalProgres);
      setRenderitzantTop(false);
    }
  }

  return (
    <div style={{ backgroundColor: "#2d2d2d", padding: "20px", borderRadius: "12px", width: "100%", boxSizing: "border-box" }}>
      <h3 style={{ margin: "0 0 20px 0" }}>Llista de Clips</h3>
      
      {topClips.map((clip, index) => (
        <div key={clip.id} style={{ marginBottom: "15px", backgroundColor: previewClipId === clip.id ? "#374151" : "#1a1a1a", borderRadius: "8px", border: previewClipId === clip.id ? "1px solid #3b82f6" : "1px solid transparent", transition: "all 0.2s" }}>
          
          <div style={{ display: "flex", gap: "10px", alignItems: "center", padding: "10px" }}>
            
            <div style={{ width: "60px" }}>
              <select 
                value={clip.posicio} 
                onChange={e => canviarPosicio(clip.id, e.target.value)} 
                style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #444", backgroundColor: "#333", color: "#eab308", fontWeight: "bold", cursor: "pointer", textAlign: "center" }} 
                title="Canviar posició"
              >
                {topClips.map((_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                ))}
              </select>
            </div>
            
            <div style={{ width: "140px" }}>
              <select value={clip.arxiu} onChange={e => actualitzarSlot(clip.id, "arxiu", e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #444", backgroundColor: "#333", color: "white" }}>
                <option value="">Vídeo...</option>
                {totsElsArxius.map(a => <option key={a} value={a}>{a}</option>)}
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
      
      {!videoAcabat && (
        <button onClick={afegirSlotClip} style={{ padding: "10px 20px", backgroundColor: "#4b5563", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>+ Afegir Slot Buit</button>
      )}

      <div style={{ textAlign: "center", marginTop: "30px", paddingTop: "25px", borderTop: "1px solid #444" }}>
        
        {/* NOVA PANTALLA D'ÈXIT (PAS INTERMIG) */}
        {videoAcabat && !renderitzantTop ? (
          <div style={{ backgroundColor: "#111", padding: "30px", borderRadius: "12px", border: "2px solid #10b981", boxShadow: "0 0 20px rgba(16, 185, 129, 0.2)" }}>
            <h2 style={{ color: "#10b981", margin: "0 0 25px 0", fontSize: "1.8rem" }}>🎉 Top Generat amb Èxit!</h2>
            
            {/* Visualitzador integrat */}
            <video 
              controls 
              src={`http://localhost:8000/output/Tops_Finals/${videoAcabat}`} 
              style={{ width: "100%", maxHeight: "400px", backgroundColor: "black", borderRadius: "8px", border: "1px solid #333", marginBottom: "30px" }}
            />

            <div style={{ display: "flex", gap: "20px", justifyContent: "center" }}>
              <button 
                onClick={() => window.open(`http://localhost:8000/output/Tops_Finals/${videoAcabat}`, '_blank')} 
                style={{ padding: "12px 24px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "1.1rem" }}
              >
                🍿 Obrir en pestanya nova
              </button>
              {/* MODIFICAT: Crida a la nova funció en lloc del reload */}
              <button 
                onClick={netejarTop} 
                style={{ padding: "12px 24px", backgroundColor: "#4b5563", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "1.1rem" }}
              >
                🔄 Netejar i Crear un altre Top
              </button>
            </div>
          </div>
        ) : (
          /* ZONA DE RENDERITZACIÓ ESTÀNDARD */
          <>
            {renderitzantTop && (
              <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "15px" }}>
                <div style={{ flex: 1, backgroundColor: "#111", borderRadius: "8px", overflow: "hidden", border: "1px solid #444" }}>
                  <div style={{ width: `${progres}%`, height: "20px", backgroundColor: "#3b82f6", transition: "width 0.3s ease-in-out" }}></div>
                </div>
                <button onClick={cancelarRender} style={{ padding: "0 20px", height: "20px", boxSizing: "content-box", backgroundColor: "#ef4444", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>
                  🛑 Cancel·lar
                </button>
              </div>
            )}

            {!renderitzantTop && (
              <button onClick={generarTopFinal} style={{ width: "100%", padding: "15px 40px", fontSize: "1.3rem", backgroundColor: "#eab308", color: "black", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
                🚀 Generar Top Final
              </button>
            )}

            {renderitzantTop && (
               <p style={{ color: "white", fontSize: "1.1rem", fontWeight: "bold" }}>⚙️ Processant... {progres}%</p>
            )}

            {missatgeTop && <p style={{ color: renderitzantTop ? "#60a5fa" : (missatgeTop.includes("❌") || missatgeTop.includes("🛑") ? "#ef4444" : "#4ade80"), marginTop: "15px", fontSize: "1.1rem" }}>{missatgeTop}</p>}
          </>
        )}
      </div>
    </div>
  )
}