import React, { useEffect, useState } from "react";
import axios from "axios";

function DonorList({ onDonationRecorded, showDonateButton = false }) {
  const user = JSON.parse(localStorage.getItem("user"));
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [donatingId, setDonatingId] = useState(null);

  const fetchDonors = () => {
    setLoading(true);
    axios
      .get("http://localhost:5000/api/donors")
      .then((res) => {
        console.log("✅ Donor API Response:", res.data);
        setDonors(res.data);
      })
      .catch((err) => console.error("Error fetching donors:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDonors();
  }, []);

  const handleDonation = async (donorId, bloodGroup) => {
    if (!confirm(`Record donation for ${bloodGroup}? This will add 1 unit to inventory.`)) {
      return;
    }

    setDonatingId(donorId);
    try {
      await axios.post("http://localhost:5000/api/donation", {
        donor_id: donorId,
        blood_group: bloodGroup,
        quantity: 1,
      });
      alert("✅ Donation recorded! Inventory updated.");
      fetchDonors(); // Refresh donor list
      if (onDonationRecorded) {
        onDonationRecorded(); // Callback to refresh inventory
      }
    } catch (err) {
      console.error("Error recording donation:", err);
      alert("❌ Failed to record donation. Please try again.");
    } finally {
      setDonatingId(null);
    }
  };

  // Show donate button if user is admin, or if it's explicitly enabled
  const canDonate = showDonateButton || user?.role === "admin";

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-bold text-danger mb-0">Registered Donors</h5>
        <button
          className="btn btn-outline-danger btn-sm"
          onClick={fetchDonors}
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <p className="text-muted text-center">Loading donors...</p>
      ) : donors.length === 0 ? (
        <p className="text-muted text-center">No donors available.</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-hover table-bordered">
            <thead className="table-danger text-center">
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Blood Group</th>
                <th>Location</th>
                <th>Last Donation Date</th>
                {canDonate && <th>Action</th>}
              </tr>
            </thead>
            <tbody className="text-center">
              {donors.map((d, index) => (
                <tr key={d.id || index}>
                  <td>{index + 1}</td>
                  <td>{d.name}</td>
                  <td>{d.blood_group}</td>
                  <td>{d.location || "—"}</td>
                  <td>
                    {d.last_donation_date
                      ? new Date(d.last_donation_date).toLocaleDateString()
                      : "—"}
                  </td>
                  {canDonate && (
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDonation(d.id, d.blood_group)}
                        disabled={donatingId === d.id}
                      >
                        {donatingId === d.id ? "Recording..." : "💉 Mark Donated"}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default DonorList;
