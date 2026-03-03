import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Container, Row, Col, Badge, Spinner, Button, Modal, Form } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Trash2, Clock, Archive, Tag, User, DollarSign, Edit2, Eye, Save, X } from 'lucide-react';
import AdminLayout from './AdminLayout';
import CategoryManager from './CategoryManager';
import UserManager from './UserManager';
import PaymentHistory from './PaymentHistory';
import AuditLogTable from './admin/AuditLogTable';

const AdminDashboard = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const getInitialTab = () => {
        const path = location.pathname;
        if (path.includes('/users')) return 'users';
        if (path.includes('/auctions')) return 'active';
        if (path.includes('/categories')) return 'categories';
        if (path.includes('/history')) return 'history';
        if (path.includes('/payments')) return 'payments';
        if (path.includes('/logs')) return 'logs';
        return 'pending';
    };

    const [activeTab, setActiveTab] = useState(getInitialTab());
    const [auctions, setAuctions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAuction, setSelectedAuction] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        setActiveTab(getInitialTab());
    }, [location.pathname]);

    const handleTabClick = (tabId) => {
        setActiveTab(tabId);
        if (tabId === 'users') navigate('/admin/users');
        else if (tabId === 'active') navigate('/admin/auctions');
        else if (tabId === 'categories') navigate('/admin/categories');
        else if (tabId === 'history') navigate('/admin/history');
        else if (tabId === 'payments') navigate('/admin/payments');
        else if (tabId === 'logs') navigate('/admin/logs');
        else navigate('/admin');
    };

    useEffect(() => {
        fetchAuctions();
    }, []);

    const fetchAuctions = async () => {
        try {
            const response = await api.get('/auction-service/admin/auctions');
            setAuctions(response.data);
            setLoading(false);
        } catch (err) {
            setLoading(false);
        }
    };

    const handleAction = async (id, action) => {
        try {
            if (action === 'delete') {
                if (!window.confirm("Are you sure you want to delete this auction?")) return;
                await api.delete(`/auction-service/admin/auctions/${id}`);
                setAuctions(prev => prev.filter(a => a.id !== id));
                setShowModal(false);
                alert("Auction Deleted Successfully!");
            } else {
                await api.put(`/auction-service/admin/auctions/${id}/${action}`);
                alert(`Auction ${action.charAt(0).toUpperCase() + action.slice(1)}d Successfully!`);
                setShowModal(false);
                fetchAuctions();
            }
        } catch (err) {
            console.error(err);
            alert("Action failed: " + (err.response?.data?.message || err.message));
            fetchAuctions();
        }
    };

    const handleUpdateAuction = async (id, updatedData) => {
        try {
            const res = await api.put(`/auction-service/auctions/${id}`, updatedData);
            setAuctions(prev => prev.map(a => a.id === id ? res.data : a));
            alert("Auction Updated Successfully!");
            setShowModal(false);
        } catch (err) {
            alert("Failed to update auction");
        }
    };

    const handleReopenAuction = async (id, updatedData) => {
        try {
            const dataToSend = { ...updatedData };
            if (dataToSend.endTime) {
                dataToSend.endTime = new Date(dataToSend.endTime).toISOString();
            }

            const res = await api.put(`/auction-service/admin/auctions/${id}/reopen`, dataToSend);
            setAuctions(prev => prev.map(a => a.id === id ? res.data : a));
            alert("Auction Reopened Successfully!");
            setShowModal(false);
        } catch (err) {
            console.error(err);
            alert("Failed to reopen auction");
        }
    };

    const openDetailModal = (auction) => {
        setSelectedAuction(auction);
        setShowModal(true);
    };

    const filteredAuctions = auctions.filter(a => {
        if (activeTab === 'pending') return a.status === 'PENDING';
        if (activeTab === 'active') return ['OPEN', 'WAITING_LIVE', 'LIVE'].includes(a.status);
        return a.status !== 'PENDING' && !['OPEN', 'WAITING_LIVE', 'LIVE'].includes(a.status);
    });

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center vh-100" style={{ background: 'var(--color-bg)' }}>
            <Spinner animation="border" style={{ color: 'var(--color-primary)' }} />
        </div>
    );

    return (
        <AdminLayout>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="m-0 text-dark">Dashboard Overview</h4>
                <div className="d-flex gap-3">
                    <TabButton id="pending" active={activeTab} onClick={handleTabClick} icon={<Clock size={16} />} label={`Pending (${auctions.filter(a => a.status === 'PENDING').length})`} />
                    <TabButton id="active" active={activeTab} onClick={handleTabClick} icon={<CheckCircle size={16} />} label={`Active (${auctions.filter(a => ['OPEN', 'WAITING_LIVE', 'LIVE'].includes(a.status)).length})`} />
                    <TabButton id="history" active={activeTab} onClick={handleTabClick} icon={<Archive size={16} />} label="History" />
                    <TabButton id="categories" active={activeTab} onClick={handleTabClick} icon={<Tag size={16} />} label="Categories" />
                    <TabButton id="users" active={activeTab} onClick={handleTabClick} icon={<User size={16} />} label="Users" />
                    <TabButton id="payments" active={activeTab} onClick={handleTabClick} icon={<DollarSign size={16} />} label="Payments" />
                    <TabButton id="logs" active={activeTab} onClick={handleTabClick} icon={<Clock size={16} />} label="Audit Logs" />
                </div>
            </div>

            <Container fluid>
                {activeTab === 'categories' ? <CategoryManager /> :
                    activeTab === 'users' ? <UserManager /> :
                        activeTab === 'payments' ? <PaymentHistory /> :
                            activeTab === 'logs' ? <AuditLogTable /> : (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    <AnimatePresence mode="wait">
                                        {filteredAuctions.length === 0 ? (
                                            <div className="text-center py-5 text-muted glass-panel mt-4">
                                                <h5>No auctions found in this category.</h5>
                                            </div>
                                        ) : (
                                            <Row>
                                                {filteredAuctions.map(auction => (
                                                    <Col lg={4} md={6} xl={3} className="mb-4" key={auction.id}>
                                                        <AuctionCard auction={auction} onClick={() => openDetailModal(auction)} />
                                                    </Col>
                                                ))}
                                            </Row>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            )}
            </Container>

            {/* Auction Detail Modal */}
            <AuctionDetailModal
                show={showModal}
                onHide={() => setShowModal(false)}
                auction={selectedAuction}
                onAction={handleAction}
                onUpdate={handleUpdateAuction}
                onReopen={handleReopenAuction}
            />
        </AdminLayout>
    );
};

const TabButton = ({ id, active, onClick, label, icon }) => (
    <button onClick={() => onClick(id)} className={`btn d-flex align-items-center gap-2 ${active === id ? 'btn-premium' : 'btn-light text-muted'}`} style={{ borderRadius: '30px', padding: '0.5rem 1.2rem', transition: 'all 0.3s ease' }}>
        {icon} {label}
    </button>
);

const AuctionCard = ({ auction, onClick }) => {
    // Truncate description Logic
    const desc = auction.description || "";
    const shortDesc = desc.length > 60 ? desc.substring(0, 60) + "..." : desc;

    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="glass-panel h-100 overflow-hidden card-hover border-0 cursor-pointer"
            onClick={onClick}
            style={{ cursor: 'pointer' }}
        >
            <div style={{ height: '200px', position: 'relative' }}>
                <div style={{ width: '100%', height: '100%', backgroundImage: `url(${import.meta.env.PROD ? '/api' : (import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080')}/auction-service${auction.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                <div className="position-absolute top-0 end-0 m-3">
                    <StatusBadge status={auction.status} />
                </div>
                <div className="position-absolute bottom-0 start-0 w-100 p-3" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}>
                    <h5 className="text-white m-0 truncate">{auction.title}</h5>
                </div>
            </div>

            <div className="p-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <h3 className="m-0" style={{ color: 'var(--color-primary)' }}>₹{auction.startPrice}</h3>
                    <small className="text-muted">ID: #{auction.id}</small>
                </div>
                <p className="text-muted small mb-3" style={{ minHeight: '40px', lineHeight: '1.4' }}>
                    {shortDesc}
                </p>
                <div className="text-center">
                    <Badge bg="light" text="dark" className="border">Click to Manage</Badge>
                </div>
            </div>
        </motion.div>
    );
};

const AuctionDetailModal = ({ show, onHide, auction, onAction, onUpdate, onReopen }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isReopening, setIsReopening] = useState(false);
    const [editForm, setEditForm] = useState({});

    useEffect(() => {
        if (auction) {
            setEditForm({
                title: auction.title,
                description: auction.description,
                startPrice: auction.startPrice,
                buyNowPrice: auction.buyNowPrice || ''
            });
            setIsEditing(false); // Reset edit mode when opening new auction
            setIsReopening(false);
        }
    }, [auction]);

    if (!auction) return null;

    const handleSave = () => {
        if (isReopening) {
            onReopen(auction.id, editForm);
        } else {
            onUpdate(auction.id, editForm);
        }
        setIsEditing(false);
        setIsReopening(false);
    };

    const startReopen = () => {
        setIsReopening(true);
        setIsEditing(true);
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Modal.Header closeButton className="border-0">
                <Modal.Title>{isReopening ? 'Reopen Auction' : (isEditing ? 'Edit Auction' : 'Auction Details')}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {isEditing ? (
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Title</Form.Label>
                            <Form.Control
                                type="text"
                                value={editForm.title}
                                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                as="textarea" rows={4}
                                value={editForm.description}
                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            />
                        </Form.Group>
                        {isReopening && (
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold text-dark">New End Time</Form.Label>
                                <Form.Control
                                    type="datetime-local"
                                    onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })}
                                />
                                <Form.Text className="text-muted">Leave empty for +24 hours.</Form.Text>
                            </Form.Group>
                        )}
                        <Row>
                            <Col>
                                <Form.Group className="mb-3">
                                    <Form.Label>Start Price (₹)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={editForm.startPrice}
                                        onChange={(e) => setEditForm({ ...editForm, startPrice: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col>
                                <Form.Group className="mb-3">
                                    <Form.Label>Buy Now Price (₹)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={editForm.buyNowPrice}
                                        onChange={(e) => setEditForm({ ...editForm, buyNowPrice: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Form>
                ) : (
                    <Row>
                        <Col md={5}>
                            <img
                                src={`${import.meta.env.PROD ? '/api' : (import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080')}/auction-service${auction.imageUrl}`}
                                alt={auction.title}
                                className="img-fluid rounded shadow-sm mb-3"
                            />
                            <div className="d-grid gap-2">
                                <StatusBadge status={auction.status} />
                                <div className="text-muted small">
                                    <strong>Seller:</strong> {auction.sellerName || 'Unknown'}<br />
                                    <strong>Winner:</strong> {auction.winnerName || 'None'}<br />
                                    <strong>Payment:</strong> {auction.paid ? <span className="text-success fw-bold">PAID</span> : 'Unpaid'}<br />
                                    <strong>Created:</strong> {new Date(auction.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                        </Col>
                        <Col md={7}>
                            <h3>{auction.title}</h3>
                            <h2 className="text-primary fw-bold">₹{auction.startPrice}</h2>
                            {auction.buyNowPrice && <h5 className="text-muted">Buy Now: ₹{auction.buyNowPrice}</h5>}

                            <hr />
                            <h6 className="fw-bold">Description</h6>
                            <p className="text-muted" style={{ whiteSpace: 'pre-wrap' }}>
                                {auction.description}
                            </p>
                        </Col>
                    </Row>
                )}
            </Modal.Body>
            <Modal.Footer className="border-0 justify-content-between">
                <div>
                    {/* Action Buttons for Pending/Open */}
                    {!isEditing && auction.status === 'PENDING' && (
                        <>
                            <Button variant="success" onClick={() => onAction(auction.id, 'approve')} className="me-2 rounded-pill">Approve</Button>
                            <Button variant="danger" onClick={() => onAction(auction.id, 'reject')} className="rounded-pill">Reject</Button>
                        </>
                    )}
                    {!isEditing && auction.status !== 'PENDING' && (
                        <div className="d-flex gap-2">
                            {['WAITING_LIVE', 'OPEN'].includes(auction.status) && (
                                <Button variant="warning" onClick={() => onAction(auction.id, 'start-live')} className="rounded-pill text-white fw-bold">
                                    Start Live Auction
                                </Button>
                            )}
                            {['SOLD', 'CLOSED', 'UNSOLD', 'REJECTED'].includes(auction.status) && !auction.paid && (
                                <Button variant="dark" onClick={startReopen} className="rounded-pill">
                                    Reopen Auction
                                </Button>
                            )}
                            <Button variant="outline-secondary" onClick={() => onAction(auction.id, 'close')} className="rounded-pill">Archive/Close</Button>
                        </div>
                    )}
                </div>

                <div className="d-flex gap-2">
                    {isEditing ? (
                        <>
                            <Button variant="outline-secondary" onClick={() => { setIsEditing(false); setIsReopening(false); }}>Cancel</Button>
                            <Button variant="primary" onClick={handleSave}>
                                {isReopening ? <><Clock size={16} className="me-1" /> Reopen</> : <><Save size={16} className="me-1" /> Save Changes</>}
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="outline-danger" onClick={() => onAction(auction.id, 'delete')}><Trash2 size={16} /></Button>
                            <Button variant="primary" onClick={() => setIsEditing(true)}><Edit2 size={16} className="me-1" /> Edit</Button>
                        </>
                    )}
                </div>
            </Modal.Footer>
        </Modal>
    );
};

const StatusBadge = ({ status }) => {
    let bg = 'secondary';
    if (status === 'OPEN') bg = 'success';
    if (status === 'PENDING') bg = 'warning';
    if (status === 'REJECTED') bg = 'danger';
    if (status === 'SOLD') bg = 'success';
    if (status === 'WAITING_LIVE') bg = 'info';
    if (status === 'LIVE') bg = 'danger';

    return (
        <Badge bg={bg} pill className="px-3 py-2 shadow-sm w-100 text-center">
            {status}
        </Badge>
    );
};

export default AdminDashboard;
