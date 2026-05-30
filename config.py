import os
from datetime import timedelta

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'mindwell-drm-secret-key-change-in-production'
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    INSTANCE_DIR = os.path.join(BASE_DIR, 'instance')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or f"sqlite:///{os.path.join(INSTANCE_DIR, 'mindwell.db')}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-mindwell-secret-key-change-in-production'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    
    ENCRYPTION_KEY = os.environ.get('ENCRYPTION_KEY') or None
    
    DRM_VIDEO_TOKEN_EXPIRES = timedelta(hours=1)
    
    HLS_OUTPUT_FOLDER = os.path.join(BASE_DIR, 'static', 'hls')
    VIDEOS_FOLDER = os.path.join(BASE_DIR, 'videos')
    
    DOMAIN_URL = os.environ.get('DOMAIN_URL') or 'http://localhost:5000'
