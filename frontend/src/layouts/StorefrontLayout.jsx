import { Outlet } from 'react-router-dom';

import Footer from '@/components/Footer.jsx';
import Navbar from '@/components/Navbar.jsx';
import ScrollToTop from '@/components/ScrollToTop.jsx';

function StorefrontLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <ScrollToTop />
      <Navbar />
      <div className="flex-1"><Outlet /></div>
      <Footer />
    </div>
  );
}

export default StorefrontLayout;
