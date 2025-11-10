import React, { useEffect, useState } from "react";
import DonorList from "./DonorList";
import InventoryView from "./InventoryView";
import UserProfile from "./UserProfile";
import axios from "axios";

function UserDashboard() {
  const user = JSON.parse(localStorage.getItem("user"));
  const [inventorySummary, setInventorySummary] = useState(0);
  const [donating, setDonating] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const fetchInventorySummary = () => {
    axios
      .get("http://localhost:5000/api/inventory")
      .then((res) => {
        const total = res.data.reduce((sum, item) => sum + (item.units || 0), 0);
        setInventorySummary(total);
      })
      .catch((err) => console.error("Error fetching inventory:", err));
  };

  useEffect(() => {
    fetchInventorySummary();
  }, []);

  const handleMyDonation = async () => {
    if (!user?.id || !user?.blood_group) {
      alert("❌ Your blood group is not set. Please update your profile.");
      return;
    }

    if (!confirm(`Record your donation of ${user.blood_group}? This will add 1 unit to inventory.`)) {
      return;
    }

    setDonating(true);
    try {
      await axios.post("http://localhost:5000/api/donation", {
        donor_id: user.id,
        blood_group: user.blood_group,
        quantity: 1,
      });
      alert("✅ Donation recorded! Thank you for your contribution!");
      fetchInventorySummary();
      window.location.reload();
    } catch (err) {
      console.error("Error recording donation:", err);
      alert("❌ Failed to record donation. Please try again.");
    } finally {
      setDonating(false);
    }
  };

  const handleDonationRecorded = () => {
    fetchInventorySummary();
  };

  const handleProfileUpdate = () => {
    fetchInventorySummary();
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="text-danger fw-bold mb-0">
          👤 User Dashboard - Welcome {user?.name || ""}
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
          {/* Welcome Card */}
          <div className="card border-danger mb-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h4 className="card-title text-danger mb-2">Hi, {user?.name || "Donor"}! 👋</h4>
                  <p className="card-text mb-1">
                    <strong>Blood Group:</strong> {user?.blood_group || "Not specified"} |{" "}
                    <strong>Location:</strong> {user?.location || "Not specified"}
                  </p>
                  <p className="card-text mb-0">
                    <strong>Total Available Units:</strong> {inventorySummary} units
                  </p>
                </div>
                <button
                  className="btn btn-danger"
                  onClick={handleMyDonation}
                  disabled={donating || !user?.blood_group}
                >
                  {donating ? "Recording..." : "💉 Mark My Donation"}
                </button>
              </div>
            </div>
          </div>

          {/* Two Panels Side-by-Side */}
          <div className="row">
            <div className="col-md-6 mb-4">
              <InventoryView />
            </div>
            <div className="col-md-6 mb-4">
              <DonorList onDonationRecorded={handleDonationRecorded} />
            </div>
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

export default UserDashboard;
