# NeuroBreak – Especificación del Proyecto

## 1. Visión General
NeuroBreak es una aplicación web de bienestar mental que combina sesiones de movimiento físico con juegos cognitivos. El objetivo es ayudar a los usuarios a mejorar su claridad mental, salud de espalda y hábitos saludables de forma progresiva y personalizada.

## 2. Alcance
- Autenticación de usuarios (email/contraseña y OAuth Google).
- Gestión de perfiles: nombre, avatar, objetivo, idioma, métricas de progreso.
- Registro de sesiones de movimiento con duración.
- Registro de juegos mentales con puntaje, duración y variante.
- Dashboard con historial y estadísticas de progreso.
- Soporte multiidioma vía `constants/translations.ts`.

## 3. Tecnologías
| Categoría   | Herramienta                   |
|-------------|-------------------------------|
| Frontend    | React + Vite (TypeScript)     |
| UI          | TSX + Vanilla CSS             |
| Backend     | Supabase (PostgreSQL + Auth)  |
| Validación  | Zod                           |
| AI          | Gemini API (geminiService.ts) |
| Deploy      | Vercel / Netlify              |

## 4. Estructura del Proyecto
```
src/
├─ components/         # UI: Auth, Dashboard, Navbar, Sidebar, MindGames, etc.
├─ constants/          # Traducciones, constantes de juegos y movimientos
├─ services/           # supabase.ts (Supabase client), geminiService.ts (AI)
├─ utils/              # validation.ts (Zod), wellnessMetrics.ts
├─ spec/               # Documentación del proyecto (este archivo)
├─ App.tsx             # Raíz de la aplicación
├─ index.tsx           # Punto de entrada React
└─ types.ts            # Tipos TypeScript globales
```

## 5. Modelado de Datos (Supabase)

### `profiles`
| Campo              | Tipo    | Descripción                        |
|--------------------|---------|------------------------------------|
| id                 | UUID    | Clave primaria (auth.uid)          |
| full_name          | TEXT    | Nombre completo del usuario        |
| avatar_url         | TEXT    | URL de foto de perfil              |
| goal               | TEXT    | Objetivo personal del usuario      |
| language           | TEXT    | Idioma preferido                   |
| mental_clarity     | FLOAT   | Métrica de claridad mental         |
| back_health        | FLOAT   | Métrica de salud de espalda        |
| sessions_completed | INT     | Total de sesiones completadas      |

### `session_history`
| Campo        | Tipo      | Descripción                   |
|--------------|-----------|-------------------------------|
| id           | UUID      | Clave primaria                |
| user_id      | UUID      | FK → profiles.id              |
| movement_id  | TEXT      | ID del movimiento realizado   |
| duration     | INT       | Duración en segundos          |
| completed_at | TIMESTAMP | Fecha/hora de finalización    |

### `mental_game_history`
| Campo        | Tipo      | Descripción                        |
|--------------|-----------|------------------------------------|
| id           | UUID      | Clave primaria                     |
| user_id      | UUID      | FK → profiles.id                   |
| game_id      | TEXT      | ID del juego mental                |
| score        | INT       | Puntaje obtenido (nullable)        |
| duration     | INT       | Duración en segundos               |
| variant_seed | TEXT      | Semilla de variante del juego      |
| completed_at | TIMESTAMP | Fecha/hora de finalización         |

## 6. Servicios (`src/services/`)

### `supabase.ts`
| Función                         | Descripción                                  |
|---------------------------------|----------------------------------------------|
| `signInWithPassword`            | Login con email y contraseña                 |
| `signInWithGoogle`              | OAuth con Google                             |
| `signUp`                        | Registro de nuevo usuario                    |
| `signOut`                       | Cierre de sesión                             |
| `getProfile`                    | Obtener perfil del usuario autenticado       |
| `updateProfile`                 | Actualizar campos del perfil                 |
| `logSession`                    | Registrar sesión de movimiento               |
| `getSessionHistory`             | Obtener historial de sesiones                |
| `logMindGameSession`            | Registrar sesión de juego mental             |
| `getMindGameHistory`            | Obtener historial de juegos (max 50)         |

### `geminiService.ts`
- Integración con la API de Google Gemini para recomendaciones y contenido generado por IA.

## 7. Seguridad
- Verificación de identidad en cada operación: el `userId` del parámetro se compara con el usuario de la sesión activa (`getCurrentUserId`).
- Row Level Security (RLS) habilitado en Supabase para que cada usuario solo acceda a sus datos.
- Validación de inputs con schemas Zod (`validation.ts`) antes de enviar a la base de datos.
- Variables de entorno: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` en `.env.local` (nunca en el repositorio).

## 8. Componentes Principales

| Componente          | Descripción                                               |
|---------------------|-----------------------------------------------------------|
| `Auth.tsx`          | Formularios de login, registro y OAuth Google             |
| `Dashboard.tsx`     | Vista principal con progreso y sesiones recientes         |
| `Navbar.tsx`        | Barra de navegación superior                              |
| `Sidebar.tsx`       | Menú lateral de navegación                                |
| `MindGames.tsx`     | Interfaz de juegos mentales                               |
| `MovementEngine.tsx`| Motor de sesiones de movimiento                           |
| `ProfileSettings.tsx`| Edición del perfil de usuario                            |
| `Insights.tsx`      | Análisis y visualización de progreso                      |
| `Ritual.tsx`        | Flujo de ritual/rutina diaria                             |
| `AIchatButton.tsx`  | Botón de chat con IA (Gemini)                             |

## 9. Internacionalización (i18n)
- Las traducciones están centralizadas en `constants/translations.ts`.
- Idioma configurable por usuario desde el perfil.

## 10. Pruebas
- **Unitarias**: funciones de `supabase.ts` y `wellnessMetrics.ts` con mocks.
- **Componentes**: React Testing Library para flujos de UI.
- **E2E**: Playwright para flujos completos (login → dashboard → sesión).

## 11. Despliegue
1. Configurar variables de entorno en la plataforma de hosting.
2. `npm run build` → genera `dist/`.
3. Publicar `dist/` en Vercel o Netlify.
4. Base de datos Supabase en producción con RLS activo.

## 12. Roadmap
- [ ] Notificaciones push para recordatorios de sesiones.
- [ ] Sistema de logros y gamificación.
- [ ] Exportar historial como CSV/JSON.
- [ ] Análisis avanzado con Supabase Edge Functions.
- [ ] Diseño premium con glassmorphism y animaciones.

---
*Documento de especificación – NeuroBreak. Actualizado: 2026-07-10.*
