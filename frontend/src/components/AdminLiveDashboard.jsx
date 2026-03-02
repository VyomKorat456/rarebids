import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import AdminLayout from './AdminLayout';
import { Container, Row, Col, Card, Badge, Button, Spinner } from 'react-bootstrap';
import { Play, Users, Clock, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminLiveDashboard = () => {
    const navigate = useNavigate();
    const [auctions, setAuctions] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchLiveAuctions = async () => {
        try {
            const res = await api.get('/auction-service/admin/auctions');
            // Filter for WAITING_LIVE and LIVE
            const liveAndWaiting = res.data.filter(a => ['WAITING_LIVE', 'LIVE'].includes(a.status));
            setAuctions(liveAndWaiting);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch auctions", err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLiveAuctions();
        const interval = setInterval(fetchLiveAuctions, 5000); // Poll every 5s for updates
        return () => clearInterval(interval);
    }, []);

    if (loading) return (
        <AdminLayout>
            <div className="d-flex justify-content-center align-items-center h-100">
                <Spinner animation="border" variant="primary" />
            </div>
        </AdminLayout>
    );

    return (
        <AdminLayout>
            <Container fluid>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h3 className="fw-bold mb-1">Live Auction Console</h3>
                        <p className="text-muted mb-0">Manage ongoing and waiting auctions.</p>
                    </div>
                    <Button variant="outline-primary" onClick={fetchLiveAuctions}>Refresh</Button>
                </div>

                {auctions.length === 0 ? (
                    <div className="text-center py-5 glass-panel">
                        <AlertCircle size={48} className="text-muted mb-3" />
                        <h5>No Active Auctions</h5>
                        <p className="text-muted">Set an auction to "WAITING_LIVE" from the Auctions tab to see it here.</p>
                        <Button variant="primary" onClick={() => navigate('/admin/auctions')}>Go to Auctions</Button>
                    </div>
                ) : (
                    <Row>
                        {auctions.map(auction => (
                            <Col md={6} lg={4} key={auction.id} className="mb-4">
                                <motion.div whileHover={{ y: -5 }} transition={{ type: 'spring', stiffness: 300 }}>
                                    <Card className="border-0 shadow-sm h-100 overflow-hidden">
                                        <div style={{ height: '180px', position: 'relative' }}>
                                            <div
                                                style={{
                                                    width: '100%', height: '100%',
                                                    backgroundImage: `url(${import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080'}/auction-service${auction.imageUrl})`,
                                                    backgroundSize: 'cover',
                                                    backgroundPosition: 'center'
                                                }}
                                            />
                                            <div className="position-absolute top-0 end-0 m-3">
                                                <Badge bg={auction.status === 'LIVE' ? 'danger' : 'warning'} className="px-3 py-2 shadow-sm">
                                                    {auction.status === 'LIVE' ? (
                                                        <><Play size={12} className="me-1 fill-current" /> LIVE</>
                                                    ) : (
                                                        <><Clock size={12} className="me-1" /> WAITING</>
                                                    )}
                                                </Badge>
                                            </div>
                                        </div>
                                        <Card.Body>
                                            <Card.Title className="truncate mb-2">{auction.title}</Card.Title>
                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                <h5 className="text-primary mb-0">₹{auction.currentPrice || auction.startPrice}</h5>
                                                <small className="text-muted">ID: #{auction.id}</small>
                                            </div>

                                            <div className="d-grid">
                                                <Button
                                                    variant={auction.status === 'LIVE' ? 'danger' : 'primary'}
                                                    className="fw-bold py-2"
                                                    onClick={() => navigate(`/admin/live/${auction.id}`)}
                                                >
                                                    {auction.status === 'LIVE' ? 'Manage Live Auction' : 'Open Waiting Room'}
                                                </Button>
                                            </div>
                                        </Card.Body>
                                        <Card.Footer className="bg-white border-top-0 text-muted small">
                                            <div className="d-flex align-items-center gap-2">
                                                <Users size={14} />
                                                <span>Click to see participants</span>
                                            </div>
                                        </Card.Footer>
                                    </Card>
                                </motion.div>
                            </Col>
                        ))}
                    </Row>
                )}
            </Container>
        </AdminLayout>
    );
};

export default AdminLiveDashboard;
