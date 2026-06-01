import { apiJson, api } from './client';

export async function getCourses() {
  return apiJson('/courses');
}

export async function getCourse(id) {
  return apiJson(`/courses/${id}`);
}

export async function enrollCourse(id) {
  return apiJson(`/courses/${id}/enroll`, { method: 'POST' });
}

export async function getEnrollments() {
  return apiJson('/enrollments');
}

export async function getLesson(id) {
  return apiJson(`/lessons/${id}`);
}

export async function saveProgress(lessonId, data) {
  return apiJson(`/progress/${lessonId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getProgress(lessonId) {
  return apiJson(`/progress/${lessonId}`);
}

export async function getVideoPlayUrl(lessonId) {
  return apiJson(`/video/${lessonId}/play`);
}
