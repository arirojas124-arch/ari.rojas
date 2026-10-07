import { Navigate, Route, Routes } from 'react-router-dom';
import { ERPLayout } from '../layout/ERPLayout.js';
import { DashboardPage } from '../features/dashboard/DashboardPage.js';
import { LoginPage } from '../features/auth/LoginPage.js';
import { RegisterPage } from '../features/auth/RegisterPage.js';
import { ProtectedRoute } from './ProtectedRoute.js';
import { CustomersPage } from '../features/management/CustomersPage.js';
import { ProductsPage } from '../features/management/ProductsPage.js';
import { UsersPage } from '../features/management/UsersPage.js';
import { SalesPage } from '../features/management/SalesPage.js';
import { InvoicesPage } from '../features/management/InvoicesPage.js';
import { ReportsPage } from '../features/management/ReportsPage.js';
import { SuppliersPage } from '../features/management/SuppliersPage.js';
import { CategoriesPage } from '../features/management/CategoriesPage.js';
import { WarehousesPage } from '../features/management/WarehousesPage.js';
import { InventoryPage } from '../features/management/InventoryPage.js';
import { QuotesPage } from '../features/management/QuotesPage.js';
import { InventoryMovementsPage } from '../features/management/InventoryMovementsPage.js';
import { CompanyPage } from '../features/management/CompanyPage.js';
import { PurchaseRequestsPage } from '../features/management/PurchaseRequestsPage.js';
import { PurchaseOrdersPage } from '../features/management/PurchaseOrdersPage.js';
import { ReceiptsPage } from '../features/management/ReceiptsPage.js';
import { FinancePage } from '../features/management/FinancePage.js';
import { ReceivablesPage } from '../features/management/ReceivablesPage.js';
import { PayablesPage } from '../features/management/PayablesPage.js';
import { EmployeesPage } from '../features/management/EmployeesPage.js';
import { AttendancePage } from '../features/management/AttendancePage.js';
import { DepartmentsPage } from '../features/management/DepartmentsPage.js';
import { ProjectsPage } from '../features/management/ProjectsPage.js';
import { TasksPage } from '../features/management/TasksPage.js';
import { AuditPage } from '../features/management/AuditPage.js';

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
      <Route path="sales" element={<SalesPage />} />
      <Route path="invoices" element={<InvoicesPage />} />
      <Route path="reports" element={<ReportsPage />} />
      <Route path="suppliers" element={<SuppliersPage />} />
      <Route path="categories" element={<CategoriesPage />} />
      <Route path="warehouses" element={<WarehousesPage />} />
      <Route path="inventory" element={<InventoryPage />} />
      <Route path="quotes" element={<QuotesPage />} />
      <Route path="inventory/movements" element={<InventoryMovementsPage />} />
      <Route path="settings/company" element={<CompanyPage />} />
      <Route path="purchase-requests" element={<PurchaseRequestsPage />} />
      <Route path="purchases" element={<PurchaseOrdersPage />} />
      <Route path="receipts" element={<ReceiptsPage />} />
      <Route path="finance" element={<FinancePage />} />
      <Route path="receivables" element={<ReceivablesPage />} />
      <Route path="payables" element={<PayablesPage />} />
      <Route path="employees" element={<EmployeesPage />} />
      <Route path="attendance" element={<AttendancePage />} />
      <Route path="departments" element={<DepartmentsPage />} />
      <Route path="projects" element={<ProjectsPage />} />
      <Route path="tasks" element={<TasksPage />} />
      <Route path="settings/audit" element={<AuditPage />} />
    </Route>
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>;
}
