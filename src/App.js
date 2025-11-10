// ✅ App.js

import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";

// ✅ Import all components
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import UserDashboard from "./components/UserDashboard";
import HospitalDashboard from "./components/HospitalDashboard";
import AdminDashboard from "./components/AdminDashboard";

function App() {
  const location = useLocation();

  // 🔒 Protect routes (redirect to /login if not logged in)
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    const allowedPaths = ["/login", "/register", "/"];
    if (!user && !allowedPaths.includes(location.pathname)) {
      window.location.href = "/login";
    }
  }, [location.pathname]);

  return (
    <>
      {/* 🔹 Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-danger">
        <div className="container">
          <Link className="navbar-brand fw-bold" to="/">
            🩸 Blood Bank
          </Link>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <Link className="nav-link" to="/login">
                  Login
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/register">
                  Register
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* 🔹 Routes */}
      <div className="container mt-4 mb-5">
        <Routes>
          <Route path="/" element={<LoginForm />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/user" element={<UserDashboard />} />
          <Route path="/hospital" element={<HospitalDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </div>

      {/* 🔹 Footer */}
      <footer className="bg-light text-center text-muted py-3 border-top fixed-bottom">
        <p className="mb-0">
          © 2025 Blood Bank System | Built with ❤️ using Flask & React
        </p>
      </footer>
    </>
  );
}

// ✅ Wrap with Router
export default function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}
