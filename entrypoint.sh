#!/bin/bash
set -e

python -c "
from app import app, db
from models import User
from flask import Flask

with app.app_context():
    db.create_all()

    if not User.query.filter_by(email='admin@mindwell.com').first():
        admin = User(email='admin@mindwell.com', name='Admin User', role='admin')
        admin.set_password('admin123')
        db.session.add(admin)

    if not User.query.filter_by(email='sarah.therapist@mindwell.com').first():
        instructor = User(email='sarah.therapist@mindwell.com', name='Dr. Sarah Johnson', role='instructor')
        instructor.set_password('instructor123')
        db.session.add(instructor)

    db.session.commit()
    print('Database initialized with admin and instructor users.')
"

python seed_data.py

exec gunicorn -w 4 -b 0.0.0.0:5000 --access-logfile - --error-logfile - app:app
