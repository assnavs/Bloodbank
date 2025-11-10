import React, { useState, useEffect } from "react";
import axios from "axios";

function RequestForm({ onRequestSubmit }) {
  const user = JSON.parse(localStorage.getItem("user"));
  const [form, setForm] = useState({
    hospital_id: user?.id || "",
    blood_group: "A+",
    quantity: "",
  });

  const [message, setMessage] = useState("");

  useEffect(() => {
    if (user?.id) {
      setForm((prev) => ({ ...prev, hospital_id: user.id }));
    }
  }, [user]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/request", form);
      setMessage("✅ Request submitted successfully!");
      setForm({ ...form, blood_group: "A+", quantity: "" });
      if (onRequestSubmit) onRequestSubmit();
    } catch (err) {
      setMessage("❌ Failed to submit request. Try again.");
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {message && <div className="alert alert-info py-2">{message}</div>}
      <div>
        <h5 className="fw-bold text-danger mb-3">🩸 Request Blood</h5>
      </div>

      <div className="mb-3">
        <label className="form-label fw-semibold">Blood Group</label>
        <select
          className="form-select"
          name="blood_group"
          value={form.blood_group}
          onChange={handleChange}
        >
          <option>A+</option>
          <option>A-</option>
          <option>B+</option>
          <option>B-</option>
          <option>O+</option>
          <option>O-</option>
          <option>AB+</option>
          <option>AB-</option>
        </select>
      </div>

      <div className="mb-3">
        <label className="form-label fw-semibold">Quantity (units)</label>
        <input
          type="number"
          className="form-control"
          name="quantity"
          value={form.quantity}
          onChange={handleChange}
          required
          min="1"
        />
      </div>

      <input type="hidden" name="hospital_id" value={form.hospital_id} />

      <button type="submit" className="btn btn-danger w-100">
        Submit Request
      </button>
    </form>
  );
}

export default RequestForm;
