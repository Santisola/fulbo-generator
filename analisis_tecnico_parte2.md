# ANÁLISIS TÉCNICO - PARTE 2

---

## 6. AUTENTICACIÓN Y AUTORIZACIÓN

### 6.1 Sistema de Autenticación

**NextAuth.js v4.24.13**

**Proveedores:**
1. Credentials (email + password)
2. Google OAuth 2.0

**Flujo Registro:**
```
Email/Contraseña/Nombre → Validar (Zod)
→ Hash contraseña (bcryptjs, 12 rounds)
→ Crear User en BD
→ Auto-login con signIn('credentials')
→ Sesión JWT en cookies
```

**Flujo Google OAuth:**
```
Click Google
→ Redirect Google auth
→ Callback a /api/auth/callback/google
→ Si nuevo: crear User en BD (sin password)
→ Generar JWT
→ Sesión establecida
```

### 6.2 Niveles de Acceso

| Nivel | Rol | Acceso |
|-------|-----|--------|
| 0 | No autenticado | Home, Login, Register |
| 1 | MEMBER | Dashboard, ver grupos, puntuar, generar equipos |
| 2 | ADMIN | + Editar grupo, eliminar jugadores, gestionar incomp. |

**Validación:** getServerSession (server) + GroupMember check

---

## 7. ALGORITMO DE GENERACIÓN DE EQUIPOS

### 7.1 Descripción

**Objetivo:** Crear dos equipos equilibrados de fútbol 5 respetando incompatibilidades.

**Entrada:**
- Lista de jugadores con puntajes promedio ocultos
- Incompatibilidades (CANNOT_FACE / MUST_TOGETHER)

**Salida:**
- Team A y Team B (lista de player IDs)
- Diferencia de promedios (minimizada)
- Validación: no duplicado en últimas 20 generaciones

### 7.2 Pseudocódigo

```typescript
for attempt = 1 to 100:
  1. Barajar aleatoriamente jugadores
  2. Partir en dos mitades (teamA, teamB)
  3. Validar incompatibilidades:
     - CANNOT_FACE: player1 en teamA, player2 NO en teamB
     - MUST_TOGETHER: ambos en mismo equipo
  4. Si inválido: continue siguiente intento
  5. Calcular diff = |avg(teamA) - avg(teamB)|
  6. Si diff < bestDiff:
     - Verificar no duplicado en últimos 20
     - Si único: guardar como best
     - Si diff < 0.1: break (suficientemente bueno)
7. Guardar en TeamHistory
8. Retornar { teamA, teamB, averageDiff }
```

### 7.3 Características

| Aspecto | Detalles |
|---------|----------|
| Complejidad Tiempo | O(100 × n²) |
| Complejidad Espacio | O(n) |
| Mínimo jugadores | 4 |
| Máximo intentos | 100 (timeout ~5s) |
| Criterio parada | diff < 0.1 o 100 intentos |
| Evita duplicados | Últimas 20 generaciones |

---

## 8. CONFIGURACIÓN DEL PROYECTO

### 8.1 Scripts NPM

```json
{
  "dev": "next dev",            // Puerto 3000
  "build": "next build",        // Build optimizado
  "start": "next start",        // Producción
  "lint": "eslint",             // ESLint
  "postinstall": "prisma generate" // Auto-genera Prisma Client
}
```

### 8.2 TypeScript (tsconfig.json)

```json
{
  "target": "ES2017",
  "jsx": "react-jsx",
  "strict": true,
  "paths": { "@/*": ["./src/*"] }
}
```

### 8.3 Variables de Entorno Requeridas

```env
DATABASE_URL=postgresql://user:pass@host/dbname
NEXTAUTH_SECRET=<32 hex chars>
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=<from Google Console>
GOOGLE_CLIENT_SECRET=<from Google Console>
```

### 8.4 Build Configuration

- **Next.js:** Bundler automático, optimización de código
- **Tailwind:** JIT compiler, purge de CSS no usado
- **Prisma:** Generación automática en postinstall
- **TypeScript:** Strict mode activado

---

## 9. FLUJOS DE USUARIO

### 9.1 Crear Cuenta → Grupo → Puntuar

```
1. Usuario llega a /
   └─ Click "Crear Cuenta"

2. /register
   └─ Email, contraseña, nombre
   └─ POST /api/auth/register
   └─ Validación Zod
   └─ Hash con bcryptjs

3. Auto-login
   └─ signIn('credentials')
   └─ JWT en cookies

4. /dashboard
   └─ Vacío (sin grupos)
   └─ Click "+ Crear Grupo"

5. /dashboard/groups/new
   └─ Nombre del grupo
   └─ POST /api/groups
   └─ Generar código único (6 chars)

6. /dashboard/groups/[id]
   └─ Detalle del grupo
   └─ Código para compartir
   └─ Click "+ Agregar Jugador"

7. /dashboard/groups/[id]/players/new
   └─ Nombre del jugador
   └─ POST /api/groups/[id]/players

8. /dashboard/groups/[id]
   └─ Listar jugadores
   └─ Botón "Puntuar" por cada uno
   └─ Otros miembros: "Puntuar" o "Editar"

9. /dashboard/groups/[id]/players/[id]/rate
   └─ Slider 1-10
   └─ POST /api/.../players/[id]/rate
   └─ Rating guardado (oculto a otros)

10. /dashboard/groups/[id]/generate
    └─ Seleccionar jugadores
    └─ POST /api/groups/[id]/teams
    └─ Algoritmo ejecuta (100 intentos)
    └─ Resultado: Team A vs Team B
```

### 9.2 Unirse a Grupo

```
1. Amigo recibe código: ABC123

2. fulbo-teams.com/join/ABC123
   └─ Si no autenticado: redirect /register

3. Página /join/[code]
   └─ POST /api/groups/join { code: "ABC123" }
   └─ Validar código existe
   └─ Crear GroupMember (MEMBER role)

4. Redirect a /dashboard/groups/[id]
   └─ Ahora es miembro del grupo
```

---

## 10. SEGURIDAD

### 10.1 Mecanismos de Seguridad

| Aspecto | Implementación |
|---------|----------------|
| Passwords | Hash bcryptjs (12 rounds) + salt |
| Sesiones | JWT en cookies HttpOnly, Secure, SameSite |
| CSRF | NextAuth.js protege automáticamente |
| SQL Injection | Prisma ORM (queries parametrizadas) |
| XSS | React escapes HTML, CSP headers |
| CORS | Same-origin, NextAuth headers |
| Validación | Zod schema en todos los endpoints |
| Autorización | getServerSession + GroupMember checks |

### 10.2 Privacidad de Puntajes

**Problema:** Si puntajes son públicos, hay prejuicio.

**Solución:** Puntajes ocultos

- Cada usuario ve SOLO su puntaje
- Promedio NO se muestra en lista de jugadores
- Promedio se revela solo en generación de equipos
- Así garantiza imparcialidad

---

## 11. RENDIMIENTO Y ESCALABILIDAD

### 11.1 Optimizaciones Actuales

| Técnica | Implementación |
|---------|----------------|
| SSR | Server Components en Next.js |
| Lazy Loading | Pages/Componentes code-split |
| Caché | React Query (configurable) |
| Índices BD | groupId en players, teamHistory |
| Paginación | TeamHistory: máximo 20 registros |
| Imágenes | Next.js Image Optimization |

### 11.2 Límites Actuales

| Recurso | Límite | Notas |
|---------|--------|-------|
| Jugadores/grupo | 100+ | Algoritmo: O(100×n²) |
| Grupos/usuario | Ilimitado | Dashboard pagina visualmente |
| Historial | 20 | Evita crecimiento ilimitado |
| Intentos gen. | 100 | Timeout ~5s en peor caso |

### 11.3 Para Producción

1. **Database:** PostgreSQL 14+, backups automáticos
2. **Cache:** Redis para sesiones y resultados
3. **Rate Limiting:** Implementar (IP + endpoint)
4. **CDN:** Cloudflare para assets estáticos
5. **Monitoreo:** Sentry para errores, LogRocket para UX
6. **Load Testing:** k6 o Artillery para validar

---

## 12. PUNTOS DE ENTRADA

### 12.1 Root Layout

```typescript
// src/app/layout.tsx
Providers (Session + QueryClient + Theme)
  ├─ metadata
  ├─ Inter font
  ├─ Root children
  └─ Global CSS
```

### 12.2 Rutas Públicas (Sin Auth)

```
/ (home)
├─ Landing con features
├─ CTAs: Login/Register
└─ ThemeToggle

/register
├─ Formulario registro
├─ Google OAuth option
└─ Link a /login

/login
├─ Formulario login
├─ Google OAuth option
└─ Link a /register

/join/[code]
├─ Validar código
├─ Crear GroupMember
└─ Redirect dashboard
```

### 12.3 Rutas Protegidas (Con Auth)

```
/dashboard
├─ getServerSession check
├─ Listar grupos del usuario
└─ Botón crear grupo

/dashboard/groups/[id]
├─ Verificar GroupMember
├─ Mostrar detalles
├─ Botones según rol

/dashboard/groups/[id]/players/[id]/rate
├─ Mostrar jugador
├─ Slider 1-10
└─ Guardar rating
```

---

## 13. STACK VISUAL

### 13.1 Tailwind CSS

**Utilidades:**
- Colores: var(--primary), var(--background), etc.
- Responsive: sm, md, lg breakpoints
- Dark mode: class="dark"
- Transiciones: hover, focus, duration

**CSS Variables:**
```css
:root {
  --foreground: ...
  --background: ...
  --primary: ...
  --card: ...
  --border: ...
  --muted-foreground: ...
}
```

### 13.2 Componentes de UI

**Uso frecuente:**
- Button: px-6 py-3 bg-primary rounded-lg
- Card: bg-card border-border rounded-2xl
- Input: px-4 py-3 bg-input border-border rounded-xl
- Link: text-primary hover:underline

**Responsive:**
- Mobile-first approach
- Hidden en sm, block en md
- Gaps y padding ajustables

---

## 14. PRÓXIMOS PASOS (ROADMAP)

### Phase 2 - Mejoras
- [ ] Búsqueda y filtros de grupos
- [ ] E
