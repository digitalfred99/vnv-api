# VnV API — Vibe & View Community Event Platform

> **Express · TypeScript · TypeORM · PostgreSQL**

---

## Stack

| Layer        | Technology           |
|--------------|----------------------|
| Runtime      | Node.js 18+          |
| Framework    | Express 4            |
| Language     | TypeScript 5         |
| ORM          | TypeORM 0.3          |
| Database     | PostgreSQL 14+       |
| Auth         | JWT (code-based)     |
| Validation   | Zod                  |
| Logging      | Winston              |

---

## Project Structure

```
src/
├── config/
│   ├── data-source.ts      # TypeORM DataSource
│   └── seed.ts             # Database seed script
├── entities/
│   ├── enums.ts
│   ├── TicketCategory.ts
│   ├── AccessCode.ts       ← System heart
│   ├── Participant.ts
│   ├── Seat.ts
│   ├── SeatAssignment.ts
│   ├── CheckIn.ts
│   └── Admin.ts
├── middleware/
│   ├── participantAuth.ts
│   ├── adminAuth.ts
│   └── errorHandler.ts
├── modules/
│   ├── category/
│   ├── access-code/
│   ├── participant/
│   ├── seating/
│   ├── checkin/
│   └── admin/
├── types/index.ts
├── utils/
│   ├── response.ts
│   ├── jwt.ts
│   └── logger.ts
├── app.ts
└── server.ts
```

---

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your PostgreSQL credentials and secrets
```

### 3. Create the database
```sql
CREATE DATABASE vnv_db;
```

### 4. Run migrations
```bash
npm run migration:run
```

### 5. Seed initial data
```bash
npm run seed
```
Seed creates: 4 categories · 140 seats · 140 access codes · 1 super admin

### 6. Start development server
```bash
npm run dev
```

---

## Domain Model

```
TicketCategory
      │
      ▼
 AccessCode ← SYSTEM HEART (login + ticket + identity)
      │
      ▼
 Participant
      │
      ▼
SeatAssignment
      │
      ▼
    Seat
      │
      ▼
  CheckIn
```

---

## API Reference

### Health
```
GET /health
```

---

### Categories
```
GET  /api/categories              # Public — list active categories
GET  /api/categories/summary      # Admin — seat/registration stats
GET  /api/categories/:id
POST /api/categories              # Admin (ADMIN+)
PATCH /api/categories/:id         # Admin (ADMIN+)
```

---

### Access Codes
```
POST  /api/access-codes/validate          # Public — validate code before registration
GET   /api/access-codes                   # Admin — list all codes
POST  /api/access-codes/generate          # Admin (ADMIN+) — batch generate
PATCH /api/access-codes/:code/sell        # Admin — mark as sold
```

**Validate response:**
```json
{
  "success": true,
  "message": "Code is valid. Proceed with registration.",
  "data": {
    "code": "VNV-SR-0012",
    "category": { "id": "...", "name": "Searching", "zoneLabel": "Searching Zone" }
  }
}
```

---

### Participants
```
POST /api/participants/register        # Public — register with access code
POST /api/participants/login           # Public — code-based login
GET  /api/participants/me              # Participant auth — get own profile
GET  /api/participants                 # Admin — list all participants
```

**Register body:**
```json
{
  "code": "VNV-SR-0012",
  "fullName": "Kwame Mensah",
  "phoneNumber": "0241234567",
  "gender": "MALE",
  "ageRange": "25-30",
  "communityArea": "Odoben Central",
  "relationshipStatus": "SINGLE",
  "personalityType": "AMBIVERT",
  "interests": ["movies", "music", "sports"]
}
```

**Login body:**
```json
{ "code": "VNV-SR-0012" }
```

**Login response:**
```json
{
  "success": true,
  "data": {
    "token": "<jwt>",
    "participant": {
      "fullName": "Kwame Mensah",
      "seatAssignment": { "seat": { "seatNumber": "SR-C04" } }
    }
  }
}
```

---

### Seating
```
GET   /api/seats                         # Admin — full seat map
GET   /api/seats?categoryId=<id>         # Admin — filter by zone
POST  /api/seats/reassign                # Admin (ADMIN+) — reassign seat
PATCH /api/seats/:seatId/reserve         # Admin (ADMIN+) — toggle reserve
```

---

### Check-In
```
POST /api/checkin            # Admin/Staff — check in by code
GET  /api/checkin/stats      # Admin — attendance stats
GET  /api/checkin            # Admin — full check-in list
```

**Check-in body:**
```json
{ "code": "VNV-SR-0012" }
```

---

### Admin
```
POST  /api/admin/login         # Public — email + password
GET   /api/admin/me            # Admin auth — self profile
POST  /api/admin               # SUPER_ADMIN — create admin
GET   /api/admin               # SUPER_ADMIN — list all admins
PATCH /api/admin/:id/toggle    # SUPER_ADMIN — activate/deactivate
```

---

## Authentication

**Participant (code-based):**
```
Authorization: Bearer <participant_jwt>
```
No email. No password. The access code IS the identity.

**Admin (email + password):**
```
Authorization: Bearer <admin_jwt>
```

---

## Admin Roles

| Role         | Can Do                                              |
|--------------|-----------------------------------------------------|
| SUPER_ADMIN  | Everything — create admins, manage categories       |
| ADMIN        | Generate codes, reassign seats, manage registrations |
| STAFF        | View data, mark codes sold, perform check-ins       |

---

## Seeding Defaults

| Category    | Slug | Price | Rows     | Seats |
|-------------|------|-------|----------|-------|
| Partners    | PT   | 50    | A, B     | 30    |
| Searching   | SR   | 40    | C, D     | 40    |
| Social      | SC   | 35    | E, F, G  | 51    |
| Solo Chill  | SL   | 30    | H        | 20    |

Default admin: `admin@vnv.event` / `VnV@Admin2024!`
*(Change this immediately after first login)*
