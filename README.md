# Generador de mensajes para WhatsApp (paquetes turisticos)

## Requisitos
- Python 3.10+ recomendado

## Instalacion y uso
```bash
pip install -r requirements.txt
python app.py
```

Abrir en el navegador:
```
http://127.0.0.1:5000
```

## Publicar en Render
1) Sube este proyecto a un repo de GitHub.
2) En Render: "New +" → "Web Service".
3) Conecta tu repo y selecciona la rama.
4) Configura:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn app:app`
5) Deploy.

## Que hace
- Limpia y detecta hoteles desde un bloque de texto pegado
- Genera un mensaje listo para WhatsApp en tiempo real
- Permite copiar el mensaje con un boton

## Estructura
- `app.py`: servidor Flask
- `templates/index.html`: interfaz
- `static/style.css`: estilos
- `static/app.js`: logica de parsing y preview
