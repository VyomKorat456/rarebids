import React, { useState, useEffect } from 'react';
import { Navbar, Container, Nav, Button, Dropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { PlusCircle, User, LogOut, Gavel } from 'lucide-react';
import { motion } from 'framer-motion';
import { jwtDecode } from 'jwt-decode';

const PremiumNavbar = (props) => {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const [localScrolled, setLocalScrolled] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    // Use prop if provided, otherwise fallback to local state
    const scrolled = props.isScrolled !== undefined ? props.isScrolled : localScrolled;

    useEffect(() => {
        if (token) {
            try {
                const decoded = jwtDecode(token);
                if (decoded.realm_access?.roles?.includes('ADMIN')) {
                    setIsAdmin(true);
                }
            } catch (e) {
                // Invalid token
            }
        }
    }, [token]);

    useEffect(() => {
        // Only add window listener if parent isn't controlling scroll
        if (props.isScrolled !== undefined) return;

        const handleScroll = () => setLocalScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [props.isScrolled]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const isSolid = props.variant === 'solid';

    return (
        <Navbar
            expand="md"
            fixed="top"
            className={`py-3 transition-all ${scrolled && !isSolid ? 'mx-4 mt-3 rounded-4' : ''} ${isSolid ? 'bg-white border-bottom' : ''}`}
            style={{
                transition: 'all 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
                background: isSolid ? '#ffffff' : (scrolled ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.25) 100%)' : 'transparent'),
                backdropFilter: scrolled && !isSolid ? 'blur(35px) saturate(240%)' : 'none',
                WebkitBackdropFilter: scrolled && !isSolid ? 'blur(35px) saturate(240%)' : 'none',
                border: scrolled && !isSolid ? '1px solid rgba(255, 255, 255, 0.4)' : (isSolid ? '1px solid #eee' : '1px solid transparent'),
                boxShadow: scrolled || isSolid ? '0 4px 20px rgba(0,0,0,0.05)' : 'none',
                willChange: 'margin, border-radius, backdrop-filter',
                backfaceVisibility: 'hidden',
            }}
        >
            <Container fluid={scrolled}>
                <Navbar.Brand as={Link} to="/home" className="d-flex align-items-center gap-2">
                    <div style={{ background: 'var(--color-primary)', padding: '6px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(217, 160, 91, 0.3)' }}>
                        <Gavel size={24} color="white" />
                    </div>
                    <span style={{ fontFamily: 'Playfair Display', fontWeight: '700', fontSize: '1.5rem', color: 'var(--color-text-main)' }}>
                        BidSystem
                    </span>
                </Navbar.Brand>

                <Navbar.Toggle aria-controls="basic-navbar-nav" className="border-0 shadow-none">
                    <div className="p-2 rounded-circle" style={{ background: 'rgba(255,255,255,0.5)', backpackFilter: 'blur(10px)' }}>
                        <span className="navbar-toggler-icon"></span>
                    </div>
                </Navbar.Toggle>

                <Navbar.Collapse id="basic-navbar-nav">
                    <div
                        className="d-flex flex-column flex-md-row align-items-center w-100 mt-3 mt-md-0 p-3 p-md-0 gap-3 rounded-4"
                        style={{
                            background: window.innerWidth < 768 ? 'rgba(255, 255, 255, 0.95)' : 'transparent', // Solid glass on mobile
                            backdropFilter: window.innerWidth < 768 ? 'blur(20px)' : 'none',
                            boxShadow: window.innerWidth < 768 ? '0 10px 30px rgba(0,0,0,0.1)' : 'none',
                            border: window.innerWidth < 768 ? '1px solid rgba(255,255,255,0.5)' : 'none'
                        }}
                    >
                        <Nav className="mx-auto align-items-center gap-3 w-100 w-md-auto text-center">
                            <NavLink to="/home">Explore</NavLink>
                            <NavLink to="/home">Categories</NavLink>
                            <NavLink to="/how-it-works">How it Works</NavLink>
                            {token && <NavLink to="/my-bids">My Bids</NavLink>}
                            {token && <NavLink to="/history">History</NavLink>}
                        </Nav>

                        {window.innerWidth < 768 && <hr className="w-100 my-2 text-muted opacity-25" />}

                        <div className="d-flex flex-column flex-md-row align-items-center gap-3 w-100 w-md-auto justify-content-center">
                            {token ? (
                                <>
                                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-100 w-md-auto">
                                        <Button
                                            onClick={props.onCreateClick ? props.onCreateClick : () => navigate('/home')}
                                            className="btn-premium d-flex align-items-center justify-content-center gap-2 shadow-sm w-100 w-md-auto"
                                        >
                                            <PlusCircle size={18} /> Create Auction
                                        </Button>
                                    </motion.div>

                                    {/* Desktop Profile Dropdown */}
                                    <div className="d-none d-md-block">
                                        <Dropdown align="end">
                                            <Dropdown.Toggle variant="light" className="d-flex align-items-center gap-2 rounded-pill px-3 border-0 bg-white shadow-sm">
                                                <div style={{ width: '30px', height: '30px', background: '#f0f0f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <User size={18} color="var(--color-text-main)" />
                                                </div>
                                            </Dropdown.Toggle>

                                            <Dropdown.Menu className="border-0 shadow-lg p-2" style={{ borderRadius: '12px', marginTop: '10px' }}>
                                                {isAdmin && <Dropdown.Item as={Link} to="/admin" className="rounded p-2 mb-1">Admin Dashboard</Dropdown.Item>}
                                                <Dropdown.Item as={Link} to="/my-bids" className="rounded p-2 mb-1">My Bids</Dropdown.Item>
                                                <Dropdown.Item as={Link} to="/history" className="rounded p-2 mb-1">Auction History</Dropdown.Item>
                                                <Dropdown.Item onClick={handleLogout} className="rounded p-2 text-danger">
                                                    <LogOut size={16} className="me-2" /> Logout
                                                </Dropdown.Item>
                                            </Dropdown.Menu>
                                        </Dropdown>
                                    </div>

                                    {/* Mobile Expanded Menu (No Dropdown) */}
                                    <div className="d-md-none w-100 d-flex flex-column gap-2">
                                        <div className="d-flex align-items-center justify-content-center gap-2 py-2 text-muted">
                                            <User size={16} /> <span>Account</span>
                                        </div>

                                        {isAdmin && (
                                            <Button
                                                as={Link}
                                                to="/admin"
                                                variant="light"
                                                className="w-100 rounded-pill border-0 shadow-sm d-flex align-items-center justify-content-center gap-2 py-2"
                                                style={{ background: 'rgba(255,255,255,0.8)' }}
                                            >
                                                Admin Dashboard
                                            </Button>
                                        )}

                                        <Button
                                            as={Link}
                                            to="/my-bids"
                                            variant="light"
                                            className="w-100 rounded-pill border-0 shadow-sm d-flex align-items-center justify-content-center gap-2 py-2"
                                            style={{ background: 'rgba(255,255,255,0.8)' }}
                                        >
                                            My Bids
                                        </Button>

                                        <Button
                                            as={Link}
                                            to="/history"
                                            variant="light"
                                            className="w-100 rounded-pill border-0 shadow-sm d-flex align-items-center justify-content-center gap-2 py-2"
                                            style={{ background: 'rgba(255,255,255,0.8)' }}
                                        >
                                            Auction History
                                        </Button>

                                        <Button
                                            onClick={handleLogout}
                                            variant="light"
                                            className="w-100 rounded-pill border-0 shadow-sm d-flex align-items-center justify-content-center gap-2 py-2 text-danger"
                                            style={{ background: 'rgba(255,220,220,0.5)' }}
                                        >
                                            <LogOut size={18} /> Logout
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <Button as={Link} to="/login" variant="outline-dark" className="rounded-pill px-4 w-100 w-md-auto">Login</Button>
                            )}
                        </div>
                    </div>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

const NavLink = ({ to, children }) => (
    <Nav.Link
        as={Link}
        to={to}
        style={{ fontWeight: '500', color: 'var(--color-text-main)', position: 'relative' }}
        className="nav-hover"
    >
        {children}
    </Nav.Link>
);

export default PremiumNavbar;
