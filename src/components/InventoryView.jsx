import React, { useEffect, useState } from "react";
import axios from "axios";

function InventoryView({ onRefresh }) {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchInventory = () => {
    setLoading(true);
    axios
      .get("http://localhost:5000/api/inventory")
      .then((res) => setInventory(res.data))
      .catch((err) => console.error("Error fetching inventory:", err))
      .finally(() => setLoading(false));
    
    // Call external refresh callback if provided
    if (onRefresh) {
      onRefresh();
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-bold text-danger mb-0">Blood Inventory</h5>
        <button className="btn btn-outline-danger btn-sm" onClick={fetchInventory}>
          Refresh
        </button>
      </div>

      {loading ? (
        <p className="text-muted text-center">Loading inventory...</p>
      ) : inventory.length === 0 ? (
        <p className="text-muted text-center">No inventory data available.</p>
      ) : (
        <ul className="list-group">
          {inventory.map((item, index) => (
            <li
              key={index}
              className={`list-group-item d-flex justify-content-between align-items-center ${
                item.units < 5 ? "list-group-item-warning" : ""
              }`}
            >
              <div>
                <strong>{item.blood_group}</strong>
                {item.units < 5 && (
                  <span className="badge bg-warning text-dark ms-2">Low Stock</span>
                )}
              </div>
              <span className={`badge rounded-pill ${
                item.units < 5 ? "bg-warning text-dark" : "bg-danger"
              }`}>
                {item.units} units
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default InventoryView;
