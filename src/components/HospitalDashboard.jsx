import React, { useEffect, useState } from "react";
import RequestForm from "./RequestForm";
import InventoryView from "./InventoryView";
import UserProfile from "./UserProfile";
import axios from "axios";

function HospitalDashboard() {
  const user = JSON.parse(localStorage.getItem("user"));
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const fetchMyRequests = () => {
    if (!user?.id) return;
    setLoading(true);
    axios
      .get(`http://localhost:5000/api/request?hospital_id=${user.id}`)
      .then((res) => setMyRequests(res.data))
      .catch((err) => console.error("Error fetching requests:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMyRequests();
  }, [user?.id]);

  const getStatusBadge = (status) => {
    const badges = {
      pending: "warning",
      approved: "success",
      rejected: "danger",
    };
    return badges[status] || "secondary";
  };

  const handleProfileUpdate = () => {
    fetchMyRequests();
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="text-danger fw-bold mb-0">
          🏥 Hospital Dashboard - Welcome {user?.name || ""}
        </h3>
        <button onClick={handleLogout} className="btn btn-outline-danger btn-sm">
          Logout
        </button>
      </div>

      {/* Navigation Tabs */}
      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            🏠 Dashboard
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

      {/* Tab Content */}
      {activeTab === "dashboard" && (
        <>
          {/* Request Form and Inventory Side-by-Side */}
          <div className="row mb-4">
            <div className="col-md-6 mb-4">
              <RequestForm onRequestSubmit={fetchMyRequests} />
            </div>
            <div className="col-md-6 mb-4">
              <InventoryView />
            </div>
          </div>

          <hr />

          {/* My Requests Table */}
          <div className="mt-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold text-danger mb-0">📜 My Requests</h5>
              <button
                className="btn btn-outline-danger btn-sm"
                onClick={fetchMyRequests}
              >
                Refresh
              </button>
            </div>

            {loading ? (
              <p className="text-muted">Loading your requests...</p>
            ) : myRequests.length === 0 ? (
              <p className="text-muted">No requests submitted yet.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-striped table-hover table-bordered">
                  <thead className="table-danger">
                    <tr>
                      <th>ID</th>
                      <th>Blood Group</th>
                      <th>Quantity</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myRequests.map((req) => (
                      <tr key={req.id}>
                        <td>{req.id}</td>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === "profile" && (
        <div className="mb-4">
          <UserProfile userId={user?.id} onProfileUpdate={handleProfileUpdate} />
        </div>
      )}
    </div>
  );
}

export default HospitalDashboard;
