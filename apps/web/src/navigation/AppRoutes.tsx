import { Navigate, Route, Routes } from 'react-router-dom';
import { ERPLayout } from '../layout/ERPLayout.js';
import { DashboardPage } from '../features/dashboard/DashboardPage.js';
import { LoginPage } from '../features/auth/LoginPage.js';
import { RegisterPage } from '../features/auth/RegisterPage.js';
import { ProtectedRoute } from './ProtectedRoute.js';
import { CustomersPage } from '../features/management/CustomersPage.js';
import { ProductsPage } from '../features/management/ProductsPage.js';
import { UsersPage } from '../features/management/UsersPage.js';

export function AppRoutes() {
  return <Routes>
    <Route path="login" element={<LoginPage />} />
    <Route path="register" element={<RegisterPage />} />
    <Route element={<ProtectedRoute><ERPLayout /></ProtectedRoute>}>
      <Route index element={<Navigate to="/dashboard" replace />} />
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="customers" element={<CustomersPage />} />
      <Route path="products" element={<ProductsPage />} />
      <Route path="settings/users" element={<UsersPage />} />
    </Route>
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>;
}
