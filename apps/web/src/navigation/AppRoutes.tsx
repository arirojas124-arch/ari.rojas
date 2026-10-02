import { Navigate, Route, Routes } from 'react-router-dom';
import { ERPLayout } from '../layout/ERPLayout.js';
import { DashboardPage } from '../features/dashboard/DashboardPage.js';
import { LoginPage } from '../features/auth/LoginPage.js';
import { RegisterPage } from '../features/auth/RegisterPage.js';
import { ProtectedRoute } from './ProtectedRoute.js';

export function AppRoutes() {
  return <Routes>
    <Route path="login" element={<LoginPage />} />
    <Route path="register" element={<RegisterPage />} />
    <Route element={<ProtectedRoute><ERPLayout /></ProtectedRoute>}>
      <Route index element={<Navigate to="/dashboard" replace />} />
      <Route path="dashboard" element={<DashboardPage />} />
    </Route>
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>;
}
