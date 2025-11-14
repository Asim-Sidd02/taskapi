# Task API

## Setup
1. Copy project.
2. `cp .env.example .env` and edit `.env` (set MONGO_URI and secrets).
3. `npm install`
4. Start dev: `npm run dev` (nodemon) or `npm start`.

Default port: `4000`.

## API endpoints

### Register
POST `/auth/register`
Body JSON:
{
  "email": "you@example.com",
  "password": "password123"
}

### Login
POST `/auth/login`
Body JSON:
{
  "email": "you@example.com",
  "password": "password123"
}
Response:
{
  "accessToken": "...",
  "refreshToken": "..."
}

### Refresh
POST `/auth/refresh`
Body JSON:
{ "refreshToken": "<refreshToken>" }

### Logout
POST `/auth/logout`
Body JSON:
{ "refreshToken": "<refreshToken>" }

### Tasks (protected)
Add Header: `Authorization: Bearer <accessToken>`

GET `/tasks` - list
POST `/tasks` - create { title, description }
PUT `/tasks/:id` - update fields { title?, description?, done? }
DELETE `/tasks/:id`

## Notes
- On Android emulator, access backend at `http://10.0.2.2:4000`.
- For production, set secure, long random secrets in `.env`.
