import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login         from './pages/Login';
import Signup        from './pages/Signup';
import UserDashboard from './pages/UserDashboard';
import Interview     from './pages/Interview';
import Result        from './pages/Result';
import Admin         from './pages/Admin';
import Landing       from './pages/Landing';
import './index.css';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('hv_token');
  const userStr = localStorage.getItem('hv_user');
  if (!token || !userStr) {
    return <Navigate to="/login" replace />;
  }
  
  try {
    const user = JSON.parse(userStr);
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      // Redirect to their default dashboard if they lack permission for this route
      return <Navigate to={user.role === 'organizer' ? '/admin' : '/dashboard'} replace />;
    }
  } catch (e) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"            element={<Landing />} />
        <Route path="/login"       element={<Login />} />
        <Route path="/signup"      element={<Signup />} />
        
        {/* User routes */}
        <Route path="/dashboard"   element={<ProtectedRoute allowedRoles={['user']}><UserDashboard /></ProtectedRoute>} />
        <Route path="/interview"   element={<ProtectedRoute allowedRoles={['user']}><Interview /></ProtectedRoute>} />
        <Route path="/result"      element={<ProtectedRoute allowedRoles={['user']}><Result /></ProtectedRoute>} />
        
        {/* Organizer routes */}
        <Route path="/admin"       element={<ProtectedRoute allowedRoles={['organizer']}><Admin /></ProtectedRoute>} />
        
        <Route path="*"            element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
