import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';

function AuctionItem() {
  const { id } = useParams();
  const [items, setItems] = useState([]); // Store all auctions
  const [item, setItem] = useState(null); // Store selected auction
  const [bid, setBid] = useState('');
  const [message, setMessage] = useState('');
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    fetchAllAuctions();
  }, []);

  useEffect(() => {
    if (id) {
      fetchItem(id);
    }
  }, [id]);

  useEffect(() => {
    if (item?.closingTime) {
      updateTimeLeft(item.closingTime);
    }
  }, [item]);

  // Fetch all auctions
  const fetchAllAuctions = async () => {
    try {
      const res = await axios.get('http://localhost:5001/auctions');
      setItems(res.data);
    } catch (error) {
      console.error('Error fetching auctions:', error);
    }
  };

  // Fetch a single auction
  const fetchItem = async (auctionId) => {
    try {
      const res = await axios.get(`http://localhost:5001/auctions/${auctionId}`);
      setItem(res.data);
    } catch (error) {
      setMessage('Error fetching auction item: ' + (error.response?.data?.message || error.message));
      console.error(error);
    }
  };

  // Update time left
  const updateTimeLeft = (endTime) => {
    if (!endTime) return;

    if (window.timeLeftInterval) {
      clearInterval(window.timeLeftInterval);
    }

    window.timeLeftInterval = setInterval(() => {
      const now = new Date().getTime();
      const auctionEndTime = new Date(endTime).getTime();
      const diff = auctionEndTime - now;

      if (diff <= 0) {
        setTimeLeft("Auction Closed");
        clearInterval(window.timeLeftInterval);
        fetchItem(id);
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${minutes}m ${seconds}s remaining`);
      }
    }, 1000);
  };

  // Handle bid submission
  const handleBid = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setMessage("You must be signed in to place a bid.");
      return;
    }

    if (!item || item.isClosed) {
      setMessage("Auction has ended. No more bids allowed.");
      return;
    }

    const bidAmount = Number(bid);
    if (isNaN(bidAmount) || bidAmount <= item.currentBid) {
      setMessage("Bid must be higher than the current bid.");
      return;
    }

    try {
      const res = await axios.post(
        `http://localhost:5001/bid/${id}`,
        { bid: bidAmount },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage(res.data.message);
      fetchItem(id);
      fetchAllAuctions(); // Refresh all auctions
    } catch (error) {
      setMessage("Error placing bid: " + (error.response?.data?.message || error.message));
      console.error("Bid Error:", error.response?.data || error.message);
    }
  };

  return (
    <div>
      <h2>Live Auctions</h2>
      <ul>
        {items.map((auction) => (
          <li key={auction._id}>
            <Link to={`/auction/${auction._id}`}>
              {auction.itemName} - Current Bid: ${auction.currentBid} {auction.isClosed ? '(Closed)' : ''}
            </Link>
          </li>
        ))}
      </ul>

      {id && item ? (
        <div>
          <h2>{item.itemName}</h2>
          <p>{item.description}</p>
          <p>Current Bid: ${item.currentBid || 0}</p>
          <p>Highest Bidder: {item.highestBidder || 'No bids yet'}</p>
          <p>{timeLeft}</p>

          {!item.isClosed ? (
            <>
              <input
                type="number"
                value={bid}
                onChange={(e) => setBid(e.target.value)}
                placeholder="Enter your bid"
              />
              <button onClick={handleBid}>Place Bid</button>
            </>
          ) : (
            <p>The auction has ended.</p>
          )}

          {message && <p className="message">{message}</p>}
        </div>
      ) : (
        <p>Select an auction to view details.</p>
      )}
    </div>
  );
}

export default AuctionItem;
