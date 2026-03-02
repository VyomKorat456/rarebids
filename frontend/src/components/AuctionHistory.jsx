import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Badge, Button, Spinner, Table } from 'react-bootstrap';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { History, Trophy, Gavel, User, ArrowRight, Clock, DollarSign } from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';

const AuctionHistory = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await api.get('/auction-service/auctions/history');
                setHistory(res.data);
            } catch (err) {
                console.error("Failed to fetch history", err);
                setError(err.response?.data?.message || err.message || "Failed to load history");
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100" style={{ background: 'var(--color-bg)' }}>
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    return (
        <div style={{ background: '#f8f9fa', minHeight: '100vh' }}>
            <Navbar />
            <Container style={{ marginTop: '100px', paddingBottom: '50px' }}>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="fw-bold mb-1" style={{ fontFamily: 'Playfair Display' }}>Auction History</h2>
                        <p className="text-muted small">View your past sales, purchases, and participations.</p>
                    </div>
                    <Button variant="outline-dark" onClick={() => navigate('/home')} className="rounded-pill px-4">
                        Back to Home
                    </Button>
                </div>

                {error && <div className="alert alert-danger rounded-4 shadow-sm mb-4">{error}</div>}

                {history.length === 0 ? (
                    <div className="text-center py-5 bg-white rounded-4 shadow-sm">
                        <History size={48} className="text-muted mb-3 opacity-25" />
                        <h4>No History Found</h4>
                        <p className="text-muted">You haven't won or sold any auctions yet.</p>
                    </div>
                ) : (
                    <Row className="g-4">
                        {history.map((auction) => (
                            <Col lg={4} md={6} key={auction.id}>
                                <Card className="h-100 border-0 shadow-sm rounded-4 overflow-hidden card-hover position-relative">
                                    <div style={{ height: '160px', position: 'relative' }}>
                                        <div
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                backgroundImage: `url(${import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080'}/auction-service${auction.imageUrl})`,
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center'
                                            }}
                                        />
                                        <div className="position-absolute top-0 end-0 m-3">
                                            <Badge bg={auction.status === 'SOLD' ? 'success' : 'secondary'} className="px-3 py-2 rounded-pill shadow-sm">
                                                {auction.status}
                                            </Badge>
                                        </div>
                                    </div>

                                    <Card.Body className="p-4">
                                        <h5 className="fw-bold text-dark mb-3 text-truncate">{auction.title}</h5>

                                        <div className="d-flex flex-column gap-2 mb-4">
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div className="d-flex align-items-center gap-2 text-muted small">
                                                    <DollarSign size={14} /> <span>Sold Price</span>
                                                </div>
                                                <span className="fw-bold text-primary">₹{auction.currentPrice || auction.startPrice}</span>
                                            </div>

                                            <div className="d-flex justify-content-between align-items-center">
                                                <div className="d-flex align-items-center gap-2 text-muted small">
                                                    <User size={14} /> <span>Winner</span>
                                                </div>
                                                <span className="fw-bold text-dark small">{auction.winnerName || 'No Winner'}</span>
                                            </div>

                                            <div className="d-flex justify-content-between align-items-center">
                                                <div className="d-flex align-items-center gap-2 text-muted small">
                                                    <Gavel size={14} /> <span>Seller</span>
                                                </div>
                                                <span className="text-dark small">{auction.sellerName}</span>
                                            </div>

                                            <div className="d-flex justify-content-between align-items-center">
                                                <div className="d-flex align-items-center gap-2 text-muted small">
                                                    <Clock size={14} /> <span>Date</span>
                                                </div>
                                                <span className="text-muted small">{new Date(auction.endTime || auction.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>

                                        <div className="d-grid">
                                            <Button
                                                variant="outline-primary"
                                                className="rounded-pill py-2 d-flex align-items-center justify-content-center gap-2"
                                                onClick={() => navigate(`/auction/${auction.id}`)}
                                            >
                                                Auction Details <ArrowRight size={16} />
                                            </Button>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                )}
            </Container>
            <Footer />
        </div>
    );
};

export default AuctionHistory;
