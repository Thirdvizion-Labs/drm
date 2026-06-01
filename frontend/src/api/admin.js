import { apiJson, api } from './client';

export async function getStats() {
  return apiJson('/admin/stats');
}

export async function getUsers() {
  return apiJson('/admin/users');
}

export async function getAdminLessons() {
  return apiJson('/admin/lessons');
}

export async function createCourse(data) {
  return apiJson('/courses', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateCourse(id, data) {
  return apiJson(`/courses/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteCourse(id) {
  return apiJson(`/courses/${id}`, { method: 'DELETE' });
}

export async function createModule(courseId, data) {
  return apiJson(`/courses/${courseId}/modules`, { method: 'POST', body: JSON.stringify(data) });
}

export async function deleteModule(id) {
  return apiJson(`/modules/${id}`, { method: 'DELETE' });
}

export async function createLesson(moduleId, data) {
  return apiJson(`/modules/${moduleId}/lessons`, { method: 'POST', body: JSON.stringify(data) });
}

export async function deleteLesson(id) {
  return apiJson(`/lessons/${id}`, { method: 'DELETE' });
}

export async function uploadVideo(lessonId, file) {
  const fd = new FormData();
  fd.append('lesson_id', lessonId);
  fd.append('video', file);
  const res = await api('/admin/upload', { method: 'POST', body: fd });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Upload failed');
  return data;
}

export async function getAllCourses() {
  return apiJson('/courses/all');
}
