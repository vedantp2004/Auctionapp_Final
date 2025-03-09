import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Navigate } from 'react-router-dom';
import Signup from './Components/Signup';
import Signin from './Components/Signin';
import Dashboard from './Components/Dashboard';
import Landing from './Components/Landing';
import PostAuction from './Components/PostAuction';
import AuctionItem from './Components/AuctionItem';
import Delete from './Components/Delete';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <header>
          <h1>Online Auction App</h1>
          <nav>
            <Link to="/signup" className="nav-link">Signup</Link>
            <Link to="/signin" className="nav-link">Signin</Link>
            <Link to="/dashboard" className="nav-link">Dashboard</Link>
            <Link to="/postauction" className="nav-link">Post Auction</Link>
            <Link to="/auctionitem" className="nav-link">Auction Item</Link> 
            <Link to="/delete-auction" className="nav-link">Delete Auction</Link>
          </nav>
        </header>
        <main>
          <section className="main-section">
            <h2>Experience the thrill of live auctions and uncover deals you won’t find anywhere else!</h2>
          </section>

          <Routes>
            {/* Redirect root ("/") to Signin page */}
            <Route path="/" element={<Navigate to="/signin" />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/signin" element={<Signin />} />
            <Route path="/landing" element={<Landing />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/postauction" element={<PostAuction />} />
            <Route path="/auctionitem" element={<AuctionItem />} /> 
            <Route path="/auction/:id" element={<AuctionItem />} />
            <Route path="/delete-auction" element={<Delete />} />
          </Routes>
        </main>
        <footer>
          <p>&copy; 2025 AuctionZone | All Rights Reserved</p>
          <p>Contact us: 9999999999</p>
          <p>Email: auct123@gmail.com</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
