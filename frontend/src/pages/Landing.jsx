import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCourses } from '../api/courses';

export default function Landing() {
  const [courses, setCourses] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    getCourses().then(setCourses).catch(() => {});
  }, []);

  return (
    <>
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1>Your Journey to Mental Wellness Starts Here</h1>
            <p>Access secure, expert-crafted courses on stress management, mindfulness, anxiety coping, and more.</p>
            <div className="hero-actions">
              <Link to="/register" className="btn btn-primary btn-lg">Start Learning Free</Link>
              <Link to="/login" className="btn btn-outline btn-lg">Sign In</Link>
            </div>
          </div>
        </div>
      </section>
      <section className="features">
        <div className="container">
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Secure Content</h3>
              <p>Server-side DRM protection ensures your learning content is encrypted and secure.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📚</div>
              <h3>Expert Courses</h3>
              <p>Learn from qualified mental health professionals with proven techniques.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⏱️</div>
              <h3>Self-Paced</h3>
              <p>Study at your own pace with progress tracking and flexible scheduling.</p>
            </div>
          </div>
        </div>
      </section>
      <section className="courses-preview">
        <div className="container">
          <h2 className="section-title">Mental Health Courses</h2>
          <div className="courses-grid">
            {courses.map(c => (
              <div key={c.id} className="course-card" onClick={() => navigate(`/course/${c.id}`)}>
                <div className="course-thumbnail">
                  <img src={c.thumbnail_url || `https://picsum.photos/400/225?random=${c.id}`} alt={c.title} />
                </div>
                <div className="course-info">
                  <h3>{c.title}</h3>
                  <p className="course-description">{(c.description || '').substring(0, 120)}...</p>
                  <div className="course-meta">
                    <span>📚 {c.module_count} modules</span>
                    <span>👨‍🏫 {c.instructor || 'Instructor'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="cta">
        <div className="container">
          <h2>Ready to Transform Your Mental Well-being?</h2>
          <p style={{ marginBottom: 24, opacity: 0.9 }}>Join thousands of learners who have improved their mental health.</p>
          <Link to="/register" className="btn btn-primary btn-lg">Create Free Account</Link>
        </div>
      </section>
    </>
  );
}
