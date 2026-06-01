import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEnrollments, getCourses, enrollCourse } from '../api/courses';
import { getUser } from '../api/auth';
import { toast } from '../components/Toast';

export default function Dashboard() {
  const [enrollments, setEnrollments] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = getUser();
  const navigate = useNavigate();

  const load = async () => {
    try {
      const [enr, courses] = await Promise.all([getEnrollments(), getCourses()]);
      setEnrollments(enr);
      setAllCourses(courses);
    } catch (e) { toast('Failed to load', 'error'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleEnroll = async (id) => {
    try {
      await enrollCourse(id);
      toast('Enrolled!', 'success');
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  if (loading) return <div className="loading">Loading...</div>;

  const enrolledIds = new Set(enrollments.map(e => e.course_id));
  const available = allCourses.filter(c => !enrolledIds.has(c.id));

  return (
    <div className="container">
      <div className="dashboard-header">
        <h1>Welcome, <span>{user?.name || 'Learner'}</span></h1>
        <p>Continue your mental wellness journey</p>
      </div>
      <div className="dashboard-grid">
        <div className="dashboard-main">
          <section className="dashboard-section">
            <h2>📚 My Courses</h2>
            {enrollments.length === 0 ? (
              <div className="empty-state">
                <p>You haven't enrolled in any courses yet.</p>
                <p>Browse below to get started!</p>
              </div>
            ) : enrollments.map(e => (
              <div key={e.id} className="course-list-item" onClick={() => navigate(`/course/${e.course_id}`)}>
                <div className="course-list-info">
                  <h3>{e.course?.title || `Course #${e.course_id}`}</h3>
                </div>
                <div className="course-list-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${e.progress_percentage || 0}%` }} />
                  </div>
                  <span className="progress-text">{Math.round(e.progress_percentage || 0)}%</span>
                </div>
              </div>
            ))}
          </section>
          <section className="dashboard-section">
            <h2>🔍 Browse All Courses</h2>
            {available.length === 0 ? (
              <p>No more courses available.</p>
            ) : (
              <div className="courses-grid-sm">
                {available.map(c => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <strong>{c.title}</strong>
                      <p style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>{c.module_count} modules</p>
                    </div>
                    <button className="btn btn-sm btn-outline" onClick={() => handleEnroll(c.id)}>Enroll</button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
        <div className="dashboard-sidebar">
          <div className="stats-card">
            <h3>Your Progress</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-value">{enrollments.length}</span>
                <span className="stat-label">Enrolled</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{enrollments.filter(e => e.progress_percentage >= 100).length}</span>
                <span className="stat-label">Completed</span>
              </div>
            </div>
          </div>
          <div className="stats-card">
            <h3>Quick Tip</h3>
            <div className="tip-card">
              <p>"Take a few deep breaths whenever you feel overwhelmed. Your nervous system will thank you."</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
