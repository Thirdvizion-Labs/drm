# MindWell LMS - Mental Health Learning Platform with Server-Side DRM

## 1. Project Overview

**Project Name:** MindWell LMS  
**Type:** Full-stack web application with server-side DRM protection  
**Core Functionality:** A secure learning management system for mental health education with encrypted video streaming and content protection  
**Target Users:** Mental health learners, students, and organizations providing wellness education

## 2. Technical Architecture

### Backend Stack
- **Framework:** Python Flask
- **Database:** SQLite with SQLAlchemy ORM
- **Authentication:** JWT tokens with bcrypt password hashing
- **DRM:** Fernet symmetric encryption for video content
- **API:** RESTful JSON API

### Frontend Stack
- **Framework:** Vanilla HTML/CSS/JavaScript
- **Video Player:** Custom encrypted stream player
- **Responsive:** Mobile-first design

## 3. Features

### Authentication & User Management
- User registration with email verification token
- User login with JWT access/refresh tokens
- Role-based access (admin, instructor, learner)
- Secure password hashing

### Course Management
- Course CRUD operations (admin/instructor)
- Module/Lesson hierarchy
- Progress tracking per user
- Course enrollment system

### Server-Side DRM Implementation
- Video files encrypted at rest using Fernet (AES-128)
- Decryption key exchange only with authenticated users
- Streaming server decrypts on-the-fly (never stores decrypted files)
- License validation per video request
- Watermarking user ID in stream response headers
- Token expiration for video access (short-lived URLs)

### Mental Health Course Content
Pre-loaded courses:
1. **Stress Management 101** - Understanding and managing stress
2. **Mindfulness Fundamentals** - Basic mindfulness practices
3. **Anxiety Coping Strategies** - Practical techniques for anxiety relief
4. **Building Resilience** - Developing mental strength
5. **Sleep and Mental Health** - Improving sleep hygiene

### User Dashboard
- Enrolled courses overview
- Progress tracking
- Continue learning feature
- Certificates of completion

## 4. Database Schema

### Users Table
- id, email, password_hash, name, role, created_at, is_active

### Courses Table
- id, title, description, instructor_id, thumbnail_url, is_published, created_at

### Modules Table
- id, course_id, title, order_index

### Lessons Table
- id, module_id, title, video_path, content_text, duration_minutes, order_index

### Enrollments Table
- id, user_id, course_id, enrolled_at, progress_percentage, completed_at

### LessonProgress Table
- id, user_id, lesson_id, watched_seconds, is_completed, last_watched_at

## 5. API Endpoints

### Auth
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/refresh
- GET /api/auth/me

### Courses
- GET /api/courses
- GET /api/courses/:id
- POST /api/courses (admin)
- PUT /api/courses/:id (admin)
- POST /api/courses/:id/enroll

### Video DRM
- GET /api/video/:lesson_id/stream (returns encrypted stream URL with token)
- GET /api/video/:lesson_id/key (validates license, returns decryption key)

### Progress
- POST /api/progress/:lesson_id
- GET /api/progress/course/:course_id

### Admin
- GET /api/admin/users
- POST /api/admin/courses
- PUT /api/admin/courses/:id/publish

## 6. Security Measures

1. **Encryption at Rest:** All video files encrypted with Fernet
2. **Key Distribution:** Decryption keys only via authenticated API
3. **Short-lived Tokens:** Video access tokens expire in 1 hour
4. **Rate Limiting:** Prevent brute-force attacks
5. **CORS Protection:** Configured allowed origins
6. **Input Validation:** All inputs sanitized
7. **Password Hashing:** Bcrypt with salt rounds

## 7. UI/UX Design

### Color Palette
- Primary: #6366F1 (Indigo - calming, trustworthy)
- Secondary: #10B981 (Emerald - growth, healing)
- Accent: #F59E0B (Amber - warmth, optimism)
- Background: #F8FAFC (Light slate)
- Text: #1E293B (Slate 800)
- Error: #EF4444 (Red)
- Success: #22C55E (Green)

### Typography
- Headings: Inter, sans-serif
- Body: Inter, sans-serif

### Layout
- Clean, calming interface
- Card-based course display
- Progress indicators
- Video player with custom controls

## 8. File Structure

```
/home/dog/project/learning/drm
├── app.py                 # Main Flask application
├── config.py              # Configuration settings
├── models.py              # Database models
├── drm.py                 # DRM encryption/decryption
├── seed_data.py           # Seed mental health courses
├── requirements.txt       # Python dependencies
├── encrypted_videos/      # Encrypted video storage
├── templates/             # HTML templates
│   ├── base.html
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── dashboard.html
│   ├── course.html
│   ├── lesson.html
│   └── admin.html
├── static/
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── app.js
│       └── video-player.js
├── instance/
│   └── mindwell.db        # SQLite database
└── SPEC.md
```

## 9. Acceptance Criteria

1. Users can register, login, and logout
2. Authenticated users can browse and enroll in courses
3. Video content is encrypted and only playable by enrolled users
4. Progress is tracked and persisted
5. Admin can manage courses and view user statistics
6. All API endpoints return proper JSON responses
7. Video streaming works with custom player
8. No decrypted video files are stored on disk
9. Application runs without errors
10. Responsive design works on mobile devices
