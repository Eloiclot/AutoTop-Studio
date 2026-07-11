# 🚀 AutoTop Studio

AutoTop Studio és una eina automatitzada dissenyada per generar vídeos verticals tipus "Top" o rànquings de manera ràpida i senzilla. 

Oblida't d'editar manualment: només has de triar els teus clips, assignar-los una posició, personalitzar l'estil dels textos i el programa s'encarrega de muntar el vídeo final amb efectes acumulatius.

## ✨ Característiques Principals
* **Tallador Integrat:** Retalla els teus vídeos originals directament des de l'aplicació.
* **Ordre Personalitzable:** Genera rànquings en ordre ascendent, descendent o totalment a mida (ex: 5, 3, 4, 1, 2).
* **Previsualització en Temps Real:** Comprova com quedarà cada fotograma abans de renderitzar.
* **Estils Globals i Individuals:** Modifica colors, vores, tipografies i mides per a cada text.

---

## 📥 Com utilitzar-ho (Versió per a usuaris)

Si només vols fer servir l'aplicació sense complicacions, segueix aquests passos:

1. Ves a la pestanya **[Releases](../../releases)** d'aquest repositori.
2. Descarrega l'últim fitxer `.zip` disponible (ex: `AutoTop_v1.0.zip`).
3. Descomprimeix el fitxer en una carpeta del teu ordinador.
4. Fes doble clic a l'arxiu **`AutoTop.exe`**.
5. Obre el teu navegador web (Chrome, Firefox, etc.) i ves a l'adreça: `http://localhost:8000`.

*Ja està! Pots començar a crear els teus Tops.*

---

## 🛠️ Instal·lació per a Desenvolupadors

Si vols modificar el codi font, necessitaràs Node.js i Python instal·lats.

**1. Clonar el repositori:**
\`\`\`bash
git clone https://github.com/Eloiclot/AutoTop-Studio.git
\`\`\`

**2. Frontend (React):**
\`\`\`bash
cd frontend/vite-project
npm install
npm run dev
\`\`\`

**3. Backend (FastAPI):**
\`\`\`bash
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
\`\`\`