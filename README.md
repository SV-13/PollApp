# PollRoom — Real-Time Poll Rooms

A web app where you can create a poll, share it via link, and collect votes with results updating in real time for all viewers.

**Live URL:** _coming soon_

## Tech Stack

- **Frontend:** React, Vite, TypeScript, Tailwind CSS
- **Backend:** Node.js, Express, Socket.IO
- **Database:** PostgreSQL (Neon)
- **Deployment:** Vercel (frontend), Render (backend)

## How It Works

1. User creates a poll with a question and 2–10 options
2. App generates a shareable link (`/poll/:id`)
3. Anyone with the link can view the poll and vote
4. When someone votes, all viewers see results update instantly via WebSockets
5. Polls and votes are persisted in PostgreSQL — refreshing the page doesn't lose anything

## Fairness / Anti-Abuse Mechanisms

### 1. Browser Fingerprinting (client-side hash + DB constraint)

When a user votes, the app generates a SHA-256 hash from their browser properties — user agent, screen size, GPU renderer, timezone, language, CPU cores, etc. This hash is sent as `voter_hash` with the vote request.

The database has a `UNIQUE(poll_id, voter_hash)` constraint, so the same browser can only vote once per poll. Unlike a simple localStorage flag, this can't be bypassed by clearing browser data — the fingerprint stays the same.

**What it prevents:** Same browser voting multiple times on the same poll.

**Limitations:** Different browsers on the same machine produce different fingerprints, so someone could technically vote twice by switching browsers. Incognito mode might also change the fingerprint slightly in some browsers.

### 2. IP-Based Rate Limiting

The `/vote` endpoint is rate-limited to 10 requests per 15-minute window per IP address using `express-rate-limit`. Even if someone tries to bypass fingerprinting (e.g. using multiple browsers or tools), they can't spam hundreds of votes from the same network.

**What it prevents:** Automated/scripted vote flooding from a single IP.

**Limitations:** Users on the same network (e.g. office WiFi, college) share an IP and share the rate limit. An attacker with rotating proxies could get around this.

## Edge Cases Handled

- **Duplicate votes:** Caught at the database level (unique constraint) — returns a 409 error instead of crashing
- **Empty/whitespace options:** Trimmed and validated on both client and server
- **Duplicate options:** Client checks for identical options before submitting
- **Max option limit:** Capped at 10 options to keep polls reasonable
- **Poll not found:** Shows a proper error page instead of crashing
- **Page refresh after voting:** Vote state persists (localStorage + DB), results load from DB
- **Race conditions on poll creation:** Uses a database transaction (BEGIN/COMMIT/ROLLBACK)
- **Direct link navigation:** Vercel rewrite rule ensures `/poll/:id` works without 404

## Known Limitations / What I'd Improve Next

- **No poll expiry** — polls live forever, no way to close or delete them
- **No authentication** — anyone with the link can vote, no user accounts
- **Fingerprinting isn't bulletproof** — different browser = different fingerprint, so a determined user can vote twice
- **Rate limit is per-IP** — shared networks (NAT) can hit the limit for legitimate users
- **No input sanitization for XSS** — React handles this by default but there's no server-side sanitization
- **No pagination** — if a poll somehow got thousands of options it could be slow
- **Could add a toast/notification system** instead of using `alert()` for errors

## Running Locally

### Prerequisites
- Node.js (v20+)
- PostgreSQL database (or a Neon account)

### Setup

```bash
# clone the repo
git clone https://github.com/YOUR_USERNAME/PollApp.git
cd PollApp

# server
cd server
npm install
cp .env.example .env   # fill in your DATABASE_URL
npm run dev

# client (new terminal)
cd client
npm install
npm run dev
```

### Database Setup

Run `server/schema.sql` in your PostgreSQL/Neon SQL editor to create the tables.

## Project Structure

```
PollApp/
├── client/                 # React frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── CreatePoll.tsx
│   │   │   └── PollRoom.tsx
│   │   ├── api.ts          # REST API calls
│   │   ├── socket.ts       # Socket.IO client
│   │   ├── fingerprint.ts  # browser fingerprint generator
│   │   ├── App.tsx          # routing
│   │   └── main.tsx
│   └── vercel.json         # SPA rewrite for Vercel
│
├── server/                 # Express backend
│   ├── src/
│   │   ├── routes/
│   │   │   ├── polls.ts    # create + get polls
│   │   │   └── vote.ts     # vote + rate limiting
│   │   ├── db.ts           # postgres pool
│   │   ├── socket.ts       # socket.io setup
│   │   └── index.ts        # entry point
│   ├── schema.sql          # DB schema
│   └── .env.example
```
