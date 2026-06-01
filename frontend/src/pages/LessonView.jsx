import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getVideoPlayUrl, getLesson, saveProgress, getProgress } from '../api/courses';
import { toast } from '../components/Toast';

export default function LessonView() {
  const { id } = useParams();
  const [lesson, setLesson] = useState(null);
  const [canPlay, setCanPlay] = useState(false);
  const [progress, setProgress] = useState({ watched_seconds: 0, is_completed: false });
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const navigate = useNavigate();

  const load = async () => {
    try {
      const playData = await getVideoPlayUrl(id);
      setLesson({ ...playData, hasVideo: true });
      setCanPlay(true);
    } catch {
      try {
        const lessonData = await getLesson(id);
        setLesson({ ...lessonData, hasVideo: false });
      } catch {
        toast('Lesson not found', 'error');
      }
    }
    try { setProgress(await getProgress(id)); } catch {}
  };

  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    if (!canPlay || !videoRef.current || !lesson?.manifest_url) return;
    const initHls = async () => {
      const Hls = (await import('hls.js')).default;
      if (Hls.isSupported()) {
        const hls = new Hls({
          xhrSetup: (xhr) => {
            const token = localStorage.getItem('access_token');
            if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
          }
        });
        hls.loadSource(lesson.manifest_url);
        hls.attachMedia(videoRef.current);
        hlsRef.current = hls;
      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = lesson.manifest_url;
      }
    };
    initHls();
    return () => { if (hlsRef.current) hlsRef.current.destroy(); };
  }, [canPlay, lesson?.manifest_url]);

  const markComplete = async () => {
    try {
      await saveProgress(id, { is_completed: true });
      toast('Lesson completed!', 'success');
      setProgress(p => ({ ...p, is_completed: true }));
    } catch { toast('Failed to save', 'error'); }
  };

  if (!lesson) return <div className="loading">Loading lesson...</div>;

  return (
    <div className="lesson-container">
      <div className="lesson-header">
        <a href="/dashboard" className="back-link" onClick={e => { e.preventDefault(); navigate('/dashboard'); }}>← Back to Dashboard</a>
        <h1>{lesson.title}</h1>
      </div>
      <div className="lesson-content-grid">
        <div className="lesson-main">
          {lesson.hasVideo ? (
            <div className="video-wrapper">
              <video ref={videoRef} controls style={{ width: '100%', maxHeight: 500 }} />
            </div>
          ) : (
            <div className="video-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <div className="text-center">
                <p style={{ fontSize: '2rem', marginBottom: 12 }}>📝</p>
                <p>Text-Based Lesson</p>
                <p style={{ opacity: 0.7 }}>No video for this lesson.</p>
              </div>
            </div>
          )}
          {lesson.content_text && (
            <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: 24, marginTop: 24, boxShadow: 'var(--shadow)' }}>
              <h2 style={{ marginBottom: 16 }}>Lesson Content</h2>
              <p style={{ lineHeight: 1.8 }}>{lesson.content_text}</p>
            </div>
          )}
        </div>
        <div className="lesson-sidebar">
          <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 20, boxShadow: 'var(--shadow)' }}>
            <h3 style={{ marginBottom: 16 }}>Progress</h3>
            <div className="progress-bar" style={{ width: '100%', marginBottom: 8 }}>
              <div className="progress-fill" style={{ width: progress.is_completed ? '100%' : '0%' }} />
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>{progress.is_completed ? 'Completed!' : 'Not started'}</span>
            <button className="btn btn-sm btn-outline btn-block" style={{ marginTop: 12 }} onClick={markComplete}>
              Mark as Complete
            </button>
          </div>
          <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: 20, boxShadow: 'var(--shadow)' }}>
            <h3 style={{ marginBottom: 16 }}>Actions</h3>
            <button className="btn btn-primary btn-block" onClick={() => navigate('/dashboard')}>
              Back to Dashboard →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
