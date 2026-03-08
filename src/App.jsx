import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import HeroSection from "./components/HeroSection";
import Features from "./components/Features";
import AppScreenshots from "./components/AppScreenshots";
import WhyAreWeUnique from "./components/WhyAreWeUnique";
import InputBahan from "./components/pages/InputBahan";
import Rekomendasi from "./components/pages/Rekomendasi";
import DetailBahan from "./components/pages/DetailBahan";
import UploadResep from "./components/pages/UploadResep";
import { ScrollToTop } from "./components/ScrollToTop";
import "./index.css";

function LandingPage() {
  return (
    <div className="landing-page">
      <Header />
      <HeroSection />
      <Features />
      <AppScreenshots />
      <WhyAreWeUnique />
    </div>
  );
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/input" element={<InputBahan />} />
        <Route path="/rekomendasi" element={<Rekomendasi />} />
        <Route path="/detail/:id" element={<DetailBahan />} />
        <Route path="/upload-resep" element={<UploadResep />} />
        <Route path="/edit-resep/:id" element={<UploadResep />} />
      </Routes>
    </Router>
  );
}

export default App;