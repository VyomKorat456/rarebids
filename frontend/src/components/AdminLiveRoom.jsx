import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, Button, Spinner, Table } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Zap, StopCircle, Activity, MessageCircle, Gavel, Play } from 'lucide-react';
import AdminLayout from './AdminLayout';
import api from '../api/axios';
import { connectWebSocket, disconnectWebSocket } from '../api/socket';
import { jwtDecode } from 'jwt-decode';

const AdminLiveRoom = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // Core State
    const [auctionState, setAuctionState] = useState(null);
    const [staticAuctionDetails, setStaticAuctionDetails] = useState(null);
    const [activityLog, setActivityLog] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [status, setStatus] = useState('CONNECTING');

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

    // Derived state for UI compatibility
    const scrollRef = useRef(null);

    // 1. Initial Load
    useEffect(() => {
        const loadData = async () => {
            try {
                const [snapshotRes, detailsRes] = await Promise.all([
                    api.get(`/auction-service/auctions/${id}/status`),
                    api.get(`/auction-service/auctions/${id}`)
                ]);
                setStaticAuctionDetails(detailsRes.data);
                const initialSnapshot = snapshotRes.data;
                setAuctionState(initialSnapshot);
                setStatus('JOINED'); // Ideally depends on WS connection, but this denotes data loaded

                setActivityLog([
                    { type: 'system', text: `Admin Console loaded for ${detailsRes.data.title}`, time: new Date() }
                ]);

                if (initialSnapshot.status === 'LIVE') setStatus('LIVE');
                if (['SOLD', 'CLOSED', 'UNSOLD'].includes(initialSnapshot.status)) setStatus('ENDED');

                // Register Admin/Creator in the room
                if (currentUser) {
                    api.post(`/auction-service/auctions/${id}/join`, null, { params: { userId: currentUser } });
                }

            } catch (err) {
                console.error("Admin load failed", err);
                setStatus('ERROR');
            }
        };
        loadData();
    }, [id, currentUser]);

    // 2. WebSocket
    useEffect(() => {
        connectWebSocket(id, (msg) => {
            console.log("Admin WebSocket Message:", msg);
            setAuctionState(msg);

            if (msg.type === 'BID') {
                setActivityLog(logs => [...logs, {
                    type: 'bid',
                    user: msg.eventUser || msg.highestBidUser || 'Someone',
                    amount: msg.highestBid,
                    time: new Date()
                }]);
            } else if (msg.type === 'JOIN') {
                setActivityLog(logs => [...logs, {
                    type: 'system',
                    text: `${msg.eventUser || 'A user'} joined the room`,
                    time: new Date()
                }]);
            } else if (msg.type === 'START') {
                setActivityLog(logs => [...logs, { type: 'system', text: 'Auction Started!', time: new Date() }]);
            } else if (msg.type === 'END') {
                setActivityLog(logs => [...logs, { type: 'system', text: 'Auction Ended', time: new Date() }]);
            }
        });

        return () => disconnectWebSocket();
    }, [id]);

    // 3. State Update & Version Guard
    const handleSnapshot = (newSnapshot) => {
        setAuctionState(prevState => {
            if (!prevState) return newSnapshot;
            if (newSnapshot.version <= prevState.version) return prevState;
            return newSnapshot;
        });
    };

    // 4. Update main status (Effect-based)
    useEffect(() => {
        if (!auctionState) return;
        if (auctionState.status === 'LIVE') setStatus('LIVE');
        if (['SOLD', 'CLOSED', 'UNSOLD'].includes(auctionState.status)) setStatus('ENDED');
    }, [auctionState]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [activityLog]);

    const handleExtendTime = async () => {
        try {
            await api.put(`/auction-service/admin/auctions/${id}/extend-time`);
        } catch (err) {
            alert("Failed to extend time");
        }
    };

    // Actions
    const handleStartLive = async () => {
        try {
            await api.put(`/auction-service/admin/auctions/${id}/start-live`);
            // Snapshot will update state
        } catch (err) {
            alert("Failed to start auction");
        }
    };

    const handleStopAuction = async () => {
        if (!window.confirm("Stop auction and sell to highest bidder?")) return;
        try {
            await api.put(`/auction-service/admin/auctions/${id}/stop-sold`);
        } catch (err) {
            alert("Failed to stop auction");
        }
    };


    if (!auctionState || !staticAuctionDetails) return (
        <AdminLayout>
            <div className="d-flex justify-content-center align-items-center h-100">
                <Spinner animation="border" />
            </div>
        </AdminLayout>
    );

    const participantCount = auctionState.participantCount || 0;
    const currentPrice = auctionState.highestBid || staticAuctionDetails.startPrice || 0;

    return (
        <AdminLayout>
            <Container fluid className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h4 className="fw-bold mb-1">Live Controller: {staticAuctionDetails.title}</h4>
                        <div className="d-flex align-items-center gap-2">
                            <StatusBadge status={auctionState.status} />
                            <span className="text-muted small">ID: #{id}</span>
                            {status === 'LIVE' || status === 'JOINED' ? (
                                <Badge bg="success" className="d-flex align-items-center gap-1">
                                    <Zap size={10} className="fill-current" /> Connected
                                </Badge>
                            ) : (
                                <Badge bg="warning" text="dark">Connecting...</Badge>
                            )}
                        </div>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                        <div className="d-flex align-items-center gap-2 px-3 py-2 bg-white rounded-pill shadow-sm text-primary fw-bold">
                            <Users size={18} />
                            <span>{participantCount} Active Users</span>
                        </div>
                    </div>
                </div>

                <Row>
                    {/* LEFT PANEL: CONTROLS & INFO */}
                    <Col lg={4} className="mb-4">
                        <Card className="border-0 shadow-sm mb-4">
                            <Card.Header className="bg-white fw-bold border-bottom-0 pt-4 px-4">
                                Auction Stats
                            </Card.Header>
                            <Card.Body className="px-4 pb-4">
                                <div className="mb-4 text-center p-3 bg-light rounded-3 border border-dashed">
                                    <small className="text-muted text-uppercase fw-bold">Current Price</small>
                                    <h1 className="text-primary fw-bold display-4 m-0">₹{currentPrice}</h1>
                                </div>

                                <div className="mb-3">
                                    <div className="d-flex justify-content-between mb-1">
                                        <span className="text-muted">Start Price</span>
                                        <span className="fw-bold">₹{staticAuctionDetails.startPrice}</span>
                                    </div>
                                    <div className="d-flex justify-content-between">
                                        <span className="text-muted">Buy Now</span>
                                        <span className="fw-bold">{staticAuctionDetails.buyNowPrice ? `₹${staticAuctionDetails.buyNowPrice}` : 'N/A'}</span>
                                    </div>
                                    {auctionState.currentTurnUser && (
                                        <div className="d-flex justify-content-between mt-2 pt-2 border-top">
                                            <span className="text-muted">Current Turn</span>
                                            <span className="fw-bold text-success">{auctionState.currentTurnUser}</span>
                                        </div>
                                    )}
                                </div>
                            </Card.Body>
                        </Card>

                        <Card className="border-0 shadow-sm bg-dark text-white">
                            <Card.Header className="bg-transparent border-white border-opacity-10 fw-bold pt-4 px-4">
                                Admin Actions
                            </Card.Header>
                            <Card.Body className="px-4 pb-4">
                                {(auctionState.status === 'WAITING_LIVE' || auctionState.status === 'OPEN') && (
                                    <div className="text-center">
                                        <p className="text-white-50 mb-3">Users are waiting in the lobby. Start when ready.</p>
                                        <Button variant="danger" size="lg" className="w-100 fw-bold py-3 shadow-lg" onClick={handleStartLive}>
                                            <Play size={20} className="me-2 fill-current" /> START AUCTION
                                        </Button>
                                    </div>
                                )}

                                {auctionState.status === 'LIVE' && (
                                    <div className="text-center">
                                        <div className="d-flex align-items-center justify-content-center gap-2 mb-3 text-success">
                                            <div className="spinner-grow spinner-grow-sm" role="status" />
                                            <span className="fw-bold">Auction is LIVE</span>
                                        </div>
                                        <div className="d-flex gap-2">
                                            <Button variant="outline-light" className="flex-grow-1 fw-bold py-2" onClick={handleExtendTime}>
                                                +30s EXTEND
                                            </Button>
                                            <Button variant="outline-danger" className="flex-grow-1 fw-bold py-2 border-2 hover-danger" onClick={handleStopAuction}>
                                                STOP & SELL
                                            </Button>
                                        </div>
                                        <small className="d-block mt-2 text-white-50">Manual controls for high-speed management.</small>
                                    </div>
                                )}

                                {['SOLD', 'CLOSED', 'UNSOLD'].includes(auctionState.status) && (
                                    <div className="text-center py-3">
                                        <h5 className="text-white-50">Auction Ended</h5>
                                        <Button variant="light" onClick={() => navigate('/admin/live-console')}>
                                            Back to Console
                                        </Button>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* RIGHT PANEL: LIVE FEED & PARTICIPANTS */}
                    <Col lg={8}>
                        <Row className="h-100">
                            <Col md={7} className="mb-4 mb-md-0">
                                <Card className="border-0 shadow-sm h-100" style={{ minHeight: '500px' }}>
                                    <Card.Header className="bg-white fw-bold border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
                                        <span><Activity size={18} className="me-2 text-primary" /> Live Activity Log</span>
                                        <Badge bg="light" text="dark" className="border">Real-time</Badge>
                                    </Card.Header>
                                    <Card.Body className="p-0 overflow-auto custom-scrollbar" style={{ height: '500px' }} ref={scrollRef}>
                                        <div className="p-4">
                                            <AnimatePresence>
                                                {activityLog.length === 0 && (
                                                    <div className="text-center text-muted py-5">
                                                        <MessageCircle size={32} className="mb-2 opacity-50" />
                                                        <p>No activity yet. Logs will appear here.</p>
                                                    </div>
                                                )}
                                                {activityLog.map((log, idx) => (
                                                    <motion.div
                                                        key={idx}
                                                        initial={{ opacity: 0, x: 20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        className="mb-3 pb-3 border-bottom border-light"
                                                    >
                                                        <div className="d-flex align-items-center gap-3">
                                                            {log.type === 'bid' ? (
                                                                <div className="bg-success bg-opacity-10 p-2 rounded-circle text-success">
                                                                    <Gavel size={18} />
                                                                </div>
                                                            ) : (
                                                                <div className="bg-secondary bg-opacity-10 p-2 rounded-circle text-secondary">
                                                                    <Activity size={18} />
                                                                </div>
                                                            )}

                                                            <div>
                                                                <div className="d-flex align-items-center gap-2">
                                                                    <span className="fw-bold text-dark">{log.user || 'System'}</span>
                                                                    <span className="text-muted small">{new Date(log.time).toLocaleTimeString()}</span>
                                                                </div>
                                                                <div className="text-muted small">
                                                                    {log.type === 'bid' ? (
                                                                        <span>Placed a bid of <span className="text-primary fw-bold">₹{log.amount}</span></span>
                                                                    ) : (
                                                                        log.text
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={5}>
                                <Card className="border-0 shadow-sm h-100">
                                    <Card.Header className="bg-white fw-bold border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
                                        <span><Users size={18} className="me-2 text-primary" /> Participants</span>
                                        <Badge bg="primary">{auctionState.participants?.length || 0}</Badge>
                                    </Card.Header>
                                    <Card.Body className="p-0 overflow-auto custom-scrollbar" style={{ maxHeight: '500px' }}>
                                        <div className="p-3">
                                            <AnimatePresence mode="popLayout">
                                                {(!auctionState.participants || auctionState.participants.length === 0) ? (
                                                    <div className="text-center text-muted py-5">
                                                        <Users size={32} className="mb-2 opacity-25" />
                                                        <p className="small">No participants yet.</p>
                                                    </div>
                                                ) : (
                                                    auctionState.participants.map((p, idx) => (
                                                        <motion.div
                                                            key={p.userId}
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: idx * 0.05 }}
                                                            className="p-2 mb-2 rounded-3 bg-light border border-light d-flex justify-content-between align-items-center"
                                                        >
                                                            <div className="d-flex align-items-center gap-2">
                                                                <div className="rounded-circle bg-white shadow-sm d-flex align-items-center justify-content-center text-muted" style={{ width: 32, height: 32 }}>
                                                                    <Users size={12} />
                                                                </div>
                                                                <div>
                                                                    <div className="fw-bold text-dark small">
                                                                        {p.displayName} {p.isAnonymous && <span className="text-muted fw-normal" style={{ fontSize: '0.65rem' }}>({p.maskedId})</span>}
                                                                    </div>
                                                                    <div className="text-muted" style={{ fontSize: '0.6rem' }}>{p.userId.substring(0, 8)}...</div>
                                                                </div>
                                                            </div>
                                                            {p.isCreator && <Badge bg="warning" text="dark" style={{ fontSize: '0.5rem' }}>HOST</Badge>}
                                                        </motion.div>
                                                    ))
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </Container>
        </AdminLayout>
    );
};

const StatusBadge = ({ status }) => {
    let bg = 'secondary';
    if (status === 'LIVE') bg = 'danger';
    if (status === 'WAITING_LIVE') bg = 'warning';
    if (status === 'SOLD') bg = 'success';
    return <Badge bg={bg}>{status}</Badge>;
};

export default AdminLiveRoom;
