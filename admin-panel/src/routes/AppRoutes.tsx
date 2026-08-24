import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ReservationsPage } from '../pages/ReservationsPage';
import { ReservationDetailsPage } from '../pages/ReservationDetailsPage';
import { OrdersPage } from '../pages/OrdersPage';
import { OrderDetailsPage } from '../pages/OrderDetailsPage';
import { ProfilePage } from '../pages/ProfilePage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { HomePage } from '../pages/cms/HomePage';
import { AboutPage } from '../pages/cms/AboutPage';
import { GalleryPage } from '../pages/cms/GalleryPage';
import { ContactPage } from '../pages/cms/ContactPage';
import { SocialMediaPage } from '../pages/cms/SocialMediaPage';
import { SettingsPage } from '../pages/cms/SettingsPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/reservations" element={<ReservationsPage />} />
        <Route path="/reservations/:id" element={<ReservationDetailsPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/orders/:id" element={<OrderDetailsPage />} />
        <Route path="/cms/home" element={<HomePage />} />
        <Route path="/cms/about" element={<AboutPage />} />
        <Route path="/cms/gallery" element={<GalleryPage />} />
        <Route path="/cms/contact" element={<ContactPage />} />
        <Route path="/cms/social-media" element={<SocialMediaPage />} />
        <Route path="/cms/settings" element={<SettingsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
