import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Place from "./pages/Place";
// import About from "./pages/About";
import Contact from "./pages/Contact";
import DistrictDetail from "./pages/DistrictDetail";
import AllDistricts from "./pages/AllDistricts";
import Explore from "./pages/Explore";
import TourismType from "./pages/TourismType";
import { HelmetProvider } from "react-helmet-async";
import JoinUs from './pages/JoinUs';
import TouristSignup from "./pages/TouristSignup";
import { TouristDashboard } from './pages/TouristDashboard';

import VendorLogin from './pages/VendorDashboard/VendorLogin';
import VendorSignup from './pages/VendorDashboard/VendorSignup';
import VendorDashboard from './pages/VendorDashboard/VendorDashboard';
import GuideLogin from './pages/GuideDashboard/GuideLogin';
import GuideSignup from './pages/GuideDashboard/GuideSignup';
import GuideDashboard from './pages/GuideDashboard/GuideDashboard';
import AdminLogin from './pages/AdminDashboard/AdminLogin';
import AdminSignup from './pages/AdminDashboard/AdminSignup';
import AdminDashboard from './pages/AdminDashboard/AdminDashboard';

import { AuthProvider } from './components/auth/AuthProvider';


import GeoLocation from './components/GeoLocation';
import GeoTransitLive from './components/GeoTransitLive';

// Immersive module (lazy)
const ImmersiveHub = lazy(() => import('./pages/Immersive/ImmersiveHub'));
const ImmersiveExplorer = lazy(() => import('./pages/Immersive/Explorer'));
const VRViewer = lazy(() => import('./pages/Immersive/VRViewer'));
const ARViewer = lazy(() => import('./pages/Immersive/ARViewer'));
const ARScanner = lazy(() => import('./pages/Immersive/ARScanner'));
const VRHeritage = lazy(() => import('./pages/Immersive/VRHeritage'));
const Checkout = lazy(() => import('./pages/Commerce/Checkout'));
const Marketplace = lazy(() => import('./pages/Commerce/Marketplace'));
const ARNavigation = lazy(() => import('./pages/Maps/ARNavigation'));
const WildlifeGuide = lazy(() => import('./pages/AR/WildlifeGuide'));
const ARCalendar = lazy(() => import('./pages/Events/ARCalendar'));
const EcoScores = lazy(() => import('./pages/Sustainability/EcoScores'));
const SafetyAlerts = lazy(() => import('./pages/Safety/SafetyAlerts'));
const AccessibilityCenter = lazy(() => import('./pages/Accessibility/AccessibilityCenter'));
const Souvenirs = lazy(() => import('./pages/NFTs/Souvenirs'));

export default function App() {

  return (
    <HelmetProvider>
      <Router>
        <Suspense fallback={<div className="pt-20 px-4">Loading…</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/district/:id" element={<DistrictDetail />} />
          <Route path="/place/:id" element={<Place />} />
          <Route path="/districts" element={<AllDistricts />} />
          {/* <Route path="/about/:section?" element={<About />} /> */}
          <Route path="/tourism/:type" element={<TourismType />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/ar-navigation" element={<ARNavigation />} />
          <Route path="/wildlife" element={<WildlifeGuide />} />
          <Route path="/events" element={<ARCalendar />} />
          <Route path="/eco" element={<EcoScores />} />
          <Route path="/safety" element={<SafetyAlerts />} />
          <Route path="/accessibility" element={<AccessibilityCenter />} />
          <Route path="/souvenirs" element={<Souvenirs />} />
          <Route path="/join" element={<JoinUs />} />
          <Route path="/signup/tourist" element={<TouristSignup />} />
          <Route path="/geo-location" element={<GeoLocation />} />
          <Route path="/geo-transit-live" element={<GeoTransitLive />} />

          {/* Authenticated dashboards and login/signup routes (flattened) */}
          <Route path="/dashboard" element={<AuthProvider><TouristDashboard /></AuthProvider>} />
          <Route path="/vendor-login" element={<AuthProvider><VendorLogin /></AuthProvider>} />
          <Route path="/vendor-signup" element={<AuthProvider><VendorSignup /></AuthProvider>} />
          <Route path="/vendor-dashboard" element={<AuthProvider><VendorDashboard /></AuthProvider>} />
          <Route path="/guide-login" element={<AuthProvider><GuideLogin /></AuthProvider>} />
          <Route path="/guide-signup" element={<AuthProvider><GuideSignup /></AuthProvider>} />
          <Route path="/guide-dashboard" element={<AuthProvider><GuideDashboard /></AuthProvider>} />
          <Route path="/admin-login" element={<AuthProvider><AdminLogin /></AuthProvider>} />
          <Route path="/admin-signup" element={<AuthProvider><AdminSignup /></AuthProvider>} />
          <Route path="/admin-dashboard" element={<AuthProvider><AdminDashboard /></AuthProvider>} />

          {/* Immersive Experiences */}
          <Route path="/immersive" element={<ImmersiveHub />} />
          <Route path="/immersive/explorer" element={<ImmersiveExplorer />} />
          <Route path="/immersive/vr-viewer" element={<VRViewer />} />
          <Route path="/immersive/ar-viewer" element={<ARViewer />} />
          <Route path="/immersive/ar-scanner" element={<ARScanner />} />
          <Route path="/immersive/vr-heritage" element={<VRHeritage />} />
        </Routes>
        </Suspense>
      </Router>
    </HelmetProvider>
  );
}
