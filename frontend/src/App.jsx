import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CourseDetail from './pages/CourseDetail';
import LessonView from './pages/LessonView';
import Admin from './pages/Admin';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/course/:id" element={<CourseDetail />} />
          <Route path="/lesson/:id" element={<ProtectedRoute><LessonView /></ProtectedRoute>} />
          <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
