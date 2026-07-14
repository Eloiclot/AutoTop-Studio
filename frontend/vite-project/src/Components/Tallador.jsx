import { useState, useRef, useEffect, useMemo } from 'react'
import Slider from 'rc-slider'
import 'rc-slider/assets/index.css'

export default function Tallador({ carpetesArrel, carregarExplorador, carpetaActual }) {
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

  useEffect(() => {
    fetch("http://localhost:8000/list-videos").then(res => res.json()).then(data => setRecents(data.videos))
  }, [])

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
    for (let i = 0; i <= durada; i += interval) marques[i] = { style: { color: '#9ca3af', marginTop: '6px', fontSize: '12px' }, label: `${i}s` };
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

  return (
    <>
      {!videoUrl && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", marginTop: "40px", backgroundColor: "#1e1e1e", padding: "50px", borderRadius: "16px" }}>
          <h2 style={{ color: "white", margin: "0 0 20px 0" }}>🎬 Selecciona un vídeo per començar a tallar</h2>
          <input type="file" accept="video/mp4" onChange={carregarVideo} style={{ padding: "15px", backgroundColor: "#333", borderRadius: "8px", color: "white", width: "300px" }} />
          <select style={{ padding: "15px", backgroundColor: "#444", color: "white", borderRadius: "8px", width: "300px" }} onChange={(e) => { if (e.target.value) { setVideoUrl(`http://localhost:8000/assets/${e.target.value}`); setNomVideoActual(e.target.value); if (videoRef.current) videoRef.current.load(); } }}>
            <option value="">Obre un original recent...</option>
            {recents.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
      )}

      {videoUrl && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 10px 10px 10px", borderBottom: "1px solid #333", marginBottom: "15px" }}>
            <div style={{ color: "#9ca3af", fontSize: "0.9rem" }}>
              Editant: <span style={{ color: "white", fontWeight: "bold" }}>{nomVideoActual}</span>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <input type="file" accept="video/mp4" onChange={carregarVideo} style={{ padding: "6px", backgroundColor: "#333", borderRadius: "4px", color: "white", fontSize: "0.8rem", width: "180px", border: "none" }} />
              <select style={{ padding: "6px", backgroundColor: "#444", color: "white", borderRadius: "4px", fontSize: "0.8rem", border: "none" }} onChange={(e) => { if (e.target.value) { setVideoUrl(`http://localhost:8000/assets/${e.target.value}`); setNomVideoActual(e.target.value); if (videoRef.current) videoRef.current.load(); } }}>
                <option value="">Canviar a recent...</option>
                {recents.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>

          <div style={{ backgroundColor: "#1e1e1e", padding: "15px 20px", borderRadius: "12px", display: "flex", flexDirection: "column", alignItems: "center", width: "100%", boxSizing: "border-box" }}>
            
            {/* L'alçada ha baixat a 55vh perquè càpiga sencer a pantalles de portàtil */}
            <video ref={videoRef} src={videoUrl} controls onLoadedMetadata={quanVideoCarrega} onTimeUpdate={controlarLimitReproduccio} onPlay={controlarIniciReproduccio} style={{ width: "auto", maxWidth: "100%", maxHeight: "55vh", borderRadius: "8px", backgroundColor: "black", boxShadow: "0 4px 10px rgba(0,0,0,0.3)" }} />
            
            <div style={{ width: "100%", marginTop: "15px" }}>
              
              {/* S'ha reduït el marge inferior a 15px */}
              <div style={{ padding: "0 10px", marginBottom: "15px", width: "100%", boxSizing: "border-box" }}>
                <Slider range allowCross={false} min={0} max={durada} step={0.1} value={talls} onChange={alCanviarSlider} marks={marquesTemps} trackStyle={[{ backgroundColor: '#646cff', height: 16 }]} railStyle={{ backgroundColor: '#444', height: 16 }} handleStyle={[{ borderColor: '#fff', height: 35, width: 8, marginTop: -9, backgroundColor: 'white', cursor: 'ew-resize', borderRadius: '3px' }, { borderColor: '#fff', height: 35, width: 8, marginTop: -9, backgroundColor: 'white', cursor: 'ew-resize', borderRadius: '3px' }]} dotStyle={{ display: 'none' }} />
              </div>

              <div style={{ display: "flex", gap: "15px", justifyContent: "center", alignItems: "center", backgroundColor: "#2d2d2d", padding: "10px 20px", borderRadius: "8px", flexWrap: "wrap" }}>
                
                <div style={{ fontSize: "1.1rem", fontWeight: "bold", marginRight: "10px", backgroundColor: "#111", padding: "6px 12px", borderRadius: "6px" }}>
                  ⏱️ <span style={{ color: "#4ade80" }}>{talls[0].toFixed(1)}s</span> - <span style={{ color: "#f87171" }}>{talls[1].toFixed(1)}s</span>
                </div>

                <input type="text" placeholder="Nom del clip" value={nomPersonalitzat} onChange={e => setNomPersonalitzat(e.target.value)} style={{ padding: "8px", borderRadius: "4px", border: "1px solid #444", backgroundColor: "#1a1a1a", color: "white", width: "200px" }} />
                <select value={carpetaDesti} onChange={e => setCarpetaDesti(e.target.value)} style={{ padding: "8px", borderRadius: "4px", border: "1px solid #444", backgroundColor: "#1a1a1a", color: "white", width: "180px" }}>
                  <option value="">Guarda a l'arrel</option>
                  {carpetesArrel.filter(c => c !== "Tops_Finals").map(c => <option key={c} value={c}>📁 {c}</option>)}
                </select>
                <button onClick={exportarClip} disabled={renderitzantClip} style={{ padding: "8px 20px", backgroundColor: renderitzantClip ? "#555" : "#ef4444", color: "white", borderRadius: "4px", fontWeight: "bold", border: "none", cursor: "pointer", fontSize: "1rem" }}>{renderitzantClip ? "Tallant..." : "Guardar Clip"}</button>
              </div>
              
              {missatgeClip && <p style={{ color: "#60a5fa", marginTop: "10px", textAlign: "center", fontWeight: "bold", marginBottom: 0 }}>{missatgeClip}</p>}
            </div>
          </div>
        </>
      )}
    </>
  )
}