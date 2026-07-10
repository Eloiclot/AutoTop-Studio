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

  return (
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
            <div style={{ textAlign: "left" }}>
              <Slider range allowCross={false} min={0} max={durada} step={0.1} value={talls} onChange={alCanviarSlider} marks={marquesTemps} trackStyle={[{ backgroundColor: '#646cff', height: 20 }]} railStyle={{ backgroundColor: '#444', height: 20 }} handleStyle={[{ borderColor: '#fff', height: 54, width: 8, marginTop: -17, backgroundColor: 'white', cursor: 'ew-resize', borderRadius: '3px' }, { borderColor: '#fff', height: 54, width: 8, marginTop: -17, backgroundColor: 'white', cursor: 'ew-resize', borderRadius: '3px' }]} dotStyle={{ display: 'none' }} />
            </div>
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
  )
}