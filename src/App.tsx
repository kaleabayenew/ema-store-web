import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ADMIN_BASE } from '@/lib/basePath'

import { SessionExpiredDialog } from './components/auth/SessionExpiredDialog'
import { AppLayout } from './components/layout/AppLayout'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { ConfirmProvider } from './components/ui/ConfirmDialog'
import { TopProgressBar } from './components/ui/TopProgressBar'
import { AboutPage } from './features/about/AboutPage'
import { AppPagesPage } from './features/app-pages/AppPagesPage'
import { AnnouncementsPage } from './features/announcements/AnnouncementsPage'
import { ApprovalsPage } from './features/approvals/ApprovalsPage'
import { ForbiddenPage } from './features/auth/ForbiddenPage'
import { ForgotPasswordPage } from './features/auth/ForgotPasswordPage'
import { LoginPage } from './features/auth/LoginPage'
import { OtpPage } from './features/auth/OtpPage'
import { BidControlPage } from './features/bids/BidControlPage'
import { PaymentBannersPage } from './features/banners/PaymentBannersPage'
import { CustomersPage } from './features/customers/CustomersPage'
import { ContactPage } from './features/contact/ContactPage'
import { CreditPage } from './features/credits/CreditPage'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { DeliveryPage } from './features/delivery/DeliveryPage'
import { OverduePage } from './features/delivery/OverduePage'
import { FinancePage } from './features/finance/FinancePage'
import { FeedbackPage } from './features/feedback/FeedbackPage'
import { FlashDealsPage } from './features/flash-deals/FlashDealsPage'
import { IntegrationsPage } from './features/integrations/IntegrationsPage'
import { MarketingPage } from './features/marketing/MarketingPage'
import { LocationsMapPage } from './features/locations/LocationsMapPage'
import { NotificationsPage } from './features/notifications/NotificationsPage'
import { OrdersPage } from './features/orders/OrdersPage'
import { PartnersPage } from './features/partners/PartnersPage'
import { ProductsPage } from './features/products/ProductsPage'
import { ProfilePage } from './features/profile/ProfilePage'
import { ReportsPage } from './features/reports/ReportsPage'
import { ReviewsPage } from './features/reviews/ReviewsPage'
import { RidePage } from './features/ride/RidePage'
import { BalancePage } from './features/balance/BalancePage'
import { SeasonalPromotionsPage } from './features/seasonal-promotions/SeasonalPromotionsPage'
import { NotFoundPage } from './features/shared/NotFoundPage'
import { SettingsPage } from './features/settings/SettingsPage'
import { SupportPage } from './features/support/SupportPage'
import { UsersPage } from './features/users/UsersPage'
import { useAutoLogout } from './hooks/useAutoLogout'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { bootstrapSession } from './services/session'
import { useAuthStore } from './store/authStore'

function App() {
  const { isAuthenticated, sessionChecked } = useAuthStore()
  useAutoLogout()

  // Restore the session from the HttpOnly cookie once on startup.
  useEffect(() => {
    void bootstrapSession()
  }, [])

  // Hold rendering until the session check finishes so protected routes
  // never flash the login page for a user with a valid cookie session.
  if (!sessionChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600" />
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <ConfirmProvider>
      <BrowserRouter basename={ADMIN_BASE}>
      <TopProgressBar />
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
            <Route path="/locations" element={<LocationsMapPage />} />
            <Route path="/marketing" element={<MarketingPage />} />
            <Route path="/flash-deals" element={<FlashDealsPage />} />
            <Route path="/seasonal-promotions" element={<SeasonalPromotionsPage />} />
            <Route path="/bids" element={<BidControlPage />} />
            <Route path="/support"   element={<SupportPage />} />
            <Route path="/contact"   element={<ContactPage />} />
            <Route path="/delivery"  element={<DeliveryPage />} />
            <Route path="/delivery/overdue" element={<OverduePage />} />
            <Route path="/finance"   element={<FinancePage />} />
            <Route path="/balance"   element={<BalancePage />} />
            <Route path="/credits"   element={<CreditPage />} />
            <Route path="/approvals" element={<ApprovalsPage />} />
            <Route path="/banners"   element={<PaymentBannersPage />} />
            <Route path="/announcements" element={<AnnouncementsPage />} />
            <Route path="/about"     element={<AboutPage />} />
            <Route path="/app-pages/customer" element={<AppPagesPage app="customer" />} />
            <Route path="/app-pages/partner"  element={<AppPagesPage app="partner" />} />
            <Route path="/reviews"   element={<ReviewsPage />} />
            <Route path="/feedback"  element={<FeedbackPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />

            {/* Admin */}
            <Route path="/users"    element={<UsersPage />} />
            <Route path="/integrations" element={<IntegrationsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/settings/audit-log" element={<SettingsPage />} />

            <Route path="/profile" element={<ProfilePage />} />

            {/* Catch-all — unknown URLs show 404 inside the layout */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
      </ConfirmProvider>
    </ErrorBoundary>
  )
}

export default App