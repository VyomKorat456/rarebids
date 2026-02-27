import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Badge, Button, Spinner } from 'react-bootstrap';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { Clock, Hammer, ArrowRight } from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';
import CountdownTimer from './CountdownTimer';

const MyBids = () => {
    const [bids, setBids] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchBids = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            try {
                const res = await api.get('/bidding-service/bids/my-bids');

                // Fetch auction details for each bid
                const bidData = res.data;
                if (!Array.isArray(bidData)) {
                    throw new Error("Invalid data received from bidding service (expected array)");
                }

                const enrichedBids = await Promise.all(bidData.map(async (bid) => {
                    if (!bid || !bid.auctionId) return { ...bid, auction: null };
                    try {
                        const auctionRes = await api.get(`/auction-service/auctions/${bid.auctionId}`);
                        return { ...bid, auction: auctionRes.data };
                    } catch (err) {
                        return { ...bid, auction: null };
                    }
                }));

                // Sort by most recent
                if (Array.isArray(enrichedBids)) {
                    setBids(enrichedBids.sort((a, b) => {
                        const dateA = a && a.timestamp ? new Date(a.timestamp) : new Date(0);
                        const dateB = b && b.timestamp ? new Date(b.timestamp) : new Date(0);
                        return dateB - dateA;
                    }));
                }

            } catch (err) {
                console.error("Failed to fetch bids", err);
                setError(err.response?.data?.message || err.message || "Failed to load bids");
            } finally {
                setLoading(false);
            }
        };

        fetchBids();
    }, [navigate]);

    // Group bids by auctionId
    const groupedBids = React.useMemo(() => {
        const groups = {};
        bids.forEach(bid => {
            if (!groups[bid.auctionId]) {
                groups[bid.auctionId] = {
                    auction: bid.auction,
                    bids: []
                };
            }
            groups[bid.auctionId].bids.push(bid);
        });
        return Object.values(groups);
    }, [bids]);

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100" style={{ background: 'var(--color-bg)' }}>
                <Spinner animation="border" variant="secondary" />
            </div>
        );
    }

    return (
        <div style={{ background: '#f8f9fa', minHeight: '100vh' }}>
            <Navbar />
            <Container style={{ marginTop: '100px', paddingBottom: '50px' }}>
                {error && (
                    <div className="alert alert-danger mb-4 shadow-sm rounded-4 d-flex justify-content-between align-items-center">
                        <div>
                            <strong>Error:</strong> {error}
                        </div>
                        <Button variant="outline-danger" size="sm" onClick={() => window.location.reload()}>Retry</Button>
                    </div>
                )}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="fw-bold" style={{ fontFamily: 'Playfair Display' }}>My Bids</h2>
                    <Button variant="outline-dark" onClick={() => navigate('/home')}>Back to Explore</Button>
                </div>

                {groupedBids.length === 0 ? (
                    <div className="text-center py-5 bg-white rounded-4 shadow-sm">
                        <Hammer size={48} className="text-muted mb-3" />
                        <h4>No Bids Yet</h4>
                        <p className="text-muted">You haven't placed any bids yet. Start exploring auctions!</p>
                        <Button variant="primary" onClick={() => navigate('/home')} className="px-4 py-2 rounded-pill mt-2">Explore Auctions</Button>
                    </div>
                ) : (
                    <Row className="g-4">
                        {groupedBids.map((group) => {
                            if (!group || !group.bids || group.bids.length === 0) return null;
                            const auction = group.auction;
                            const latestBid = group.bids[0];
                            const myHighestBid = group.bids.length > 0 ? Math.max(...group.bids.map(b => b.amount || 0)) : 0;

                            return (
                                <Col md={6} lg={4} key={auction?.id || (latestBid && latestBid.id) || Math.random()}>
                                    <Card className="h-100 border-0 shadow-sm rounded-4 overflow-hidden nav-hover">
                                        <Card.Body className="p-4">
                                            {latestBid && (
                                                <div className="d-flex justify-content-between align-items-start mb-3">
                                                    <Badge bg={latestBid.status === 'ACCEPTED' ? 'success' : 'secondary'} className="rounded-pill px-3 py-2">
                                                        {latestBid.status || 'PLACED'}
                                                    </Badge>
                                                    <small className="text-muted">
                                                        Last bid: {latestBid.timestamp ? new Date(latestBid.timestamp).toLocaleDateString() : 'N/A'}
                                                    </small>
                                                </div>
                                            )}

                                            {auction ? (
                                                <>
                                                    <h5 className="fw-bold mb-2 text-truncate">{auction.title}</h5>

                                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                                        <div>
                                                            <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>My Highest Bid</small>
                                                            <span className="fw-bold text-dark fs-5">₹{myHighestBid}</span>
                                                        </div>
                                                        <div className="text-end">
                                                            <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Total Bids</small>
                                                            <span className="fw-bold text-secondary">{group.bids.length}</span>
                                                        </div>
                                                    </div>

                                                    <div className="border-top pt-3 mt-3">
                                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                                            <span className="text-muted small">Auction Status</span>
                                                            <Badge bg={
                                                                auction.status === 'LIVE' ? 'danger' :
                                                                    auction.status === 'OPEN' ? 'success' :
                                                                        auction.status === 'WAITING_LIVE' ? 'warning' : 'secondary'
                                                            }>
                                                                {auction.status}
                                                            </Badge>
                                                        </div>
                                                        {auction.status !== 'LIVE' && auction.status !== 'SOLD' && auction.status !== 'CLOSED' && (
                                                            <div className="bg-light p-2 rounded text-center mb-2">
                                                                <small className="text-muted d-block" style={{ fontSize: '0.7rem' }}>Live Starts In</small>
                                                                <CountdownTimer
                                                                    targetDate={new Date(new Date(auction.endTime).getTime() + 5 * 60 * 60 * 1000)}
                                                                    mode="compact"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="d-grid gap-2 mt-3">
                                                        <Button
                                                            variant="outline-primary"
                                                            className="rounded-pill d-flex align-items-center justify-content-center gap-2"
                                                            onClick={() => navigate(`/auction/${auction.id}`)}
                                                        >
                                                            View Auction <ArrowRight size={16} />
                                                        </Button>
                                                        {/* Could add a history toggle button here later */}
                                                    </div>
                                                </>
                                            ) : (
                                                <p className="text-muted fst-italic">Auction details unavailable</p>
                                            )}
                                        </Card.Body>
                                    </Card>
                                </Col>
                            );
                        })}
                    </Row>
                )}
            </Container>
            <Footer />
        </div>
    );
};

export default MyBids;
