import { Routes, Route, Navigate } from 'react-router-dom';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { AppShell } from '@/components/AppShell';
import { LoginPage } from '@/features/auth/LoginPage';
import { DashboardPage } from '@/features/reports/DashboardPage';

// Jobs
import { JobsListPage } from '@/features/jobs/JobsListPage';
import { JobCreatePage } from '@/features/jobs/JobCreatePage';
import { JobDetailPage } from '@/features/jobs/JobDetailPage';

// Customers
import { CustomersListPage } from '@/features/customers/CustomersListPage';
import { CustomerCreatePage } from '@/features/customers/CustomerCreatePage';
import { CustomerDetailPage } from '@/features/customers/CustomerDetailPage';

// Devices
import { DevicesListPage } from '@/features/devices/DevicesListPage';
import { DeviceCreatePage } from '@/features/devices/DeviceCreatePage';
import { DeviceDetailPage } from '@/features/devices/DeviceDetailPage';

// Quotations
import { QuotationsListPage } from '@/features/documents/quotations/QuotationsListPage';
import { QuotationCreatePage } from '@/features/documents/quotations/QuotationCreatePage';
import { QuotationDetailPage } from '@/features/documents/quotations/QuotationDetailPage';
import { QuotationPrintPage } from '@/features/documents/quotations/QuotationPrintPage';

// Invoices
import { InvoicesListPage } from '@/features/documents/invoices/InvoicesListPage';
import { InvoiceCreatePage } from '@/features/documents/invoices/InvoiceCreatePage';
import { InvoiceDetailPage } from '@/features/documents/invoices/InvoiceDetailPage';
import { InvoicePrintPage } from '@/features/documents/invoices/InvoicePrintPage';

// Receipts
import { ReceiptPrintPage } from '@/features/documents/receipts/ReceiptPrintPage';

// Products
import { ProductsListPage } from '@/features/products/ProductsListPage';
import { ProductCreatePage } from '@/features/products/ProductCreatePage';
import { ProductDetailPage } from '@/features/products/ProductDetailPage';
import { StockMovementsPage } from '@/features/products/StockMovementsPage';

// Users (Admin)
import { UsersListPage } from '@/features/users/UsersListPage';
import { UserCreatePage } from '@/features/users/UserCreatePage';

// Settings & Reports
import { SettingsPage } from '@/features/settings/SettingsPage';
import { ReportsPage } from '@/features/reports/ReportsPage';
import { AuditLogPage } from '@/features/audit/AuditLogPage';
import { SearchPage } from '@/features/search/SearchPage';

export function AppRouter() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected routes */}
      <Route element={<RequireAuth><AppShell /></RequireAuth>}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Jobs */}
        <Route path="/jobs" element={<JobsListPage />} />
        <Route path="/jobs/new" element={<JobCreatePage />} />
        <Route path="/jobs/:id" element={<JobDetailPage />} />

        {/* Customers */}
        <Route path="/customers" element={<CustomersListPage />} />
        <Route path="/customers/new" element={<CustomerCreatePage />} />
        <Route path="/customers/:id" element={<CustomerDetailPage />} />

        {/* Devices */}
        <Route path="/devices" element={<DevicesListPage />} />
        <Route path="/devices/new" element={<DeviceCreatePage />} />
        <Route path="/devices/:id" element={<DeviceDetailPage />} />

        {/* Quotations */}
        <Route path="/quotations" element={<QuotationsListPage />} />
        <Route path="/quotations/new" element={<QuotationCreatePage />} />
        <Route path="/quotations/:id" element={<QuotationDetailPage />} />
        <Route path="/quotations/:id/print" element={<QuotationPrintPage />} />

        {/* Invoices */}
        <Route path="/invoices" element={<InvoicesListPage />} />
        <Route path="/invoices/new" element={<InvoiceCreatePage />} />
        <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
        <Route path="/invoices/:id/print" element={<InvoicePrintPage />} />

        {/* Receipts */}
        <Route path="/receipts/:id/print" element={<ReceiptPrintPage />} />

        {/* Products */}
        <Route path="/products" element={<ProductsListPage />} />
        <Route path="/products/new" element={<ProductCreatePage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/products/:id/movements" element={<StockMovementsPage />} />

        {/* Users (Admin only) */}
        <Route path="/users" element={<UsersListPage />} />
        <Route path="/users/new" element={<UserCreatePage />} />

        {/* Settings & System */}
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/audit" element={<AuditLogPage />} />
        <Route path="/search" element={<SearchPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
