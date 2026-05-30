# MindWell DRM - Encrypted Video Streaming Platform

Secure Video-on-Demand (VoD) platform with **HLS + AES-128 encryption**. Videos are encrypted at rest, decryption keys served only to authorized users. Auto-encrypt on upload — drop a video and get a playable DRM-protected stream instantly.

## Architecture

```
User App → Nginx (drm.thirdvizion.com) → Flask API → SQLite/PostgreSQL
                                              ↓
                                         FFmpeg → HLS segments + AES key
                                              ↓
                                    static/hls/{lesson_id}/
                                       ├── playlist.m3u8
                                       ├── video.key (16-byte AES)
                                       ├── playlist0.ts (encrypted)
                                       └── playlist1.ts
```

**DRM Flow:**

1. Admin uploads MP4 → Flask saves to `videos/` → FFmpeg segments & encrypts with random AES-128 key
2. User logs in → gets JWT → calls `/api/video/{id}/play` → gets `manifest_url`
3. Player fetches `.m3u8` (JWT-protected) → manifest references AES key at `/api/video/{id}/key`
4. Player fetches key (JWT + enrollment check) → decrypts `.ts` segments → plays

## Quick Start (Docker)

### Prerequisites
- Docker & Docker Compose
- Domain `drm.thirdvizion.com` pointing to your VPS (for production)

### 1. Deploy

```bash
git clone <your-repo> /var/www/mindwell
cd /var/www/mindwell

cp .env.example .env
# Edit .env with your secrets

docker compose up -d
```

### 2. Enable HTTPS (first time)

```bash
docker compose run --rm certbot certonly --webroot \
  -w /var/www/certbot -d drm.thirdvizion.com

docker compose restart nginx
```

### 3. Upload a Video

```bash
# Login as admin
TOKEN=$(curl -s https://drm.thirdvizion.com/api/auth/login \
  -X POST -H "Content-Type: application/json" \
  -d '{"email":"admin@mindwell.com","password":"admin123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

# List lessons (find ID for target lesson)
curl -s https://drm.thirdvizion.com/api/admin/lessons \
  -H "Authorization: Bearer $TOKEN"

# Upload & auto-encrypt in one call
curl -X POST https://drm.thirdvizion.com/api/admin/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "lesson_id=1" \
  -F "video=@/path/to/video.mp4"

# Response:
# {
#   "message": "Video uploaded and encrypted successfully",
#   "play_url": "https://drm.thirdvizion.com/api/video/1/play",
#   "hls_path": "static/hls/1/playlist.m3u8"
# }
```

### 4. Play from your App

```javascript
// Web (hls.js)
const resp = await fetch(`https://drm.thirdvizion.com/api/video/1/play`, {
  headers: { Authorization: `Bearer ${userToken}` }
});
const { manifest_url } = await resp.json();

const video = document.getElementById('player');
if (Hls.isSupported()) {
  const hls = new Hls();
  hls.loadSource(manifest_url);
  hls.attachMedia(video);
}
```

```javascript
// React Native
import Video from 'react-native-video';

<Video
  source={{
    uri: `https://drm.thirdvizion.com/api/video/1/manifest`,
    headers: { Authorization: `Bearer ${userToken}` }
  }}
  controls={true}
  resizeMode="contain"
  style={{ width: '100%', height: 300 }}
/>
```

## Manual Setup (without Docker)

### Prerequisites
- Python 3.8+, FFmpeg, SQLite

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Initialize DB & seed
python app.py
python seed_data.py

# Run
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## API Reference

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/login` | - | Login, returns JWT |
| `POST` | `/api/auth/register` | - | Register new user |
| `GET` | `/api/auth/me` | JWT | Get current user |

### Courses

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/courses` | - | List published courses |
| `GET` | `/api/courses/:id` | - | Course with modules/lessons |
| `POST` | `/api/courses/:id/enroll` | JWT | Enroll in course |
| `GET` | `/api/courses/:id/lessons` | JWT | List lessons (must be enrolled) |

### Video / DRM (all require JWT + enrollment)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/video/:id/play` | Returns manifest URL + lesson metadata |
| `GET` | `/api/video/:id/manifest` | HLS `.m3u8` playlist |
| `GET` | `/api/video/:id/key` | AES-128 decryption key |
| `GET` | `/api/video/:id/:filename` | Encrypted `.ts` segments |

### Admin

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/admin/lessons` | Admin | List all lessons with video status |
| `POST` | `/api/admin/upload` | Admin | Upload + auto-encrypt video |

## Default Users

| Email | Password | Role |
|-------|----------|------|
| `admin@mindwell.com` | `admin123` | Admin |
| `sarah.therapist@mindwell.com` | `instructor123` | Instructor |

## Seeded Courses & Lesson IDs

| Course | Module | Lesson | ID |
|--------|--------|--------|----|
| Stress Management 101 | Understanding Stress | What is Stress? | 1 |
| | | Recognizing Stress Symptoms | 2 |
| | Practical Stress Relief | Deep Breathing Exercises | 3 |
| | | Progressive Muscle Relaxation | 4 |
| Mindfulness Fundamentals | Intro to Mindfulness | What is Mindfulness? | 5 |
| | | The Science Behind Mindfulness | 6 |
| | Basic Practices | Mindful Breathing | 7 |
| | | Body Scan Meditation | 8 |
| Anxiety Coping Strategies | Understanding Anxiety | What is Anxiety? | 9 |
| | | The Anxiety Loop | 10 |
| | Coping Techniques | Cognitive Restructuring | 11 |
| | | Grounding Techniques | 12 |
| Building Resilience | Foundations | What is Resilience? | 13 |
| | | The Resilience Factors | 14 |
| | Toolkit | Developing Growth Mindset | 15 |
| | | Building Support Networks | 16 |
| Sleep and Mental Health | Sleep-Mental Health | Why Sleep Matters | 17 |
| | | Understanding Sleep Cycles | 18 |
| | Improving Sleep | Sleep Hygiene Fundamentals | 19 |
| | | Relaxation for Sleep | 20 |

## Nginx Config (`nginx/nginx.conf`)

The Nginx config for `drm.thirdvizion.com` includes:
- **HTTP → HTTPS redirect** on port 80
- **SSL termination** on port 443 with TLS 1.2/1.3
- **Security headers** (HSTS, X-Frame-Options, etc.)
- **Client max body size** set to 500MB for video uploads
- **Static file serving** for CSS/JS with long cache
- **API proxy** to Flask app for DRM/auth endpoints
- **Certbot** integration for Let's Encrypt auto-renewal

After deploying, run:
```bash
docker compose run --rm certbot certonly --webroot \
  -w /var/www/certbot -d drm.thirdvizion.com
```

## File Structure

```
├── app.py              # Flask app & all API routes
├── config.py           # Configuration (secrets, paths, URLs)
├── models.py           # SQLAlchemy models
├── drm.py              # Fernet encryption utilities
├── hls_drm.py          # HLS + AES-128 via FFmpeg
├── seed_data.py        # 5 mental health courses
├── templates/          # HTML templates (Flask backend UI)
├── static/
│   ├── css/style.css
│   ├── js/app.js, video-player.js
│   └── hls/            # Encrypted HLS output
├── videos/             # Uploaded source videos
├── instance/           # SQLite database
├── nginx/
│   ├── nginx.conf      # Production config (drm.thirdvizion.com)
│   └── dev.conf        # Local dev config
├── Dockerfile
├── docker-compose.yml
├── entrypoint.sh
└── requirements.txt
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SECRET_KEY` | (hardcoded default) | Flask secret key |
| `JWT_SECRET_KEY` | (hardcoded default) | JWT signing key |
| `DOMAIN_URL` | `http://localhost:5000` | Public domain (used in HLS manifest for key URL) |
| `DATABASE_URL` | SQLite (`instance/mindwell.db`) | Database connection string |

**Always change `SECRET_KEY` and `JWT_SECRET_KEY` in production.**
