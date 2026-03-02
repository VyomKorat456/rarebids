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
    const [auctions, setAuctions] = useState([]);
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
                const response = await api.get('/auction-service/auctions');
                setAuctions(response.data);
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
            const response = await api.get('/auction-service/auctions');
            setAuctions(response.data);
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
                            <h2 className="mb-2">Trendings Auctions</h2>
                            <p className="text-muted m-0">Bid on the most popular items ending soon.</p>
                        </div>
                        <Link to="/explore" className="btn btn-link text-decoration-none text-muted">View All</Link>
                    </div>

                    {loading ? (
                        <div className="text-center py-5"><Spinner animation="border" variant="secondary" /></div>
                    ) : (
                        <Row>
                            {auctions.map((auction, index) => (
                                <Col md={6} lg={4} key={auction.id} className="mb-4">
                                    <motion.div
                                        initial={{ opacity: 0, y: 30 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <AuctionItemCard auction={auction} />
                                    </motion.div>
                                </Col>
                            ))}
                            {auctions.length === 0 && (
                                <Col className="text-center py-5">
                                    <p className="text-muted">No active auctions right now. Be the first to list something!</p>
                                    <Button onClick={() => setShowCreateModal(true)} variant="outline-primary">Create Listing</Button>
                                </Col>
                            )}
                        </Row>
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

    return (
        <div
            className="glass-panel h-100 card-hover overflow-hidden cursor-pointer"
            style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
            onClick={() => navigate(`/auction/${auction.id}`)}
        >
            <div className="position-relative" style={{ height: '220px' }}>
                <img
                    src={`${import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080'}/auction-service${auction.imageUrl}`}
                    alt={auction.title}
                    className="w-100 h-100"
                    style={{ objectFit: 'cover' }}
                    onError={(e) => { e.target.onerror = null; e.target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22400%22%20height%3D%22300%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20300%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_18e11e86b0b%20text%20%7B%20fill%3A%23AAAAAA%3Bfont-weight%3Abold%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A20pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_18e11e86b0b%22%3E%3Crect%20width%3D%22400%22%20height%3D%22300%22%20fill%3D%22%23EEEEEE%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%22115%22%20y%3D%22155%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E'; }}
                />
                <div className="position-absolute top-0 end-0 m-2 d-flex gap-2">
                    {auction.status === 'LIVE' && (
                        <Badge bg="danger" className="shadow-sm border animate-pulse">
                            LIVE
                        </Badge>
                    )}
                    <Badge bg="light" text="dark" className="shadow-sm border">
                        <CountdownTimer targetDate={auction.endTime} mode="compact" />
                    </Badge>
                </div>
            </div>
            <div className="p-3">
                <h5 className="mb-2 text-truncate" style={{ fontFamily: 'Playfair Display' }}>{auction.title}</h5>
                <p className="text-muted small mb-3 text-truncate">{auction.description}</p>

                <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                    <div>
                        <small className="text-uppercase text-muted" style={{ fontSize: '0.7rem' }}>Current Bid</small>
                        <div className="d-flex align-items-center text-dark fw-bold" style={{ fontSize: '1.1rem' }}>
                            <DollarSign size={16} /> {auction.startPrice}
                        </div>
                    </div>
                    <Button variant="outline-dark" size="sm" className="rounded-pill px-3">Place Bid</Button>
                </div>
            </div>
        </div>
    );
};

export default Home;
