# RapBattle Voter 🎤

Sistema de votación en tiempo real para batallas de rap. Permite a los organizadores crear eventos, gestionar batallas y recibir votos en vivo de la audiencia.

## 🏗️ Arquitectura

### Monorepo con Turborepo
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: FastAPI + Python + SQLAlchemy + Alembic
- **Base de Datos**: PostgreSQL
- **Cache/Real-time**: Redis (pub/sub + contadores)
- **Containerización**: Docker + Docker Compose

### Estructura del Proyecto
```
RapBattleVoter/
├── apps/
│   ├── api/          # FastAPI backend
│   └── web/          # Next.js frontend
├── packages/
│   ├── core/         # Tipos compartidos + API client
│   └── ui/           # Componentes React reutilizables
├── infra/
│   ├── db/           # Migraciones Alembic
│   └── scripts/      # Scripts utilitarios
└── scripts/          # Scripts Docker
```

## 🚀 Cómo Ejecutar Localmente

### Opción 1: Todo en Docker (Recomendado)

```bash
# Clonar el repositorio
git clone <tu-repo>
cd RapBattleVoter

# Arrancar todo con Docker
./scripts/docker-prod.sh
```

**URLs disponibles:**
- 🌐 **Web App**: http://localhost:3000
- ⚙️ **Admin Panel**: http://localhost:3000/admin
- 🚀 **API**: http://localhost:8000
- 📚 **API Docs**: http://localhost:8000/docs

### Opción 2: Desarrollo Híbrido

```bash
# Solo servicios Docker (DB + API)
./scripts/docker-dev.sh

# En otra terminal, arrancar solo el frontend
pnpm --filter @rapbattles/web dev
```

### Opción 3: Desarrollo Completo

```bash
# Instalar dependencias
pnpm install

# Arrancar todo con Turborepo
pnpm dev
```

## 🎯 Funcionalidades

### Para Organizadores (Admin Panel)
1. **Crear Eventos**: Generar tokens únicos para eventos
2. **Gestionar Batallas**: Crear "MC A vs MC B"
3. **Control de Votación**: Abrir/cerrar votaciones por batalla
4. **QR Codes**: Generar códigos QR para cada batalla
5. **Monitoreo**: Ver resultados en tiempo real

### Para Votantes
1. **Escanear QR**: Acceder a la batalla específica
2. **Votar**: Elegir entre MC A o MC B
3. **Ver Resultados**: Contadores en tiempo real
4. **Una Votación**: Por dispositivo por batalla

### Para Presentadores
1. **Pantalla en Vivo**: Mostrar resultados en tiempo real
2. **Updates Automáticos**: Sin necesidad de refrescar
3. **Diseño Optimizado**: Para proyectar en pantallas grandes

## 🔧 Configuración

### Variables de Entorno
```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Variables principales:
SIGNING_SECRET=tu-secreto-para-tokens
ADMIN_KEY=tu-clave-admin-segura
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/rapbattles
REDIS_URL=redis://localhost:6379/0
```

### Base de Datos
```bash
# Las migraciones se ejecutan automáticamente al arrancar
# Pero puedes ejecutarlas manualmente:
docker compose exec api alembic upgrade head
```

## 🛠️ Comandos Útiles

### Docker
```bash
# Ver logs
docker compose logs -f api
docker compose logs -f web

# Reiniciar servicios
docker compose restart api
docker compose restart web

# Parar todo
docker compose down

# Limpiar volúmenes (⚠️ borra datos)
docker compose down -v
```

### Desarrollo
```bash
# Linting
pnpm lint

# Type checking
pnpm typecheck

# Build
pnpm build
```

## 📱 Uso del Sistema

### 1. Crear un Evento
1. Ir a http://localhost:3000/admin
2. Crear nuevo evento
3. Copiar el token generado

### 2. Crear una Batalla
1. En el admin panel, crear batalla "MC A vs MC B"
2. Configurar fechas de inicio/fin
3. Generar QR code

### 3. Votación
1. Los votantes escanean el QR
2. Votan por A o B
3. Ven resultados en tiempo real

### 4. Presentación
1. Abrir http://localhost:3000/presenter/[battle-id]
2. Mostrar en pantalla grande
3. Los resultados se actualizan automáticamente

## 🔒 Seguridad

- **Tokens HMAC**: Para autenticar eventos
- **Una Votación**: Por dispositivo por batalla
- **Rate Limiting**: Por IP para prevenir spam
- **Admin Key**: Protege el panel administrativo
- **Validación**: Server-side de todos los votos

## 🚀 Despliegue

### Producción con Docker
```bash
# Build y deploy
docker compose -f docker-compose.prod.yml up -d

# O usar el script
./scripts/docker-prod.sh
```

### Variables de Producción
```bash
# Cambiar en producción:
SIGNING_SECRET=secreto-muy-seguro-produccion
ADMIN_KEY=clave-admin-muy-segura-produccion
DATABASE_URL=postgresql://user:pass@db-host:5432/rapbattles
REDIS_URL=redis://redis-host:6379/0
```

## 📊 Monitoreo

### Health Checks
- API: `GET /healthz`
- Web: Verificar respuesta en puerto 3000

### Logs
```bash
# Ver todos los logs
docker compose logs -f

# Logs específicos
docker compose logs -f api
docker compose logs -f web
docker compose logs -f postgres
```

## 🐛 Troubleshooting

### Puerto 3000 ocupado
```bash
# Encontrar proceso
lsof -i :3000

# Matar proceso
kill -9 <PID>
```

### API no responde
```bash
# Verificar contenedor
docker compose ps

# Reiniciar API
docker compose restart api

# Ver logs
docker compose logs api
```

### Base de datos
```bash
# Conectar a PostgreSQL
docker compose exec postgres psql -U postgres -d rapbattles

# Ver tablas
\dt

# Resetear base de datos
docker compose down -v
docker compose up -d
```

## 📝 Notas de Desarrollo

- **Hot Reload**: Funciona en modo desarrollo
- **TypeScript**: Tipos compartidos entre frontend y backend
- **ESLint/Prettier**: Configurados para mantener código limpio
- **Git Hooks**: Pre-commit hooks para validación

## 🤝 Contribución

1. Fork el proyecto
2. Crear feature branch
3. Commit cambios
4. Push a tu fork
5. Crear Pull Request

## 📄 Licencia

MIT License - ver LICENSE file para detalles.