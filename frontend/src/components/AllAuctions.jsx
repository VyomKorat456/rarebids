import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Spinner, Badge, Button, Form, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, DollarSign, Clock, CheckCircle, XCircle } from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';

const AllAuctions = () => {
    const [auctions, setAuctions] = useState([]);
    const [filteredAuctions, setFilteredAuctions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, OPEN, SOLD
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const fetchAuctions = async () => {
            try {
                const res = await api.get('/auction-service/auctions');
                setAuctions(res.data);
            } catch (err) {
                console.error("Fetch failed", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAuctions();
    }, []);

    // ... existing filter logic ...

    return (
        <div
            style={{ background: 'var(--color-bg)', height: '100vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}
            onScroll={(e) => setIsScrolled(e.currentTarget.scrollTop > 20)}
        >
            <Navbar isScrolled={isScrolled} />

            <Container className="py-5" style={{ marginTop: '80px', flex: '1 0 auto' }}>
                <div className="mb-5 text-center">
                    <h1 className="fw-bold mb-3">Explore All Auctions</h1>
                    <p className="text-muted lead">Browse active listings and sold treasures.</p>
                </div>

                {/* Filters */}
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4 gap-3">
                    <InputGroup style={{ maxWidth: '400px' }}>
                        <InputGroup.Text className="bg-white border-end-0"><Search size={18} className="text-muted" /></InputGroup.Text>
                        <Form.Control
                            placeholder="Search by title..."
                            className="border-start-0 shadow-none"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </InputGroup>

                    <div className="d-flex gap-2">
                        <Button
                            variant={statusFilter === 'ALL' ? 'dark' : 'outline-dark'}
                            onClick={() => setStatusFilter('ALL')}
                            className="rounded-pill px-3"
                        >
                            All
                        </Button>
                        <Button
                            variant={statusFilter === 'OPEN' ? 'success' : 'outline-success'}
                            onClick={() => setStatusFilter('OPEN')}
                            className="rounded-pill px-3"
                        >
                            Active
                        </Button>
                        <Button
                            variant={statusFilter === 'SOLD' ? 'secondary' : 'outline-secondary'}
                            onClick={() => setStatusFilter('SOLD')}
                            className="rounded-pill px-3"
                        >
                            Sold
                        </Button>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-5"><Spinner animation="border" variant="secondary" /></div>
                ) : (
                    <Row>
                        <AnimatePresence>
                            {filteredAuctions.map((auction, index) => (
                                <Col md={6} lg={4} key={auction.id} className="mb-4">
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <AuctionCard auction={auction} />
                                    </motion.div>
                                </Col>
                            ))}
                        </AnimatePresence>

                        {!loading && filteredAuctions.length === 0 && (
                            <Col className="text-center py-5 text-muted">
                                <h5>No auctions found matching your criteria.</h5>
                            </Col>
                        )}
                    </Row>
                )}
            </Container>

            <Footer />
        </div>
    );
};

const AuctionCard = ({ auction }) => {
    const navigate = useNavigate();
    const isSold = auction.status === 'SOLD';
    const isOpen = auction.status === 'OPEN';

    return (
        <div
            className="glass-panel h-100 overflow-hidden cursor-pointer card-hover"
            onClick={() => navigate(`/auction/${auction.id}`)}
            style={{ transition: 'all 0.3s ease' }}
        >
            <div className="position-relative" style={{ height: '220px' }}>
                <img
                    src={`http://localhost:8080/auction-service${auction.imageUrl}`}
                    alt={auction.title}
                    className="w-100 h-100"
                    style={{ objectFit: 'cover', filter: isSold ? 'grayscale(100%)' : 'none' }}
                    onError={(e) => { e.target.onerror = null; e.target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22400%22%20height%3D%22300%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20300%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_18e11e86b0b%20text%20%7B%20fill%3A%23AAAAAA%3Bfont-weight%3Abold%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A20pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_18e11e86b0b%22%3E%3Crect%20width%3D%22400%22%20height%3D%22300%22%20fill%3D%22%23EEEEEE%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%22115%22%20y%3D%22155%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E'; }}
                />

                {/* Status Overlay */}
                <div className="position-absolute top-0 end-0 m-2">
                    {isSold ? (
                        <Badge bg="danger" className="shadow-sm d-flex align-items-center gap-1 px-3 py-2">
                            <XCircle size={14} /> SOLD
                        </Badge>
                    ) : isOpen ? (
                        <Badge bg="success" className="shadow-sm d-flex align-items-center gap-1 px-3 py-2">
                            <Clock size={14} /> ACTIVE
                        </Badge>
                    ) : (
                        <Badge bg="secondary">CLOSED</Badge>
                    )}
                </div>

                {isSold && (
                    <div className="position-absolute bottom-0 w-100 text-center py-2" style={{ background: 'rgba(0,0,0,0.6)', color: 'white' }}>
                        Sold to {auction.winnerName || 'Private Buyer'}
                    </div>
                )}
            </div>

            <div className="p-3">
                <h5 className="mb-2 text-truncate">{auction.title}</h5>
                <p className="text-muted small mb-3 text-truncate">{auction.description}</p>

                <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                    <div>
                        <small className="text-uppercase text-muted" style={{ fontSize: '0.7rem' }}>
                            {isSold ? 'Sold Price' : 'Current Price'}
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

export default AllAuctions;
