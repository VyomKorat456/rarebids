import React, { useEffect, useState } from 'react';
import { Container, Button, Row, Col, Spinner, Badge } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { motion } from 'framer-motion';
import { ArrowRight, Clock, DollarSign } from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';

import CreateAuctionModal from './CreateAuction'; // Renamed export
import CountdownTimer from './CountdownTimer';

const Home = () => {
    const [liveAuctions, setLiveAuctions] = useState([]);
    const [activeAuctions, setActiveAuctions] = useState([]);
    const [soldAuctions, setSoldAuctions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Hero Image Slider Logic
    const heroImages = [
        "/anime_hero.png",
        "/anime_hero_2.png",
        "/anime_hero_3.png",
        "/anime_hero_4.png"
    ];
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentImageIndex((prevIndex) => (prevIndex + 1) % heroImages.length);
        }, 5000); // Change image every 5 seconds
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const fetchAuctions = async () => {
            try {
                // Fetch all public auctions to get live, active, and sold
                const response = await api.get('/auction-service/auctions/all');
                const allAucs = response.data;
                
                const now = new Date();
                
                // Categorize
                setLiveAuctions(allAucs.filter(a => a.status === 'LIVE').slice(0, 5));
                setActiveAuctions(allAucs.filter(a => (a.status === 'OPEN' || a.status === 'WAITING_LIVE') && new Date(a.endTime) > now).slice(0, 5));
                setSoldAuctions(allAucs.filter(a => a.status === 'SOLD' || a.status === 'CLOSED' || (a.status === 'OPEN' && new Date(a.endTime) <= now)).slice(0, 5));
                
            } catch (err) {
                console.error("Failed to fetch auctions", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAuctions();
    }, []);

    const [isScrolled, setIsScrolled] = useState(false);

    // ... existing useEffect ...

    // Refresh function to pass to modal
    const refreshAuctions = async () => {
        try {
            const response = await api.get('/auction-service/auctions/all');
            const allAucs = response.data;
            const now = new Date();
            setLiveAuctions(allAucs.filter(a => a.status === 'LIVE').slice(0, 5));
            setActiveAuctions(allAucs.filter(a => (a.status === 'OPEN' || a.status === 'WAITING_LIVE') && new Date(a.endTime) > now).slice(0, 5));
            setSoldAuctions(allAucs.filter(a => a.status === 'SOLD' || a.status === 'CLOSED' || (a.status === 'OPEN' && new Date(a.endTime) <= now)).slice(0, 5));
        } catch (err) { }
    };

    return (
        <div
            style={{ background: 'var(--color-bg)', height: '100vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}
            onScroll={(e) => setIsScrolled(e.currentTarget.scrollTop > 20)}
        >
            <Navbar onCreateClick={() => setShowCreateModal(true)} isScrolled={isScrolled} />

            {/* Hero Section */}
            <section style={{
                paddingTop: '120px', paddingBottom: '80px',
                background: 'linear-gradient(135deg, #fdfbf7 0%, #eef2f3 100%)',
                borderBottom: '1px solid var(--color-border)'
            }}>
                <Container>
                    <Row className="align-items-center">
                        <Col lg={6} className="mb-5 mb-lg-0">
                            <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
                                <Badge bg="secondary" className="mb-3 px-3 py-2 text-uppercase ls-1" style={{ letterSpacing: '2px', backgroundColor: '#D9A05B' }}>
                                    Premium Marketplace
                                </Badge>
                                <h1 style={{ fontSize: '3.5rem', lineHeight: '1.1', marginBottom: '1.5rem', color: '#2C3E50' }}>
                                    Discover Unique <br /> <span style={{ color: 'var(--color-primary)' }}>Treasures</span>
                                </h1>
                                <p className="lead text-muted mb-4" style={{ maxWidth: '500px' }}>
                                    Bid on exclusive items from reliable sellers. From vintage collectibles to modern masterpieces.
                                </p>
                                <div className="d-flex gap-3">
                                    <Button onClick={() => setShowCreateModal(true)} className="btn-premium px-4 py-2 d-flex align-items-center gap-2">
                                        Start Selling <ArrowRight size={18} />
                                    </Button>
                                    <Button variant="outline-secondary" className="rounded-pill px-4 py-2 btn-outline-premium">
                                        View History
                                    </Button>
                                </div>
                            </motion.div>
                        </Col>
                        <Col lg={6}>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.8 }}
                            >
                                <div style={{ width: '80%', margin: '0 auto', overflow: 'hidden', borderRadius: '15px' }}>
                                    <motion.img
                                        key={currentImageIndex}
                                        initial={{ opacity: 0, x: 50 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -50 }}
                                        transition={{ duration: 0.5 }}
                                        src={heroImages[currentImageIndex]}
                                        alt="Hero"
                                        className="img-fluid shadow-lg"
                                        style={{
                                            width: '100%',
                                            height: '400px',
                                            objectFit: 'cover',
                                            borderRadius: '15px'
                                        }}
                                    />
                                </div>
                            </motion.div>
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* Auction Grid */}
            <section className="py-5 flex-grow-1">
                <Container>
                    <div className="d-flex justify-content-between align-items-end mb-5">
                        <div>
                            <h2 className="mb-2" style={{ fontFamily: 'Playfair Display' }}>Trendings Auctions</h2>
                            <p className="text-muted m-0">Bid on the most popular items ending soon.</p>
                        </div>
                        <Link to="/explore" className="btn btn-link text-decoration-none text-muted">View All</Link>
                    </div>

                    {loading ? (
                        <div className="text-center py-5"><Spinner animation="border" variant="secondary" /></div>
                    ) : (
                        <>
                            <div className="mb-5">
                                <div className="d-flex align-items-center mb-4 gap-4">
                                    <h3 className="m-0" style={{ fontFamily: 'Playfair Display', width: '220px' }}>Live Auctions</h3>
                                    {liveAuctions.length === 0 && (
                                        <div className="text-secondary m-0 px-4 py-2 rounded-3 shadow-sm" style={{ background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.5)', fontSize: '0.95rem', fontWeight: '500', width: 'fit-content' }}>
                                            No Live auctions found right now.
                                        </div>
                                    )}
                                </div>
                                {liveAuctions.length > 0 && (
                                    <Row className="row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 row-cols-xl-5 g-4">
                                        {liveAuctions.map((auction, index) => (
                                            <Col key={auction.id} className="mb-4">
                                                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} className="h-100">
                                                    <AuctionItemCard auction={auction} />
                                                </motion.div>
                                            </Col>
                                        ))}
                                    </Row>
                                )}
                            </div>

                            <div className="mb-5">
                                <div className="d-flex align-items-center mb-4 gap-4">
                                    <h3 className="m-0" style={{ fontFamily: 'Playfair Display', width: '220px' }}>Active Auctions</h3>
                                    {activeAuctions.length === 0 && (
                                        <div className="text-secondary m-0 px-4 py-2 rounded-3 shadow-sm" style={{ background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.5)', fontSize: '0.95rem', fontWeight: '500', width: 'fit-content' }}>
                                            No Active auctions found right now.
                                        </div>
                                    )}
                                </div>
                                {activeAuctions.length > 0 && (
                                    <Row className="row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 row-cols-xl-5 g-4">
                                        {activeAuctions.map((auction, index) => (
                                            <Col key={auction.id} className="mb-4">
                                                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} className="h-100">
                                                    <AuctionItemCard auction={auction} />
                                                </motion.div>
                                            </Col>
                                        ))}
                                    </Row>
                                )}
                            </div>

                            <div className="mb-5">
                                <div className="d-flex align-items-center mb-4 gap-4">
                                    <h3 className="m-0" style={{ fontFamily: 'Playfair Display', width: '220px' }}>Sold Auctions</h3>
                                    {soldAuctions.length === 0 && (
                                        <div className="text-secondary m-0 px-4 py-2 rounded-3 shadow-sm" style={{ background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.5)', fontSize: '0.95rem', fontWeight: '500', width: 'fit-content' }}>
                                            No Sold auctions found right now.
                                        </div>
                                    )}
                                </div>
                                {soldAuctions.length > 0 && (
                                    <Row className="row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 row-cols-xl-5 g-4">
                                        {soldAuctions.map((auction, index) => (
                                            <Col key={auction.id} className="mb-4">
                                                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} className="h-100">
                                                    <AuctionItemCard auction={auction} />
                                                </motion.div>
                                            </Col>
                                        ))}
                                    </Row>
                                )}
                            </div>
                        </>
                    )}
                </Container>
            </section>

            <CreateAuctionModal show={showCreateModal} onHide={() => { setShowCreateModal(false); refreshAuctions(); }} />
            <Footer />
        </div >
    );
};

const AuctionItemCard = ({ auction }) => {
    const navigate = useNavigate();
    
    // An auction is considered "Sold/Ended" if the backend says SOLD/CLOSED, 
    // OR if the end time has already passed
    const timeHasPassed = new Date(auction.endTime) < new Date();
    const isSold = auction.status === 'SOLD' || auction.status === 'CLOSED' || (auction.status === 'OPEN' && timeHasPassed);
    const isOpen = (auction.status === 'OPEN' || auction.status === 'WAITING_LIVE') && !timeHasPassed;
    const isLive = auction.status === 'LIVE';

    return (
        <div
            className="glass-panel h-100 card-hover overflow-hidden cursor-pointer"
            style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
            onClick={() => navigate(`/auction/${auction.id}`)}
        >
            <div className="position-relative" style={{ height: '220px' }}>
                <img
                    src={`${import.meta.env.PROD ? '/api' : (import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080')}/auction-service${auction.imageUrl}`}
                    alt={auction.title}
                    className="w-100 h-100"
                    style={{ objectFit: 'cover', filter: isSold ? 'grayscale(100%)' : 'none' }}
                    onError={(e) => { e.target.onerror = null; e.target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22400%22%20height%3D%22300%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20300%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_18e11e86b0b%20text%20%7B%20fill%3A%23AAAAAA%3Bfont-weight%3Abold%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A20pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_18e11e86b0b%22%3E%3Crect%20width%3D%22400%22%20height%3D%22300%22%20fill%3D%22%23EEEEEE%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%22115%22%20y%3D%22155%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E'; }}
                />
                <div className="position-absolute top-0 end-0 m-2 d-flex gap-2">
                    {isSold ? (
                        <Badge bg="danger" className="shadow-sm border">
                            ENDED
                        </Badge>
                    ) : isLive ? (
                        <Badge bg="danger" className="shadow-sm border animate-pulse">
                            LIVE
                        </Badge>
                    ) : isOpen ? (
                        <Badge bg="light" text="dark" className="shadow-sm border">
                            <CountdownTimer targetDate={auction.endTime} mode="compact" />
                        </Badge>
                    ) : (
                        <Badge bg="secondary" className="shadow-sm border">
                            CLOSED
                        </Badge>
                    )}
                </div>
            </div>
            
            <div className="p-3">
                <h6 className="mb-3 text-truncate fw-bold" style={{ fontSize: '1rem', fontFamily: 'Playfair Display' }}>{auction.title}</h6>

                <div className="d-flex justify-content-between align-items-center">
                    <div>
                        <small className="text-uppercase text-muted" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>
                            {isSold ? 'Final Bid' : 'Current Bid'}
                        </small>
                        <div className={`d-flex align-items-center fw-bold ${isSold ? 'text-muted text-decoration-line-through' : 'text-primary'}`} style={{ fontSize: '1.1rem' }}>
                            <DollarSign size={16} /> {auction.currentPrice || auction.startPrice}
                        </div>
                    </div>

                    {!isSold && (
                        <Button variant="outline-dark" size="sm" className="rounded-pill px-4">
                            View
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Home;
