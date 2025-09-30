# ITWebs Server

## Quick Start

```bash
# 1. Start infrastructure
docker-compose up -d
```

```bash
# 2. Install dependencies
bun install

# 3. Setup environment
cp .env.example .development.env
```

```bash
# 4. Run migrations (wait 10-15s for MySQL)
bun run migrate
```

```bash
# 5. Start API
bun run dev
```

**API:** http://localhost:7000  
**NOTIFICATION_SERVICE:** http://localhost:3001  
**RabbitMQ UI:** http://localhost:15672 (admin/admin123)

## Architecture

**Services:**
- **Main API** (port 7000) - `bun run dev` with hot reload
- **Notification Service** - Docker microservice (email sending via RabbitMQ)
- **MySQL** (port 3307), **Redis** (port 6379), **RabbitMQ** (port 5672) - Docker

## Commands

### Development
```bash
bun run dev          # Start API
bun run debug        # Start with debugging
```

### Database
```bash
bun run migrate              # Run migrations
bun run migrate:undo         # Undo last migration
bun run migrate:status       # Check migration status
```

### Docker
```bash
docker-compose up -d         # Start services
docker-compose down          # Stop services
docker-compose logs notification-service -f  # View notification logs
docker-compose down -v       # Reset all data (warning: deletes DB)
docker-compose up -d --build # Rebuild services
```

## API Routes

### Auth (`/api/v1/auth`)
- `POST /register` - Register user
- `POST /login` - Login
- `POST /google` - Google OAuth
- `POST /refresh` - Refresh token
- `POST /logout` - Logout
- `POST /forgot-password` - Request password reset
- `POST /reset-password` - Reset with code
- `PATCH /update-email` - Update email
- `PATCH /update-password` - Update password

### Files (`/api/v1/files`)
- `POST /upload` - Upload file (auth required)
- `GET /` - Get user files (auth required)
- `DELETE /:fileId` - Delete file (auth required)
- `GET /:userId/:fileId` - Download file

### Users (`/api/v1/users`)
- `GET /` - Get profile (auth required)
- `PATCH /update-username` - Update username (auth required)

## Environment Variables

Key settings in `.development.env`:
- `PORT=7000` - API port
- `MYSQL_PORT=3307` - MySQL port
- `REDIS_PORT=6379` - Redis port
- `RABBIT_URI_DEV=amqp://admin:admin123@localhost:5672` - RabbitMQ

## Tech Stack

- **Runtime:** Bun
- **Framework:** NestJS
- **Database:** MySQL + Sequelize
- **Cache:** Redis
- **Queue:** RabbitMQ
- **Auth:** JWT + Google OAuth 2.0
- **Files:** Sharp (image processing, HEIC conversion)

## Troubleshooting

**Database connection error:**
```bash
# Wait 10-15s for MySQL initialization
docker-compose logs db
bun run migrate
```

**Notification service not working:**
```bash
docker-compose logs notification-service
docker-compose restart notification-service
```

**Reset everything:**
```bash
docker-compose down -v
docker-compose up -d
bun run migrate
```
