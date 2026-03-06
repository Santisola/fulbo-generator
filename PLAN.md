# Plan de Implementación: Fulbo Teams Generator

## 1. Overview del Proyecto

Sistema web para generar equipos de fútbol 5 amateur de manera equilibrada, usando puntajes promedio ocultos de jugadores cargados por miembros de un grupo.

## 2. Stack Tecnológico

- **Frontend + Backend**: Next.js 14 (App Router)
- **Base de Datos**: PostgreSQL con Prisma ORM
- **Autenticación**: NextAuth.js (credentials + OAuth opcional)
- **Estilos**: Tailwind CSS
- **Estado**: React Query para data fetching

## 3. Modelo de Datos (Prisma Schema)

### Entidades Principales

```
User
├── id, email, password (hash), name
├── createdAt
└── groups: GroupMember[]

Group
├── id, name, code (invitation code único)
├── createdBy: User
├── createdAt
├── members: GroupMember[]
├── players: Player[]
└── teamHistory: TeamHistory[]

GroupMember
├── id, userId, groupId
├── role: 'ADMIN' | 'MEMBER'
└── joinedAt

Player
├── id, name, groupId
├── ratings: Rating[]
└── averageRating: Float (calculado, oculto)

Rating
├── id, playerId, userId
├── score: Int (1-10)
└── createdAt

TeamHistory
├── id, groupId
├── teamA: String (JSON - ids de jugadores)
├── teamB: String (JSON - ids de jugadores)
├── averageDiff: Float
└── generatedAt
```

## 4. Funcionalidades por Módulo

### 4.1 Autenticación
- Registro de usuarios (email + password)
- Login con credenciales
- (Opcional) OAuth con Google
- Sesión persistente con JWT

### 4.2 Gestión de Grupos
- Crear grupo (genera código único de 6 caracteres)
- Unirse a grupo por código
- Ver miembros del grupo
- Solo admins pueden eliminar miembros o el grupo

### 4.3 Gestión de Jugadores
- Agregar jugador al grupo (nombre)
- Editar nombre de jugador
- Eliminar jugador
- Ver lista de jugadores (SIN puntajes visibles)

### 4.4 Sistema de Puntuación
- Cada miembro puede puntuar cualquier jugador del grupo (1-10)
- Un usuario solo puede tener UN puntaje por jugador
- El puntaje individual es OCULTO para otros usuarios
- El promedio se calcula automáticamente
- El promedio es OCULTO hasta generar equipos

### 4.5 Generación de Equipos
- Seleccionar jugadores disponibles
- Algoritmo de equilibrado por promedios
- Verificar que no repita equipos anteriores (últimos 20)
- Guardar en historial

### 4.6 Historial de Equipos
- Ver últimos 20 equipos generados
- Mostrar fecha de generación

## 5. Fases de Implementación

### Fase 1: Setup y Autenticación
- Inicializar proyecto Next.js
- Configurar Prisma + PostgreSQL
- Implementar autenticación

### Fase 2: Gestión de Grupos
- CRUD de grupos
- Sistema de códigos de invitación

### Fase 3: Jugadores y Puntuaciones
- CRUD de jugadores
- Sistema de puntuación oculto

### Fase 4: Generación de Equipos
- Algoritmo de equilibrado
- Verificación de historial

### Fase 5: Polish y Deploy

---

*Plan creado: 2026-03-05*
