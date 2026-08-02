import { Route, Routes } from 'react-router-dom';

import AuthLayout from '@/layouts/AuthLayout.jsx';
import DashboardLayout from '@/layouts/DashboardLayout.jsx';
import StorefrontLayout from '@/layouts/StorefrontLayout.jsx';
import DashboardPage from '@/pages/DashboardPage.jsx';
import DashboardSectionPage from '@/pages/DashboardSectionPage.jsx';
import LandingPage from '@/pages/LandingPage.jsx';
import OurStoryPage from '@/pages/OurStoryPage.jsx';
import CategoriesPage from '@/pages/CategoriesPage.jsx';
import BuyerOrdersPage from '@/pages/BuyerOrdersPage.jsx';
import CartPage from '@/pages/CartPage.jsx';
import CheckoutPage from '@/pages/CheckoutPage.jsx';
import OrderDetailsPage from '@/pages/OrderDetailsPage.jsx';
import ProfilePage from '@/pages/ProfilePage.jsx';
import ProductDetailsPage from '@/pages/ProductDetailsPage.jsx';
import ProductFormPage from '@/pages/ProductFormPage.jsx';
import ShopPage from '@/pages/ShopPage.jsx';
import MyProductsPage from '@/pages/MyProductsPage.jsx';
import SettingsPage from '@/pages/SettingsPage.jsx';
import WishlistPage from '@/pages/WishlistPage.jsx';
import RoutePage from '@/pages/RoutePage.jsx';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage.jsx';
import LoginPage from '@/pages/auth/LoginPage.jsx';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage.jsx';
import RegisterTypePage from '@/pages/auth/RegisterTypePage.jsx';
import CustomerRegisterPage from '@/pages/auth/CustomerRegisterPage.jsx';
import SellerRegisterPage from '@/pages/auth/SellerRegisterPage.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';

const page = (title, description, eyebrow) => (
  <RoutePage title={title} description={description} eyebrow={eyebrow} />
);

const dashboardSections = ['products', 'inventory', 'orders', 'analytics', 'revenue', 'users', 'categories', 'coupons', 'sellers', 'settings'];

function AppRoutes() {
  return (
    <Routes>
      <Route element={<StorefrontLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="shop" element={<ShopPage />} />
        <Route path="shop/:identifier" element={<ProductDetailsPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="search" element={<ShopPage searchMode />} />
        <Route path="about" element={<OurStoryPage />} />
        <Route path="creators" element={page('Meet the makers', 'Independent studios, patient processes, and people with a point of view.', 'Community')} />
        <Route path="creator/apply" element={page('Build here', 'Bring your practice, products, and perspective to a marketplace designed around independent work.', 'For creators')} />
        <Route path="shipping" element={page('Shipping & returns', 'Clear expectations, careful packing, and support when plans change.', 'Help')} />
        <Route path="contact" element={page('Talk to a human', 'Questions about an order, a product, or joining the marketplace? We are here.', 'Help')} />
        <Route path="journal" element={page('Field notes', 'Conversations, studio visits, and useful ideas from the IndigoMart community.', 'Journal')} />

        <Route element={<ProtectedRoute />}>
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="wishlist" element={<WishlistPage />} />
          <Route path="orders" element={<BuyerOrdersPage />} />
          <Route path="orders/:id" element={<OrderDetailsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        <Route path="*" element={<RoutePage eyebrow="404" title="A little off course." description="The page you were looking for has moved, changed, or never made it to market." actionLabel="Return home" actionTo="/" />} />
      </Route>

      <Route element={<AuthLayout />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="signup" element={<RegisterTypePage />} />
        <Route path="signup/customer" element={<CustomerRegisterPage />} />
        <Route path="signup/seller" element={<SellerRegisterPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password/:token" element={<ResetPasswordPage />} />
      </Route>

      <Route element={<ProtectedRoute roles={['creator', 'seller']} />}>
        <Route path="seller" element={<DashboardLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="my-products" element={<MyProductsPage />} />
          <Route path="my-products/new" element={<ProductFormPage />} />
          <Route path="my-products/:id" element={<ProductFormPage />} />
          <Route path="settings" element={<SettingsPage />} />
          {dashboardSections.filter((section) => section !== 'users' && section !== 'categories' && section !== 'settings').map((section) => (
            <Route key={section} path={section} element={<DashboardSectionPage title={section[0].toUpperCase() + section.slice(1)} />} />
          ))}
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['creator']} />}>
        <Route path="creator" element={<DashboardLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="settings" element={<SettingsPage />} />
          {dashboardSections.filter((section) => section !== 'users' && section !== 'categories' && section !== 'settings').map((section) => (
            <Route key={section} path={section} element={<DashboardSectionPage title={section[0].toUpperCase() + section.slice(1)} />} />
          ))}
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['admin']} />}>
        <Route path="admin" element={<DashboardLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="settings" element={<SettingsPage />} />
          {dashboardSections.filter((section) => section !== 'users' && section !== 'inventory' && section !== 'revenue' && section !== 'settings').map((section) => (
            <Route key={section} path={section} element={<DashboardSectionPage title={section[0].toUpperCase() + section.slice(1)} />} />
          ))}
        </Route>
      </Route>
    </Routes>
  );
}

export default AppRoutes;