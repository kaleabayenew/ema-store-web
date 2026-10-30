import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { SessionExpiredDialog } from './components/auth/SessionExpiredDialog'
import { AppLayout } from './components/layout/AppLayout'
import { ApprovalsPage } from './features/approvals/ApprovalsPage'
import { ForbiddenPage } from './features/auth/ForbiddenPage'
import { ForgotPasswordPage } from './features/auth/ForgotPasswordPage'
import { LoginPage } from './features/auth/LoginPage'
import { OtpPage } from './features/auth/OtpPage'
import { CustomersPage } from './features/customers/CustomersPage'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { DeliveryPage } from './features/delivery/DeliveryPage'
import { FinancePage } from './features/finance/FinancePage'
import { FlashDealsPage } from './features/flash-deals/FlashDealsPage'
import { MarketingPage } from './features/marketing/MarketingPage'
import { NotificationsPage } from './features/notifications/NotificationsPage'
import { OrdersPage } from './features/orders/OrdersPage'
import { PartnersPage } from './features/partners/PartnersPage'
import { ProductsPage } from './features/products/ProductsPage'
import { ReportsPage } from './features/reports/ReportsPage'
import { RidePage } from './features/ride/RidePage'
import { SettingsPage } from './features/settings/SettingsPage'
import { SupportPage } from './features/support/SupportPage'
import { UsersPage } from './features/users/UsersPage'
import { useAutoLogout } from './hooks/useAutoLogout'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { useAuthStore } from './store/authStore'

function App() {
  const { isAuthenticated } = useAuthStore()
  useAutoLogout()

  return (
    <BrowserRouter>
      <SessionExpiredDialog />
      <Routes>
        {/* Public */}
        <Route path="/login"           element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
        <Route path="/otp"             element={<OtpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/403"             element={<ForbiddenPage />} />

        {/* Protected — all routes share AppLayout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />

            {/* Overview */}
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/reports"   element={<ReportsPage />} />

            {/* Operations */}
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/partners"  element={<PartnersPage />} />
            <Route path="/products"  element={<ProductsPage />} />
            <Route path="/orders"    element={<OrdersPage />} />
            <Route path="/ride"      element={<RidePage />} />
            <Route path="/marketing" element={<MarketingPage />} />
            <Route path="/flash-deals" element={<FlashDealsPage />} />
            <Route path="/support"   element={<SupportPage />} />
            <Route path="/delivery"  element={<DeliveryPage />} />
            <Route path="/finance"   element={<FinancePage />} />
            <Route path="/approvals" element={<ApprovalsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />

            {/* Admin */}
            <Route path="/users"    element={<UsersPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/settings/audit-log" element={<SettingsPage />} />

            {/* Profile placeholder */}
            <Route path="/profile" element={
              <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                Profile page coming soon
              </div>
            } />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
