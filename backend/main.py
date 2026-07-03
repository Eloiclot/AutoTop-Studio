import os
import shutil
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from moviepy.editor import VideoFileClip, TextClip, CompositeVideoClip, concatenate_videoclips, ImageClip
# --- CONFIGURACIÓ IMAGEMAGICK ---
os.environ["IMAGEMAGICK_BINARY"] = r"C:\Program Files\ImageMagick-7.1.2-Q16-HDRI\magick.exe"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ASSETS_DIR = "assets"
OUTPUT_DIR = "output"
TOPS_DIR = "Tops_Finals" # Carpeta especial

# Creem l'estructura de carpetes a l'inici
for directory in [ASSETS_DIR, OUTPUT_DIR, os.path.join(OUTPUT_DIR, TOPS_DIR)]:
    if not os.path.exists(directory):
        os.makedirs(directory)

app.mount("/assets", StaticFiles(directory="assets"), name="assets")
app.mount("/output", StaticFiles(directory="output"), name="output")

class RenderRequest(BaseModel):
    video_path: str
    start: float
    end: float
    output_name: str
    folder_name: str = ""

class FolderRequest(BaseModel):
    folder_name: str

class MoveRequest(BaseModel):
    filename: str
    current_folder: str
    new_folder: str

class DeleteRequest(BaseModel):
    filename: str
    folder: str

# Model de dades pel nou Creador de Tops
class TopClip(BaseModel):
    posicio: int
    arxiu: str
    subtitol: str

class RenderTopRequest(BaseModel):
    titol_global: str
    ordre: str
    clips: list[TopClip]
    output_name: str

@app.post("/upload")
async def upload_video(file: UploadFile = File(...)):
    file_path = os.path.join(ASSETS_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"filename": file.filename}

@app.get("/list-videos")
def list_videos():
    return {"videos": [f for f in os.listdir(ASSETS_DIR) if os.path.isfile(os.path.join(ASSETS_DIR, f))]}

@app.get("/list-output")
def list_output(folder: str = ""):
    target_dir = os.path.join(OUTPUT_DIR, folder) if folder else OUTPUT_DIR
    if not os.path.exists(target_dir):
        return {"folders": [], "files": []}
    
    items = os.listdir(target_dir)
    folders = [f for f in items if os.path.isdir(os.path.join(target_dir, f))]
    files = [f for f in items if os.path.isfile(os.path.join(target_dir, f))]
    return {"folders": folders, "files": files}

@app.post("/create-folder")
def create_folder(req: FolderRequest):
    if req.folder_name.lower() == TOPS_DIR.lower():
        return {"status": "error", "message": "Aquest nom està reservat."}
    
    target_dir = os.path.join(OUTPUT_DIR, req.folder_name)
    if not os.path.exists(target_dir):
        os.makedirs(target_dir)
        return {"status": "success"}
    return {"status": "error", "message": "La carpeta ja existeix"}

@app.post("/move-file")
def move_file(req: MoveRequest):
    # PROTECCIÓ DE LA CARPETA DE TOPS
    if req.new_folder == TOPS_DIR or req.current_folder == TOPS_DIR:
        raise HTTPException(status_code=403, detail="No es poden moure arxius cap a o des de la carpeta Tops_Finals.")

    src_dir = os.path.join(OUTPUT_DIR, req.current_folder) if req.current_folder else OUTPUT_DIR
    dest_dir = os.path.join(OUTPUT_DIR, req.new_folder) if req.new_folder else OUTPUT_DIR
    
    src_path = os.path.join(src_dir, req.filename)
    dest_path = os.path.join(dest_dir, req.filename)
    
    if not os.path.exists(src_path):
        raise HTTPException(status_code=404, detail="L'arxiu no existeix.")
    if os.path.exists(dest_path):
        raise HTTPException(status_code=400, detail="Ja existeix un arxiu amb aquest nom al destí.")
        
    shutil.move(src_path, dest_path)
    return {"status": "success"}

@app.post("/delete-file")
def delete_file(req: DeleteRequest):
    target_dir = os.path.join(OUTPUT_DIR, req.folder) if req.folder else OUTPUT_DIR
    file_path = os.path.join(target_dir, req.filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="L'arxiu no existeix.")
    os.remove(file_path)
    return {"status": "success"}

# Model per rebre la configuració de la preview
class PreviewRequest(BaseModel):
    video_path: str
    text: str = ""
    color: str = "white"
    stroke_color: str = "black"
    stroke_width: int = 3
    pos_y: int = 700
    font_size: int = 70
    font: str = "Arial"

@app.post("/preview-frame")
def get_preview_frame(req: PreviewRequest):
    video_path = os.path.join(OUTPUT_DIR, req.video_path)
    if not os.path.exists(video_path):
        raise HTTPException(status_code=404, detail="Vídeo no trobat a la carpeta output")

    try:
        clip = VideoFileClip(video_path)
        img_temp_path = "preview_bg_temp.png"
        clip.save_frame(img_temp_path, t=0)
        clip.close() 
        
        bg_clip = ImageClip(img_temp_path).set_duration(0.1)
        clips_to_composite = [bg_clip]

        if req.text:
            # Creem el Text amb Vora i Tipografia
            txt_clip = TextClip(req.text, fontsize=req.font_size, color=req.color, 
                                font=req.font, stroke_color=req.stroke_color, stroke_width=req.stroke_width)
            
            # El centrem horitzontalment i usem la Y global
            txt_clip = txt_clip.set_position(('center', req.pos_y)).set_duration(0.1)
            clips_to_composite.append(txt_clip)

        comp = CompositeVideoClip(clips_to_composite)
        final_preview_path = "preview_final.png"
        comp.save_frame(final_preview_path, t=0)
        
        bg_clip.close()
        comp.close()
        
        return FileResponse(final_preview_path)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generant preview: {str(e)}")

@app.post("/render")
def renderitzar_clip(request: RenderRequest):
    if request.folder_name == TOPS_DIR:
        raise HTTPException(status_code=403, detail="No pots guardar clips solts a la carpeta de Tops.")

    full_path = os.path.join(ASSETS_DIR, request.video_path)
    if not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail="El vídeo original no existeix.")

    target_dir = os.path.join(OUTPUT_DIR, request.folder_name) if request.folder_name else OUTPUT_DIR
    os.makedirs(target_dir, exist_ok=True)

    nom_arxiu = request.output_name if request.output_name.endswith('.mp4') else request.output_name + '.mp4'
    output_path = os.path.join(target_dir, nom_arxiu)

    try:
        with VideoFileClip(full_path) as clip:
            new_clip = clip.subclip(request.start, request.end)
            new_clip.write_videofile(output_path, codec="libx264", audio_codec="aac")
        return {"status": "success", "file": nom_arxiu}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/render-top")
def renderitzar_top(req: RenderTopRequest):
    try:
        # 1. Ordenar els clips
        clips_data = req.clips
        if req.ordre == "ascendent":
            clips_data.sort(key=lambda x: x.posicio)
        elif req.ordre == "descendent":
            clips_data.sort(key=lambda x: x.posicio, reverse=True)
        # Si és manual, els deixem tal qual venen
        
        video_clips = []
        textos_clips = []
        temps_actual = 0
        
        # 2. Carregar cada vídeo i calcular els temps per als textos dinàmics
        for d in clips_data:
            ruta_clip = os.path.join(OUTPUT_DIR, d.arxiu)
            if not os.path.exists(ruta_clip):
                raise HTTPException(status_code=404, detail=f"No s'ha trobat l'arxiu {d.arxiu}")
                
            v_clip = VideoFileClip(ruta_clip)
            video_clips.append(v_clip)
            
            # Text dinàmic d'aquest clip (ara el deixem fix al mig perquè no tenim l'escala vertical feta encara)
            t = TextClip(f"{d.posicio}. {d.subtitol}", fontsize=50, color='yellow')
            t = t.set_position(('center', 'center')).set_start(temps_actual).set_duration(v_clip.duration)
            textos_clips.append(t)
            
            temps_actual += v_clip.duration
            
        # 3. Ajuntar els vídeos
        video_final = concatenate_videoclips(video_clips)
        
        # 4. Text global
        t_global = TextClip(req.titol_global, fontsize=70, color='white', bg_color='black')
        t_global = t_global.set_position(('center', 50)).set_duration(video_final.duration)
        
        # 5. Composició
        totes_les_capes = [video_final, t_global] + textos_clips
        composicio = CompositeVideoClip(totes_les_capes)
        
        # 6. Guardar obligatòriament a Tops_Finals
        nom_arxiu = req.output_name if req.output_name.endswith('.mp4') else req.output_name + '.mp4'
        output_path = os.path.join(OUTPUT_DIR, TOPS_DIR, nom_arxiu)
        
        composicio.write_videofile(output_path, fps=24, codec="libx264", audio_codec="aac")
        
        # Tanquem arxius de memòria
        for v in video_clips: v.close()
        video_final.close()
        composicio.close()
        
        return {"status": "success", "file": nom_arxiu}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))