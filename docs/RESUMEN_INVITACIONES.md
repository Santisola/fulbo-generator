# Resumen Ejecutivo: Sistema de Invitaciones a Grupos

## 1. ¿Cómo se generan los links de invitación?

**Función:** `generateCode()` en `src/app/api/groups/route.ts`

- Genera 6 caracteres aleatorios: **A-Z (excluye 0, 1, O, I) + números 2-9**
- Ejemplo: `ABC2XZ` o `KLM456`
- Se genera al crear un grupo (`POST /api/groups`)
- Se valida que sea UNIQUE en la base de datos
- Reintenta hasta 10 veces si hay colisión

**Parámetros:**
- Sin parámetros externos
- Solo genera + valida
- Almacena en tabla `Group.code`

**Link final:**
```
https://[domain]/join/[CODE]
Ejemplo: https://fulboTeams.com/join/ABC2XZ
```

---

## 2. ¿Dónde está la lógica de registro?

**Archivo:** `src/app/api/auth/register/route.ts`

**Endpoint:** `POST /api/auth/register`

**Body requerido:**
```json
{
  "email": "usuario@mail.com",
  "password": "miPassword123",
  "name": "Juan Pérez"
}
```

**Validaciones (Zod):**
- Email: formato válido
- Password: mínimo 6 caracteres
- Name: mínimo 2 caracteres

**Proceso interno:**
1. Valida schema con Zod
2. Verifica que email NO exista
3. Hashea password con bcryptjs (12 salt rounds)
4. Crea usuario en BD
5. Devuelve datos del usuario creado

**Respuesta exitosa:**
```json
{
  "id": "cuid...",
  "email": "usuario@mail.com",
  "name": "Juan Pérez"
}
```

---

## 3. ¿Cómo funciona el flujo de redirección post-registro?

**Página de registro:** `src/app/register/page.tsx`

**Pasos:**
1. User rellena formulario (email, password, name)
2. Submite → `POST /api/auth/register`
3. Backend crea usuario
4. Frontend ejecuta: `signIn('credentials', { redirect: false })`
5. Auto-login con las mismas credenciales
6. `router.push('/dashboard')` ← **REDIRECCIÓN FINAL**

**Redirección actual:**
```
/register → Crear cuenta → /dashboard
```

**Problema identificado:**
- Si venía de `/join/[code]`, se PIERDE esa información
- El usuario llega a `/dashboard` sin unirse al grupo
- No hay parámetro de retorno

---

## 4. Parámetros de redirección disponibles

### Actualmente implementados:

**NextAuth `callbackUrl`:**
```typescript
signIn('google', { callbackUrl: '/dashboard' })
```

**Problema:** Está hardcodeado a `/dashboard`

### Parámetros QUE FALTA IMPLEMENTAR:

**Opción 1: Query Parameter "returnTo" (RECOMENDADA - SIMPLE)**
```
/register?returnTo=%2Fjoin%2FABC2XZ
/login?returnTo=%2Fjoin%2FABC2XZ
```

**Opción 2: NextAuth callbackUrl (ESTÁNDAR - COMPLEJO)**
```typescript
signIn('credentials', {
  email, password,
  redirect: false,
  callbackUrl: `/join/${code}`  // ← HACER DINÁMICO
})
```

**Opción 3: Zustand Store (FLEXIBLE - MÁS CÓDIGO)**
```typescript
useInviteStore.setCode(code)  // Guardar intent
// Después de login, leer store y redirigir
```

---

## 5. Estructura de rutas relacionadas

### Públicas (sin autenticación):
```
GET  /join/[code]                   Página de invitación
GET  /api/groups/info/[code]        Info del grupo
POST /api/groups/join               Registrar usuario al grupo
POST /api/auth/register             Crear usuario
GET  /register                       Página de registro
GET  /login                          Página de login
```

### Protegidas (con autenticación):
```
GET  /dashboard                     Dashboard
GET  /dashboard/groups/[groupId]    Detalles grupo
POST /api/groups                    Crear grupo
...y muchas más
```

---

## 6. Endpoints detallados

### GET `/api/groups/info/[code]`
**Propósito:** Obtener nombre y ID del grupo (sin auth)

**Parámetro:** `code` (URL param)

**Respuesta (200):**
```json
{
  "id": "cuid123...",
  "name": "Los Gallos"
}
```

**Respuesta (404):**
```json
{
  "error": "Grupo no encontrado"
}
```

---

### POST `/api/groups/join`
**Propósito:** Registrar usuario autenticado al grupo

**Autenticación:** REQUERIDA (NextAuth JWT session)

**Body:**
```json
{
  "code": "ABC2XZ"
}
```

**Proceso:**
1. Obtiene `userId` de la sesión
2. Convierte código a mayúsculas
3. Busca grupo por código en BD
4. Verifica user NO es miembro ya
5. Crea registro en tabla `GroupMember` (rol: `MEMBER`)

**Respuesta (200):**
```json
{
  "success": true,
  "groupId": "cuid123..."
}
```

**Respuestas error:**
- 401: "No autorizado" (sin sesión)
- 400: "Código requerido" | "Código inválido" | "Ya eres miembro"
- 500: "Error al unirse al grupo"

---

## 7. Flujo completo ACTUAL vs IDEAL

### FLUJO ACTUAL (Con problemas)

```
Usuario sin cuenta → https://fulbo.com/join/ABC2XZ
                         ↓
                  /join/[code] page
                    (Carga grupo)
                         ↓
                ¿Tiene sesión? NO
                         ↓
          Muestra: "Iniciar Sesión"
                         ↓
     Click → /login (sin parámetros)
                         ↓
       Ingresa credenciales
                         ↓
      signIn() → router.push('/dashboard')
                         ↓
        ❌ Usuario en /dashboard
        ❌ NO unido al grupo
        ❌ Pierde intent original
```

### FLUJO IDEAL (Con returnTo)

```
Usuario sin cuenta → https://fulbo.com/join/ABC2XZ
                         ↓
                  /join/[code] page
                    (Carga grupo)
                         ↓
                ¿Tiene sesión? NO
                         ↓
    Click → /register?returnTo=%2Fjoin%2FABC2XZ
                         ↓
       Registra + signIn()
                         ↓
    router.push(returnTo) → /join/ABC2XZ
                         ↓
      useEffect detecta sesión
                         ↓
    handleJoin() → POST /api/groups/join
                         ↓
       ✓ Unido al grupo
                         ↓
  router.push(/dashboard/groups/[groupId])
                         ↓
  ✓ Usuario ve detalles del grupo
```

---

## 8. Base de datos relevante

### Tabla: Group
```
id          CUID (PK)
name        STRING
code        STRING UNIQUE ← El código de 6 caracteres
createdById CUID (FK → User.id)
createdAt   DATETIME
```

### Tabla: GroupMember
```
id        CUID (PK)
userId    CUID (FK → User.id)
groupId   CUID (FK → Group.id)
role      ENUM: ADMIN | MEMBER
joinedAt  DATETIME
CONSTRAINT UNIQUE(userId, groupId)  ← Un user por grupo
```

### Tabla: User
```
id        CUID (PK)
email     STRING UNIQUE
password  STRING (bcrypt hash)
name      STRING (nullable)
image     STRING (nullable, para Google)
createdAt DATETIME
```

---

## 9. Componentes clave

| Componente/Archivo | Responsabilidad |
|-------------------|-----------------|
| `JoinGroupPage` | Maneja flujo de invitación, llama APIs, redirige |
| `CopyButton` | Copia URL del grupo al portapapeles |
| `POST /api/groups/route.ts` | Genera código único + crea grupo |
| `POST /api/groups/join/route.ts` | Registra user a grupo |
| `GET /api/groups/info/[code]` | Obtiene datos del grupo por código |
| `POST /api/auth/register` | Crea nueva cuenta |
| `src/lib/auth.ts` | Configuración NextAuth + providers |

---

## 10. Problemas identificados

| Problema | Impacto | Severidad |
|----------|---------|-----------|
| Sin parámetro `returnTo` en login/registro | User se pierde después del login | ALTA |
| `callbackUrl` hardcodeado a `/dashboard` | Google OAuth no va a `/join/[code]` | MEDIA |
| No hay memoria de intención | Si pierde conexión, pierde context | MEDIA |
| handleJoin() solo en `/join/[code]` | User registrado en `/login` NO se une | ALTA |

---

## 11. Recomendaciones

### Implementar Query Parameter "returnTo" (RECOMENDADO)

**Cambios necesarios:**

1. **En `JoinGroupPage` (`/join/[code]`):**
```typescript
// Cuando user clica "Iniciar Sesión"
const encodedReturnTo = encodeURIComponent(`/join/${code}`)
href={`/login?returnTo=${encodedReturnTo}`}

// O: "Crear Cuenta"
href={`/register?returnTo=${encodedReturnTo}`}
```

2. **En `/login` y `/register`:**
```typescript
const { returnTo } = useSearchParams()
// Después de login exitoso:
router.push(returnTo || '/dashboard')
```

3. **En Google OAuth:**
```typescript
signIn('google', { 
  callbackUrl: returnTo || '/dashboard'
})
```

**Ventajas:**
- ✓ Simple de implementar
- ✓ No requiere state global
- ✓ Estándar web
- ✓ Funciona en todos los flows (email + Google)

**Tiempo estimado:** 30-4
