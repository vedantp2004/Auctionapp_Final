import React, { useState } from "react";
import axios from "axios";

function Delete() {
  const [itemName, setItemName] = useState("");
  const [message, setMessage] = useState("");

  // ✅ Make the function async
  const handleDelete = async () => {
    if (!itemName.trim()) {
      setMessage("Please enter a valid Auction Name.");
      return;
    }
  
    try {
      const response = await axios.delete(
        `http://localhost:5001/auctions/name/${encodeURIComponent(itemName.trim())}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
  
      setMessage(response.data.message || "Auction deleted successfully.");
      setItemName(""); // Clear input after deletion
    } catch (error) {
      setMessage("Error deleting auction: " + (error.response?.data?.message || error.message));
      console.error(error);
    }
  };
  

  return (
    <div>
      <h2>Delete Auction</h2>
      <input
        type="text"
        placeholder="Enter Auction Name"
        value={itemName}
        onChange={(e) => setItemName(e.target.value)}
      />
      <button onClick={handleDelete}>Delete Auction</button>
      {message && <p>{message}</p>}
    </div>
  );
}

export default Delete;