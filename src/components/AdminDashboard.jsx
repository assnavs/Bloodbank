import React, { useEffect, useState } from "react";
import DonorList from "./DonorList";
import InventoryView from "./InventoryView";
import RequestForm from "./RequestForm";
import axios from "axios";
import UserProfile from "./UserProfile";

function AdminDashboard() {
  const user = JSON.parse(localStorage.getItem("user"));
  const [stats, setStats] = useState({
    totalDonors: 0,
    totalHospitals: 0,
    totalUnits: 0,
    pendingRequests: 0,
  });
  const [requests, setRequests] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const fetchStats = async () => {
    try {
      const [donorsRes, hospitalsRes, inventoryRes, requestsRes] = await Promise.all([
        axios.get("http://localhost:5000/api/donors"),
        axios.get("http://localhost:5000/api/hospitals"),
        axios.get("http://localhost:5000/api/inventory"),
        axios.get("http://localhost:5000/api/request"),
      ]);

      const totalUnits = inventoryRes.data.reduce((sum, item) => sum + (item.units || 0), 0);
      const pending = requestsRes.data.filter((r) => r.status === "pending").length;

      setStats({
        totalDonors: donorsRes.data.length,
        totalHospitals: hospitalsRes.data.length,
        totalUnits,
        pendingRequests: pending,
      });

      setRequests(requestsRes.data);
      setHospitals(hospitalsRes.data);
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleRequestUpdate = async (requestId, newStatus) => {
    if (newStatus === "approved") {
      // Find the request to check quantity
      const request = requests.find(r => r.id === requestId);
      if (request) {
        // Check if enough inventory
        try {
          const inventoryRes = await axios.get("http://localhost:5000/api/inventory");
          const bloodGroupInventory = inventoryRes.data.find(
            inv => inv.blood_group === request.blood_group
          );
          
          if (!bloodGroupInventory || bloodGroupInventory.units < request.quantity) {
            const available = bloodGroupInventory ? bloodGroupInventory.units : 0;
            alert(
              `❌ Insufficient inventory!\n` +
              `Available: ${available} units\n` +
              `Requested: ${request.quantity} units`
            );
            return;
          }
        } catch (err) {
          console.error("Error checking inventory:", err);
        }
      }
    }

    try {
      const res = await axios.put(`http://localhost:5000/api/request/${requestId}`, {
        status: newStatus,
      });
      
      if (res.data.message) {
        alert(res.data.message);
      }
      
      fetchStats(); // Refresh data
    } catch (err) {
      console.error("Error updating request:", err);
      const errorMsg = err.response?.data?.error || "Failed to update request";
      alert(errorMsg);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: "warning",
      approved: "success",
      rejected: "danger",
    };
    return badges[status] || "secondary";
  };

  const handleDonationRecorded = () => {
    fetchStats(); // This will refresh all stats including inventory
  };

  const handleProfileUpdate = () => {
    fetchStats();
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="text-danger fw-bold mb-0">
          🧑‍💼 Admin Dashboard - Welcome {user?.name || ""}
        </h3>
        <button onClick={handleLogout} className="btn btn-outline-danger btn-sm">
          Logout
        </button>
      </div>

      {/* 📊 Stats Cards */}
      {activeTab === "overview" && (
        <div className="row mb-4">
          <div className="col-md-3 mb-3">
            <div className="card border-danger">
              <div className="card-body text-center">
                <h5 className="card-title text-danger">👥 Total Donors</h5>
                <h2 className="text-danger">{stats.totalDonors}</h2>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card border-danger">
              <div className="card-body text-center">
                <h5 className="card-title text-danger">🏥 Total Hospitals</h5>
                <h2 className="text-danger">{stats.totalHospitals}</h2>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card border-danger">
              <div className="card-body text-center">
                <h5 className="card-title text-danger">🩸 Total Units</h5>
                <h2 className="text-danger">{stats.totalUnits}</h2>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card border-danger">
              <div className="card-body text-center">
                <h5 className="card-title text-danger">⏳ Pending Requests</h5>
                <h2 className="text-danger">{stats.pendingRequests}</h2>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🧭 Navigation Tabs */}
      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            📊 Overview
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "donors" ? "active" : ""}`}
            onClick={() => setActiveTab("donors")}
          >
            👥 Donors
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "hospitals" ? "active" : ""}`}
            onClick={() => setActiveTab("hospitals")}
          >
            🏥 Hospitals
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "inventory" ? "active" : ""}`}
            onClick={() => setActiveTab("inventory")}
          >
            🩸 Inventory
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "requests" ? "active" : ""}`}
            onClick={() => setActiveTab("requests")}
          >
            📦 Requests
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            👤 Profile
          </button>
        </li>
      </ul>

      {/* 📋 Tab Content */}
      {activeTab === "donors" && (
        <div className="mb-4">
          <DonorList onDonationRecorded={handleDonationRecorded} />
        </div>
      )}

      {activeTab === "hospitals" && (
        <div className="mb-4">
          <h5 className="fw-bold text-danger mb-3">🏥 Registered Hospitals</h5>
          {loading ? (
            <p className="text-muted">Loading hospitals...</p>
          ) : hospitals.length === 0 ? (
            <p className="text-muted">No hospitals registered.</p>
          ) : (
            <table className="table table-striped table-hover table-bordered">
              <thead className="table-danger">
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                {hospitals.map((h) => (
                  <tr key={h.id}>
                    <td>{h.id}</td>
                    <td>{h.name}</td>
                    <td>{h.email}</td>
                    <td>{h.location || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === "inventory" && (
        <div className="mb-4">
          <InventoryView />
        </div>
      )}

      {activeTab === "requests" && (
        <div className="mb-4">
          <h5 className="fw-bold text-danger mb-3">📦 Blood Requests Management</h5>
          {loading ? (
            <p className="text-muted">Loading requests...</p>
          ) : requests.length === 0 ? (
            <p className="text-muted">No requests found.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped table-hover table-bordered">
                <thead className="table-danger">
                  <tr>
                    <th>ID</th>
                    <th>Hospital</th>
                    <th>Blood Group</th>
                    <th>Quantity</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => (
                    <tr key={req.id}>
                      <td>{req.id}</td>
                      <td>{req.hospital_name || `Hospital #${req.hospital_id}`}</td>
                      <td>{req.blood_group}</td>
                      <td>{req.quantity} units</td>
                      <td>
                        <span className={`badge bg-${getStatusBadge(req.status)}`}>
                          {req.status}
                        </span>
                      </td>
                      <td>
                        {req.created_at
                          ? new Date(req.created_at).toLocaleDateString()
                          : "—"}
                      </td>
                      <td>
                        {req.status === "pending" && (
                          <div className="btn-group btn-group-sm">
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handleRequestUpdate(req.id, "approved")}
                            >
                              ✓ Approve
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleRequestUpdate(req.id, "rejected")}
                            >
                              ✗ Reject
                            </button>
                          </div>
                        )}
                        {req.status !== "pending" && (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "overview" && (
        <div className="row">
          <div className="col-md-6 mb-4">
            <DonorList onDonationRecorded={handleDonationRecorded} />
          </div>
          <div className="col-md-6 mb-4">
            <InventoryView />
          </div>
        </div>
      )}

      {activeTab === "profile" && (
        <div className="mb-4">
          <UserProfile userId={user?.id} onProfileUpdate={handleProfileUpdate} />
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
