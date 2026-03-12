import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Spinner, Badge, Button, Form, InputGroup, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, DollarSign, Clock, CheckCircle, XCircle, PlusCircle } from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';

const AllAuctions = () => {
    const [auctions, setAuctions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, OPEN, LIVE, SOLD
    const [isScrolled, setIsScrolled] = useState(false);
    
    // Category Request state
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [requesting, setRequesting] = useState(false);
    const [requestData, setRequestData] = useState({ name: '', description: '' });
    
    // Server-Side Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await api.get('/auction-service/categories');
                setCategories(res.data);
            } catch (err) {
                console.error("Failed to fetch categories", err);
            }
        };
        fetchCategories();
    }, []);

    const fetchAuctions = async () => {
        setLoading(true);
        try {
            const pageIndex = currentPage - 1; // Backend is 0-indexed
            let url = `/auction-service/auctions/paginated?page=${pageIndex}&size=${itemsPerPage}&search=${searchTerm}&statusStr=${statusFilter}`;
            if (selectedCategory) {
                url += `&categoryId=${selectedCategory}`;
            }
            const res = await api.get(url);
            setAuctions(res.data.content);
            setTotalPages(res.data.totalPages);
        } catch (err) {
            console.error("Fetch failed", err);
        } finally {
            setLoading(false);
        }
    };

    // Refetch when page or filters change
    useEffect(() => {
        fetchAuctions();
    }, [currentPage, statusFilter, selectedCategory]);

    // Delay search triggering so it doesn't fire on every keystroke
    useEffect(() => {
        const delayBounceFn = setTimeout(() => {
            if (currentPage !== 1) {
                setCurrentPage(1); // Reset to page 1 on new search, which will trigger the parent useEffect automatically
            } else {
                fetchAuctions(); // If already on page 1, manually trigger
            }
        }, 500);
        return () => clearTimeout(delayBounceFn);
    }, [searchTerm]);

    const handleStatusChange = (status) => {
        setStatusFilter(status);
        setCurrentPage(1); // Reset to page 1 on tab swap
    };

    const handleCategoryChange = (catId) => {
        setSelectedCategory(catId === selectedCategory ? null : catId);
        setCurrentPage(1);
    };

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleRequestCategory = async (e) => {
        e.preventDefault();
        setRequesting(true);
        try {
            await api.post('/auction-service/categories/request', requestData);
            alert('Category request submitted successfully!');
            setShowRequestModal(false);
            setRequestData({ name: '', description: '' });
        } catch (err) {
            console.error("Request failed", err);
            alert('Failed to submit request. ' + (err.response?.data?.message || 'Please try again.'));
        } finally {
            setRequesting(false);
        }
    };

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
                            onClick={() => handleStatusChange('ALL')}
                            className="rounded-pill px-3"
                        >
                            All
                        </Button>
                        <Button
                            variant={statusFilter === 'OPEN' ? 'success' : 'outline-success'}
                            onClick={() => handleStatusChange('OPEN')}
                            className="rounded-pill px-3"
                        >
                            Active
                        </Button>
                        <Button
                            variant={statusFilter === 'LIVE' ? 'danger' : 'outline-danger'}
                            onClick={() => handleStatusChange('LIVE')}
                            className="rounded-pill px-3"
                        >
                            Live
                        </Button>
                        <Button
                            variant={statusFilter === 'SOLD' ? 'secondary' : 'outline-secondary'}
                            onClick={() => handleStatusChange('SOLD')}
                            className="rounded-pill px-3"
                        >
                            Sold
                        </Button>
                    </div>
                </div>

                {/* Category Selection */}
                <div className="mb-5">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <p className="text-muted small fw-bold text-uppercase m-0 ls-1">Browse by Category</p>
                        <Button 
                            variant="link" 
                            className="text-primary small p-0 fw-bold text-decoration-none d-flex align-items-center gap-1"
                            onClick={() => setShowRequestModal(true)}
                            style={{ fontSize: '0.8rem' }}
                        >
                            <PlusCircle size={14} /> Request New Category
                        </Button>
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                        <Button
                            variant={selectedCategory === null ? 'primary' : 'outline-primary'}
                            className={`rounded-pill px-4 py-2 border-0 shadow-sm transition-all ${selectedCategory === null ? 'btn-premium' : 'bg-white text-dark border'}`}
                            onClick={() => setSelectedCategory(null)}
                            style={{ fontSize: '0.85rem' }}
                        >
                            All Collections
                        </Button>
                        {categories.map(cat => (
                            <Button
                                key={cat.id}
                                variant={selectedCategory === cat.id ? 'primary' : 'outline-primary'}
                                className={`rounded-pill px-4 py-2 border-0 shadow-sm transition-all ${selectedCategory === cat.id ? 'btn-premium' : 'bg-white text-dark border'}`}
                                onClick={() => handleCategoryChange(cat.id)}
                                style={{ fontSize: '0.85rem' }}
                            >
                                {cat.name}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Category Request Modal */}
                <Modal show={showRequestModal} onHide={() => setShowRequestModal(false)} centered className="premium-modal">
                    <Modal.Header closeButton className="border-0 pb-0">
                        <Modal.Title className="fw-bold">Request New Category</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="pt-3">
                        <p className="text-muted small mb-4">Suggest a new category for our marketplace. Our admins will review and add it if it's a good fit!</p>
                        <Form onSubmit={handleRequestCategory}>
                            <Form.Group className="mb-3">
                                <Form.Label className="small fw-bold">Category Name</Form.Label>
                                <Form.Control 
                                    type="text" 
                                    placeholder="e.g. Vintage Watches, Digital Art..." 
                                    required 
                                    value={requestData.name}
                                    onChange={e => setRequestData({...requestData, name: e.target.value})}
                                    className="rounded-3 shadow-none p-2"
                                />
                            </Form.Group>
                            <Form.Group className="mb-4">
                                <Form.Label className="small fw-bold">Description (Optional)</Form.Label>
                                <Form.Control 
                                    as="textarea" 
                                    rows={3} 
                                    placeholder="Briefly describe what goes in this category..." 
                                    value={requestData.description}
                                    onChange={e => setRequestData({...requestData, description: e.target.value})}
                                    className="rounded-3 shadow-none p-2"
                                />
                            </Form.Group>
                            <div className="d-flex gap-2">
                                <Button variant="light" className="w-100 rounded-pill py-2" onClick={() => setShowRequestModal(false)}>
                                    Cancel
                                </Button>
                                <Button variant="primary" type="submit" className="w-100 rounded-pill py-2 btn-premium border-0" disabled={requesting}>
                                    {requesting ? <Spinner animation="border" size="sm" /> : 'Submit Request'}
                                </Button>
                            </div>
                        </Form>
                    </Modal.Body>
                </Modal>

                {loading ? (
                    <div className="text-center py-5"><Spinner animation="border" variant="secondary" /></div>
                ) : (
                    <>
                        <Row className="row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 row-cols-xl-5 g-4 mb-5">
                            <AnimatePresence>
                                {auctions.map((auction, index) => (
                                    <Col key={auction.id}>
                                        <motion.div
                                            layout
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            transition={{ duration: 0.3 }}
                                            className="h-100"
                                        >
                                            <AuctionCard auction={auction} />
                                        </motion.div>
                                    </Col>
                                ))}
                            </AnimatePresence>

                            {!loading && auctions.length === 0 && (
                                <Col xs={12} className="text-center py-5 text-muted d-flex justify-content-center w-100">
                                    <h5 className="m-0 text-center">No auctions found matching your criteria.</h5>
                                </Col>
                            )}
                        </Row>

                        {/* Pagination Controls - Outside the Grid */}
                        {!loading && totalPages > 1 && (
                            <div className="d-flex justify-content-center mt-5 mb-5 pt-4 border-top">
                                <div className="d-flex gap-2">
                                    <Button
                                        variant="outline-secondary"
                                        disabled={currentPage === 1}
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        className="rounded-pill px-4 shadow-sm bg-white"
                                    >
                                        Previous
                                    </Button>

                                    {[...Array(totalPages)].map((_, i) => (
                                        <Button
                                            key={i + 1}
                                            variant={currentPage === i + 1 ? 'dark' : 'outline-secondary'}
                                            onClick={() => handlePageChange(i + 1)}
                                            className={`rounded-circle shadow-sm ${currentPage === i + 1 ? 'btn-premium border-0' : 'bg-white'}`}
                                            style={{ width: '45px', height: '45px', padding: 0 }}
                                        >
                                            {i + 1}
                                        </Button>
                                    ))}

                                    <Button
                                        variant="outline-secondary"
                                        disabled={currentPage === totalPages}
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        className="rounded-pill px-4 shadow-sm bg-white"
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </Container>

            <Footer />
        </div>
    );
};

const AuctionCard = ({ auction }) => {
    const navigate = useNavigate();
    
    // An auction is considered "Sold/Ended" if the backend says SOLD/CLOSED, 
    // OR if the end time has already passed (even if the backend hasn't realized it yet)
    const timeHasPassed = new Date(auction.endTime) < new Date();
    const isSold = auction.status === 'SOLD' || auction.status === 'CLOSED' || (auction.status === 'OPEN' && timeHasPassed);
    const isOpen = (auction.status === 'OPEN' || auction.status === 'WAITING_LIVE') && !timeHasPassed;
    const isLive = auction.status === 'LIVE';

    return (
        <div
            className="glass-panel h-100 overflow-hidden cursor-pointer card-hover"
            onClick={() => navigate(`/auction/${auction.id}`)}
            style={{ transition: 'all 0.3s ease' }}
        >
            <div className="position-relative" style={{ height: '220px' }}>
                <img
                    src={`${import.meta.env.PROD ? '/api' : (import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080')}/auction-service${auction.imageUrl}`}
                    alt={auction.title}
                    className="w-100 h-100"
                    style={{ objectFit: 'cover', filter: isSold ? 'grayscale(100%)' : 'none' }}
                    onError={(e) => { e.target.onerror = null; e.target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22400%22%20height%3D%22300%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20300%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_18e11e86b0b%20text%20%7B%20fill%3A%23AAAAAA%3Bfont-weight%3Abold%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A20pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_18e11e86b0b%22%3E%3Crect%20width%3D%22400%22%20height%3D%22300%22%20fill%3D%22%23EEEEEE%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%22115%22%20y%3D%22155%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E'; }}
                />

                {/* Status Overlay */}
                <div className="position-absolute top-0 end-0 m-2">
                    {isSold ? (
                        <Badge bg="danger" className="shadow-sm d-flex align-items-center gap-1 px-3 py-2">
                            <XCircle size={14} /> ENDED
                        </Badge>
                    ) : isLive ? (
                        <Badge bg="danger" className="shadow-sm d-flex align-items-center gap-1 px-3 py-2 animate-pulse">
                            ACTIVE LIVE
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
                <h6 className="mb-3 text-truncate fw-bold" style={{ fontSize: '1rem' }}>{auction.title}</h6>

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

export default AllAuctions;
