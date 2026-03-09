# Análisis Completo: Sistema de Invitaciones y Registro en Fulbo Teams

## Documento técnico sobre cómo funciona el flujo de invitaciones, registro y redirecciones

---

## 1. GENERACIÓN DE LINKS DE INVITACIÓN

### 1.1 ¿Dónde se generan?

**Archivo:** `src/app/api/groups/route.ts`

**Función:** `generateCode()`

```typescript
function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}
```

**Características del código:**
- **Longitud:** 6 caracteres
- **Caracteres permitidos:** Letras mayúsculas (A-Z) + números (2-9)
- **Excluye:** 0, 1, O, I (evita confusión visual)
- **Generación:** Al crear un grupo (`POST /api/groups`)
- **Validación:** Se reintenta hasta 10 veces si ya existe (evita duplicados)

### 1.2 URL de invitación completa

**Patrón:**
```
https://[domain]/join/[CODE]
```

**Ejemplo:**
```
https://fulboTeams.com/join/ABC2XZ
```

**Cómo se genera en frontend:**

**Archivo:** `src/components/CopyButton.tsx`

```typescript
const handleCopy = async () => {
  const url = `${window.location.origin}/join/${code}`
  await navigator.clipboard.writeText(url)
  setCopied(true)
  setTimeout(() => setCopied(false), 2000)
}
```

**Dónde se muestra:** En la página de detalles del grupo (`/dashboard/groups/[groupId]`)

---

## 2. ESTRUCTURA DE RUTAS Y ENDPOINTS

### 2.1 Rutas públicas (sin autenticación requerida)

| Ruta | Tipo | Función |
|------|------|---------|
| `/join/[code]` | GET (Page) | Página de invitación |
| `/api/groups/info/[code]` | GET (API) | Obtiene info del grupo por código |
| `/api/groups/join` | POST (API) | Registra usuario al grupo |
| `/register` | GET (Page) | Página de registro |
| `/login` | GET (Page) | Página de login |
| `/api/auth/register` | POST (API) | Crea nuevo usuario |

### 2.2 Rutas protegidas (requieren autenticación)

| Ruta | Tipo | Función |
|------|------|---------|
| `/dashboard` | GET (Page) | Dashboard principal |
| `/dashboard/groups/[groupId]` | GET (Page) | Detalles del grupo |
| `/dashboard/groups/new` | GET (Page) | Crear nuevo grupo |
| Y todas las demás subrutas de dashboard | - | - |

---

## 3. FLUJO DE INVITACIÓN Y REGISTRO (PASO A PASO)

### 3.1 Flujo completo: Usuario sin cuenta

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Usuario recibe link: https://app.com/join/ABC2XZ             │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
        ┌──────────────────────────────────────┐
        │ 2. Accede a /join/[code]             │
        │    (Componente: JoinGroupPage)       │
        └──────────────────────────────────────┘
                           │
                           ▼
        ┌──────────────────────────────────────┐
        │ 3. useEffect fetcha /api/groups/     │
        │    info/[code]                       │
        │    - Obtiene nombre del grupo        │
        │    - Valida que el código exista     │
        └──────────────────────────────────────┘
                           │
                           ▼
        ┌──────────────────────────────────────┐
        │ 4. ¿Usuario autenticado?             │
        │    (useSession)                      │
        │    NO → Mostrar botón "Iniciar      │
        │           Sesión" o "Crear Cuenta"  │
        │    SÍ → Ejecutar handleJoin()       │
        └──────────────────────────────────────┘
                      NO │ │ SÍ
            ┌────────────┼─┼─────────────┐
            ▼            │ │             ▼
    ┌───────────────┐    │ │     ┌──────────────────┐
    │ Ir a /login   │    │ │     │ POST /api/groups/│
    │ o /register   │    │ │     │ join con { code }│
    │               │    │ │     │                  │
    │ Credenciales: │    │ │     │ Backend:         │
    │ - email       │    │ │     │ 1. Valida sesión │
    │ - password    │    │ │     │ 2. Busca grupo   │
    │ - name        │    │ │     │ 3. Verifica no   │
    │               │    │ │     │    sea miembro   │
    │ POST /api/    │    │ │     │ 4. Crea          │
    │ auth/register │    │ │     │    GroupMember   │
    │               │    │ │     │ 5. Devuelve      │
    │ Luego signIn()│    │ │     │    { groupId }   │
    └───────────────┘    │ │     └──────────────────┘
            │            │ │            │
            └────────────┼─┼────────────┘
                         │ │
                         ▼ ▼
           ┌──────────────────────────────┐
           │ 5. Usuario ahora              │
           │    autenticado + miembro del  │
           │    grupo                      │
           └──────────────────────────────┘
                         │
                         ▼
           ┌──────────────────────────────┐
           │ 6. router.push(               │
           │  /dashboard/groups/[groupId] │
           │ )                            │
           └──────────────────────────────┘
                         │
                         ▼
           ┌──────────────────────────────┐
           │ Usuario ve detalles del      │
           │ grupo y puede empezar a      │
           │ puntuar jugadores, etc.      │
           └──────────────────────────────┘
```

### 3.2 Flujo simplificado: Usuario con cuenta

```
Link /join/[code] → Verifica sesión → Si hay sesión: 
  POST /api/groups/join → Redirect a /dashboard/groups/[groupId]
```

---

## 4. ENDPOINTS Y PARÁMETROS DETALLADOS

### 4.1 GET `/api/groups/info/[code]`

**Propósito:** Obtener información del grupo sin autenticación

**Parámetro:** `code` (URL param) - código de 6 caracteres

**Respuesta exitosa (200):**
```json
{
  "id": "cl9abc123...",
  "name": "Los Gallos"
}
```

**Respuesta error (404):**
```json
{
  "error": "Grupo no encontrado"
}
```

**Nota:** Se ejecuta en el primer `useEffect` de `JoinGroupPage`

---

### 4.2 POST `/api/groups/join`

**Propósito:** Registrar usuario autenticado a un grupo

**Autenticación:** REQUERIDA (NextAuth session)

**Body:**
```json
{
  "code": "ABC2XZ"
}
```

**Proceso interno:**
1. Obtiene userId de la sesión
2. Convierte código a mayúsculas
3. Busca grupo por código
4. Verifica que no sea miembro ya
5. Crea entrada en `GroupMember` tabla con rol `MEMBER`

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "groupId": "cl9abc123..."
}
```

**Respuestas error:**
```json
{ "error": "No autorizado" }                          // 401
{ "error": "Código requerido" }                      // 400
{ "error": "Código inválido" }                       // 404
{ "error": "Ya eres miembro de este grupo" }         // 400
{ "error": "Error al unirse al grupo" }              // 500
```

---

### 4.3 POST `/api/auth/register`

**Propósito:** Crear nueva cuenta de usuario

**Autenticación:** NO REQUERIDA (público)

**Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "miPassword123",
  "name": "Juan Pérez"
}
```

**Validaciones (Zod schema):**
- `email`: debe ser email válido
- `password`: mínimo 6 caracteres
- `name`: mínimo 2 caracteres

**Proceso interno:**
1. Valida schema
2. Verifica que email no exista
3. Hashea password con bcryptjs (12 salt rounds)
4. Crea usuario en BD
5. Devuelve datos del usuario creado

**Respuesta exitosa (200):**
```json
{
  "id": "cuid...",
  "email": "usuario@ejemplo.com",
  "name": "Juan Pérez"
}
```

**Respuestas error:**
```json
{ "error": "El email ya está registrado" }           // 400
{ "error": "Mensaje de validación de zod" }         // 400
{ "error": "Error al registrar usuario" }            // 500
```

---

## 5. MECANISMO DE REDIRECCIÓN

### 5.1 En NextAuth y Next.js

**NextAuth soporta 3 formas de redirección:**

1. **`callbackUrl`** - Parámetro de signIn
2. **`pages.signIn`** - Configuración global
3. **Redirección manual** - Con `router.push()`

### 5.2 Uso actual en el proyecto

**Configuración en `src/lib/auth.ts`:**
```typescript
pages: {
  signIn: '/login',        // Página de login
  newUser: '/onboarding'   // NO se u
