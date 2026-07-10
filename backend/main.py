import os
import shutil
import random

# --- PEGAT PER A MOVIEPY I PILLOW 10+ ---
import PIL.Image
if not hasattr(PIL.Image, 'ANTIALIAS'):
    PIL.Image.ANTIALIAS = PIL.Image.Resampling.LANCZOS
# ----------------------------------------

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from moviepy.editor import VideoFileClip, TextClip, CompositeVideoClip, concatenate_videoclips, ImageClip, ColorClip
import moviepy.video.fx.all as vfx

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
TOPS_DIR = "Tops_Finals" 

for directory in [ASSETS_DIR, OUTPUT_DIR, os.path.join(OUTPUT_DIR, TOPS_DIR)]:
    if not os.path.exists(directory):
        os.makedirs(directory)

app.mount("/assets", StaticFiles(directory="assets"), name="assets")
app.mount("/output", StaticFiles(directory="output"), name="output")

# ==========================================
# MODELS DE DADES
# ==========================================
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

class TopClip(BaseModel):
    id: int
    posicio: int
    arxiu: str
    subtitol: str
    estil: dict

# Actualitzat amb ordre_personalitzat
class RenderTopRequest(BaseModel):
    titol_global: str
    ordre: str
    ordre_personalitzat: str = "" 
    clips: list[TopClip]
    output_name: str
    estil_global: dict

# Actualitzat amb ordre i ordre_personalitzat
class PreviewRequest(BaseModel):
    video_path: str
    ordre: str = "ascendent"
    ordre_personalitzat: str = ""
    global_text: str = ""
    global_color: str = "red"
    global_stroke_color: str = "black"
    global_stroke_width: int = 5
    global_pos_x: str = "center" 
    global_pos_y: int = 200
    global_font_size: int = 80
    global_font: str = "Impact"
    clips: list[TopClip] = []
    total_slots: int = 1
    current_slot: int = 0
    list_x: int = 100
    list_start_y: int = 400
    list_gap_y: int = 100

# ==========================================
# FUNCIÓ AUXILIAR D'ORDENAMENT
# ==========================================
def obtenir_sequencia(ordre: str, ordre_pers: str, posicions_existents: list[int]):
    pos_ordenades = sorted(posicions_existents)
    if ordre == "ascendent":
        return pos_ordenades
    elif ordre == "descendent":
        return sorted(posicions_existents, reverse=True)
    elif ordre == "personalitzat":
        try:
            # Separem per comes i convertim a números
            seq = [int(x.strip()) for x in ordre_pers.split(',') if x.strip().isdigit()]
            # Ens assegurem que només hi hagi posicions que existeixin als clips actuals
            return [x for x in seq if x in posicions_existents]
        except:
            return pos_ordenades
    return pos_ordenades


# ==========================================
# ENDPOINTS
# ==========================================

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
        
        bg_base = ColorClip(size=(1080, 1920), color=(0,0,0)).set_duration(0.1)
        bg_video_frame = ImageClip(img_temp_path).fx(vfx.resize, width=1080).set_position("center").set_duration(0.1)
        
        clips_to_composite = [bg_base, bg_video_frame]

        if req.global_text:
            txt_global = TextClip(req.global_text, fontsize=req.global_font_size, color=req.global_color, 
                                font=req.global_font, stroke_color=req.global_stroke_color, stroke_width=req.global_stroke_width)
            x_val_global = int(req.global_pos_x) if str(req.global_pos_x).lstrip('-').isdigit() else req.global_pos_x
            txt_global = txt_global.set_position((x_val_global, req.global_pos_y)).set_duration(0.1)
            clips_to_composite.append(txt_global)

        list_x_fixed = 40
        list_start_y_fixed = 500
        list_gap_y_fixed = 130

        # LÒGICA PER SABER QUÈ S'HA DE VEURE (ACUMULATIU PER PREVIEW)
        posicions_totals = [c.posicio for c in req.clips]
        sequencia = obtenir_sequencia(req.ordre, req.ordre_personalitzat, posicions_totals)
        
        posicions_visibles = []
        if req.current_slot in sequencia:
            idx = sequencia.index(req.current_slot)
            posicions_visibles = sequencia[:idx + 1] # Els anteriors i l'actual
        else:
            posicions_visibles = [req.current_slot]

        for i in range(1, req.total_slots + 1):
            y_pos = list_start_y_fixed + ((i - 1) * list_gap_y_fixed)
            
            if i == 1:
                num_color = "#FFE100" 
            elif i == 2:
                num_color = "#9E9E9EE7" 
            elif i == 3:
                num_color = "#FF8000" 
            elif i == req.total_slots:
                num_color = "#A321FF" 
            elif i%2 == 0:
                num_color = "#00D0FF" 
            else:
                num_color = "white" 
            
            clip_i = next((c for c in req.clips if c.posicio == i), None)
            
            stroke_w = clip_i.estil.get("stroke_width", 3) + 1 if clip_i else 4
            f_size = clip_i.estil.get("font_size", 70) + 15 if clip_i else 85
            
            txt_num = TextClip(f"{i}.", fontsize=f_size, color=num_color, font="Impact", stroke_color="black", stroke_width=stroke_w)
            txt_num = txt_num.set_position((list_x_fixed, y_pos)).set_duration(0.1)
            clips_to_composite.append(txt_num)

            # Només es dibuixa el text si aquest slot ja "s'ha mostrat"
            if i in posicions_visibles and clip_i and clip_i.subtitol:
                offset_x = list_x_fixed + txt_num.w + 20 
                txt_clip = TextClip(clip_i.subtitol, 
                                    fontsize=clip_i.estil.get("font_size", 70), 
                                    color=clip_i.estil.get("color", "white"), 
                                    font=clip_i.estil.get("font", "Arial"), 
                                    stroke_color=clip_i.estil.get("stroke_color", "black"), 
                                    stroke_width=clip_i.estil.get("stroke_width", 3))
                txt_clip = txt_clip.set_position((offset_x, y_pos + 5)).set_duration(0.1)
                clips_to_composite.append(txt_clip)

        comp = CompositeVideoClip(clips_to_composite, size=(1080, 1920))
        final_preview_path = "preview_final.png"
        comp.save_frame(final_preview_path, t=0)
        
        bg_base.close()
        bg_video_frame.close()
        comp.close()
        
        return FileResponse(final_preview_path)

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error generant preview: {str(e)}")


@app.post("/render-top")
def renderitzar_top(req: RenderTopRequest):
    try:
        clips_data = req.clips
        posicions_totals = [c.posicio for c in clips_data]
        
        # 1. Obtenim la seqüència exacta a renderitzar
        sequencia = obtenir_sequencia(req.ordre, req.ordre_personalitzat, posicions_totals)
        
        if not sequencia:
            raise HTTPException(status_code=400, detail="Seqüència invàlida. Revisa l'ordre personalitzat.")

        # 2. Ordenem l'array de clips per fer-lo coincidir amb la seqüència
        clips_ordenats = []
        for p in sequencia:
            c = next((clip for clip in clips_data if clip.posicio == p), None)
            if c: clips_ordenats.append(c)
            
        final_clips = []
        total_slots = len(clips_data)
        
        list_x_fixed = 30
        list_start_y_fixed = 500
        list_gap_y_fixed = 130
        
        posicions_visibles = [] # Aquesta llista actuarà de "memòria"
        
        for clip_data in clips_ordenats:
            # Afegim el clip actual a la memòria. Així es quedarà fixat per la resta del vídeo.
            posicions_visibles.append(clip_data.posicio)
            
            ruta_clip = os.path.join(OUTPUT_DIR, clip_data.arxiu)
            if not os.path.exists(ruta_clip):
                raise HTTPException(status_code=404, detail=f"No s'ha trobat l'arxiu {clip_data.arxiu}")
                
            v_clip_original = VideoFileClip(ruta_clip)
            v_clip_resized = v_clip_original.fx(vfx.resize, width=1080)
            v_clip_final = CompositeVideoClip(
                [v_clip_resized.set_position("center")], 
                size=(1080, 1920)
            ).set_duration(v_clip_original.duration)
            
            layers = [v_clip_final]
            
            if req.titol_global:
                txt_global = TextClip(
                    req.titol_global, 
                    fontsize=req.estil_global.get("font_size", 80), 
                    color=req.estil_global.get("color", "white"), 
                    font=req.estil_global.get("font", "Arial"), 
                    stroke_color=req.estil_global.get("stroke_color", "black"), 
                    stroke_width=req.estil_global.get("stroke_width", 3)
                )
                pos_x = req.estil_global.get("pos_x", "center")
                x_val = int(pos_x) if str(pos_x).lstrip('-').isdigit() else pos_x
                txt_global = txt_global.set_position((x_val, req.estil_global.get("pos_y", 200))).set_duration(v_clip_final.duration)
                layers.append(txt_global)
            
            # Repassem TOTS els slots possibles
            for i in range(1, total_slots + 1):
                y_pos = list_start_y_fixed + ((i - 1) * list_gap_y_fixed)
                
                # He corregit la tabulació dels colors que es va trencar a la versió anterior
                if i == 1:
                    num_color = "#FFE100" 
                elif i == 2:
                    num_color = "#9E9E9EE7" 
                elif i == 3:
                    num_color = "#FF8000" 
                elif i == total_slots:
                    num_color = "#A321FF" 
                elif i%2 == 0:
                    num_color = "#00D0FF" 
                else:
                    num_color = "white" 
                
                clip_i = next((c for c in clips_data if c.posicio == i), None)
                
                stroke_w = clip_i.estil.get("stroke_width", 3) + 1 if clip_i else 4
                f_size = clip_i.estil.get("font_size", 70) + 15 if clip_i else 85
                
                txt_num = TextClip(f"{i}.", fontsize=f_size, color=num_color, font="Impact", stroke_color="black", stroke_width=stroke_w)
                txt_num = txt_num.set_position((list_x_fixed, y_pos)).set_duration(v_clip_final.duration)
                layers.append(txt_num)
                
                # La màgia: només hi escrivim el text si ja hem passat per aquest clip en la línia de temps
                if i in posicions_visibles and clip_i and clip_i.subtitol:
                    offset_x = list_x_fixed + txt_num.w + 20
                    txt_clip = TextClip(
                        clip_i.subtitol, 
                        fontsize=clip_i.estil.get("font_size", 70), 
                        color=clip_i.estil.get("color", "white"), 
                        font=clip_i.estil.get("font", "Arial"), 
                        stroke_color=clip_i.estil.get("stroke_color", "black"), 
                        stroke_width=clip_i.estil.get("stroke_width", 3)
                    )
                    txt_clip = txt_clip.set_position((offset_x, y_pos + 5)).set_duration(v_clip_final.duration)
                    layers.append(txt_clip)

            comp = CompositeVideoClip(layers, size=(1080, 1920))
            final_clips.append(comp)

        if not final_clips:
            raise HTTPException(status_code=400, detail="No s'han pogut carregar els clips.")

        video_final = concatenate_videoclips(final_clips, method="compose")
        nom_arxiu = req.output_name if req.output_name.endswith('.mp4') else req.output_name + '.mp4'
        output_path = os.path.join(OUTPUT_DIR, TOPS_DIR, nom_arxiu)
        
        video_final.write_videofile(output_path, fps=30, codec="libx264", audio_codec="aac",threads=8,preset="ultrafast")
        
        for c in final_clips:
            c.close()
        video_final.close()
        
        return {"status": "success", "file": nom_arxiu}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))