import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { Home } from "@/routes/Home";
import { Study } from "@/routes/Study";
import { About } from "@/routes/About";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function App() {
  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col bg-[var(--color-background)]">
        <Header />
        <main className="flex-1 mx-auto w-full max-w-[960px] px-4 sm:px-6 py-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/study/:theme" element={<Study />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </HashRouter>
  );
}
