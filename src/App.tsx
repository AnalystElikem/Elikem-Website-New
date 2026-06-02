import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import AboutTeaser from "./components/AboutTeaser";
import Expertise from "./components/Expertise";
import LatestArticles from "./components/LatestArticles";
import Newsletter from "./components/Newsletter";
import Footer from "./components/Footer";

import About from "./pages/About";
import Pastor from "./pages/Pastor";
import Analyst from "./pages/Analyst";
import Writer from "./pages/Writer";
import Blog from "./pages/Blog";
import BlogDetail from "./pages/BlogDetail";

// ✅ HOME PAGE COMPONENT
function Home() {
  return (
    <div
      style={{
        background: "#f5f2eb",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <Navbar />

      <div id="home">
        <Hero />
      </div>

      <div id="about">
        <AboutTeaser />
      </div>

      <div id="expertise">
        <Expertise />
      </div>

      <div id="latest-articles">
        <LatestArticles />
      </div>

      <div id="newsletter">
        <Newsletter />
      </div>

      <Footer />
    </div>
  );
}

// ✅ APP ROUTER
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/pastor" element={<Pastor />} />
      <Route path="/data" element={<Analyst />} />
      <Route path="/writing" element={<Writer />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/blog/:blogName" element={<BlogDetail />} />
    </Routes>
  );
}