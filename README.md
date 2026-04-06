# SkillFinder - prototipo mejorado

Proyecto web tipo plataforma de cursos, pensado para que cualquier persona pueda publicar cursos útiles y también descubrir cursos creados por la comunidad.

## Tecnologías base
- **React** para construir la interfaz
- **TypeScript** para escribir el código con más orden
- **Vite** para correr el proyecto rápido en desarrollo
- **Tailwind CSS** para estilos y diseño visual
- **React Router** para navegar entre páginas
- **Lucide React** para iconos

## Lo que ya quedó mejorado
- Publicación de cursos con guardado local en el navegador
- Validaciones más claras en el formulario de creación
- Búsqueda y filtros sincronizados con la URL
- Ordenamiento de resultados
- Estado vacío más útil cuando no hay resultados
- Guardado de cursos en perfil
- Inicio de curso persistente en perfil
- Sección de cursos publicados por el usuario
- Mejoras pequeñas de accesibilidad y carga de imágenes

## Cómo correrlo
1. Instala dependencias:
   ```bash
   npm install
   ```
2. Inicia el proyecto:
   ```bash
   npm run dev
   ```
3. Para generar versión final:
   ```bash
   npm run build
   ```

## Nota
Los cursos creados desde la pantalla **Crear curso** se guardan en el navegador usando `localStorage`, así que sirven perfecto para demo y presentación académica sin necesidad de backend todavía.
