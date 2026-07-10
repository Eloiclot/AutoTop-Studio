import { useState, useRef, useEffect } from 'react'
import Tallador from './components/Tallador'
import Ranking from './components/Ranking'
import PreviewVisor from './components/PreviewVisor'
import OpcionsGlobals from './components/OpcionsGlobals'
import './App.css'

function App() {
  const [pestanya, setPestanya] = useState("tallador")
  const [mostrarExplorador, setMostrarExplorador] = useState(false)

  // ESTATS TALLADOR (Recuperats perquè no peti)
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
  const [totsElsArxius, setTotsElsArxius] = useState([]) 
  const [carpetaActual, setCarpetaActual] = useState("") 
  const [nomNovaCarpeta, setNomNovaCarpeta] = useState("")
  const [carpetesArrel, setCarpetesArrel] = useState([]) 

  // ESTATS GLOBALS CREADOR DE TOPS
  const [topTitol, setTopTitol] = useState("")
  const [topOrdre, setTopOrdre] = useState("ascendent")
  const [ordrePersonalitzat, setOrdrePersonalitzat] = useState("")
  const [topNomSortida, setTopNomSortida] = useState("")
  
  const estilPerDefecteClip = { color: "#ffffff", stroke_color: "#000000", stroke_width: 4, font_size: 70, font: "Arial" }
  
  const [estilGlobal, setEstilGlobal] = useState({ 
    color: "#ffffff", stroke_color: "#000000", stroke_width: 4, pos_x: "center", pos_y: 70, font_size: 80, font: "Arial",
    list_x: 80, list_start_y: 450, list_gap_y: 110
  })

  const [topClips, setTopClips] = useState([
    { id: Date.now(), posicio: 1, arxiu: "", subtitol: "", mostrarEstil: false, estil: { ...estilPerDefecteClip } }
  ])

  // Estats Preview
  const [previewSrc, setPreviewSrc] = useState(null)
  const [carregantPreview, setCarregantPreview] = useState(false)
  const [previewClipId, setPreviewClipId] = useState(null)

  const carregarExplorador = async (carpeta = "") => {
    const res = await fetch(`http://localhost:8000/list-output?folder=${carpeta}`);
    const data = await res.json();
    setCarpetes(data.folders); setArxius(data.files);
    
    if (carpeta === "") {
      setCarpetesArrel(data.folders);
      let tots = [...data.files];
      
      const promeses = data.folders.map(async (c) => {
        if (c === "Tops_Finals") return [];
        try {
          const cRes = await fetch(`http://localhost:8000/list-output?folder=${c}`);
          const cData = await cRes.json();
          return cData.files.map(f => `${c}/${f}`);
        } catch (e) { return []; }
      });
      
      const resultats = await Promise.all(promeses);
      resultats.forEach(arr => tots.push(...arr));
      setTotsElsArxius(tots);
    }
  }

  useEffect(() => { 
    fetch("http://localhost:8000/list-videos")
      .then(res => res.json())
      .then(data => setRecents(data.videos))
      .catch(() => {});
    carregarExplorador(""); 
  }, [])
  
  useEffect(() => { carregarExplorador(carpetaActual); }, [carpetaActual])

  const crearCarpeta = async () => {
    if (!nomNovaCarpeta.trim()) return;
    await fetch("http://localhost:8000/create-folder", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ folder_name: nomNovaCarpeta.trim() }) });
    setNomNovaCarpeta(""); carregarExplorador(""); 
  }
  
  const eliminarArxiu = async (nom) => {
    if (window.confirm(`Segur que vols eliminar "${nom}"?`)) {
      await fetch("http://localhost:8000/delete-file", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ filename: nom, folder: carpetaActual }) });
      carregarExplorador(carpetaActual);
      if (carpetaActual !== "") carregarExplorador(""); 
    }
  }
  
  const moureArxiu = async (nom, desti) => {
    await fetch("http://localhost:8000/move-file", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ filename: nom, current_folder: carpetaActual, new_folder: desti }) });
    carregarExplorador(carpetaActual);
    if (carpetaActual !== "") carregarExplorador(""); 
  }
  
  const afegirClipAlTop = (nomArxiu) => {
    const rutaCompleta = carpetaActual ? `${carpetaActual}/${nomArxiu}` : nomArxiu;
    setTopClips(prev => [...prev, { id: Date.now(), posicio: prev.length + 1, arxiu: rutaCompleta, subtitol: "", mostrarEstil: false, estil: { ...estilPerDefecteClip } }]);
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  }

  const carpetesOrdenades = [...carpetes].sort((a, b) => {
    if (a === "Tops_Finals") return -1;
    if (b === "Tops_Finals") return 1;
    return a.localeCompare(b);
  });

  const renderitzarExplorador = () => (
    <div style={{ backgroundColor: "#1e1e1e", padding: "30px", borderRadius: "16px", boxSizing: "border-box", border: pestanya === "tops" ? "1px solid #444" : "none" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", borderBottom: "1px solid #333", paddingBottom: "15px" }}>
        
        <h2 style={{ margin: 0, display: "flex", alignItems: "center", gap: "10px", fontSize: "1.3rem" }}>
          🗂️ Sortida: <span style={{ color: "#60a5fa" }}>{carpetaActual === "" ? "Arrel" : carpetaActual}</span>
          {carpetaActual === "Tops_Finals" && <span style={{ fontSize: "0.9rem", backgroundColor: "#eab308", color: "black", padding: "3px 8px", borderRadius: "12px", marginLeft: "10px" }}>Protegida</span>}
        </h2>
        
        <div style={{ display: "flex", gap: "15px" }}>
          {carpetaActual === "" && (
            <div style={{ display: "flex", gap: "10px" }}>
              <input type="text" placeholder="Nova carpeta..." value={nomNovaCarpeta} onChange={e => setNomNovaCarpeta(e.target.value)} style={{ padding: "8px", borderRadius: "6px", backgroundColor: "#1a1a1a", color: "white", border: "1px solid #555" }} />
              <button onClick={crearCarpeta} style={{ padding: "8px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "6px" }}>Crear</button>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "15px", textAlign: "left" }}>
        
        {carpetaActual !== "" && (
          <div onClick={() => setCarpetaActual("")} style={{ padding: "15px", backgroundColor: "#374151", borderRadius: "12px", cursor: "pointer", border: "1px dashed #9ca3af", display: "flex", alignItems: "center", gap: "15px" }}>
            <span style={{ fontSize: "1.8rem" }}>🔙</span>
            <span style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#d1d5db" }}>Arrel</span>
          </div>
        )}

        {carpetesOrdenades.map(carpeta => (
          <div key={carpeta} onClick={() => setCarpetaActual(carpeta)} style={{ padding: "15px", backgroundColor: carpeta === "Tops_Finals" ? "#422006" : "#2d2d2d", borderRadius: "12px", cursor: "pointer", border: carpeta === "Tops_Finals" ? "2px solid #eab308" : "1px solid #444", display: "flex", alignItems: "center", gap: "15px" }}>
            <span style={{ fontSize: "1.8rem" }}>{carpeta === "Tops_Finals" ? "🌟" : "📁"}</span>
            <span style={{ fontSize: "1.1rem", fontWeight: "bold" }}>{carpeta}</span>
          </div>
        ))}

        {arxius.map(arxiu => (
          <div key={arxiu} style={{ backgroundColor: "#2d2d2d", borderRadius: "12px", border: "1px solid #444", display: "flex", flexDirection: "column" }}>
            <a href={`http://localhost:8000/output/${carpetaActual ? carpetaActual + '/' : ''}${arxiu}`} target="_blank" rel="noopener noreferrer" style={{ padding: "15px", textDecoration: "none", color: "white", flex: 1, display: "flex", flexDirection: "column", gap: "8px", paddingBottom: "10px" }}>
              <span style={{ fontSize: "2rem", textAlign: "center" }}>🎞️</span>
              <span style={{ fontSize: "0.9rem", textAlign: "center", wordBreak: "break-all" }}>{arxiu}</span>
            </a>
            
            {carpetaActual !== "Tops_Finals" && pestanya === "tops" && (
              <div style={{ padding: "0 10px 10px 10px" }}>
                 <button onClick={() => afegirClipAlTop(arxiu)} style={{ width: "100%", padding: "6px", backgroundColor: "#059669", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>➕ Afegir al Top</button>
              </div>
            )}

            <div style={{ backgroundColor: "#1a1a1a", padding: "10px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #444" }}>
              {carpetaActual !== "Tops_Finals" ? (
                carpetaActual === "" ? (
                  <select onChange={e => { if(e.target.value) moureArxiu(arxiu, e.target.value) }} value="" style={{ padding: "6px", backgroundColor: "#333", color: "white", borderRadius: "4px", maxWidth: "100px", fontSize:"0.8rem" }}>
                    <option value="" disabled>Moure a...</option>
                    {carpetesArrel.filter(c => c !== "Tops_Finals").map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                ) : ( <button onClick={() => moureArxiu(arxiu, "")} style={{ padding: "6px 10px", backgroundColor: "#4b5563", color: "white", border: "none", borderRadius: "4px", fontSize:"0.8rem" }}>🔙 Arrel</button> )
              ) : ( <span style={{ fontSize: "0.8rem", color: "#eab308", paddingLeft: "5px" }}>Finalitzat</span> )}
              <button onClick={() => eliminarArxiu(arxiu)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem" }}>🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ padding: "20px", width: "98vw", minHeight: "100vh", margin: "0 auto", color: "white", fontFamily: "sans-serif", boxSizing: "border-box" }}>
      
      <div style={{ display: "flex", backgroundColor: "#1e1e1e", padding: "10px 20px", borderRadius: "8px", marginBottom: "20px", gap: "10px", alignItems: "center" }}>
        <strong style={{ marginRight: "20px", color: "#eab308", fontSize: "1.2rem" }}>🚀 AutoTop</strong>
        <button onClick={() => setPestanya("tallador")} style={{ padding: "10px 20px", backgroundColor: pestanya === "tallador" ? "#3b82f6" : "transparent", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>
          ✂️ Tallador de Clips
        </button>
        <button onClick={() => setPestanya("tops")} style={{ padding: "10px 20px", backgroundColor: pestanya === "tops" ? "#eab308" : "transparent", color: pestanya === "tops" ? "black" : "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>
          🏆 Creador de Tops
        </button>
      </div>

      {pestanya === "tallador" && (
        <>
          <Tallador 
            videoUrl={videoUrl} setVideoUrl={setVideoUrl}
            nomVideoActual={nomVideoActual} setNomVideoActual={setNomVideoActual}
            durada={durada} setDurada={setDurada}
            talls={talls} setTalls={setTalls}
            recents={recents} setRecents={setRecents}
            renderitzantClip={renderitzantClip} setRenderitzantClip={setRenderitzantClip}
            missatgeClip={missatgeClip} setMissatgeClip={setMissatgeClip}
            nomPersonalitzat={nomPersonalitzat} setNomPersonalitzat={setNomPersonalitzat}
            carpetaDesti={carpetaDesti} setCarpetaDesti={setCarpetaDesti}
            videoRef={videoRef}
            carregarExplorador={carregarExplorador} 
            carpetaActual={carpetaActual} 
            carpetesArrel={carpetesArrel} 
          />
          <div style={{ marginTop: "30px" }}>
            {renderitzarExplorador()}
          </div>
        </>
      )}

      {pestanya === "tops" && (
        <div style={{ backgroundColor: "#1e1e1e", padding: "30px", borderRadius: "16px", marginBottom: "30px" }}>
          
          <OpcionsGlobals 
            topTitol={topTitol} setTopTitol={setTopTitol} 
            topOrdre={topOrdre} setTopOrdre={setTopOrdre}
            ordrePersonalitzat={ordrePersonalitzat} setOrdrePersonalitzat={setOrdrePersonalitzat}
            topNomSortida={topNomSortida} setTopNomSortida={setTopNomSortida}
            estilGlobal={estilGlobal} setEstilGlobal={setEstilGlobal}
          />

          <hr style={{ borderColor: "#333", margin: "25px 0" }}/>

          <div style={{ display: "flex", gap: "30px", alignItems: "flex-start" }}>
            
            <div style={{ flex: 1.2, display: "flex", flexDirection: "column", gap: "20px" }}>
              <Ranking 
                topClips={topClips} setTopClips={setTopClips} 
                totsElsArxius={totsElsArxius} 
                carpetaActual={carpetaActual}
                previewClipId={previewClipId} setPreviewClipId={setPreviewClipId}
                estilPerDefecteClip={estilPerDefecteClip}
                setPreviewSrc={setPreviewSrc}
                topTitol={topTitol} topOrdre={topOrdre} ordrePersonalitzat={ordrePersonalitzat} topNomSortida={topNomSortida}
                estilGlobal={estilGlobal} carregarExplorador={carregarExplorador}
              />

              <div style={{ width: "100%", marginTop: "10px" }}>
                <button 
                  onClick={() => setMostrarExplorador(!mostrarExplorador)}
                  style={{ width: "100%", padding: "15px", backgroundColor: "#2d2d2d", color: "white", border: "1px solid #444", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "1.1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                >
                  <span>🗂️ {mostrarExplorador ? "Amagar Explorador d'Arxius" : "Mostrar Explorador d'Arxius"}</span>
                  <span>{mostrarExplorador ? "▲" : "▼"}</span>
                </button>

                {mostrarExplorador && (
                  <div style={{ marginTop: "15px" }}>
                    {renderitzarExplorador()}
                  </div>
                )}
              </div>
            </div>

            <PreviewVisor 
              previewSrc={previewSrc} setPreviewSrc={setPreviewSrc}
              carregantPreview={carregantPreview} setCarregantPreview={setCarregantPreview}
              previewClipId={previewClipId} setPreviewClipId={setPreviewClipId}
              topClips={topClips} topTitol={topTitol} estilGlobal={estilGlobal}
              topOrdre={topOrdre} ordrePersonalitzat={ordrePersonalitzat} 
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default App