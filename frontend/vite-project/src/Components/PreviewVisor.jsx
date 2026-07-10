import { useEffect } from 'react'

export default function PreviewVisor({ 
  previewSrc, setPreviewSrc, carregantPreview, setCarregantPreview, 
  previewClipId, setPreviewClipId, topClips, topTitol, estilGlobal,
  topOrdre, ordrePersonalitzat 
}) {

  const generarPreviewClip = async (clip, silenci = false) => {
    if (!clip.arxiu) {
      setPreviewSrc(null);
      return;
    }
    if (!silenci) { setCarregantPreview(true); setPreviewSrc(null); }

    try {
      const res = await fetch("http://localhost:8000/preview-frame", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          video_path: clip.arxiu,
          
          ordre: topOrdre, 
          ordre_personalitzat: ordrePersonalitzat, 
          
          global_text: topTitol, global_color: estilGlobal.color, global_stroke_color: estilGlobal.stroke_color, global_stroke_width: estilGlobal.stroke_width, global_pos_x: estilGlobal.pos_x, global_pos_y: estilGlobal.pos_y, global_font_size: estilGlobal.font_size, global_font: estilGlobal.font,
          clips: topClips, total_slots: topClips.length, current_slot: clip.posicio, list_x: estilGlobal.list_x, list_start_y: estilGlobal.list_start_y, list_gap_y: estilGlobal.list_gap_y
        })
      });
      if (res.ok) { const blob = await res.blob(); setPreviewSrc(URL.createObjectURL(blob)); }
    } catch (e) { if (!silenci) alert("❌ Error de connexió"); }
    if (!silenci) setCarregantPreview(false);
  }

  useEffect(() => {
    if (!previewClipId && topClips.length > 0 && topClips[0].arxiu) {
      setPreviewClipId(topClips[0].id);
    }
  }, [topClips, previewClipId, setPreviewClipId]);

  useEffect(() => {
    if (previewClipId !== null && previewClipId !== 'global') {
      const clipActiu = topClips.find(c => c.id === previewClipId);
      if (clipActiu && clipActiu.arxiu) {
        const timer = setTimeout(() => { generarPreviewClip(clipActiu, true); }, 400); 
        return () => clearTimeout(timer);
      } else {
        setPreviewSrc(null);
      }
    }
  }, [estilGlobal, topTitol, topClips, previewClipId, topOrdre, ordrePersonalitzat]);

  return (
    <div style={{ flex: 0.8, position: "sticky", top: "20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
      
      <div style={{ backgroundColor: "#2d2d2d", padding: "20px", borderRadius: "12px", width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
        
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginBottom: "15px", width: "100%" }}>
          <h3 style={{ margin: 0, fontSize: "1rem" }}>📱 Preview del Clip</h3>
        </div>
        
        <div style={{ height: "78vh", minHeight: "600px", aspectRatio: "9/16", backgroundColor: "#111", borderRadius: "8px", border: "2px solid #eab308", display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden", flexDirection: "column" }}>
          
          {carregantPreview && !previewSrc && <p style={{ color: "#60a5fa" }}>⏳ Processant...</p>}
          
          {!carregantPreview && !previewSrc && (
            <p style={{ color: "#9ca3af", padding: "20px", textAlign: "center" }}>Insereix un vídeo per començar</p>
          )}

          {previewSrc && (
            <img src={previewSrc} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          )}
        </div>
      </div>
    </div>
  )
}