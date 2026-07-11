# ONE DISC — Plataforma de Evaluación (React + Tailwind + Supabase)

Réplica 1:1 de la versión AppScript, con Google Sheets/Drive reemplazados por Supabase.

## Puesta en marcha

1. **Base de datos**: en [Supabase Dashboard](https://supabase.com/dashboard/project/pnyzlhmpfavrusqgjuxk) → SQL Editor → pegar y ejecutar `supabase/schema.sql` (crea tablas `admins`, `usuarios`, `respuestas`, el bucket `informes` y las políticas RLS).
2. **Credenciales**: ya están en `.env` (URL + anon key). Ese archivo no se sube a git.
3. **Correr**: `npm install` y `npm run dev` → http://localhost:5173

## Acceso

- **SuperAdmin**: usuario `superadmin`, contraseña `admin123` (fijo, igual que el original — se cambia en `src/lib/auth.js`).
- El SuperAdmin crea Admins; cada Admin crea sus Usuarios; los Usuarios hacen el test.

## Arquitectura

| Módulo | Dónde vive | Qué cambió vs AppScript |
|---|---|---|
| Landing + Login | `src/pages/Landing.jsx` | CSS custom → Tailwind. Misma UI y flujo. |
| Userboard | `src/pages/Userboard.jsx` | GAS → Supabase. Manual personalizado intacto (Manual.js). |
| Test DISC | `src/pages/TestDisc.jsx` | Preguntas, puntajes y PDF idénticos. Guardado → Supabase + Storage. |
| Informe | `public/informe/` (estático) | **HTML+JS originales sin tocar** — lee `sessionStorage.discUserData`. |
| AdminDashboard | `src/pages/AdminDashboard.jsx` | Verificación de tests: N fetches → 1 consulta. |
| SuperAdminDashboard | `src/pages/SuperAdminDashboard.jsx` | "Crear infraestructura" (Drive/Sheets/Scripts) eliminado: con base única el admin queda ACTIVADO al crearse. |
| JS legacy (no tocar) | `public/legacy/` | pdfGenerator, ruedas, charts, Manual — se cargan por `loadScript.js` con sus versiones exactas de jsPDF (Test: 3.0.3, Informe/Manual: 2.5.1). |

## Notas

- La sesión replica la semántica original: `sessionStorage`, timeout de 1 hora, mismas claves (los JS legacy las leen).
- El PDF del informe ahora se sube a Supabase Storage (bucket `informes`) en lugar de Drive; la ruta queda en `respuestas.pdf_path`.
- El login de usuario pasó de iterar la planilla de cada admin a una sola consulta con join — esto es lo que lo hace masivo.
