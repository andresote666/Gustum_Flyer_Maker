# Gustum – Generador de Carteles

A simple web page for updating Gustum's daily menu and exporting it as social media images, without any design software.

Built from the Figma design *Gustum_Menu_v2 · v10 Cafetería clásica celeste*.

## What it does

- A form in Spanish organised like the menu: date, specials, soups, lunch of the day, diet of the day, drinks and WhatsApp.
- Live preview of the 5 formats:
  - Historia (Story 1080×1920)
  - Publicación (Feed 1080×1350)
  - Carrusel 1 · Especiales
  - Carrusel 2 · Sopas y bebidas
  - Carrusel 3 · Almuerzo y dieta
- Exports PNGs at full 1080px size. On a computer they go to the Downloads folder; on a phone the share menu opens (save to Photos, WhatsApp, Instagram).
- Photo upload with zoom and position adjustment.
- "Ver más grande": a full-screen zoom view of the preview.
- Long names and extra dishes shrink to fit the design automatically.
- Saves automatically in the browser, with an optional backup file.

## Run it locally

It must be served over http (opening `index.html` directly won't export correctly):

```bash
python3 -m http.server 8765
```

Then open http://localhost:8765.

## Hosting

It's a static site with no build step: `index.html`, `app.js`, `styles.css` and `assets/`. You can publish it as is on GitHub Pages, Netlify or Vercel.

The menu is saved in the browser of the device where it's edited, so it isn't shared between devices.

## Files

- `index.html` – page structure, photo adjuster and zoom view
- `styles.css` – editor styles and the flyer formats (rebuilt 1:1 from Figma)
- `app.js` – menu data, flyer rendering, auto-fit, photos, export
- `assets/` – logo, sun, stars and example photos
