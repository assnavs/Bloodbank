import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function LoginForm() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await axios.post("http://localhost:5000/api/login", form);
      const { role } = res.data;

      // Save user session in local storage
      localStorage.setItem("user", JSON.stringify(res.data));

      // Redirect based on role
      if (role === "admin") navigate("/admin");
      else if (role === "hospital") navigate("/hospital");
      else navigate("/user");
    } catch (err) {
      setError("Invalid credentials or server error.");
      console.error(err);
    }
  };

  return (
    <div className="container mt-5 col-md-5">
      <div className="card shadow p-4 rounded-4">
        <h4 className="text-danger fw-bold mb-3 text-center">Login</h4>
        {error && <div className="alert alert-danger py-2">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label>Email</label>
            <input
              type="email"
              name="email"
              className="form-control"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="mb-3">
            <label>Password</label>
            <input
              type="password"
              name="password"
              className="form-control"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" className="btn btn-danger w-100">
            Login
          </button>
        </form>
        <p className="text-center mt-2">
          Don’t have an account? <a href="/register">Register</a>
        </p>
      </div>
    </div>
  );
}

export default LoginForm;
