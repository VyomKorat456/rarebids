import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Badge, Button, Form, Spinner, Tooltip, OverlayTrigger } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Shield, Zap, DollarSign, Clock, Eye, EyeOff,
    Play, Square, ChevronRight, Trophy, Info, Activity,
    Truck, Tag, Gavel, ShieldCheck
} from 'lucide-react';
import Navbar from './Navbar';
import api from '../api/axios';
import { connectWebSocket, disconnectWebSocket } from '../api/socket';
import { jwtDecode } from 'jwt-decode';

const LiveAuctionRoom = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // State
    const [auctionState, setAuctionState] = useState(null);
    const [staticDetails, setStaticDetails] = useState(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setCurrentUser(decoded.sub);
            } catch (e) {
                console.error("Token decode failed");
            }
        }
    }, []);
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [hasBid, setHasBid] = useState(false);

    // Local UI
    const [bidAmount, setBidAmount] = useState('');
    const [activityLog, setActivityLog] = useState([]);
    const [activeTab, setActiveTab] = useState('activity'); // activity | participants
    const [categories, setCategories] = useState({});
    const [showStartOverlay, setShowStartOverlay] = useState(false);
    const scrollRef = useRef(null);

    const getIsAdmin = () => {
        const token = localStorage.getItem('token');
        if (!token) return false;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.realm_access?.roles?.includes('ADMIN');
        } catch (e) {
            return false;
        }
    };

    const isAdmin = getIsAdmin();
    const isCreator = staticDetails?.createdBy === currentUser;

    // 1. Initial Load
    useEffect(() => {
        if (!currentUser) return;
        const loadData = async () => {
            try {
                const [snap, details, catRes] = await Promise.all([
                    api.get(`/auction-service/auctions/${id}/status`),
                    api.get(`/auction-service/auctions/${id}`),
                    api.get('/auction-service/categories')
                ]);
                setAuctionState(snap.data);
                setStaticDetails(details.data);

                const catMap = {};
                catRes.data.forEach(c => catMap[c.id] = c.name);
                setCategories(catMap);

                // Track if I am anonymous and if I have bid
                const me = snap.data.participants?.find(p => p.userId === currentUser);
                if (me) setIsAnonymous(me.isAnonymous);

                const eligibilityRes = await api.get(`/bidding-service/bids/check-eligibility`, {
                    params: { auctionId: id, userId: currentUser }
                });
                setHasBid(eligibilityRes.data);

                setActivityLog([{ type: 'system', text: `Connected to ${details.data.title}` }]);

                // Auto-join the auction room
                handleJoin();
            } catch (err) {
                console.error("Load failed", err);
            }
        };
        loadData();
    }, [id, currentUser]);

    // 2. WebSocket
    useEffect(() => {
        connectWebSocket(id, (msg) => {
            console.log("WebSocket Message:", msg);
            setAuctionState(msg);

            if (msg.type === 'BID') {
                setActivityLog(prev => [...prev.slice(-49), {
                    type: 'bid',
                    user: msg.eventUser || msg.highestBidUser,
                    amount: msg.highestBid,
                    time: new Date()
                }]);
            } else if (msg.type === 'START') {
                setActivityLog(prev => [...prev, { type: 'system', text: 'Auction Started!' }]);
                setShowStartOverlay(true);
                setTimeout(() => setShowStartOverlay(false), 3000);
            } else if (msg.type === 'END') {
                setActivityLog(prev => [...prev, { type: 'system', text: 'Auction Ended' }]);
            } else if (msg.type === 'JOIN') {
                setActivityLog(prev => [...prev.slice(-49), {
                    type: 'system',
                    text: `${msg.eventUser || 'A user'} joined the room`,
                    time: new Date()
                }]);
            } else if (msg.type === 'TOGGLE_ANONYMOUS') {
                // Handled by auctionState update
            }
        });
        return () => disconnectWebSocket();
    }, [id]);

    // 3. Timer
    useEffect(() => {
        if (!auctionState?.endTime) return;
        const timer = setInterval(() => {
            const diff = new Date(auctionState.endTime).getTime() - Date.now();
            setTimeLeft(Math.max(0, Math.ceil(diff / 1000)));
        }, 1000);
        return () => clearInterval(timer);
    }, [auctionState?.endTime]);

    // 4. Actions
    const handleJoin = () => api.post(`/auction-service/auctions/${id}/join`, null, { params: { userId: currentUser } });

    const placeBid = async (amount) => {
        try {
            await api.post('/auction-service/bids', null, { params: { auctionId: id, amount, userId: currentUser } });
            setBidAmount('');
        } catch (err) {
            alert(err.response?.data || "Bid failed");
        }
    };

    const toggleAnon = async () => {
        await api.post(`/auction-service/auctions/${id}/toggle-anonymous`);
        setIsAnonymous(!isAnonymous);
    };

    const startAuction = () => api.post(`/auction-service/auctions/${id}/start`);
    const forceEnd = () => api.post(`/auction-service/auctions/${id}/force-end`);

    if (!auctionState || !staticDetails) return (
        <div className="vh-100 d-flex align-items-center justify-content-center bg-dark">
            <Spinner animation="grow" variant="primary" />
        </div>
    );

    const isLive = auctionState.status === 'LIVE';
    const currentPrice = auctionState.highestBid || staticDetails.currentPrice || staticDetails.startPrice;

    return (
        <div className="vh-100 d-flex flex-column bg-white text-dark overflow-hidden font-sans">
            <Navbar variant="light" />

            <div className="flex-grow-1 position-relative" style={{ marginTop: '64px', height: 'calc(100vh - 64px)' }}>
                <Row className="h-100 g-0">

                    {/* LEFT: MAIN STAGE */}
                    <Col lg={8} className="d-flex flex-column h-100 border-end border-light shadow-sm overflow-hidden"
                        style={{ background: 'radial-gradient(circle at 50% 50%, #ffffff 0%, #f8f9fa 100%)' }}>

                        {/* Top Info Bar */}
                        <div className="flex-shrink-0 d-flex justify-content-between align-items-center p-3 border-bottom border-light bg-white bg-opacity-80 backdrop-blur" style={{ height: '60px' }}>
                            <div className="d-flex align-items-center gap-3">
                                <Badge bg="danger" className="d-flex align-items-center gap-1">
                                    <Zap size={10} className="fill-current" /> {auctionState?.status}
                                </Badge>
                                <div className="d-flex align-items-center gap-1 text-muted small">
                                    <Users size={14} />
                                    <span>{auctionState?.participantCount || 0}</span>
                                </div>
                            </div>

                            {(isAdmin || isCreator) && (
                                <div className="d-flex gap-2">
                                    {!isLive && auctionState.status !== 'SOLD' && (
                                        <Button variant="outline-success" size="sm" onClick={startAuction} className="py-0 px-2 d-flex align-items-center gap-1" style={{ fontSize: '0.75rem' }}>
                                            <Play size={10} /> Start
                                        </Button>
                                    )}
                                    {isAdmin && isLive && (
                                        <Button variant="outline-danger" size="sm" onClick={forceEnd} className="py-0 px-2 d-flex align-items-center gap-1" style={{ fontSize: '0.75rem' }}>
                                            <Square size={10} /> End
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Mid Section: Product Details & Price */}
                        <div className="flex-grow-1 p-0 overflow-hidden">
                            <Row className="w-100 g-0 h-100 m-0">
                                {/* Left Side: Product Image */}
                                <Col md={6} className="h-100 d-flex align-items-center justify-content-center border-end border-light bg-white bg-opacity-40">
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="w-100 h-100 d-flex align-items-center justify-content-center p-4"
                                    >
                                        <img
                                            key={staticDetails.imageUrl}
                                            src={`${import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080'}/auction-service${staticDetails.imageUrl}`}
                                            className="img-fluid rounded-4 shadow-sm border border-light"
                                            style={{ maxHeight: '55vh', maxWidth: '100%', objectFit: 'contain' }}
                                            onError={(e) => { e.target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22400%22%20height%3D%22300%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20300%22%20preserveAspectRatio%3D%22none%22%3E%3Crect%20width%3D%22400%22%20height%3D%22300%22%20fill%3D%22%23eee%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20fill%3D%22%23999%22%20dy%3D%22.3em%22%20text-anchor%3D%22middle%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E' }}
                                        />
                                    </motion.div>
                                </Col>

                                {/* Right Side: Title, Description, Price */}
                                <Col md={6} className="h-100 overflow-auto custom-scrollbar p-4">
                                    <div className="text-start ps-md-4 pe-lg-4 flex-grow-1">
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mb-4"
                                        >
                                            <h2 className="fw-bold text-dark mb-1" style={{ fontSize: '1.75rem', letterSpacing: '-0.01em' }}>{staticDetails.title}</h2>
                                            <p className="text-muted small mb-0" style={{ maxWidth: '400px', lineHeight: '1.5' }}>{staticDetails.description}</p>
                                        </motion.div>

                                        <div className="d-flex flex-column gap-3" style={{ maxWidth: '400px' }}>
                                            {/* Price Structure Card */}
                                            <div className="p-3 rounded-4 bg-white border border-light shadow-sm">
                                                <div className="mb-3">
                                                    <span className="text-muted small fw-bold text-uppercase tracking-wider mb-1 d-block" style={{ fontSize: '0.6rem' }}>Current Price</span>
                                                    <motion.div
                                                        key={currentPrice}
                                                        initial={{ scale: 1.05 }}
                                                        animate={{ scale: 1 }}
                                                        className="d-flex align-items-center gap-2"
                                                    >
                                                        <span className="text-primary fw-bold h4 mb-0">₹</span>
                                                        <span className="h1 fw-black mb-0 font-mono text-dark">
                                                            {currentPrice.toLocaleString()}
                                                        </span>
                                                    </motion.div>
                                                </div>

                                                <div className="d-flex justify-content-between pt-2 border-top border-light">
                                                    <div>
                                                        <span className="text-muted small fw-bold text-uppercase tracking-wider d-block" style={{ fontSize: '0.55rem' }}>Opening Price</span>
                                                        <span className="fw-bold text-dark-emphasis" style={{ fontSize: '0.9rem' }}>₹{staticDetails.startPrice?.toLocaleString()}</span>
                                                    </div>
                                                    <div className="text-end">
                                                        <span className="text-muted small fw-bold text-uppercase tracking-wider d-block" style={{ fontSize: '0.55rem' }}>Total Bids</span>
                                                        <span className="fw-bold text-primary" style={{ fontSize: '0.9rem' }}>{auctionState.bidCount || 0}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Timer Block Card */}
                                            <motion.div
                                                className={`p-3 rounded-4 d-flex align-items-center gap-3 border ${timeLeft <= 5 && auctionState.status === 'LIVE' && timeLeft > 0 ? 'border-danger text-danger bg-danger bg-opacity-10' : 'border-light bg-light text-dark shadow-sm'}`}
                                                animate={timeLeft <= 5 && auctionState.status === 'LIVE' && timeLeft > 0 ? { scale: [1, 1.02, 1] } : {}}
                                                transition={{ repeat: Infinity, duration: 0.5 }}
                                            >
                                                <div className={`p-2 rounded-3 ${timeLeft <= 5 && auctionState.status === 'LIVE' && timeLeft > 0 ? 'bg-danger text-white' : 'bg-white text-primary shadow-sm'}`}>
                                                    <Clock size={18} />
                                                </div>
                                                <div>
                                                    <span className="text-muted small fw-bold text-uppercase tracking-wider d-block" style={{ fontSize: '0.55rem' }}>
                                                        {auctionState.status === 'LIVE' ? (timeLeft > 0 ? 'Ending In' : 'Status') : (auctionState.status === 'SOLD' ? 'WINNER' : 'Status')}
                                                    </span>
                                                    <div className="fw-bold font-mono pb-0 mb-0">
                                                        {auctionState.status === 'LIVE' ? (
                                                            <h4 className="mb-0 fw-bold">
                                                                {timeLeft > 0 ? (
                                                                    `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`
                                                                ) : 'ENDING...'}
                                                            </h4>
                                                        ) : (
                                                            auctionState.status === 'SOLD' ? (
                                                                <div className="d-flex flex-column">
                                                                    <div className="text-primary text-truncate" style={{ fontSize: '1rem', maxWidth: '200px' }}>{auctionState.highestBidUser}</div>
                                                                    <div className="text-muted small" style={{ fontSize: '0.7rem' }}>Won for ₹{auctionState.highestBid?.toLocaleString()}</div>
                                                                </div>
                                                            ) : (
                                                                <h4 className="mb-0 fw-bold">
                                                                    {auctionState.status === 'WAITING_LIVE' || auctionState.status === 'OPEN' ? 'WAITING...' : 'ENDED'}
                                                                </h4>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>

                                            {/* Additional Details Section */}
                                            <div className="p-3 rounded-4 bg-white border border-light shadow-sm mt-2">
                                                <div className="d-flex align-items-center gap-2 mb-3">
                                                    <Info size={14} className="text-primary" />
                                                    <span className="fw-bold text-dark small">Product Information</span>
                                                </div>

                                                <div className="d-flex flex-column gap-3">
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <span className="text-muted" style={{ fontSize: '0.75rem' }}>Condition</span>
                                                        <Badge bg="info" className="bg-opacity-10 text-info border border-info px-2 py-1" style={{ fontSize: '0.65rem' }}>
                                                            {staticDetails.itemCondition || 'Used'}
                                                        </Badge>
                                                    </div>

                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <span className="text-muted" style={{ fontSize: '0.75rem' }}>Category</span>
                                                        <span className="fw-bold text-dark" style={{ fontSize: '0.75rem' }}>
                                                            {categories[staticDetails.categoryId] || 'Gadgets'}
                                                        </span>
                                                    </div>

                                                    <div className="d-flex justify-content-between align-items-start border-top pt-2">
                                                        <div className="d-flex align-items-center gap-2">
                                                            <Truck size={12} className="text-muted" />
                                                            <span className="text-muted" style={{ fontSize: '0.7rem' }}>Shipping</span>
                                                        </div>
                                                        <span className="text-dark text-end" style={{ fontSize: '0.7rem', maxWidth: '150px' }}>
                                                            {staticDetails.shippingInfo || 'Standard Delivery'}
                                                        </span>
                                                    </div>

                                                    <div className="border-top pt-2">
                                                        <div className="d-flex align-items-center gap-2 mb-2">
                                                            <ShieldCheck size={12} className="text-success" />
                                                            <span className="text-muted" style={{ fontSize: '0.7rem' }}>Verified Seller</span>
                                                        </div>
                                                        <span className="fw-bold text-dark" style={{ fontSize: '0.75rem' }}>
                                                            {staticDetails.sellerName || 'Verified Professional'}
                                                        </span>
                                                    </div>

                                                    {staticDetails.tags && (
                                                        <div className="d-flex flex-wrap gap-1 border-top pt-2">
                                                            {staticDetails.tags.split(',').map((tag, i) => (
                                                                <span key={i} className="px-2 py-0.5 rounded-pill bg-light text-muted border border-light" style={{ fontSize: '0.6rem' }}>
                                                                    #{tag.trim()}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Col>
                            </Row>
                        </div>

                        {/* Bottom: Bid Controls */}
                        <div className="flex-shrink-0 p-3 bg-white border-top border-light w-100 shadow-sm" style={{ zIndex: 10 }}>
                            <div className="mx-auto" style={{ maxWidth: '500px' }}>
                                <div className="d-flex gap-2 mb-2">
                                    {[100, 500, 1000, 5000].map(inc => (
                                        <Button key={inc} variant="outline-primary" className="flex-grow-1 py-1 small" style={{ fontSize: '0.75rem', padding: '2px' }} onClick={() => placeBid(currentPrice + inc)} disabled={auctionState.status !== 'LIVE' || (!hasBid && !isAdmin)}>
                                            +{inc}
                                        </Button>
                                    ))}
                                </div>
                                <div className="d-flex gap-2">
                                    <div className="flex-grow-1 position-relative">
                                        <Form.Control
                                            type="number"
                                            placeholder={(hasBid || isAdmin) ? "Bid..." : "Viewer Mode"}
                                            className="bg-light border-0 text-dark py-1 ps-4 shadow-none"
                                            style={{ fontSize: '0.9rem' }}
                                            value={bidAmount}
                                            onChange={(e) => setBidAmount(e.target.value)}
                                            disabled={!isLive || (!hasBid && !isAdmin)}
                                        />
                                        <DollarSign size={12} className="position-absolute top-50 start-0 translate-middle-y ms-2 text-muted" />
                                    </div>
                                    <Button variant="primary" size="sm" className="px-3 fw-bold shadow-sm" onClick={() => placeBid(Number(bidAmount))} disabled={auctionState.status !== 'LIVE' || !bidAmount || (!hasBid && !isAdmin)}>
                                        BID
                                    </Button>
                                    <Button variant="outline-secondary" size="sm" className="px-2" onClick={toggleAnon} title="Toggle Anonymous" disabled={!hasBid && !isAdmin}>
                                        {isAnonymous ? <EyeOff size={16} className="text-primary" /> : <Eye size={16} />}
                                    </Button>
                                </div>
                                {!hasBid && !isAdmin && isLive && (
                                    <div className="text-center mt-2">
                                        <Badge bg="warning" text="dark" className="small" style={{ fontSize: '0.7rem' }}>
                                            <Info size={10} className="me-1" /> Placing bids is locked. You must pre-bid to participate.
                                        </Badge>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Col>

                    {/* RIGHT: SIDEBAR */}
                    <Col lg={4} className="d-flex flex-column h-100 bg-light border-start border-light overflow-hidden shadow-sm">

                        {/* Sidebar Tabs */}
                        <div className="flex-shrink-0 d-flex border-bottom border-light bg-white">
                            <button
                                className={`flex-grow-1 py-2 px-3 border-0 transition-all ${activeTab === 'activity' ? 'text-primary fw-bold border-bottom border-2 border-primary bg-primary bg-opacity-5' : 'text-muted'}`}
                                onClick={() => setActiveTab('activity')}
                                style={{ fontSize: '0.7rem' }}
                            >
                                <Activity size={14} className="me-2" /> LIVE FEED
                            </button>
                            <button
                                className={`flex-grow-1 py-2 px-3 border-0 transition-all ${activeTab === 'participants' ? 'text-primary fw-bold border-bottom border-2 border-primary bg-primary bg-opacity-5' : 'text-muted'}`}
                                onClick={() => setActiveTab('participants')}
                                style={{ fontSize: '0.7rem' }}
                            >
                                <Users size={14} className="me-2" /> PEOPLE ({auctionState.participants?.length || 0})
                            </button>
                        </div>

                        <div className="flex-grow-1 overflow-hidden d-flex flex-column">
                            {activeTab === 'activity' ? (
                                <div className="flex-grow-1 overflow-auto p-3 custom-scrollbar" style={{ background: '#fff' }}>
                                    <AnimatePresence mode="popLayout">
                                        {activityLog.length === 0 ? (
                                            <div className="h-100 d-flex flex-column align-items-center justify-content-center text-muted opacity-25">
                                                <Activity size={32} className="mb-2" />
                                                <span style={{ fontSize: '0.8rem' }}>Waiting for activity...</span>
                                            </div>
                                        ) : (
                                            activityLog.map((log, idx) => (
                                                <motion.div key={idx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="mb-2">
                                                    {log.type === 'bid' ? (
                                                        <div className="p-2 rounded-2 bg-light border border-light shadow-sm">
                                                            <div className="d-flex justify-content-between mb-0">
                                                                <span className="fw-bold text-primary" style={{ fontSize: '0.75rem' }}>{log.user}</span>
                                                                <span className="text-muted" style={{ fontSize: '0.6rem' }}>Just now</span>
                                                            </div>
                                                            <div className="d-flex align-items-center gap-2">
                                                                <span className="text-muted opacity-75" style={{ fontSize: '0.7rem' }}>Bid:</span>
                                                                <span className="fw-bold text-success" style={{ fontSize: '0.8rem' }}>₹{log.amount.toLocaleString()}</span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-center my-1">
                                                            <span className="px-2 py-0.5 rounded-pill bg-white text-muted shadow-sm" style={{ fontSize: '0.6rem', border: '1px solid #eee' }}>
                                                                {log.text}
                                                            </span>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            ))
                                        )}
                                    </AnimatePresence>
                                </div>
                            ) : (
                                <div className="flex-grow-1 overflow-auto p-3 custom-scrollbar" style={{ background: '#f8f9fa' }}>
                                    <AnimatePresence mode="popLayout">
                                        {(!auctionState.participants || auctionState.participants.length === 0) ? (
                                            <div className="h-100 d-flex flex-column align-items-center justify-content-center text-muted opacity-25">
                                                <Users size={32} className="mb-2" />
                                                <span style={{ fontSize: '0.8rem' }}>No participants.</span>
                                            </div>
                                        ) : (
                                            auctionState.participants?.map((p, idx) => (
                                                <motion.div key={p.userId} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                                                    className="d-flex align-items-center justify-content-between p-2 mb-1 rounded-2 bg-white border border-light">
                                                    <div className="d-flex align-items-center gap-2">
                                                        <div className="position-relative">
                                                            <div className="rounded-circle bg-light shadow-sm d-flex align-items-center justify-content-center text-muted" style={{ width: 28, height: 28 }}>
                                                                <Users size={10} />
                                                            </div>
                                                            <div className="position-absolute bottom-0 end-0 bg-success border border-white rounded-circle" style={{ width: 6, height: 6 }} />
                                                        </div>
                                                        <div>
                                                            <div className="d-flex align-items-center gap-2">
                                                                <span className={`fw-bold ${p.userId === currentUser ? 'text-primary' : 'text-dark'}`} style={{ fontSize: '0.75rem' }}>
                                                                    {p.isAnonymous ? (isAdmin ? `${p.displayName} (${p.maskedId})` : p.maskedId) : p.displayName}
                                                                </span>
                                                                {p.isCreator && <Badge bg="warning" text="dark" style={{ fontSize: '0.5rem', fontWeight: 'bold' }}>HOST</Badge>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {p.isAnonymous && <EyeOff size={10} className="text-muted opacity-30" />}
                                                </motion.div>
                                            ))
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}

                            {/* Summary Footer */}
                            <div className="flex-shrink-0 p-3 bg-white border-top border-light">
                                <div className="d-flex justify-content-between">
                                    <span className="text-muted" style={{ fontSize: '0.7rem' }}>Highest Bidder</span>
                                    <span className="fw-bold text-primary" style={{ fontSize: '0.75rem' }}>{auctionState.highestBidUser || 'None'}</span>
                                </div>
                            </div>
                        </div>

                        {/* START OVERLAY */}
                        <AnimatePresence>
                            {showStartOverlay && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 1.2 }}
                                    className="position-absolute top-50 start-50 translate-middle text-center"
                                    style={{ zIndex: 1000, pointerEvents: 'none' }}
                                >
                                    <div className="bg-primary text-white p-4 rounded-5 shadow-2xl px-5 border border-white border-opacity-20 backdrop-blur" style={{ boxShadow: '0 0 50px rgba(13, 110, 253, 0.5)' }}>
                                        <Zap size={48} className="mb-3 animate-pulse fill-current" />
                                        <h1 className="fw-black m-0" style={{ fontSize: '3rem', letterSpacing: '-0.05em' }}>LET'S GO!</h1>
                                        <p className="m-0 fw-bold opacity-75">AUCTION IS LIVE NOW</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </Col>
                </Row>
            </div>

            <style>{`
                .backdrop-blur { backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }
                .body-small { font-size: 0.85rem; }
                .font-sans { font-family: 'Inter', -apple-system, sans-serif; }
                .font-mono { font-family: 'JetBrains Mono', monospace; }
                .shadow-2xl { filter: drop-shadow(0 25px 50px rgba(0,0,0,0.1)); }
                .font-black { font-weight: 900; }
                .tracking-wide { letter-spacing: 0.1em; }
                .hover-bg-light:hover { background: #f8f9fa; }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
                .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
                .active-tab-glow-light { background: linear-gradient(to bottom, rgba(13, 110, 253, 0.05), transparent) !important; }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
            `}</style>
        </div >
    );
};

export default LiveAuctionRoom;
