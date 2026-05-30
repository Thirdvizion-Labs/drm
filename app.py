import os
from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity
from config import Config
from models import db, User, Course, Lesson, Enrollment
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

# --- AUTH API ---
@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(email=data.get('email')).first()
    if user and user.check_password(data.get('password')):
        from flask_jwt_extended import create_access_token
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

    user = User(
        email=data.get('email'),
        name=data.get('name'),
        role='learner'
    )
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

@app.route('/api/courses/<int:course_id>', methods=['GET'])
def get_course(course_id):
    course = Course.query.get_or_404(course_id)
    return jsonify(course.to_dict(include_modules=True))

@app.route('/api/courses/<int:course_id>/enroll', methods=['POST'])
@jwt_required()
def enroll_course(course_id):
    user_id = get_jwt_identity()
    if Enrollment.query.filter_by(user_id=user_id, course_id=course_id).first():
        return jsonify({'error': 'Already enrolled'}), 400

    enrollment = Enrollment(user_id=user_id, course_id=course_id)
    db.session.add(enrollment)
    db.session.commit()

    return jsonify({'message': 'Enrolled successfully'})

@app.route('/api/courses/<int:course_id>/lessons', methods=['GET'])
@jwt_required()
def get_course_lessons(course_id):
    user_id = get_jwt_identity()
    enrollment = Enrollment.query.filter_by(user_id=user_id, course_id=course_id).first()
    if not enrollment:
        return jsonify({'error': 'Not enrolled'}), 403

    course = Course.query.get_or_404(course_id)
    lessons = []
    for module in course.modules:
        for lesson in module.lessons:
            lessons.append(lesson.to_dict())
    return jsonify(lessons)

# --- VIDEO / DRM API ---
@app.route('/api/video/<int:lesson_id>/play', methods=['GET'])
@jwt_required()
def get_video_play_url(lesson_id):
    user_id = get_jwt_identity()

    lesson = Lesson.query.get_or_404(lesson_id)
    enrollment = Enrollment.query.filter_by(user_id=user_id, course_id=lesson.module.course_id).first()
    if not enrollment:
        return jsonify({'error': 'Not enrolled in this course'}), 403

    manifest_url = f"{Config.DOMAIN_URL}/api/video/{lesson_id}/manifest"

    return jsonify({
        'lesson_id': lesson_id,
        'type': 'hls',
        'manifest_url': manifest_url,
        'title': lesson.title,
        'duration_minutes': lesson.duration_minutes,
        'thumbnail_url': lesson.module.course.thumbnail_url if lesson.module else None
    })

@app.route('/api/video/<int:lesson_id>/manifest', methods=['GET'])
@jwt_required()
def get_manifest(lesson_id):
    user_id = get_jwt_identity()

    lesson = Lesson.query.get_or_404(lesson_id)
    enrollment = Enrollment.query.filter_by(user_id=user_id, course_id=lesson.module.course_id).first()
    if not enrollment:
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
    enrollment = Enrollment.query.filter_by(user_id=user_id, course_id=lesson.module.course_id).first()
    if not enrollment:
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
    enrollment = Enrollment.query.filter_by(user_id=user_id, course_id=lesson.module.course_id).first()
    if not enrollment:
        return jsonify({'error': 'Not enrolled'}), 403

    directory = os.path.join(Config.HLS_OUTPUT_FOLDER, str(lesson_id))
    filepath = os.path.join(directory, filename)
    if not os.path.exists(filepath):
        return jsonify({'error': 'File not found'}), 404
    return send_from_directory(directory, filename)

# --- ADMIN API ---
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
        return jsonify({
            'message': 'Video uploaded but encryption failed',
            'video_path': video_path
        }), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=5000)
