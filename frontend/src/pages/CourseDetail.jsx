import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCourse, enrollCourse } from '../api/courses';
import { getUser } from '../api/auth';
import { toast } from '../components/Toast';

export default function CourseDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const navigate = useNavigate();
  const user = getUser();

  useEffect(() => {
    getCourse(id).then(c => {
      setCourse(c);
      const first = {};
      if (c.modules?.length) first[0] = true;
      setExpanded(first);
    }).catch(() => toast('Failed to load course', 'error'))
    .finally(() => setLoading(false));
  }, [id]);

  const handleEnroll = async () => {
    try {
      await enrollCourse(id);
      toast('Enrolled!', 'success');
      const c = await getCourse(id);
      setCourse(c);
    } catch (e) { toast(e.message, 'error'); }
  };

  if (loading) return <div className="loading">Loading course...</div>;
  if (!course) return <div className="error">Course not found</div>;

  const totalLessons = (course.modules || []).reduce((s, m) => s + (m.lessons || []).length, 0);

  return (
    <div className="container">
      <div className="course-header">
        <div className="course-thumbnail-large">
          <img src={course.thumbnail_url || 'https://picsum.photos/400/225'} alt={course.title} />
        </div>
        <div className="course-header-info">
          <h1>{course.title}</h1>
          <p className="course-instructor">by {course.instructor || 'Instructor'}</p>
          <p>{course.description}</p>
          {course.is_enrolled ? (
            <div style={{ marginTop: 20 }}>
              <button className="btn btn-primary" onClick={() => {
                const first = course.modules?.[0]?.lessons?.[0];
                if (first) navigate(`/lesson/${first.id}`);
              }}>Continue Learning</button>
            </div>
          ) : (
            <button className="btn btn-primary btn-lg" style={{ marginTop: 20 }} onClick={handleEnroll}>Enroll Now</button>
          )}
        </div>
      </div>
      <div className="course-curriculum">
        <h2>Course Content</h2>
        <p style={{ color: 'var(--text-light)', marginBottom: 24 }}>{(course.modules || []).length} modules • {totalLessons} lessons</p>
        {(course.modules || []).map((m, mi) => (
          <div key={m.id} className="module-card">
            <div className="module-header" onClick={() => setExpanded(p => ({ ...p, [mi]: !p[mi] }))}>
              <h3>{m.title}</h3>
              <span>{expanded[mi] ? '▼' : '▶'}</span>
            </div>
            {expanded[mi] && (
              <div className="module-content">
                <p style={{ color: 'var(--text-light)', marginBottom: 12 }}>{m.description}</p>
                {(m.lessons || []).map((l, li) => (
                  <div key={l.id}
                    className={`lesson-item ${!course.is_enrolled ? 'lesson-locked' : ''}`}
                    onClick={() => course.is_enrolled && navigate(`/lesson/${l.id}`)}
                  >
                    <div className="lesson-info">
                      <span className="lesson-number">{li + 1}</span>
                      <div>
                        <h4>{l.title}</h4>
                        <span className="lesson-duration">⏱️ {l.duration_minutes} min</span>
                      </div>
                    </div>
                    {!course.is_enrolled && <span>🔒</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
