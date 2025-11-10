import React, { useState } from "react";
import axios from "axios";

function RegisterForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "donor", // default role
    blood_group: "A+",
    location: "",
  });

  const [status, setStatus] = useState({ type: "", msg: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: "", msg: "" });

    try {
      const res = await axios.post("http://localhost:5000/api/register", form);
      setStatus({
        type: "success",
        msg: res.data.message || "✅ Registered successfully!",
      });
      setForm({
        name: "",
        email: "",
        password: "",
        role: "donor",
        blood_group: "A+",
        location: "",
      });
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "❌ Something went wrong! Please try again.";
      setStatus({ type: "error", msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5 col-md-6">
      <div className="card shadow p-4 rounded-4">
        <h4 className="text-danger fw-bold mb-3 text-center">
          🩸 Registration Form
        </h4>

        {status.msg && (
          <div
            className={`alert ${
              status.type === "success" ? "alert-success" : "alert-danger"
            } py-2`}
          >
            {status.msg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Name */}
          <div className="mb-3">
            <label className="form-label">Full Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>

          {/* Email */}
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>

          {/* Password */}
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>

          {/* Role Selection */}
          <div className="mb-3">
            <label className="form-label">Register As</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="form-select"
            >
              <option value="donor">Donor</option>
              <option value="hospital">Hospital</option>
            </select>
          </div>

          {/* Blood Group */}
          {form.role === "donor" && (
            <div className="mb-3">
              <label className="form-label">Blood Group</label>
              <select
                name="blood_group"
                value={form.blood_group}
                onChange={handleChange}
                className="form-select"
              >
                {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </div>
          )}

          {/* Location */}
          <div className="mb-3">
            <label className="form-label">Location</label>
            <input
              name="location"
              value={form.location}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>

          {/* Submit Button */}
          <button className="btn btn-danger w-100" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <p className="text-center mt-3">
          Already have an account? <a href="/login">Login</a>
        </p>
      </div>
    </div>
  );
}

export default RegisterForm;
