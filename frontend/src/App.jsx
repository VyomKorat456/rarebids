import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Home from './components/Home';
import AdminDashboard from './components/AdminDashboard';
import AdminLiveDashboard from './components/AdminLiveDashboard';
import AdminLiveRoom from './components/AdminLiveRoom';
import CreateAuction from './components/CreateAuction';
import HowItWorks from './components/HowItWorks';
import ProductDetail from './components/ProductDetail';
import AllAuctions from './components/AllAuctions';
import MyBids from './components/MyBids';
import ProtectedRoute from './components/ProtectedRoute'; // Import ProtectedRoute

import LiveAuctionRoom from './components/LiveAuctionRoom';
import AuctionHistory from './components/AuctionHistory';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={<Home />} />
        <Route path="/explore" element={<AllAuctions />} />
        <Route path="/my-bids" element={<MyBids />} />
        <Route path="/history" element={<AuctionHistory />} />
        <Route path="/admin/live-console" element={<ProtectedRoute role="ADMIN"><AdminLiveDashboard /></ProtectedRoute>} />
        <Route path="/admin/live/:id" element={<ProtectedRoute role="ADMIN"><AdminLiveRoom /></ProtectedRoute>} />
        <Route path="/admin/*" element={<AdminDashboard />} />
        <Route path="/auction/:id" element={<ProductDetail />} />
        <Route path="/live/:id" element={<LiveAuctionRoom />} /> {/* Live Room Route */}
        {/* <Route path="/create-auction" element={<CreateAuction />} /> */}
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
