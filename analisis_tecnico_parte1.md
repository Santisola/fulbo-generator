# ANÁLISIS TÉCNICO COMPLETO: Fulbo Teams Generator

**Última actualización:** 9 de marzo de 2026  
**Líneas de código:** ~632 líneas de TypeScript/TSX  
**Estado:** Proyecto en desarrollo (v0.1.0)

---

## 1. ESTRUCTURA DEL PROYECTO

### 1.1 Organización de Directorios

```
fulbo-generator/
├── prisma/                        # ORM y esquema
├── public/                        # Activos estáticos (4 SVGs)
├── src/
│   ├── app/                       # App Router de Next.js
│   │   ├── api/                   # 12 API endpoints
│   │   ├── dashboard/             # Panel autenticado
│   │   ├── join/                  # Unirse a grupo
│   │   ├── login/                 # Autenticación
│   │   ├── register/              # Registro
│   │   └── globals.css            # Estilos (Tailwind)
│   ├── components/                # 8 componentes React
│   ├── lib/                       # auth.ts, prisma.ts
│   └── types/                     # Tipos TypeScript
├── package.json, tsconfig.json, next.config.ts
└── .gitignore, eslint.config.mjs, postcss.config.mjs
```

### 1.2 Estadísticas

| Tipo | Cantidad |
|------|----------|
| Páginas (tsx) | 10 |
| API Routes | 12 |
| Componentes | 8 |
| Modelos Prisma | 8 |
| Total líneas | ~632 |

---

## 2. TECNOLOGÍAS PRINCIPALES

### 2.1 Stack Tecnológico

| Categoría | Tecnología | Versión |
|-----------|-----------|---------|
| **Framework** | Next.js | 16.1.6 |
| **React** | React | 19.2.3 |
| **Lenguaje** | TypeScript | 5 |
| **Estilos** | Tailwind CSS | 4 |
| **ORM** | Prisma | 5.22.0 |
| **BD** | PostgreSQL | (remota) |
| **Auth** | NextAuth.js | 4.24.13 |
| **Encriptación** | bcryptjs | 3.0.3 |
| **Estado** | Zustand | 5.0.11 |
| **Data Fetching** | React Query | 5.90.21 |
| **Validación** | Zod | 4.3.6 |
| **Linting** | ESLint | 9 |

### 2.2 Dependencias Clave

**Producción:**
- @prisma/client: ORM Type-safe
- @tanstack/react-query: Data fetching y caché
- next-auth: Autenticación
- bcryptjs: Hash de passwords
- zod: Validación de esquemas

**Desarrollo:**
- @tailwindcss/postcss: PostCSS para Tailwind
- typescript: Tipado estático
- eslint: Linting

---

## 3. PROPÓSITO Y ALCANCE

### 3.1 Objetivo Principal

**Sistema web para generar equipos de fútbol 5 equilibrados** usando puntajes ocultos de jugadores, garantizando imparcialidad.

### 3.2 Funcionalidades Clave

✅ Autenticación con email/password o Google OAuth  
✅ Crear grupos con código de invitación (6 caracteres)  
✅ Agregar jugadores y puntuar (escala 1-10, oculto)  
✅ Gestionar incompatibilidades (CANNOT_FACE / MUST_BE_TOGETHER)  
✅ Generar equipos equilibrados (algoritmo optimizado)  
✅ Historial de últimos 20 equipos  
✅ Interfaz responsive (dark/light theme)  

---

## 4. MODELO DE DATOS (8 ENTIDADES)

```
User
├── id: String (cuid)
├── email: String (unique)
├── password: String (hashed)
├── name, image, createdAt
└── Relaciones: groups, createdGroups, ratings

Group
├── id, name, code (unique, 6 chars)
├── createdById, createdAt
└── Relaciones: members, players, teamHistory, incompatibilities

GroupMember
├── userId, groupId
├── role: ADMIN | MEMBER
└── joinedAt

Player
├── id, name, groupId
├── averageRating: Float? (oculto)
└── createdAt

Rating
├── playerId, userId, score (1-10)
├── unique([playerId, userId])
└── createdAt

TeamHistory
├── groupId, teamA, teamB (JSON arrays)
├── averageDiff: Float
└── generatedAt

PlayerIncompatibility
├── player1Id, player2Id, groupId
├── type: CANNOT_FACE_EACH_OTHER | MUST_BE_ON_SAME_TEAM
└── reason?, createdAt

Enums: Role, CompatibilityType
```

---

## 5. COMPONENTES Y MÓDULOS

### 5.1 Componentes React (8)

1. **ThemeProvider.tsx** - Context para tema dark/light
2. **Providers.tsx** - Wrapper: SessionProvider + QueryClient + Theme
3. **ThemeToggle.tsx** - Botón cambiar tema
4. **CopyButton.tsx** - Copiar código al portapapeles
5. **FloatingGuideButton.tsx** - Botón flotante ayuda
6. **HelpTooltip.tsx** - Tooltips informativos
7. **PageLoader.tsx** - Barra de progreso (NPProgress)
8. **AppGuide.tsx** - Guía de uso
9. **DashboardClient.tsx** - Dashboard principal

### 5.2 Páginas (10 Routes)

**Públicas:**
- `/` - Landing page
- `/register` - Registro (email/password/Google)
- `/login` - Login (credentials/Google)
- `/join/[code]` - Unirse a grupo

**Protegidas:**
- `/dashboard` - Panel de grupos
- `/dashboard/groups/new` - Crear grupo
- `/dashboard/groups/[id]` - Detalle grupo
- `/dashboard/groups/[id]/players/new` - Agregar jugador
- `/dashboard/groups/[id]/players/[id]/rate` - Puntuar
- `/dashboard/groups/[id]/players/[id]/edit` - Editar (ADMIN)
- `/dashboard/groups/[id]/incompatibilities` - Gestionar incompatibilidades (ADMIN)
- `/dashboard/groups/[id]/generate` - Generar equipos

### 5.3 API Routes (12 Endpoints)

**Auth:**
- `POST /api/auth/register` - Registro
- `[...nextauth]` - NextAuth handlers

**Grupos:**
- `POST /api/groups` - Crear
- `GET /api/groups/info/[code]` - Info pública
- `POST /api/groups/join` - Unirse

**Jugadores:**
- `GET|POST /api/groups/[id]/players` - Listar/Crear
- `GET|DELETE /api/groups/[id]/players/[id]` - Ver/Eliminar
- `PUT /api/groups/[id]/players/[id]/edit` - Editar
- `POST /api/groups/[id]/players/[id]/rate` - Puntuar

**Incompatibilidades:**
- `GET|POST /api/groups/[id]/incompatibilities` - Listar/Crear
- `DELETE /api/groups/[id]/incompatibilities/[id]` - Eliminar

**Equipos:**
- `POST /api/groups/[id]/teams` - GENERAR (algoritmo principal)

