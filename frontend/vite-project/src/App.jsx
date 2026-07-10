import { useState, useRef, useEffect, useMemo } from 'react'
import Slider from 'rc-slider'
import 'rc-slider/assets/index.css'

function App() {
  const [pestanya, setPestanya] = useState("tallador")

  // ESTATS TALLADOR
  const [videoUrl, setVideoUrl] = useState(null)
  const [nomVideoActual, setNomVideoActual] = useState(null)
  const [durada, setDurada] = useState(0)
  const [talls, setTalls] = useState([0, 0])
  const [recents, setRecents] = useState([])
  const [renderitzantClip, setRenderitzantClip] = useState(false)
  const [missatgeClip, setMissatgeClip] = useState("")
  const [nomPersonalitzat, setNomPersonalitzat] = useState("")
  const [carpetaDesti, setCarpetaDesti] = useState("")
  const videoRef = useRef(null)
  
  // ESTATS EXPLORADOR
  const [carpetes, setCarpetes] = useState([])
  const [arxius, setArxius] = useState([])
  const [carpetaActual, setCarpetaActual] = useState("") 
  const [nomNovaCarpeta, setNomNovaCarpeta] = useState("")
  const [carpetesArrel, setCarpetesArrel] = useState([]) 

  // ESTATS CREADOR DE TOPS
  const [topTitol, setTopTitol] = useState("")
  const [topOrdre, setTopOrdre] = useState("ascendent")
  const [topNomSortida, setTopNomSortida] = useState("")
  const [renderitzantTop, setRenderitzantTop] = useState(false)
  const [missatgeTop, setMissatgeTop] = useState("")

  // --- ESTATS D'ESTIL AÏLLATS ---
  const [estilGlobal, setEstilGlobal] = useState({ 
    color: "#ffffff", stroke_color: "#000000", stroke_width: 4, pos_x: "center", pos_y: 70, font_size: 80, font: "Arial",
    list_x: 80, list_start_y: 450, list_gap_y: 110 // <-- AFEGEIX AIXÒ
  })
  const [mostrarEstilGlobal, setMostrarEstilGlobal] = useState(false)

  const estilPerDefecteClip = { color: "#ffffff", stroke_color: "#000000", stroke_width: 4, font_size: 70, font: "Arial" }

  const [topClips, setTopClips] = useState([
    { id: Date.now(), posicio: 1, arxiu: "", subtitol: "", mostrarEstil: false, estil: { ...estilPerDefecteClip } }
  ])

  // Estats de Previsualització
  const [previewSrc, setPreviewSrc] = useState(null)
  const [carregantPreview, setCarregantPreview] = useState(false)
  const [previewClipId, setPreviewClipId] = useState(null) 

  const carregarExplorador = async (carpeta = "") => {
    const res = await fetch(`http://localhost:8000/list-output?folder=${carpeta}`);
    const data = await res.json();
    setCarpetes(data.folders); setArxius(data.files);
    if (carpeta === "") setCarpetesArrel(data.folders);
  }

  useEffect(() => {
    fetch("http://localhost:8000/list-videos").then(res => res.json()).then(data => setRecents(data.videos))
    carregarExplorador("");
  }, [])

  useEffect(() => { carregarExplorador(carpetaActual); }, [carpetaActual])

  // LÒGICA TALLADOR
  const carregarVideo = async (event) => {
    const arxiu = event.target.files[0]
    if (arxiu) {
      const formData = new FormData(); formData.append("file", arxiu);
      await fetch("http://localhost:8000/upload", { method: "POST", body: formData });
      setVideoUrl(URL.createObjectURL(arxiu)); setNomVideoActual(arxiu.name);
      setRecents(prev => [...new Set([...prev, arxiu.name])]); setMissatgeClip("");
    }
  }

  const quanVideoCarrega = () => { if (videoRef.current) { setDurada(videoRef.current.duration); setTalls([0, videoRef.current.duration]); } }

  const alCanviarSlider = (nousValors) => {
    setTalls(nousValors)
    if (videoRef.current) {
      if (nousValors[0] !== talls[0]) videoRef.current.currentTime = nousValors[0]
      else if (nousValors[1] !== talls[1]) videoRef.current.currentTime = nousValors[1]
    }
  }

  const controlarLimitReproduccio = () => {
    if (videoRef.current && !videoRef.current.paused) {
      if (videoRef.current.currentTime >= talls[1]) { videoRef.current.pause(); videoRef.current.currentTime = talls[0]; }
    }
  }

  const controlarIniciReproduccio = () => {
    if (videoRef.current && (videoRef.current.currentTime < talls[0] || videoRef.current.currentTime >= talls[1])) videoRef.current.currentTime = talls[0]
  }

  const marquesTemps = useMemo(() => {
    const marques = {}; if (durada === 0) return marques;
    let interval = 5; if (durada > 60) interval = 10; if (durada > 120) interval = 30;
    for (let i = 0; i <= durada; i += interval) marques[i] = { style: { color: '#9ca3af', marginTop: '12px', fontSize: '18px' }, label: `${i}s` };
    return marques;
  }, [durada]);

  const exportarClip = async () => {
    if (!nomVideoActual) return;
    let nomFinal = nomPersonalitzat.trim() !== "" ? nomPersonalitzat.trim() : `clip_${Math.floor(Date.now() / 1000)}`;
    setRenderitzantClip(true); setMissatgeClip("⏳ Exportant clip...");
    try {
      const res = await fetch("http://localhost:8000/render", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ video_path: nomVideoActual, start: talls[0], end: talls[1], output_name: nomFinal, folder_name: carpetaDesti })
      });
      if (res.ok) { setMissatgeClip(`✅ Clip guardat!`); carregarExplorador(carpetaActual); } 
      else { const error = await res.json(); setMissatgeClip(`❌ ${error.detail}`); }
    } catch (err) { setMissatgeClip("❌ Error del servidor"); }
    setRenderitzantClip(false);
  }

  // LÒGICA EXPLORADOR
  const crearCarpeta = async () => {
    if (!nomNovaCarpeta.trim()) return;
    await fetch("http://localhost:8000/create-folder", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ folder_name: nomNovaCarpeta.trim() }) });
    setNomNovaCarpeta(""); carregarExplorador(""); 
  }
  const eliminarArxiu = async (nom) => {
    if (window.confirm(`Segur que vols eliminar "${nom}"?`)) {
      await fetch("http://localhost:8000/delete-file", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ filename: nom, folder: carpetaActual }) });
      carregarExplorador(carpetaActual);
    }
  }
  const moureArxiu = async (nom, desti) => {
    await fetch("http://localhost:8000/move-file", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ filename: nom, current_folder: carpetaActual, new_folder: desti }) });
    carregarExplorador(carpetaActual);
  }

  const afegirClipAlTop = (nomArxiu) => {
    setTopClips(prev => [...prev, { id: Date.now(), posicio: prev.length + 1, arxiu: nomArxiu, subtitol: "", mostrarEstil: false, estil: { ...estilPerDefecteClip } }]);
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  }

  // LÒGICA CREADOR TOPS
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
    if (previewClipId === id) tancarPreview();
  };

  // --- PREVIEWS SEPARADES ---
// --- PREVIEWS SEPARADES ---
const generarPreviewGlobal = async (silenci = false) => {
    if (!topClips[0] || !topClips[0].arxiu) { alert("Posa un vídeo al primer clip per previsualitzar el fons."); return; }
    if (!silenci) { setCarregantPreview(true); setPreviewSrc(null); }
    setPreviewClipId('global'); 

    try {
      const res = await fetch("http://localhost:8000/preview-frame", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          video_path: topClips[0].arxiu,
          
          global_text: topTitol,
          global_color: estilGlobal.color, global_stroke_color: estilGlobal.stroke_color, global_stroke_width: estilGlobal.stroke_width,
          global_pos_x: estilGlobal.pos_x, global_pos_y: estilGlobal.pos_y, 
          global_font_size: estilGlobal.font_size, global_font: estilGlobal.font,
          
          clips: topClips, // NOU: Enviem tota la llista d'arxius
          
          total_slots: topClips.length, 
          current_slot: 0, 
          list_x: estilGlobal.list_x, list_start_y: estilGlobal.list_start_y, list_gap_y: estilGlobal.list_gap_y
        })
      });
      if (res.ok) { const blob = await res.blob(); setPreviewSrc(URL.createObjectURL(blob)); }
    } catch (e) { if (!silenci) alert("❌ Error de connexió"); }
    if (!silenci) setCarregantPreview(false);
  }
  
  const generarPreviewClip = async (clip, silenci = false) => {
    if (!clip.arxiu) return;
    if (!silenci) { setCarregantPreview(true); setPreviewSrc(null); }
    setPreviewClipId(clip.id); 

    try {
      const res = await fetch("http://localhost:8000/preview-frame", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          video_path: clip.arxiu,
          
          global_text: topTitol,
          global_color: estilGlobal.color, global_stroke_color: estilGlobal.stroke_color, global_stroke_width: estilGlobal.stroke_width,
          global_pos_x: estilGlobal.pos_x, global_pos_y: estilGlobal.pos_y, 
          global_font_size: estilGlobal.font_size, global_font: estilGlobal.font,
          
          clips: topClips, // NOU: Enviem tota la llista per saber l'estil dels clips anteriors
          
          total_slots: topClips.length, 
          current_slot: clip.posicio, 
          list_x: estilGlobal.list_x, list_start_y: estilGlobal.list_start_y, list_gap_y: estilGlobal.list_gap_y
        })
      });
      if (res.ok) { const blob = await res.blob(); setPreviewSrc(URL.createObjectURL(blob)); }
    } catch (e) { if (!silenci) alert("❌ Error de connexió"); }
    if (!silenci) setCarregantPreview(false);
  }

  const tancarPreview = () => { setPreviewSrc(null); setPreviewClipId(null); setCarregantPreview(false); }

  useEffect(() => {
    if (previewClipId === 'global') {
      const timer = setTimeout(() => { generarPreviewGlobal(true); }, 400); 
      return () => clearTimeout(timer);
    } else if (previewClipId !== null) {
      const clipActiu = topClips.find(c => c.id === previewClipId);
      if (clipActiu) {
        const timer = setTimeout(() => { generarPreviewClip(clipActiu, true); }, 400); 
        return () => clearTimeout(timer);
      }
    }
  }, [estilGlobal, topTitol, topClips, previewClipId]);

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
    <div style={{ padding: "20px", width: "98vw", margin: "0 auto", color: "white", fontFamily: "sans-serif", textAlign: "center", boxSizing: "border-box" }}>
      
      <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginBottom: "40px" }}>
        <button onClick={() => setPestanya("tallador")} style={{ padding: "15px 30px", fontSize: "1.2rem", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", backgroundColor: pestanya === "tallador" ? "#3b82f6" : "#333", color: "white" }}>
          ✂️ Tallador de Clips
        </button>
        <button onClick={() => setPestanya("tops")} style={{ padding: "15px 30px", fontSize: "1.2rem", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", backgroundColor: pestanya === "tops" ? "#eab308" : "#333", color: pestanya === "tops" ? "black" : "white" }}>
          🏆 AutoTop Studio (Creador)
        </button>
      </div>

      {/* --- PESTANYA 1: TALLADOR --- */}
      {pestanya === "tallador" && (
        <>
          <div style={{ marginBottom: "30px", display: "flex", gap: "20px", justifyContent: "center" }}>
            <input type="file" accept="video/mp4" onChange={carregarVideo} style={{ padding: "15px", backgroundColor: "#333", borderRadius: "8px", color: "white" }} />
            <select style={{ padding: "15px", backgroundColor: "#444", color: "white", borderRadius: "8px" }} onChange={(e) => { if (e.target.value) { setVideoUrl(`http://localhost:8000/assets/${e.target.value}`); setNomVideoActual(e.target.value); if (videoRef.current) videoRef.current.load(); } }}>
              <option value="">Obre un original recent...</option>
              {recents.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>

          {videoUrl && (
            <div style={{ backgroundColor: "#1e1e1e", padding: "40px", borderRadius: "16px", marginBottom: "40px", boxSizing: "border-box" }}>
              <video ref={videoRef} src={videoUrl} controls onLoadedMetadata={quanVideoCarrega} onTimeUpdate={controlarLimitReproduccio} onPlay={controlarIniciReproduccio} style={{ width: "auto", maxWidth: "100%", maxHeight: "60vh", borderRadius: "12px", backgroundColor: "black" }} />
              <div style={{ marginTop: "60px", padding: "0 20px" }}>
                <h3 style={{ margin: "0 0 30px 0", fontSize: "1.8rem" }}>Talls: <span style={{ color: "#4ade80" }}>{talls[0].toFixed(1)}s</span> fins a <span style={{ color: "#f87171" }}>{talls[1].toFixed(1)}s</span></h3>
                <div style={{ textAlign: "left" }}><Slider range allowCross={false} min={0} max={durada} step={0.1} value={talls} onChange={alCanviarSlider} marks={marquesTemps} trackStyle={[{ backgroundColor: '#646cff', height: 20 }]} railStyle={{ backgroundColor: '#444', height: 20 }} handleStyle={[{ borderColor: '#fff', height: 54, width: 8, marginTop: -17, backgroundColor: 'white', cursor: 'ew-resize', borderRadius: '3px' }, { borderColor: '#fff', height: 54, width: 8, marginTop: -17, backgroundColor: 'white', cursor: 'ew-resize', borderRadius: '3px' }]} dotStyle={{ display: 'none' }} /></div>
                <div style={{ marginTop: "80px", display: "flex", gap: "15px", justifyContent: "center", backgroundColor: "#2d2d2d", padding: "20px", borderRadius: "12px" }}>
                  <input type="text" placeholder="Nom del clip" value={nomPersonalitzat} onChange={e => setNomPersonalitzat(e.target.value)} style={{ padding: "10px", borderRadius: "6px" }} />
                  <select value={carpetaDesti} onChange={e => setCarpetaDesti(e.target.value)} style={{ padding: "10px", borderRadius: "6px" }}>
                    <option value="">Guarda a l'arrel</option>
                    {carpetesArrel.filter(c => c !== "Tops_Finals").map(c => <option key={c} value={c}>📁 {c}</option>)}
                  </select>
                  <button onClick={exportarClip} disabled={renderitzantClip} style={{ padding: "10px 20px", backgroundColor: renderitzantClip ? "#555" : "#ef4444", color: "white", borderRadius: "6px", fontWeight: "bold", border: "none", cursor: "pointer" }}>{renderitzantClip ? "Tallant..." : "Guardar Clip"}</button>
                </div>
                {missatgeClip && <p style={{ color: "#60a5fa", marginTop: "15px" }}>{missatgeClip}</p>}
              </div>
            </div>
          )}
        </>
      )}

      {/* --- PESTANYA 2: CREADOR DE TOPS --- */}
      {pestanya === "tops" && (
        <div style={{ backgroundColor: "#1e1e1e", padding: "40px", borderRadius: "16px", marginBottom: "40px", textAlign: "left" }}>
          
          {/* BARRA SUPERIOR - TÍTOL GLOBAL */}
          <div style={{ display: "flex", gap: "15px", marginBottom: "15px", alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", color: "#9ca3af", marginBottom: "5px" }}>Títol Global del Vídeo:</label>
              <div style={{ display: "flex", gap: "10px" }}>
                <input type="text" value={topTitol} onChange={e => setTopTitol(e.target.value)} placeholder="Ex: Top 5 Dades curioses" style={{ flex: 1, padding: "12px", borderRadius: "6px", backgroundColor: "#333", color: "white", border: "1px solid #555" }} />
                
                {/* BOTONS TÍTOL GLOBAL */}
                <button onClick={() => setMostrarEstilGlobal(!mostrarEstilGlobal)} style={{ padding: "0 20px", backgroundColor: mostrarEstilGlobal ? "#6b7280" : "#4b5563", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>
                  🎨 Modificar text
                </button>
                <button onClick={() => previewClipId === 'global' ? tancarPreview() : generarPreviewGlobal(false)} style={{ padding: "0 20px", backgroundColor: previewClipId === 'global' ? "#10b981" : "#3b82f6", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>
                  {previewClipId === 'global' ? "👁️ Ocultar" : "👁️ Ver Títol"}
                </button>
              </div>
            </div>
            <div>
              <label style={{ display: "block", color: "#9ca3af", marginBottom: "5px" }}>Arxiu final (.mp4):</label>
              <input type="text" value={topNomSortida} onChange={e => setTopNomSortida(e.target.value)} placeholder="video_final" style={{ width: "200px", padding: "12px", borderRadius: "6px", backgroundColor: "#333", color: "white", border: "1px solid #555" }} />
            </div>
          </div>

          {/* DESPLEGABLE ESTIL TÍTOL GLOBAL (Amb X i Y) */}
          {mostrarEstilGlobal && (
            <div style={{ backgroundColor: "#252525", padding: "20px", borderRadius: "12px", marginBottom: "30px", border: "1px dashed #eab308" }}>
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
                
                {/* NOU: DESPLEGABLE X I MINI SLIDER Y */}
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
                {/* 👇 ENGANXA LA MODIFICACIÓ C JUST AQUÍ (LA TEVA LÍNIA 379 BUIDA) 👇 */}
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
            {/* 👆 FINS AQUÍ 👆 */}
              </div>
            </div>
          )}

          <hr style={{ borderColor: "#333", margin: "30px 0" }}/>

          <div style={{ display: "flex", gap: "30px", alignItems: "flex-start" }}>
            
            {/* COLUMNA ESQUERRA: LLISTA DE CLIPS (Ara cadascú té el seu estil) */}
            <div style={{ flex: 1.2 }}>
              <div style={{ backgroundColor: "#2d2d2d", padding: "20px", borderRadius: "12px", marginBottom: "30px" }}>
                <h3 style={{ margin: "0 0 20px 0" }}>Llista de Clips</h3>
                
                {topClips.map((clip, index) => (
                  <div key={clip.id} style={{ marginBottom: "15px", backgroundColor: previewClipId === clip.id ? "#374151" : "#1a1a1a", borderRadius: "8px", border: previewClipId === clip.id ? "1px solid #3b82f6" : "1px solid transparent" }}>
                    
                    {/* FILA PRINCIPAL DEL CLIP */}
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

                      {/* BOTONS DEL CLIP */}
                      <button onClick={() => actualitzarSlot(clip.id, "mostrarEstil", !clip.mostrarEstil)} style={{ padding: "8px 12px", backgroundColor: clip.mostrarEstil ? "#6b7280" : "#4b5563", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                        🎨 Modificar
                      </button>
                      <button onClick={() => previewClipId === clip.id ? tancarPreview() : generarPreviewClip(clip, false)} style={{ padding: "8px 12px", backgroundColor: previewClipId === clip.id ? "#10b981" : "#3b82f6", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                        {previewClipId === clip.id ? "👁️ Ocultar" : "👁️ Ver"}
                      </button>
                      <button onClick={() => treureSlot(clip.id)} style={{ padding: "8px 12px", backgroundColor: "#ef4444", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>X</button>
                    </div>

                    {/* DESPLEGABLE ESTIL DEL CLIP (Sense posicions X/Y) */}
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
              </div>
            </div>

            {/* COLUMNA DRETA: ZONA DE LA PREVIEW FORÇADA A 9:16 */}
            {(previewSrc || carregantPreview) && (
              <div style={{ flex: 0.8, position: "sticky", top: "20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                {carregantPreview && !previewSrc && <p style={{ color: "#60a5fa", textAlign: "center", width: "100%", marginBottom: "15px" }}>⏳ Carregant preview...</p>}
                
                {previewSrc && (
                  <div style={{ backgroundColor: "#2d2d2d", padding: "20px", borderRadius: "12px", textAlign: "center", width: "100%" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                      <h3 style={{ margin: 0, fontSize: "1rem" }}>📱 Preview {previewClipId === 'global' ? "(Títol)" : "(Clip)"}</h3>
                      <button onClick={tancarPreview} style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: "1.2rem" }}>✖</button>
                    </div>
                    
                    <div style={{ width: "100%", aspectRatio: "9/16", backgroundColor: "black", borderRadius: "8px", border: "2px solid #eab308", display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden" }}>
                      <img src={previewSrc} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

          <div style={{ textAlign: "center", marginTop: "20px", borderTop: "1px solid #444", paddingTop: "30px" }}>
            <button onClick={generarTopFinal} disabled={renderitzantTop} style={{ padding: "15px 40px", fontSize: "1.3rem", backgroundColor: renderitzantTop ? "#555" : "#eab308", color: renderitzantTop ? "white" : "black", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
              {renderitzantTop ? "⚙️ Processant tot l'arxiu..." : "🚀 Generar Top Final"}
            </button>
            {missatgeTop && <p style={{ color: "#4ade80", marginTop: "15px", fontSize: "1.1rem" }}>{missatgeTop}</p>}
          </div>

        </div>
      )}

      {/* --- EXPLORADOR D'ARXIUS --- */}
      <div style={{ backgroundColor: "#1e1e1e", padding: "40px", borderRadius: "16px", boxSizing: "border-box" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", borderBottom: "1px solid #333", paddingBottom: "15px" }}>
          
          <h2 style={{ margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
            🗂️ Sortida: <span style={{ color: "#60a5fa" }}>{carpetaActual === "" ? "Arrel" : carpetaActual}</span>
            {carpetaActual === "Tops_Finals" && <span style={{ fontSize: "1rem", backgroundColor: "#eab308", color: "black", padding: "3px 8px", borderRadius: "12px", marginLeft: "10px" }}>Protegida</span>}
          </h2>
          
          <div style={{ display: "flex", gap: "15px" }}>
            {carpetaActual !== "" && <button onClick={() => setCarpetaActual("")} style={{ padding: "10px 20px", backgroundColor: "#4b5563", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>🔙 Tornar a l'Arrel</button>}
            {carpetaActual === "" && (
              <div style={{ display: "flex", gap: "10px" }}>
                <input type="text" placeholder="Nova carpeta..." value={nomNovaCarpeta} onChange={e => setNomNovaCarpeta(e.target.value)} style={{ padding: "10px", borderRadius: "6px", backgroundColor: "#1a1a1a", color: "white", border: "1px solid #555" }} />
                <button onClick={crearCarpeta} style={{ padding: "10px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "6px" }}>Crear</button>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "20px", textAlign: "left" }}>
          {carpetes.map(carpeta => (
            <div key={carpeta} onClick={() => setCarpetaActual(carpeta)} style={{ padding: "20px", backgroundColor: carpeta === "Tops_Finals" ? "#422006" : "#2d2d2d", borderRadius: "12px", cursor: "pointer", border: carpeta === "Tops_Finals" ? "2px solid #eab308" : "1px solid #444", display: "flex", alignItems: "center", gap: "15px" }}>
              <span style={{ fontSize: "2rem" }}>{carpeta === "Tops_Finals" ? "🌟" : "📁"}</span>
              <span style={{ fontSize: "1.2rem", fontWeight: "bold" }}>{carpeta}</span>
            </div>
          ))}

          {arxius.map(arxiu => (
            <div key={arxiu} style={{ backgroundColor: "#2d2d2d", borderRadius: "12px", border: "1px solid #444", display: "flex", flexDirection: "column" }}>
              <a href={`http://localhost:8000/output/${carpetaActual ? carpetaActual + '/' : ''}${arxiu}`} target="_blank" rel="noopener noreferrer" style={{ padding: "20px", textDecoration: "none", color: "white", flex: 1, display: "flex", flexDirection: "column", gap: "10px", paddingBottom: "10px" }}>
                <span style={{ fontSize: "2.5rem", textAlign: "center" }}>🎞️</span>
                <span style={{ fontSize: "1rem", textAlign: "center", wordBreak: "break-all" }}>{arxiu}</span>
              </a>
              
              {carpetaActual === "" && pestanya === "tops" && (
                <div style={{ padding: "0 10px 10px 10px" }}>
                   <button onClick={() => afegirClipAlTop(arxiu)} style={{ width: "100%", padding: "8px", backgroundColor: "#059669", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>➕ Afegir al Top</button>
                </div>
              )}

              <div style={{ backgroundColor: "#1a1a1a", padding: "10px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #444" }}>
                {carpetaActual !== "Tops_Finals" ? (
                  carpetaActual === "" ? (
                    <select onChange={e => { if(e.target.value) moureArxiu(arxiu, e.target.value) }} value="" style={{ padding: "6px", backgroundColor: "#333", color: "white", borderRadius: "4px", maxWidth: "120px" }}>
                      <option value="" disabled>Moure a...</option>
                      {carpetesArrel.filter(c => c !== "Tops_Finals").map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  ) : ( <button onClick={() => moureArxiu(arxiu, "")} style={{ padding: "6px 10px", backgroundColor: "#4b5563", color: "white", border: "none", borderRadius: "4px" }}>🔙 L'arrel</button> )
                ) : ( <span style={{ fontSize: "0.8rem", color: "#eab308", paddingLeft: "5px" }}>Finalitzat</span> )}
                <button onClick={() => eliminarArxiu(arxiu)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem" }}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default App