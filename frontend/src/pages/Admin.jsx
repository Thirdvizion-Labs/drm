import { useEffect, useState } from 'react';
import { getStats, getUsers, getAdminLessons, getAllCourses,
  createCourse, updateCourse, deleteCourse,
  createModule, deleteModule,
  createLesson, deleteLesson, uploadVideo } from '../api/admin';
import { toast } from '../components/Toast';

export default function Admin() {
  const [tab, setTab] = useState('stats');
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal state
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editCourseId, setEditCourseId] = useState(null);
  const [courseForm, setCourseForm] = useState({ title: '', description: '', is_published: true });

  const [showModuleModal, setShowModuleModal] = useState(false);
  const [moduleForm, setModuleForm] = useState({ course_id: '', title: '', description: '', order_index: 0 });

  const [showLessonModal, setShowLessonModal] = useState(false);
  const [lessonForm, setLessonForm] = useState({ course_id: '', module_id: '', title: '', content_text: '', duration_minutes: 10, order_index: 0 });

  const [showUpload, setShowUpload] = useState(false);
  const [uploadLesson, setUploadLesson] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);

  const loadTab = async (t) => {
    setLoading(true);
    try {
      if (t === 'stats') setStats(await getStats());
      if (t === 'users') setUsers(await getUsers());
      if (t === 'courses') setCourses(await getAllCourses());
      if (t === 'lessons') setLessons(await getAdminLessons());
    } catch { toast('Failed to load', 'error'); }
    setLoading(false);
  };

  useEffect(() => { loadTab(tab); }, [tab]);

  // Course CRUD
  const handleCourseSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editCourseId) {
        await updateCourse(editCourseId, courseForm);
        toast('Course updated!', 'success');
      } else {
        await createCourse(courseForm);
        toast('Course created!', 'success');
      }
      setShowCourseModal(false);
      loadTab('courses');
    } catch (err) { toast(err.message, 'error'); }
  };

  const handleDeleteCourse = async (id) => {
    if (!confirm('Delete this course and all content?')) return;
    try { await deleteCourse(id); toast('Deleted!', 'success'); loadTab('courses'); }
    catch (err) { toast(err.message, 'error'); }
  };

  // Module CRUD
  const handleModuleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createModule(moduleForm.course_id, {
        title: moduleForm.title,
        description: moduleForm.description,
        order_index: moduleForm.order_index,
      });
      toast('Module created!', 'success');
      setShowModuleModal(false);
      setModuleForm({ course_id: '', title: '', description: '', order_index: 0 });
      loadTab('courses');
    } catch (err) { toast(err.message, 'error'); }
  };

  const handleDeleteModule = async (id) => {
    if (!confirm('Delete this module?')) return;
    try { await deleteModule(id); toast('Deleted!', 'success'); loadTab('courses'); }
    catch (err) { toast(err.message, 'error'); }
  };

  // Lesson CRUD
  const handleLessonSubmit = async (e) => {
    e.preventDefault();
    try {
      await createLesson(lessonForm.module_id, {
        title: lessonForm.title,
        content_text: lessonForm.content_text,
        duration_minutes: lessonForm.duration_minutes,
        order_index: lessonForm.order_index,
      });
      toast('Lesson created!', 'success');
      setShowLessonModal(false);
      loadTab('courses');
    } catch (err) { toast(err.message, 'error'); }
  };

  const handleDeleteLesson = async (id) => {
    if (!confirm('Delete this lesson?')) return;
    try { await deleteLesson(id); toast('Deleted!', 'success'); loadTab('courses'); }
    catch (err) { toast(err.message, 'error'); }
  };

  // Video Upload
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;
    try {
      await uploadVideo(uploadLesson.id, uploadFile);
      toast('Video uploaded and encrypted!', 'success');
      setShowUpload(false);
      setUploadFile(null);
      loadTab('lessons');
    } catch (err) { toast(err.message, 'error'); }
  };

  const tabs = [
    { key: 'stats', label: '📊 Stats' },
    { key: 'courses', label: '📚 Courses' },
    { key: 'lessons', label: '🎬 Lessons' },
    { key: 'users', label: '👥 Users' },
  ];

  return (
    <div className="container">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <p>Manage courses, content, and videos</p>
      </div>
      <div className="admin-tabs">
        {tabs.map(t => (
          <button key={t.key} className={`tab-btn ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </div>

      {/* STATS */}
      {tab === 'stats' && <div>
        <h2 className="mb-4">Platform Statistics</h2>
        <div className="stats-cards">
          {[
            { label: 'Users', value: stats.total_users },
            { label: 'Courses', value: stats.total_courses },
            { label: 'Enrollments', value: stats.total_enrollments },
            { label: 'Lessons', value: stats.total_lessons },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <h3>{s.label}</h3>
              <span className="stat-value">{s.value ?? '...'}</span>
            </div>
          ))}
        </div>
      </div>}

      {/* COURSES */}
      {tab === 'courses' && <div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => { setEditCourseId(null); setCourseForm({ title: '', description: '', is_published: true }); setShowCourseModal(true); }}>+ New Course</button>
          <button className="btn btn-outline" onClick={async () => {
            const c = await getAllCourses();
            setModuleForm(p => ({ ...p, course_id: c[0]?.id || '' }));
            setShowModuleModal(true);
          }}>+ New Module</button>
          <button className="btn btn-outline" onClick={async () => {
            const c = await getAllCourses();
            setLessonForm(p => ({ ...p, course_id: c[0]?.id || '' }));
            setShowLessonModal(true);
          }}>+ New Lesson</button>
        </div>
        {loading ? <div className="loading">Loading...</div> : courses.length === 0 ? <p>No courses yet.</p> : courses.map(c => (
          <div key={c.id} className="course-admin-card">
            <div className="course-admin-info">
              <h4>{c.title}</h4>
              <p>{c.module_count} modules · {c.enrollment_count || 0} enrollments</p>
              <span className={`tag ${c.is_published ? 'tag-green' : 'tag-yellow'}`}>{c.is_published ? 'Published' : 'Draft'}</span>
              {c.modules?.map(m => (
                <div key={m.id} className="module-block">
                  <h4>📦 {m.title} <button className="delete-btn" onClick={() => handleDeleteModule(m.id)}>×</button></h4>
                  {m.lessons?.length ? m.lessons.map(l => (
                    <div key={l.id} className="lesson-row">
                      <span>{l.title}</span>
                      <span className="tag tag-blue">{l.duration_minutes}min</span>
                      <button className="delete-btn" onClick={() => handleDeleteLesson(l.id)}>×</button>
                    </div>
                  )) : <p style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>No lessons</p>}
                </div>
              ))}
            </div>
            <div className="course-admin-actions">
              <button className="btn btn-sm btn-outline" onClick={() => {
                setEditCourseId(c.id);
                setCourseForm({ title: c.title, description: c.description || '', is_published: c.is_published });
                setShowCourseModal(true);
              }}>✏️ Edit</button>
              <button className="btn btn-sm btn-outline" style={{ color: 'var(--error)', borderColor: 'var(--error)' }} onClick={() => handleDeleteCourse(c.id)}>🗑️ Delete</button>
            </div>
          </div>
        ))}
      </div>}

      {/* LESSONS */}
      {tab === 'lessons' && <div>
        <h2 className="mb-4">Video Management</h2>
        {loading ? <div className="loading">Loading...</div> : lessons.length === 0 ? <p>No lessons.</p> : (
          <div className="data-table-container">
            <table className="data-table">
              <thead><tr><th>Lesson</th><th>Course</th><th>Video</th><th>HLS</th><th>Action</th></tr></thead>
              <tbody>
                {lessons.map(l => (
                  <tr key={l.id}>
                    <td>{l.title}</td>
                    <td>{l.course_title}</td>
                    <td>{l.has_video ? '✅' : '❌'}</td>
                    <td>{l.has_hls ? '✅' : '❌'}</td>
                    <td><button className="btn btn-sm btn-primary" onClick={() => { setUploadLesson(l); setShowUpload(true); }}>Upload Video</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showUpload && (
          <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowUpload(false); }}>
            <div className="modal-card">
              <h3 className="mb-4">Upload Video</h3>
              <p className="mb-3">Lesson: <strong>{uploadLesson?.title}</strong></p>
              <form onSubmit={handleUpload}>
                <div className="form-group">
                  <label>Select MP4 Video</label>
                  <input type="file" accept=".mp4,.mov,.avi" onChange={e => setUploadFile(e.target.files[0])} required />
                </div>
                <div className="form-actions" style={{ display: 'flex', gap: 12 }}>
                  <button type="submit" className="btn btn-primary">Upload & Encrypt</button>
                  <button type="button" className="btn btn-outline" onClick={() => setShowUpload(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>}

      {/* USERS */}
      {tab === 'users' && <div>
        <h2 className="mb-4">Users</h2>
        {loading ? <div className="loading">Loading...</div> : (
          <div className="data-table-container">
            <table className="data-table">
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Created</th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td><span className={`tag tag-${u.role}`}>{u.role}</span></td>
                    <td>{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>}

      {/* COURSE MODAL */}
      {showCourseModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowCourseModal(false); }}>
          <div className="modal-card">
            <h3 className="mb-4">{editCourseId ? 'Edit Course' : 'Create Course'}</h3>
            <form onSubmit={handleCourseSubmit}>
              <div className="form-group">
                <label>Title</label>
                <input value={courseForm.title} onChange={e => setCourseForm(p => ({ ...p, title: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows={3} value={courseForm.description} onChange={e => setCourseForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <input type="checkbox" checked={courseForm.is_published} onChange={e => setCourseForm(p => ({ ...p, is_published: e.target.checked }))} />
                Published
              </label>
              <div className="form-actions" style={{ display: 'flex', gap: 12 }}>
                <button type="submit" className="btn btn-primary">Save</button>
                <button type="button" className="btn btn-outline" onClick={() => setShowCourseModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODULE MODAL */}
      {showModuleModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModuleModal(false); }}>
          <div className="modal-card">
            <h3 className="mb-4">Add Module</h3>
            <form onSubmit={handleModuleSubmit}>
              <div className="form-group">
                <label>Course</label>
                <select value={moduleForm.course_id} onChange={e => setModuleForm(p => ({ ...p, course_id: e.target.value }))} required>
                  <option value="">Select course...</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Title</label>
                <input value={moduleForm.title} onChange={e => setModuleForm(p => ({ ...p, title: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows={3} value={moduleForm.description} onChange={e => setModuleForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Order</label>
                <input type="number" value={moduleForm.order_index} onChange={e => setModuleForm(p => ({ ...p, order_index: parseInt(e.target.value) || 0 }))} />
              </div>
              <div className="form-actions" style={{ display: 'flex', gap: 12 }}>
                <button type="submit" className="btn btn-primary">Save</button>
                <button type="button" className="btn btn-outline" onClick={() => setShowModuleModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LESSON MODAL */}
      {showLessonModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowLessonModal(false); }}>
          <div className="modal-card">
            <h3 className="mb-4">Add Lesson</h3>
            <form onSubmit={handleLessonSubmit}>
              <div className="form-group">
                <label>Course</label>
                <select value={lessonForm.course_id} onChange={async e => {
                  const cid = e.target.value;
                  setLessonForm(p => ({ ...p, course_id: cid }));
                  if (cid) {
                    const res = await fetch(`/api/courses/${cid}`, { headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } });
                    const c = await res.json();
                    const mods = c.modules || [];
                    setLessonForm(p => ({ ...p, module_id: mods[0]?.id || '' }));
                  }
                }} required>
                  <option value="">Select course...</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Module</label>
                <select value={lessonForm.module_id} onChange={e => setLessonForm(p => ({ ...p, module_id: e.target.value }))} required>
                  <option value="">Select module...</option>
                  {courses.find(c => c.id == lessonForm.course_id)?.modules?.map(m => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Title</label>
                <input value={lessonForm.title} onChange={e => setLessonForm(p => ({ ...p, title: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Content</label>
                <textarea rows={4} value={lessonForm.content_text} onChange={e => setLessonForm(p => ({ ...p, content_text: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Duration (min)</label>
                  <input type="number" value={lessonForm.duration_minutes} onChange={e => setLessonForm(p => ({ ...p, duration_minutes: parseInt(e.target.value) || 10 }))} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Order</label>
                  <input type="number" value={lessonForm.order_index} onChange={e => setLessonForm(p => ({ ...p, order_index: parseInt(e.target.value) || 0 }))} />
                </div>
              </div>
              <div className="form-actions" style={{ display: 'flex', gap: 12 }}>
                <button type="submit" className="btn btn-primary">Save</button>
                <button type="button" className="btn btn-outline" onClick={() => setShowLessonModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
