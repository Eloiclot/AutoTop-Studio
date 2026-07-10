import { useState, useEffect } from 'react'
import Tallador from './components/Tallador'
import Ranking from './components/Ranking'
import PreviewVisor from './components/PreviewVisor'
import OpcionsGlobals from './components/OpcionsGlobals'
import './App.css'

function App() {
  const [pestanya, setPestanya] = useState("tallador")
  const [mostrarExplorador, setMostrarExplorador] = useState(false)

  // ESTATS EXPLORADOR
  const [carpetes, setCarpetes] = useState([])
  const [arxius, setArxius] = useState([])
  const [carpetaActual, setCarpetaActual] = useState("") 
  const [nomNovaCarpeta, setNomNovaCarpeta] = useState("")
  const [carpetesArrel, setCarpetesArrel] = useState([]) 

  // ESTATS GLOBALS CREADOR DE TOPS
  const [topTitol, setTopTitol] = useState("")
  const [topOrdre, setTopOrdre] = useState("ascendent")
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
    if (carpeta === "") setCarpetesArrel(data.folders);
  }

  useEffect(() => { carregarExplorador(""); }, [])
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

  return (
    <div style={{ padding: "20px", width: "98vw", minHeight: "100vh", margin: "0 auto", color: "white", fontFamily: "sans-serif", boxSizing: "border-box" }}>
      
      {/* BARRA DE NAVEGACIÓ SUPERIOR */}
      <div style={{ display: "flex", backgroundColor: "#1e1e1e", padding: "10px 20px", borderRadius: "8px", marginBottom: "20px", gap: "10px", alignItems: "center" }}>
        <strong style={{ marginRight: "20px", color: "#eab308", fontSize: "1.2rem" }}>🚀 AutoTop</strong>
        <button onClick={() => setPestanya("tallador")} style={{ padding: "10px 20px", backgroundColor: pestanya === "tallador" ? "#3b82f6" : "transparent", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>
          ✂️ Tallador de Clips
        </button>
        <button onClick={() => setPestanya("tops")} style={{ padding: "10px 20px", backgroundColor: pestanya === "tops" ? "#eab308" : "transparent", color: pestanya === "tops" ? "black" : "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>
          🏆 Creador de Tops
        </button>
      </div>

      {/* PESTANYA 1: TALLADOR */}
      {pestanya === "tallador" && (
        <Tallador carpetesArrel={carpetesArrel} carregarExplorador={carregarExplorador} carpetaActual={carpetaActual} />
      )}

      {/* PESTANYA 2: CREADOR DE TOPS */}
      {pestanya === "tops" && (
        <div style={{ backgroundColor: "#1e1e1e", padding: "30px", borderRadius: "16px", marginBottom: "30px" }}>
          
          <OpcionsGlobals 
            topTitol={topTitol} setTopTitol={setTopTitol} 
            topOrdre={topOrdre} setTopOrdre={setTopOrdre}
            topNomSortida={topNomSortida} setTopNomSortida={setTopNomSortida}
            estilGlobal={estilGlobal} setEstilGlobal={setEstilGlobal}
          />

          <hr style={{ borderColor: "#333", margin: "25px 0" }}/>

          <div style={{ display: "flex", gap: "30px", alignItems: "flex-start" }}>
            
            {/* COLUMNA ESQUERRA: Només Rànquing */}
            <div style={{ flex: 1.2, display: "flex", flexDirection: "column" }}>
              <Ranking 
                topClips={topClips} setTopClips={setTopClips} 
                arxius={arxius} carpetaActual={carpetaActual}
                previewClipId={previewClipId} setPreviewClipId={setPreviewClipId}
                estilPerDefecteClip={estilPerDefecteClip}
                setPreviewSrc={setPreviewSrc}
                topTitol={topTitol} topOrdre={topOrdre} topNomSortida={topNomSortida}
                estilGlobal={estilGlobal} carregarExplorador={carregarExplorador}
              />
            </div>

            {/* COLUMNA DRETA: Preview Enorme */}
            <PreviewVisor 
              previewSrc={previewSrc} setPreviewSrc={setPreviewSrc}
              carregantPreview={carregantPreview} setCarregantPreview={setCarregantPreview}
              previewClipId={previewClipId} setPreviewClipId={setPreviewClipId}
              topClips={topClips} topTitol={topTitol} estilGlobal={estilGlobal}
            />
          </div>
        </div>
      )}

      {/* EXPLORADOR D'ARXIUS GLOBAL (Disponible a totes les pestanyes) */}
      <div style={{ marginTop: "10px", paddingBottom: "40px" }}>
        
        {/* BOTÓ DESPLEGABLE EXPLORADOR */}
        <button 
          onClick={() => setMostrarExplorador(!mostrarExplorador)}
          style={{ width: "100%", padding: "15px", backgroundColor: "#2d2d2d", color: "white", border: "1px solid #444", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "1.1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}
        >
          <span>🗂️ {mostrarExplorador ? "Amagar Explorador d'Arxius" : "Mostrar Explorador d'Arxius"}</span>
          <span>{mostrarExplorador ? "▲" : "▼"}</span>
        </button>

        {/* CONTINGUT DE L'EXPLORADOR */}
        {mostrarExplorador && (
          <div style={{ backgroundColor: "#252525", padding: "25px", borderRadius: "0 0 12px 12px", border: "1px solid #444", borderTop: "none", maxHeight: "50vh", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #333", paddingBottom: "15px", flexShrink: 0 }}>
              <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "10px", fontSize: "1.1rem" }}>
                Sortida: <span style={{ color: "#60a5fa" }}>{carpetaActual === "" ? "Arrel" : carpetaActual}</span>
                {carpetaActual === "Tops_Finals" && <span style={{ fontSize: "0.8rem", backgroundColor: "#eab308", color: "black", padding: "3px 8px", borderRadius: "12px" }}>Protegida</span>}
              </h3>
              <div style={{ display: "flex", gap: "10px" }}>
                {carpetaActual !== "" && <button onClick={() => setCarpetaActual("")} style={{ padding: "8px 15px", backgroundColor: "#4b5563", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>🔙 Arrel</button>}
                {carpetaActual === "" && (
                  <div style={{ display: "flex", gap: "10px" }}>
                    <input type="text" placeholder="Nova carpeta..." value={nomNovaCarpeta} onChange={e => setNomNovaCarpeta(e.target.value)} style={{ padding: "8px", borderRadius: "6px", backgroundColor: "#1a1a1a", color: "white", border: "1px solid #555" }} />
                    <button onClick={crearCarpeta} style={{ padding: "8px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "6px" }}>Crear</button>
                  </div>
                )}
              </div>
            </div>

            <div style={{ overflowY: "auto", flex: 1, paddingRight: "10px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "15px" }}>
                {carpetes.map(carpeta => (
                  <div key={carpeta} onClick={() => setCarpetaActual(carpeta)} style={{ padding: "15px", backgroundColor: carpeta === "Tops_Finals" ? "#422006" : "#2d2d2d", borderRadius: "12px", cursor: "pointer", border: carpeta === "Tops_Finals" ? "2px solid #eab308" : "1px solid #444", display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "1.5rem" }}>{carpeta === "Tops_Finals" ? "🌟" : "📁"}</span>
                    <span style={{ fontSize: "1rem", fontWeight: "bold" }}>{carpeta}</span>
                  </div>
                ))}
                {arxius.map(arxiu => (
                  <div key={arxiu} style={{ backgroundColor: "#1a1a1a", borderRadius: "12px", border: "1px solid #444", display: "flex", flexDirection: "column" }}>
                    <a href={`http://localhost:8000/output/${carpetaActual ? carpetaActual + '/' : ''}${arxiu}`} target="_blank" rel="noopener noreferrer" style={{ padding: "15px", textDecoration: "none", color: "white", flex: 1, display: "flex", flexDirection: "column", gap: "5px", paddingBottom: "10px" }}>
                      <span style={{ fontSize: "2rem", textAlign: "center" }}>🎞️</span>
                      <span style={{ fontSize: "0.85rem", textAlign: "center", wordBreak: "break-all" }}>{arxiu}</span>
                    </a>
                    {carpetaActual === "" && pestanya === "tops" && (
                      <div style={{ padding: "0 10px 10px 10px" }}>
                         <button onClick={() => afegirClipAlTop(arxiu)} style={{ width: "100%", padding: "6px", backgroundColor: "#059669", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "0.9rem" }}>➕ Afegir</button>
                      </div>
                    )}
                    <div style={{ backgroundColor: "#111", padding: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #444" }}>
                      {carpetaActual !== "Tops_Finals" ? (
                        carpetaActual === "" ? (
                          <select onChange={e => { if(e.target.value) moureArxiu(arxiu, e.target.value) }} value="" style={{ padding: "4px", backgroundColor: "#333", color: "white", borderRadius: "4px", maxWidth: "90px", fontSize: "0.8rem" }}>
                            <option value="" disabled>Moure...</option>
                            {carpetesArrel.filter(c => c !== "Tops_Finals").map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        ) : ( <button onClick={() => moureArxiu(arxiu, "")} style={{ padding: "4px 8px", backgroundColor: "#4b5563", color: "white", border: "none", borderRadius: "4px", fontSize: "0.8rem" }}>🔙 Arrel</button> )
                      ) : ( <span style={{ fontSize: "0.75rem", color: "#eab308", paddingLeft: "5px" }}>Finalitzat</span> )}
                      <button onClick={() => eliminarArxiu(arxiu)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1rem" }}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}

export default App