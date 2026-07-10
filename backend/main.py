import os
import shutil

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

# AFEGITS IMPORTANTS: ColorClip i vfx per poder reescalar sense que peti
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

class TopClip(BaseModel):
    id: int
    posicio: int
    arxiu: str
    subtitol: str
    estil: dict

class RenderTopRequest(BaseModel):
    titol_global: str
    ordre: str
    clips: list[TopClip]
    output_name: str
    estil_global: dict

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

class PreviewRequest(BaseModel):
    video_path: str
    global_text: str = ""
    global_color: str = "white"
    global_stroke_color: str = "black"
    global_stroke_width: int = 3
    global_pos_x: str = "center" 
    global_pos_y: int = 200
    global_font_size: int = 80
    global_font: str = "Arial"
    
    clips: list[TopClip] = []
    
    total_slots: int = 1
    current_slot: int = 0
    list_x: int = 100
    list_start_y: int = 400
    list_gap_y: int = 100

@app.post("/preview-frame")
def get_preview_frame(req: PreviewRequest):
    video_path = os.path.join(OUTPUT_DIR, req.video_path)
    if not os.path.exists(video_path):
        raise HTTPException(status_code=404, detail="Vídeo no trobat a la carpeta output")

    try:
        # 1. Traiem el fotograma directament de l'arxiu original (és més ràpid que escalar el vídeo sencer)
        clip = VideoFileClip(video_path)
        img_temp_path = "preview_bg_temp.png"
        clip.save_frame(img_temp_path, t=0)
        clip.close() 
        
        # 2. Creem un fons 1080x1920 negre pur
        bg_base = ColorClip(size=(1080, 1920), color=(0,0,0)).set_duration(0.1)
        
        # 3. Carreguem el fotograma com a imatge, EL REESCALEM a 1080 i el centrem
        bg_video_frame = ImageClip(img_temp_path).fx(vfx.resize, width=1080).set_position("center").set_duration(0.1)
        
        # Aquesta és la base sobre la qual s'apilaran els textos
        clips_to_composite = [bg_base, bg_video_frame]

        if req.global_text:
            txt_global = TextClip(req.global_text, fontsize=req.global_font_size, color=req.global_color, 
                                font=req.global_font, stroke_color=req.global_stroke_color, stroke_width=req.global_stroke_width)
            x_val_global = int(req.global_pos_x) if str(req.global_pos_x).lstrip('-').isdigit() else req.global_pos_x
            txt_global = txt_global.set_position((x_val_global, req.global_pos_y)).set_duration(0.1)
            clips_to_composite.append(txt_global)

        number_colors = ['red', 'orange', '#3b82f6', 'white', 'yellow', 'magenta']

        for i in range(1, req.total_slots + 1):
            y_pos = req.list_start_y + ((i - 1) * req.list_gap_y)
            num_color = number_colors[(i - 1) % len(number_colors)]
            
            clip_i = next((c for c in req.clips if c.posicio == i), None)
            
            stroke_w = clip_i.estil.get("stroke_width", 3) + 1 if clip_i else 4
            f_size = clip_i.estil.get("font_size", 70) + 15 if clip_i else 85
            
            txt_num = TextClip(f"{i}.", fontsize=f_size, color=num_color, 
                               font="Impact", stroke_color="black", stroke_width=stroke_w)
            txt_num = txt_num.set_position((req.list_x, y_pos)).set_duration(0.1)
            clips_to_composite.append(txt_num)

            if i <= req.current_slot and clip_i and clip_i.subtitol:
                offset_x = req.list_x + txt_num.w + 20 
                
                txt_clip = TextClip(clip_i.subtitol, 
                                    fontsize=clip_i.estil.get("font_size", 70), 
                                    color=clip_i.estil.get("color", "white"), 
                                    font=clip_i.estil.get("font", "Arial"), 
                                    stroke_color=clip_i.estil.get("stroke_color", "black"), 
                                    stroke_width=clip_i.estil.get("stroke_width", 3))
                
                txt_clip = txt_clip.set_position((offset_x, y_pos + 5)).set_duration(0.1)
                clips_to_composite.append(txt_clip)

        # Forcem el render de la imatge a 1080x1920
        comp = CompositeVideoClip(clips_to_composite, size=(1080, 1920))
        final_preview_path = "preview_final.png"
        comp.save_frame(final_preview_path, t=0)
        
        bg_base.close()
        bg_video_frame.close()
        comp.close()
        
        return FileResponse(final_preview_path)

    except Exception as e:
        import traceback
        traceback.print_exc() # Aquesta és la línia màgica per veure on peta
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
        clips_data = req.clips
        if req.ordre == "ascendent":
            clips_data.sort(key=lambda x: x.posicio)
        elif req.ordre == "descendent":
            clips_data.sort(key=lambda x: x.posicio, reverse=True)
            
        final_clips = []
        total_slots = len(clips_data)
        
        list_x = req.estil_global.get("list_x", 80)
        list_start_y = req.estil_global.get("list_start_y", 450)
        list_gap_y = req.estil_global.get("list_gap_y", 110)
        
        number_colors = ['red', 'orange', '#3b82f6', 'white', 'yellow', 'magenta']
        
        for clip_data in clips_data:
            ruta_clip = os.path.join(OUTPUT_DIR, clip_data.arxiu)
            if not os.path.exists(ruta_clip):
                raise HTTPException(status_code=404, detail=f"No s'ha trobat l'arxiu {clip_data.arxiu}")
                
            # --- INICI ZONA DE FORMAT 9:16 ---
            v_clip_original = VideoFileClip(ruta_clip)
            # Reescalem a amplada completa 1080p usant vfx.resize correctament
            v_clip_resized = v_clip_original.fx(vfx.resize, width=1080)
            # Centrem dins un llenç negre pur de resolució vertical
            v_clip_final = CompositeVideoClip(
                [v_clip_resized.set_position("center")], 
                size=(1080, 1920)
            ).set_duration(v_clip_original.duration)
            
            layers = [v_clip_final]
            # --- FI ZONA DE FORMAT 9:16 ---
            
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
            
            for i in range(1, total_slots + 1):
                y_pos = list_start_y + ((i - 1) * list_gap_y)
                num_color = number_colors[(i - 1) % len(number_colors)]
                
                clip_i = next((c for c in clips_data if c.posicio == i), None)
                
                stroke_w = clip_i.estil.get("stroke_width", 3) + 1 if clip_i else 4
                f_size = clip_i.estil.get("font_size", 70) + 15 if clip_i else 85
                
                txt_num = TextClip(f"{i}.", fontsize=f_size, color=num_color, font="Impact", stroke_color="black", stroke_width=stroke_w)
                txt_num = txt_num.set_position((list_x, y_pos)).set_duration(v_clip_final.duration)
                layers.append(txt_num)
                
                if i <= clip_data.posicio and clip_i and clip_i.subtitol:
                    offset_x = list_x + txt_num.w + 20
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

            # Assignem mida a la composició perquè MoviePy no es confongui
            comp = CompositeVideoClip(layers, size=(1080, 1920))
            final_clips.append(comp)

        if not final_clips:
            raise HTTPException(status_code=400, detail="No s'han pogut carregar els clips.")

        video_final = concatenate_videoclips(final_clips, method="compose")
        nom_arxiu = req.output_name if req.output_name.endswith('.mp4') else req.output_name + '.mp4'
        output_path = os.path.join(OUTPUT_DIR, TOPS_DIR, nom_arxiu)
        
        video_final.write_videofile(output_path, fps=30, codec="libx264", audio_codec="aac")
        
        for c in final_clips:
            c.close()
        video_final.close()
        
        return {"status": "success", "file": nom_arxiu}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))