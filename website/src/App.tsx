import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Core Pages (Fast Static Load for initial paint)
import { Home } from './pages/Home';
import { Courses } from './pages/Courses';
import { About } from './pages/About';
import { Results } from './pages/Results';
import { Contact } from './pages/Contact';

// Heavy & Secondary Pages (Code-split with React.lazy for instant initial website load)
const BrainGames = lazy(() => import('./pages/BrainGames').then((m) => ({ default: m.BrainGames })));
const DemoHub = lazy(() => import('./pages/DemoHub').then((m) => ({ default: m.DemoHub })));
const DesignSystem = lazy(() => import('./pages/DesignSystem').then((m) => ({ default: m.DesignSystem })));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy').then((m) => ({ default: m.PrivacyPolicy })));
const Terms = lazy(() => import('./pages/Terms').then((m) => ({ default: m.Terms })));
const RefundPolicy = lazy(() => import('./pages/RefundPolicy').then((m) => ({ default: m.RefundPolicy })));
const VerifyCertificate = lazy(() => import('./pages/VerifyCertificate').then((m) => ({ default: m.VerifyCertificate })));

// Fast minimalist loader for lazy components
const PageLoader: React.FC = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
    <div className="w-10 h-10 border-3 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-3" />
    <span className="text-xs font-semibold text-slate-500">Loading MindMaster Academy...</span>
  </div>
);

// Scroll to top on route change
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

export const App: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background font-body-md text-on-surface antialiased">
      <ScrollToTop />
      <Navbar />
      <div className="flex-1">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/about" element={<About />} />
            <Route path="/results" element={<Results />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/demo-hub" element={<DemoHub />} />
            <Route path="/design-system" element={<DesignSystem />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/terms-and-conditions" element={<Terms />} />
            <Route path="/refund" element={<RefundPolicy />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />
            <Route path="/brain-games" element={<BrainGames />} />
            <Route path="/games" element={<BrainGames />} />
            <Route path="/play" element={<BrainGames />} />
            <Route path="/verify-certificate" element={<VerifyCertificate />} />
            <Route path="/verify" element={<VerifyCertificate />} />
          </Routes>
        </Suspense>
      </div>
      <Footer />
    </div>
  );
};

export default App;
