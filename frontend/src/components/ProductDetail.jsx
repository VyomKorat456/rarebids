import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Button, Badge, Form, InputGroup, Spinner } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, DollarSign, Shield, ShieldCheck, Truck, Tag, Gavel, User, CheckCircle } from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';
import CountdownTimer from './CountdownTimer';

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [auction, setAuction] = useState(null);
    const [categories, setCategories] = useState({});
    const [loading, setLoading] = useState(true);
    const [detailsScrolled, setDetailsScrolled] = useState(false);
    const [bidAmount, setBidAmount] = useState('');
    const [bidLoading, setBidLoading] = useState(false);
    const [hasBid, setHasBid] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [showReopenModal, setShowReopenModal] = useState(false);
    const [reopenForm, setReopenForm] = useState({ endTime: '', startPrice: '' });

    useEffect(() => {
        const checkEligibility = async () => {
            const token = localStorage.getItem('token');
            if (!token || !auction) return;

            // Decode token to get userId (sub)
            try {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));
                const payload = JSON.parse(jsonPayload);
                const userId = payload.sub;
                setCurrentUser(userId);

                const res = await api.get('/bidding-service/bids/check-eligibility', {
                    params: { auctionId: auction.id, userId }
                });
                setHasBid(res.data);
            } catch (e) {
                console.error("Eligibility check failed");
            }
        };
        checkEligibility();
    }, [auction]);

    const handlePlaceBid = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        const currentHighest = auction.currentPrice || auction.startPrice;
        if (parseFloat(bidAmount) <= currentHighest) {
            alert(`Bid must be higher than ₹${currentHighest}`);
            return;
        }

        setBidLoading(true);
        try {
            // Updated Endpoint to hit Bidding Service via Gateway
            await api.post(
                '/bidding-service/bids',
                null,
                {
                    params: {
                        auctionId: auction.id,
                        amount: bidAmount
                    }
                }
            );

            alert('Bid placed successfully!');
            // Refresh logic: Optimistically update UI or re-fetch
            setAuction(prev => ({ ...prev, currentPrice: parseFloat(bidAmount) }));
            setHasBid(true);
            setBidAmount('');
        } catch (err) {
            console.error("Bid failed", err);
            alert(err.response?.data || 'Failed to place bid');
        } finally {
            setBidLoading(false);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch Auction (Critical)
                const auctionRes = await api.get(`/auction-service/auctions/${id}`);
                setAuction(auctionRes.data);

                // 2. Fetch Categories (Non-critical, parallel-ish)
                try {
                    const categoryRes = await api.get('/auction-service/categories');
                    const catMap = {};
                    categoryRes.data.forEach(c => catMap[c.id] = c.name);
                    setCategories(catMap);
                } catch (catErr) {
                    console.warn("Failed to load categories", catErr);
                }

            } catch (err) {
                console.error("Failed to fetch auction details", err);
                // Only set auction to null if the auction fetch itself failed
                setAuction(null);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    // Load Razorpay Script Dynamically
    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handlePayment = async (type, amountOverride = null) => {
        const res = await loadRazorpayScript();
        if (!res) {
            alert('Razorpay SDK failed to load. Are you online?');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const amount = amountOverride || (type === 'BUY_NOW' ? auction.buyNowPrice : auction.currentPrice);

            // 1. Create Order on Backend
            const result = await api.post('/auction-service/payment/create-order', {
                auctionId: auction.id,
                userId: currentUser,
                amount: amount
            });

            const { orderId, currency, amount: orderAmount } = result.data;

            // 2. Open Razorpay
            const options = {
                key: "rzp_test_SC1GGrRjQIZx1h",
                amount: (Math.round(orderAmount * 100)).toString(),
                currency: currency,
                name: "Bid System Auction",
                description: `Payment for ${auction.title} (${type === 'BUY_NOW' ? 'Buy Now' : 'Auction Win'})`,
                order_id: orderId,
                handler: async function (response) {
                    try {
                        await api.post('/auction-service/payment/verify', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        });

                        alert('Payment Successful!');
                        setAuction(prev => ({ ...prev, paid: true }));
                        navigate('/history');
                    } catch (err) {
                        alert('Payment Verification Failed');
                    }
                },
                theme: { color: "#D9A05B" }
            };

            const paymentObject = new window.Razorpay(options);
            paymentObject.open();

        } catch (err) {
            console.error("Payment Error", err);
            alert('Something went wrong during payment.');
        }
    };
    // };

    const handleReopen = async () => {
        try {
            const token = localStorage.getItem('token');
            const data = {
                endTime: reopenForm.endTime ? new Date(reopenForm.endTime).toISOString() : null,
                startPrice: reopenForm.startPrice || auction.startPrice,
                buyNowPrice: auction.buyNowPrice
            };

            await api.put(`/auction-service/admin/auctions/${auction.id}/reopen`, data);
            setShowReopenModal(false);
            alert("Auction Reopened Successfully!");
            window.location.reload();
        } catch (err) {
            alert("Failed to reopen auction: " + (err.response?.data || err.message));
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100" style={{ background: 'var(--color-bg)' }}>
                <Spinner animation="border" variant="secondary" />
            </div>
        );
    }

    if (!auction) {
        return (
            <div className="text-center py-5">
                <h3>Auction not found</h3>
                <Button onClick={() => navigate('/home')} variant="outline-primary">Return Home</Button>
            </div>
        );
    }

    const timeLeft = new Date(auction.endTime) - new Date();
    const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));

    return (
        <div style={{ background: '#fdfbf7', minHeight: '100vh', paddingBottom: '2rem' }}>
            <Navbar isScrolled={true} /> {/* Always show glass navbar on this page */}

            <Container style={{ marginTop: '150px', paddingBottom: '80px' }}>
                {/* Back Button */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mb-4"
                >
                    <Button
                        onClick={() => navigate(-1)}
                        className="btn-light rounded-pill px-8 py-2 shadow-sm d-flex align-items-center gap-2 border-0 text-muted hover-scale"
                        style={{ background: 'rgba(255,255,255,0.8)' }}
                    >
                        <ArrowLeft size={18} /> Back to Marketplace
                    </Button>
                </motion.div>

                {/* Unified Main Content Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="glass-panel p-4 rounded-4 mb-5 shadow-sm"
                    style={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid rgba(0,0,0,0.08)',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.08)'
                    }}
                >
                    <Row className="g-4 align-items-center">
                        {/* Left Column: Header Info + Image */}
                        <Col lg={6} className="border-end pe-lg-4">
                            {/* Header Info (Moved Here) */}
                            <div className="mb-3">
                                <div className="d-flex align-items-center gap-3 mb-2">
                                    <div className="d-flex align-items-center gap-2">
                                        <Badge bg="secondary" className="text-uppercase ls-1 px-2 py-1 small" style={{ backgroundColor: '#D9A05B', letterSpacing: '0.5px', fontSize: '0.75rem' }}>
                                            {auction.itemCondition || 'Used'}
                                        </Badge>
                                        {auction.categoryId && (
                                            <Badge bg="light" text="dark" className="border px-2 py-1 small shadow-sm" style={{ fontSize: '0.75rem' }}>
                                                {categories[auction.categoryId] || `Category #${auction.categoryId}`}
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="d-flex gap-1 text-warning align-items-center small">
                                        <span className="fw-bold text-dark me-1">4.8</span>
                                        ★★★★★ <span className="text-muted ms-1">(12)</span>
                                    </div>
                                </div>

                                <h1 className="fw-bold mb-1 display-6" style={{ color: '#2C3E50', fontFamily: 'Playfair Display' }}>
                                    {auction.title}
                                </h1>

                                <p className="text-muted mb-3 d-flex align-items-center gap-3 small">
                                    <span className="d-flex align-items-center gap-2 text-dark">
                                        <User size={14} />
                                        Listed by <strong>{auction.sellerName || (auction.createdBy && auction.createdBy.length > 25 ? 'Verified Seller' : auction.createdBy) || 'Unknown Seller'}</strong>
                                    </span>
                                    <span className="text-muted">•</span>
                                    <span className="text-success fw-bold d-flex align-items-center gap-1">
                                        <ShieldCheck size={14} /> Verified
                                    </span>
                                </p>
                            </div>

                            {/* Image */}
                            <div
                                className="rounded-3 overflow-hidden position-relative d-flex align-items-center justify-content-center bg-light"
                                style={{ height: '350px', cursor: 'zoom-in' }} // Increased height slightly
                            >
                                <motion.img
                                    src={auction.imageUrl ? `http://localhost:8080/auction-service${auction.imageUrl}` : "data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22800%22%20height%3D%22600%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20800%20600%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_18e11e86b0b%20text%20%7B%20fill%3A%23AAAAAA%3Bfont-weight%3Abold%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A40pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_18e11e86b0b%22%3E%3Crect%20width%3D%22800%22%20height%3D%22600%22%20fill%3D%22%23EEEEEE%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%22230%22%20y%3D%22320%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E"}
                                    alt={auction.title}
                                    className="img-fluid"
                                    style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', transition: 'transform 0.3s ease-out' }}
                                    whileHover={{ scale: 1.05 }}
                                />
                            </div>
                        </Col>

                        {/* Right Column: Bidding Form */}
                        <Col lg={6} className="d-flex flex-column justify-content-center">
                            <div className="ps-lg-4">
                                <div className="mb-4">
                                    <p className="text-muted text-uppercase small mb-2 ls-1 fw-bold text-center">
                                        {auction.status === 'LIVE' ? 'Live Auction In Progress' :
                                            (['SOLD', 'CLOSED', 'UNSOLD'].includes(auction.status) ? 'Auction Ended' : 'Live Auction Starts In')}
                                    </p>
                                    {auction.status === 'LIVE' ? (
                                        <div className="text-center">
                                            <Badge bg="danger" className="p-2 fs-6 animate-pulse">LIVE NOW</Badge>
                                        </div>
                                    ) : (
                                        ['SOLD', 'CLOSED', 'UNSOLD'].includes(auction.status) ? (
                                            <div className="text-center p-3 bg-light rounded-3 border border-dark border-opacity-10 shadow-sm">
                                                <h4 className="fw-bold mb-0 text-dark opacity-75">AUCTION ENDED</h4>
                                            </div>
                                        ) : (
                                            <CountdownTimer
                                                targetDate={new Date(new Date(auction.endTime).getTime() + 5 * 60 * 60 * 1000)}
                                                mode="detailed"
                                            />
                                        )
                                    )}
                                </div>

                                <div className="row align-items-end mb-4 border-top pt-4">
                                    <div className="col">
                                        <p className="text-muted text-uppercase small mb-1 ls-1 fw-bold" style={{ fontSize: '0.7rem' }}>Current Highest Bid</p>
                                        <div className="d-flex align-items-baseline gap-2">
                                            <h2 className="display-5 fw-bold m-0" style={{ color: 'var(--color-primary)' }}>
                                                ₹{auction.currentPrice || auction.startPrice}
                                            </h2>
                                            <span className="text-muted small">INR</span>
                                        </div>
                                    </div>
                                    <div className="col-auto text-end">
                                        <small className="text-muted d-block mb-0 small">Starting Price</small>
                                        <span className="fw-bold fs-6 text-dark">₹{auction.startPrice}</span>
                                    </div>
                                </div>

                                {auction.status === 'LIVE' ? (
                                    <div className="d-grid gap-2">
                                        <Button
                                            onClick={() => navigate(`/live/${auction.id}`)}
                                            className={`${hasBid ? 'btn-danger' : 'btn-dark'} py-3 fw-bold shadow-sm`}
                                            size="lg"
                                        >
                                            {hasBid ? 'JOIN LIVE AUCTION' : 'VIEW LIVE AUCTION'}
                                        </Button>
                                        <small className="text-center text-muted">
                                            {hasBid
                                                ? 'Enter the live room to place real-time bids.'
                                                : 'You must place a bid to participate in the live room.'}
                                        </small>
                                        {hasBid && (
                                            <div className="text-center mt-2">
                                                <Badge bg="success" className="bg-opacity-10 text-success border border-success px-3 py-2 rounded-pill">
                                                    <CheckCircle size={14} className="me-1" />
                                                    You are eligible to bid
                                                </Badge>
                                            </div>
                                        )}
                                    </div>
                                ) : ['SOLD', 'CLOSED', 'UNSOLD'].includes(auction.status) ? (
                                    <div className="text-center p-4 bg-light rounded-3 border border-success border-opacity-25 shadow-sm">
                                        <div className="text-success mb-2">
                                            {auction.status === 'SOLD' ? <CheckCircle size={48} className="me-2" /> : <Gavel size={48} className="text-muted opacity-50" />}
                                        </div>
                                        <h3 className={`fw-bold mb-1 ${auction.status === 'SOLD' ? 'text-success' : 'text-muted'}`}>
                                            {auction.status === 'SOLD' ? 'Item Sold!' : (auction.status === 'CLOSED' ? 'Auction Closed' : 'Auction Unsold')}
                                        </h3>
                                        {auction.status === 'SOLD' && (
                                            <p className="text-muted small mb-3">
                                                Winner: <strong className="text-dark">{auction.winnerName || "Private Buyer"}</strong>
                                            </p>
                                        )}
                                        <div className="mb-4">
                                            <Badge bg={auction.status === 'SOLD' ? "success" : "secondary"} className="px-3 py-2 rounded-pill fs-6 fw-bold">
                                                {auction.status === 'SOLD' ? `Final Price: ₹${(auction.currentPrice || auction.buyNowPrice)?.toLocaleString()}` : 'No Winner'}
                                            </Badge>
                                        </div>

                                        {auction.status === 'SOLD' && currentUser === auction.winnerId ? (
                                            <div className="d-grid gap-2 border-top pt-4">
                                                {auction.paid ? (
                                                    <div className="text-center p-4 bg-success bg-opacity-5 rounded-4 border border-success border-opacity-20 shadow-sm animate-fade-in">
                                                        <div className="mb-3">
                                                            <div className="bg-success text-white d-inline-flex align-items-center justify-content-center rounded-circle mb-2 shadow-sm" style={{ width: '60px', height: '60px' }}>
                                                                <ShieldCheck size={32} />
                                                            </div>
                                                            <h4 className="fw-bold text-success mb-1">THIS ITEM IS YOURS!</h4>
                                                            <p className="text-muted small mb-0">Ownership record has been transfered to your account.</p>
                                                        </div>

                                                        <div className="bg-white p-3 rounded-3 border border-success border-opacity-10 mb-3 text-start shadow-xs">
                                                            <div className="d-flex align-items-center gap-3 mb-2">
                                                                <Truck className="text-primary" size={20} />
                                                                <div>
                                                                    <div className="fw-bold small text-dark">Estimated Delivery</div>
                                                                    <div className="text-muted small">
                                                                        {new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, {
                                                                            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="progress" style={{ height: '6px' }}>
                                                                <div className="progress-bar bg-success" role="progressbar" style={{ width: '25%' }}></div>
                                                            </div>
                                                            <small className="text-muted mt-1 d-block" style={{ fontSize: '0.65rem' }}>Preparing for shipment (Warehouse: Mumbai, IN)</small>
                                                        </div>

                                                        <Button variant="outline-success" className="w-100 rounded-pill fw-bold" onClick={() => navigate('/history')}>
                                                            VIEW IN ORDER HISTORY
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="text-center text-success small mb-3 fw-bold">
                                                            🎉 Congratulations! You won this auction.
                                                        </div>
                                                        <Button
                                                            variant="success"
                                                            size="lg"
                                                            className="py-3 fw-bold shadow-sm rounded-pill"
                                                            onClick={() => handlePayment('AUCTION_WIN')}
                                                        >
                                                            <DollarSign size={20} className="me-2" />
                                                            COMPLETE PAYMENT NOW
                                                        </Button>
                                                        <small className="text-muted">You have 30 minutes to complete the payment.</small>
                                                    </>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="border-top pt-3">
                                                <p className="text-muted small m-0">This auction has concluded.</p>
                                                <Button variant="outline-primary" size="sm" className="mt-2 rounded-pill" onClick={() => navigate('/explore')}>
                                                    Browse Other Auctions
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ) : hasBid ? (
                                    <div className="text-center p-4 bg-light rounded-3 border border-success border-opacity-25 shadow-sm">
                                        <div className="text-success mb-2">
                                            <CheckCircle size={48} className="me-2" />
                                        </div>
                                        <h4 className="fw-bold text-success">You have joined!</h4>
                                        <p className="text-muted small m-0">
                                            You are eligible for the live auction.
                                        </p>
                                        <div className="mt-3">
                                            <Button variant="outline-primary" size="sm" onClick={() => navigate('/my-bids')}>
                                                View My Bids
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <Form onSubmit={handlePlaceBid}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="fw-bold small">Your Bid Amount</Form.Label>
                                            <InputGroup >
                                                <InputGroup.Text className="bg-light border-end-0 text-muted ps-3 fw-bold small">₹</InputGroup.Text>
                                                <Form.Control
                                                    type="number"
                                                    value={bidAmount}
                                                    onChange={(e) => setBidAmount(e.target.value)}
                                                    placeholder={`> ₹${(auction.currentPrice || auction.startPrice)}`}
                                                    className="border-start-0 py-2 shadow-none bg-light"
                                                    style={{ fontSize: '0.95rem' }}
                                                    min={(auction.currentPrice || auction.startPrice) + 1}
                                                    required
                                                    disabled={auction.status === 'WAITING_LIVE'}
                                                />
                                            </InputGroup>

                                            <div className="d-flex gap-2 mt-2">
                                                {[100, 500, 1000].map((inc) => (
                                                    <Button
                                                        key={inc}
                                                        variant="outline-secondary"
                                                        size="sm"
                                                        className="flex-grow-1"
                                                        onClick={() => setBidAmount((parseFloat(auction.currentPrice || auction.startPrice) || 0) + inc)}
                                                    >
                                                        + ₹{inc}
                                                    </Button>
                                                ))}
                                            </div>

                                            {auction.status === 'WAITING_LIVE' && (
                                                <Form.Text className="text-muted small">
                                                    Bidding involves waiting for the live session. Pre-bids are closed.
                                                </Form.Text>
                                            )}
                                        </Form.Group>

                                        {/* Buttons - Made smaller/compact */}
                                        <div className="d-grid gap-2 mb-3">
                                            <Button
                                                type="submit"
                                                className="btn-premium py-2 fw-bold shadow-sm"
                                                size="sm"
                                                style={{ fontSize: '0.9rem' }}
                                                disabled={bidLoading || auction.status === 'WAITING_LIVE'}
                                            >
                                                {bidLoading ? <Spinner size="sm" animation="border" /> : (auction.status === 'WAITING_LIVE' ? 'Waiting for Live' : 'Place Bid')}
                                            </Button>

                                            {auction.buyNowPrice && auction.status !== 'WAITING_LIVE' && (
                                                <Button
                                                    variant="outline-dark"
                                                    size="sm"
                                                    className="py-2 rounded-pill fw-bold"
                                                    style={{ fontSize: '0.9rem' }}
                                                    onClick={() => handlePayment('BUY_NOW')}
                                                >
                                                    Buy Now for ₹{auction.buyNowPrice?.toLocaleString()}
                                                </Button>
                                            )}
                                        </div>

                                        <div className="d-flex align-items-center justify-content-center gap-2 text-muted small bg-light p-2 rounded-3" style={{ fontSize: '0.75rem' }}>
                                            <Shield size={14} />
                                            <span>Covered by <strong>Buyer Protection Guarantee</strong></span>
                                        </div>
                                    </Form>
                                )}

                                {currentUser && auction.createdBy === currentUser && ['SOLD', 'CLOSED', 'UNSOLD', 'REJECTED'].includes(auction.status) && !auction.paid && (
                                    <div className="mt-4 pt-3 border-top text-center w-100">
                                        <Button variant="dark" onClick={() => setShowReopenModal(true)} className="w-100 py-2 fw-bold">
                                            <Clock size={16} className="me-2" /> Reopen Auction
                                        </Button>
                                        <small className="text-muted mt-2 d-block">You are the owner of this auction.</small>
                                    </div>
                                )}
                            </div>
                        </Col>
                    </Row>
                </motion.div>

                {/* Full Width Bottom Section: details */}
                <Row>
                    <Col xs={12}>
                        <div className="bg-white p-5 rounded-4 shadow-sm">
                            <h3 className="fw-bold mb-4" style={{ fontFamily: 'Playfair Display' }}>Product Details</h3>
                            <Row className="g-5">
                                <Col lg={8}>
                                    <h5 className="fw-bold mb-3 border-bottom pb-2">Description</h5>
                                    <p className="text-muted lead" style={{ lineHeight: '1.8', fontSize: '1rem' }}>
                                        {auction.description}
                                    </p>
                                </Col>
                                <Col lg={4} className="border-start">
                                    <h5 className="fw-bold mb-3 border-bottom pb-2">Specifications</h5>
                                    <div className="d-flex flex-column gap-4">
                                        <div className="d-flex gap-3">
                                            <div className="p-2 rounded-circle bg-light text-primary h-100">
                                                <Truck size={20} />
                                            </div>
                                            <div>
                                                <h6 className="fw-bold m-0">Shipping</h6>
                                                <p className="text-muted small m-0">{auction.shippingInfo || 'Standard shipping rates apply.'}</p>
                                            </div>
                                        </div>
                                        <div className="d-flex gap-3">
                                            <div className="p-2 rounded-circle bg-light text-success h-100">
                                                <Tag size={20} />
                                            </div>
                                            <div>
                                                <h6 className="fw-bold m-0">Tags</h6>
                                                <p className="text-muted small m-0">{auction.tags || 'No tags'}</p>
                                            </div>
                                        </div>
                                        <div className="d-flex gap-3">
                                            <div className="p-2 rounded-circle bg-light text-warning h-100">
                                                <Gavel size={20} />
                                            </div>
                                            <div>
                                                <h6 className="fw-bold m-0">Auction Type</h6>
                                                <p className="text-muted small m-0">Public Listing</p>
                                            </div>
                                        </div>
                                    </div>
                                </Col>
                            </Row>
                        </div>
                    </Col>
                </Row>

            </Container>

            {/* Reopen Modal */}
            <React.Fragment>
                <div className={`modal fade ${showReopenModal ? 'show d-block' : ''}`} tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header border-0">
                                <h5 className="modal-title">Reopen Auction</h5>
                                <button type="button" className="btn-close" onClick={() => setShowReopenModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <Form>
                                    <Form.Group className="mb-3">
                                        <Form.Label>New End Time</Form.Label>
                                        <Form.Control
                                            type="datetime-local"
                                            onChange={(e) => setReopenForm({ ...reopenForm, endTime: e.target.value })}
                                        />
                                        <Form.Text className="text-muted">Leave empty for +24 hours.</Form.Text>
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Start Price (₹)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            defaultValue={auction.startPrice}
                                            onChange={(e) => setReopenForm({ ...reopenForm, startPrice: e.target.value })}
                                        />
                                    </Form.Group>
                                </Form>
                            </div>
                            <div className="modal-footer border-0">
                                <Button variant="secondary" onClick={() => setShowReopenModal(false)}>Cancel</Button>
                                <Button variant="primary" onClick={handleReopen}>Confirm Reopen</Button>
                            </div>
                        </div>
                    </div>
                </div>
            </React.Fragment>

            <Footer />
        </div>
    );
};

export default ProductDetail;
