import React, { useState, useEffect } from "react";
import axios from "axios";

function UserProfile({ userId, onProfileUpdate }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [form, setForm] = useState({
    name: "",
    email: "",
    blood_group: "",
    location: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:5000/api/user/${userId}`);
      setProfile(res.data);
      setForm({
        name: res.data.name || "",
        email: res.data.email || "",
        blood_group: res.data.blood_group || "",
        location: res.data.location || "",
        password: "",
        confirmPassword: "",
      });
    } catch (err) {
      console.error("Error fetching profile:", err);
      setMessage({
        type: "error",
        text: "Failed to load profile",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEdit = () => {
    setEditing(true);
    setMessage({ type: "", text: "" });
  };

  const handleCancel = () => {
    setEditing(false);
    setMessage({ type: "", text: "" });
    // Reset form to original values
    if (profile) {
      setForm({
        name: profile.name || "",
        email: profile.email || "",
        blood_group: profile.blood_group || "",
        location: profile.location || "",
        password: "",
        confirmPassword: "",
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    // Validate password if provided
    if (form.password && form.password !== form.confirmPassword) {
      setMessage({
        type: "error",
        text: "❌ Passwords do not match",
      });
      return;
    }

    if (form.password && form.password.length < 6) {
      setMessage({
        type: "error",
        text: "❌ Password must be at least 6 characters",
      });
      return;
    }

    setSaving(true);
    try {
      const updateData = {
        name: form.name,
        email: form.email,
        blood_group: form.blood_group,
        location: form.location,
      };

      // Only include password if it's provided
      if (form.password) {
        updateData.password = form.password;
      }

      await axios.put(`http://localhost:5000/api/user/${userId}`, updateData);

      setMessage({
        type: "success",
        text: "✅ Profile updated successfully!",
      });

      // Refresh profile
      await fetchProfile();
      setEditing(false);

      // Update localStorage if it's the current user
      const currentUser = JSON.parse(localStorage.getItem("user"));
      if (currentUser && currentUser.id === userId) {
        const updatedUser = {
          ...currentUser,
          name: form.name,
          email: form.email,
          blood_group: form.blood_group,
          location: form.location,
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }

      // Callback to notify parent component
      if (onProfileUpdate) {
        onProfileUpdate();
      }

      // Reload page after 1 second to reflect changes
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      console.error("Error updating profile:", err);
      setMessage({
        type: "error",
        text: err.response?.data?.error || "❌ Failed to update profile",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center p-4">
        <p className="text-muted">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="alert alert-danger">
        ❌ Failed to load profile
      </div>
    );
  }

  return (
    <div className="card border-danger">
      <div className="card-header bg-danger text-white d-flex justify-content-between align-items-center">
        <h5 className="mb-0">👤 User Profile</h5>
        {!editing && (
          <button
            className="btn btn-light btn-sm"
            onClick={handleEdit}
          >
            ✏️ Edit Profile
          </button>
        )}
      </div>
      <div className="card-body">
        {message.text && (
          <div
            className={`alert alert-${
              message.type === "error" ? "danger" : "success"
            } py-2`}
          >
            {message.text}
          </div>
        )}

        {!editing ? (
          // View Mode
          <div>
            <table className="table table-borderless">
              <tbody>
                <tr>
                  <th width="30%">Name:</th>
                  <td>{profile.name || "—"}</td>
                </tr>
                <tr>
                  <th>Email:</th>
                  <td>{profile.email || "—"}</td>
                </tr>
                <tr>
                  <th>Role:</th>
                  <td>
                    <span className="badge bg-danger">
                      {profile.role?.toUpperCase() || "—"}
                    </span>
                  </td>
                </tr>
                <tr>
                  <th>Blood Group:</th>
                  <td>{profile.blood_group || "Not specified"}</td>
                </tr>
                <tr>
                  <th>Location:</th>
                  <td>{profile.location || "Not specified"}</td>
                </tr>
                {profile.role === "donor" && profile.last_donation_date && (
                  <tr>
                    <th>Last Donation:</th>
                    <td>
                      {new Date(profile.last_donation_date).toLocaleDateString()}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          // Edit Mode
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label fw-semibold">Name</label>
              <input
                type="text"
                className="form-control"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Email</label>
              <input
                type="email"
                className="form-control"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            {profile.role === "donor" && (
              <div className="mb-3">
                <label className="form-label fw-semibold">Blood Group</label>
                <select
                  className="form-select"
                  name="blood_group"
                  value={form.blood_group}
                  onChange={handleChange}
                >
                  <option value="">Select Blood Group</option>
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
            )}

            <div className="mb-3">
              <label className="form-label fw-semibold">Location</label>
              <input
                type="text"
                className="form-control"
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="Enter your location"
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">
                New Password (leave blank to keep current)
              </label>
              <input
                type="password"
                className="form-control"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter new password"
              />
            </div>

            {form.password && (
              <div className="mb-3">
                <label className="form-label fw-semibold">Confirm Password</label>
                <input
                  type="password"
                  className="form-control"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm new password"
                />
              </div>
            )}

            <div className="d-flex gap-2">
              <button
                type="submit"
                className="btn btn-danger"
                disabled={saving}
              >
                {saving ? "Saving..." : "💾 Save Changes"}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default UserProfile;
