import os
from flask import Flask, request, jsonify, send_from_directory, send_file, render_template
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity, create_access_token, verify_jwt_in_request
from config import Config
from models import db, User, Course, Module, Lesson, Enrollment, LessonProgress
from hls_drm import hls_manager
from functools import wraps

app = Flask(__name__)
app.config.from_object(Config)

CORS(app, resources={r"/api/*": {"origins": "*"}})
jwt = JWTManager(app)
db.init_app(app)

os.makedirs(Config.INSTANCE_DIR, exist_ok=True)
os.makedirs(Config.HLS_OUTPUT_FOLDER, exist_ok=True)
os.makedirs(Config.VIDEOS_FOLDER, exist_ok=True)

hls_manager.domain_url = Config.DOMAIN_URL

def admin_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        user = User.query.get(get_jwt_identity())
        if not user or user.role not in ['admin', 'instructor']:
            return jsonify({'error': 'Admin access required'}), 403
        return fn(*args, **kwargs)
    return wrapper

def get_enrollment(user_id, course_id):
    return Enrollment.query.filter_by(user_id=user_id, course_id=course_id).first()

# --- PAGE ROUTES ---
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login')
def login_page():
    return render_template('login.html')

@app.route('/register')
def register_page():
    return render_template('register.html')

@app.route('/dashboard')
def dashboard_page():
    return render_template('dashboard.html')

@app.route('/course/<int:course_id>')
def course_page(course_id):
    return render_template('course.html', course_id=course_id)

@app.route('/lesson/<int:lesson_id>')
def lesson_page(lesson_id):
    return render_template('lesson.html', lesson_id=lesson_id)

@app.route('/admin')
def admin_page():
    return render_template('admin.html')

# --- AUTH API ---
@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(email=data.get('email')).first()
    if user and user.check_password(data.get('password')):
        return jsonify({
            'access_token': create_access_token(identity=str(user.id)),
            'user': user.to_dict()
        })
    return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.json
    if User.query.filter_by(email=data.get('email')).first():
        return jsonify({'error': 'Email already registered'}), 400
    user = User(email=data.get('email'), name=data.get('name'), role='learner')
    user.set_password(data.get('password'))
    db.session.add(user)
    db.session.commit()
    return jsonify({'message': 'User created', 'user': user.to_dict()}), 201

@app.route('/api/auth/me', methods=['GET'])
@jwt_required()
def get_current_user():
    user = User.query.get(get_jwt_identity())
    return jsonify(user.to_dict())

# --- COURSES API ---
@app.route('/api/courses', methods=['GET'])
def get_courses():
    courses = Course.query.filter_by(is_published=True).all()
    return jsonify([c.to_dict() for c in courses])

@app.route('/api/courses/all', methods=['GET'])
@jwt_required()
def get_all_courses():
    courses = Course.query.all()
    return jsonify([c.to_dict() for c in courses])

@app.route('/api/courses', methods=['POST'])
@admin_required
def create_course():
    data = request.json
    course = Course(
        title=data['title'],
        description=data.get('description', ''),
        instructor_id=get_jwt_identity(),
        is_published=data.get('is_published', False)
    )
    db.session.add(course)
    db.session.commit()
    return jsonify(course.to_dict(include_modules=True)), 201

@app.route('/api/courses/<int:course_id>', methods=['GET'])
def get_course(course_id):
    course = Course.query.get_or_404(course_id)
    data = course.to_dict(include_modules=True)
    try:
        verify_jwt_in_request(optional=True)
        user_id = get_jwt_identity()
        data['is_enrolled'] = bool(user_id and get_enrollment(user_id, course_id))
    except RuntimeError:
        data['is_enrolled'] = False
    return jsonify(data)

@app.route('/api/courses/<int:course_id>', methods=['PUT'])
@admin_required
def update_course(course_id):
    course = Course.query.get_or_404(course_id)
    data = request.json
    for key in ('title', 'description', 'is_published', 'thumbnail_url'):
        if key in data:
            setattr(course, key, data[key])
    db.session.commit()
    return jsonify(course.to_dict(include_modules=True))

@app.route('/api/courses/<int:course_id>', methods=['DELETE'])
@admin_required
def delete_course(course_id):
    course = Course.query.get_or_404(course_id)
    db.session.delete(course)
    db.session.commit()
    return jsonify({'message': 'Course deleted'})

@app.route('/api/courses/<int:course_id>/enroll', methods=['POST'])
@jwt_required()
def enroll_course(course_id):
    user_id = get_jwt_identity()
    if get_enrollment(user_id, course_id):
        return jsonify({'error': 'Already enrolled'}), 400
    enrollment = Enrollment(user_id=user_id, course_id=course_id)
    db.session.add(enrollment)
    db.session.commit()
    return jsonify({'message': 'Enrolled successfully'})

@app.route('/api/courses/<int:course_id>/lessons', methods=['GET'])
@jwt_required()
def get_course_lessons(course_id):
    user_id = get_jwt_identity()
    if not get_enrollment(user_id, course_id):
        return jsonify({'error': 'Not enrolled'}), 403
    course = Course.query.get_or_404(course_id)
    lessons = []
    for module in course.modules:
        for lesson in module.lessons:
            lessons.append(lesson.to_dict())
    return jsonify(lessons)

# --- MODULES API ---
@app.route('/api/courses/<int:course_id>/modules', methods=['POST'])
@admin_required
def create_module(course_id):
    data = request.json
    module = Module(
        course_id=course_id,
        title=data['title'],
        description=data.get('description', ''),
        order_index=data.get('order_index', 0)
    )
    db.session.add(module)
    db.session.commit()
    return jsonify(module.to_dict(include_lessons=True)), 201

@app.route('/api/modules/<int:module_id>', methods=['PUT'])
@admin_required
def update_module(module_id):
    module = Module.query.get_or_404(module_id)
    data = request.json
    for key in ('title', 'description', 'order_index'):
        if key in data:
            setattr(module, key, data[key])
    db.session.commit()
    return jsonify(module.to_dict(include_lessons=True))

@app.route('/api/modules/<int:module_id>', methods=['DELETE'])
@admin_required
def delete_module(module_id):
    module = Module.query.get_or_404(module_id)
    db.session.delete(module)
    db.session.commit()
    return jsonify({'message': 'Module deleted'})

# --- LESSONS API ---
@app.route('/api/modules/<int:module_id>/lessons', methods=['POST'])
@admin_required
def create_lesson(module_id):
    data = request.json
    lesson = Lesson(
        module_id=module_id,
        title=data['title'],
        content_text=data.get('content_text', ''),
        duration_minutes=data.get('duration_minutes', 0),
        order_index=data.get('order_index', 0)
    )
    db.session.add(lesson)
    db.session.commit()
    return jsonify(lesson.to_dict()), 201

@app.route('/api/lessons/<int:lesson_id>', methods=['GET'])
@jwt_required()
def get_lesson(lesson_id):
    lesson = Lesson.query.get_or_404(lesson_id)
    return jsonify(lesson.to_dict())

@app.route('/api/lessons/<int:lesson_id>', methods=['PUT'])
@admin_required
def update_lesson(lesson_id):
    lesson = Lesson.query.get_or_404(lesson_id)
    data = request.json
    for key in ('title', 'content_text', 'duration_minutes', 'order_index'):
        if key in data:
            setattr(lesson, key, data[key])
    db.session.commit()
    return jsonify(lesson.to_dict())

@app.route('/api/lessons/<int:lesson_id>', methods=['DELETE'])
@admin_required
def delete_lesson(lesson_id):
    lesson = Lesson.query.get_or_404(lesson_id)
    db.session.delete(lesson)
    db.session.commit()
    return jsonify({'message': 'Lesson deleted'})

# --- ENROLLMENTS API ---
@app.route('/api/enrollments', methods=['GET'])
@jwt_required()
def get_enrollments():
    user_id = get_jwt_identity()
    enrollments = Enrollment.query.filter_by(user_id=user_id).all()
    return jsonify([{
        **e.to_dict(),
        'course': Course.query.get(e.course_id).to_dict() if Course.query.get(e.course_id) else None
    } for e in enrollments])

# --- PROGRESS API ---
@app.route('/api/progress/<int:lesson_id>', methods=['POST'])
@jwt_required()
def save_progress(lesson_id):
    user_id = get_jwt_identity()
    data = request.json
    progress = LessonProgress.query.filter_by(user_id=user_id, lesson_id=lesson_id).first()
    if not progress:
        progress = LessonProgress(user_id=user_id, lesson_id=lesson_id)
        db.session.add(progress)
    if 'watched_seconds' in data:
        progress.watched_seconds = data['watched_seconds']
    if 'is_completed' in data:
        progress.is_completed = data['is_completed']
    progress.last_watched_at = db.func.now()
    db.session.commit()
    return jsonify(progress.to_dict())

@app.route('/api/progress/<int:lesson_id>', methods=['GET'])
@jwt_required()
def get_progress(lesson_id):
    user_id = get_jwt_identity()
    progress = LessonProgress.query.filter_by(user_id=user_id, lesson_id=lesson_id).first()
    return jsonify(progress.to_dict() if progress else {'watched_seconds': 0, 'is_completed': False})

@app.route('/api/progress/course/<int:course_id>', methods=['GET'])
@jwt_required()
def get_course_progress(course_id):
    user_id = get_jwt_identity()
    course = Course.query.get_or_404(course_id)
    result = []
    for module in course.modules:
        module_data = module.to_dict()
        lessons_progress = []
        for lesson in module.lessons:
            progress = LessonProgress.query.filter_by(user_id=user_id, lesson_id=lesson.id).first()
            lessons_progress.append({
                'lesson_id': lesson.id,
                'watched_seconds': progress.watched_seconds if progress else 0,
                'is_completed': progress.is_completed if progress else False
            })
        module_data['lessons'] = lessons_progress
        result.append(module_data)
    return jsonify({'progress': result})

# --- VIDEO / DRM API ---
@app.route('/api/video/<int:lesson_id>/play', methods=['GET'])
@jwt_required()
def get_video_play_url(lesson_id):
    user_id = get_jwt_identity()
    lesson = Lesson.query.get_or_404(lesson_id)
    if not get_enrollment(user_id, lesson.module.course_id):
        return jsonify({'error': 'Not enrolled in this course'}), 403
    return jsonify({
        'lesson_id': lesson_id,
        'type': 'hls',
        'manifest_url': f"{Config.DOMAIN_URL}/api/video/{lesson_id}/manifest",
        'title': lesson.title,
        'duration_minutes': lesson.duration_minutes,
        'thumbnail_url': lesson.module.course.thumbnail_url if lesson.module else None
    })

@app.route('/api/video/<int:lesson_id>/manifest', methods=['GET'])
@jwt_required()
def get_manifest(lesson_id):
    user_id = get_jwt_identity()
    lesson = Lesson.query.get_or_404(lesson_id)
    if not get_enrollment(user_id, lesson.module.course_id):
        return jsonify({'error': 'Not enrolled in this course'}), 403
    directory = os.path.join(Config.HLS_OUTPUT_FOLDER, str(lesson_id))
    if not os.path.exists(os.path.join(directory, 'playlist.m3u8')):
        return jsonify({'error': 'Video not prepared yet'}), 404
    return send_from_directory(directory, 'playlist.m3u8')

@app.route('/api/video/<int:lesson_id>/key', methods=['GET'])
@jwt_required()
def get_hls_key(lesson_id):
    user_id = get_jwt_identity()
    lesson = Lesson.query.get_or_404(lesson_id)
    if not get_enrollment(user_id, lesson.module.course_id):
        return jsonify({'error': 'Not enrolled'}), 403
    directory = os.path.join(Config.HLS_OUTPUT_FOLDER, str(lesson_id))
    key_path = os.path.join(directory, 'video.key')
    if not os.path.exists(key_path):
        return jsonify({'error': 'Key not found'}), 404
    return send_file(key_path, mimetype='application/octet-stream')

@app.route('/api/video/<int:lesson_id>/<path:filename>', methods=['GET'])
@jwt_required()
def get_video_file(lesson_id, filename):
    if filename in ('play', 'key', 'manifest'):
        return jsonify({'error': 'Not found'}), 404
    user_id = get_jwt_identity()
    lesson = Lesson.query.get_or_404(lesson_id)
    if not get_enrollment(user_id, lesson.module.course_id):
        return jsonify({'error': 'Not enrolled'}), 403
    directory = os.path.join(Config.HLS_OUTPUT_FOLDER, str(lesson_id))
    if not os.path.exists(os.path.join(directory, filename)):
        return jsonify({'error': 'File not found'}), 404
    return send_from_directory(directory, filename)

# --- ADMIN API ---
@app.route('/api/admin/stats', methods=['GET'])
@admin_required
def admin_stats():
    return jsonify({
        'total_users': User.query.count(),
        'total_courses': Course.query.count(),
        'total_enrollments': Enrollment.query.count(),
        'total_lessons': Lesson.query.count()
    })

@app.route('/api/admin/users', methods=['GET'])
@admin_required
def admin_users():
    users = User.query.all()
    return jsonify([u.to_dict() for u in users])

@app.route('/api/admin/lessons', methods=['GET'])
@admin_required
def get_all_lessons():
    lessons = Lesson.query.all()
    return jsonify([{
        'id': l.id,
        'title': l.title,
        'module_id': l.module_id,
        'course_id': l.module.course_id,
        'course_title': l.module.course.title,
        'video_path': l.video_path,
        'has_video': bool(l.video_path and os.path.exists(l.video_path)),
        'has_hls': os.path.exists(os.path.join(Config.HLS_OUTPUT_FOLDER, str(l.id), 'playlist.m3u8'))
    } for l in lessons])

@app.route('/api/admin/upload', methods=['POST'])
@admin_required
def upload_video():
    lesson_id = request.form.get('lesson_id', type=int)
    if not lesson_id:
        return jsonify({'error': 'lesson_id is required'}), 400
    lesson = Lesson.query.get_or_404(lesson_id)
    if 'video' not in request.files:
        return jsonify({'error': 'No video file provided'}), 400
    video = request.files['video']
    if video.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    ext = os.path.splitext(video.filename)[1]
    video_path = os.path.join(Config.VIDEOS_FOLDER, f'lesson_{lesson_id}{ext}')
    video.save(video_path)
    lesson.video_path = video_path
    db.session.commit()
    result = hls_manager.encrypt_video_hls(video_path, lesson_id)
    if result:
        return jsonify({
            'message': 'Video uploaded and encrypted successfully',
            'video_path': video_path,
            'hls_path': result,
            'play_url': f"{Config.DOMAIN_URL}/api/video/{lesson_id}/play"
        })
    else:
        return jsonify({'message': 'Video uploaded but encryption failed', 'video_path': video_path}), 500

@app.route('/api/admin/bulk-seed', methods=['POST'])
@admin_required
def bulk_seed():
    from seed_data import seed_mental_health_courses
    seed_mental_health_courses()
    return jsonify({'message': 'Seed data created'})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=7200)
