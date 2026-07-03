import os

# 1. PRIMER DE TOT: Li diem la ruta exacta ABANS que MoviePy arrenqui
# ⚠️ REVISA si la teva carpeta té el "-26" al nom dins de C:\Program Files\
os.environ["IMAGEMAGICK_BINARY"] = r"C:\Program Files\ImageMagick-7.1.2-Q16-HDRI\magick.exe"

# 2. DESPRÉS ja podem importar MoviePy perquè ho llegeixi bé
from moviepy.editor import VideoFileClip, TextClip, CompositeVideoClip, concatenate_videoclips

# (Recorda posar els noms dels teus clips reals aquí)
CLIP_1 = "output/gos1.mp4" 
CLIP_2 = "output/emu1.mp4"

try:
    print("🎬 Carregant vídeos...")
    video1 = VideoFileClip(CLIP_1)
    video2 = VideoFileClip(CLIP_2)
    
    # Enganxem els vídeos
    video_final = concatenate_videoclips([video1, video2])
    
    print("✍️ Generant textos...")
    # Títol fixe
    titol_global = TextClip("Top 2: Animals Curiosos", fontsize=70, color='white', bg_color='black')
    titol_global = titol_global.set_position(('center', 50)).set_duration(video_final.duration)
    
    # Text clip 1
    text_clip1 = TextClip("2. La Guerra dels Emús", fontsize=50, color='yellow')
    text_clip1 = text_clip1.set_position((50, 300)).set_start(0).set_duration(video_final.duration)
    
    # Text clip 2
    text_clip2 = TextClip("1. El Gat Líquid", fontsize=50, color='yellow')
    text_clip2 = text_clip2.set_position((50, 400)).set_start(video1.duration).set_duration(video_final.duration - video1.duration)
    
    print("🥞 Muntant les capes...")
    composicio = CompositeVideoClip([video_final, titol_global, text_clip1, text_clip2])
    
    print("💾 Renderitzant el resultat (això pot trigar una mica)...")
    composicio.write_videofile("output/prova_top.mp4", fps=24, codec="libx264")
    
    print("✅ PROVA SUPERADA! Revisa l'arxiu prova_top.mp4")

except Exception as e:
    print(f"❌ ERROR: {e}")