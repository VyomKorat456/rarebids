import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, Users, Settings, LogOut, Bell, Search, Gavel } from 'lucide-react';
import { Container, Dropdown, Form, InputGroup } from 'react-bootstrap';

const AdminLayout = ({ children }) => {
    return (
        <div className="d-flex" style={{ height: '100vh', background: 'var(--color-bg)' }}>
            <Sidebar />
            <div className="flex-grow-1 d-flex flex-column overflow-hidden">
                <AdminHeader />
                <main className="flex-grow-1 overflow-auto p-4">
                    {children}
                </main>
            </div>
        </div>
    );
};

const Sidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const links = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
        { icon: Gavel, label: 'Live Console', path: '/admin/live-console' }, // New Link
        { icon: ShoppingBag, label: 'Auctions', path: '/admin/auctions' },
        { icon: Users, label: 'Users', path: '/admin/users' },
        { icon: Settings, label: 'Settings', path: '/admin/settings' },
    ];

    return (
        <div className="d-flex flex-column p-3 text-white" style={{ width: '260px', background: '#2C3E50', flexShrink: 0 }}>
            <div className="d-flex align-items-center gap-2 mb-5 px-2 mt-2">
                <Gavel size={28} color="#D9A05B" />
                <span style={{ fontFamily: 'Playfair Display', fontSize: '1.4rem', fontWeight: '600' }}>BidAdmin</span>
            </div>

            <nav className="flex-grow-1 d-flex flex-column gap-2">
                {links.map((link) => {
                    const isActive = location.pathname === link.path;
                    return (
                        <Link
                            key={link.label}
                            to={link.path}
                            className={`d-flex align-items-center gap-3 px-3 py-3 rounded text-decoration-none transition-all ${isActive ? 'bg-white bg-opacity-10 text-white' : 'text-white-50 hover-bg-opacity-10'}`}
                            style={{ transition: 'all 0.2s' }}
                        >
                            <link.icon size={20} />
                            <span style={{ fontWeight: '500' }}>{link.label}</span>
                        </Link>
                    )
                })}
            </nav>

            <div className="mt-auto">
                <button onClick={handleLogout} className="btn btn-outline-light w-100 border-0 d-flex align-items-center gap-2 text-white-50 hover-text-white">
                    <LogOut size={20} /> Logout
                </button>
            </div>
        </div>
    );
};

const AdminHeader = () => {
    return (
        <header className="bg-white border-bottom px-4 py-3 d-flex justify-content-between align-items-center sticky-top">
            <div style={{ width: '300px' }}>
                <InputGroup>
                    <InputGroup.Text className="bg-light border-0"><Search size={18} className="text-muted" /></InputGroup.Text>
                    <Form.Control placeholder="Search..." className="bg-light border-0 shadow-none" />
                </InputGroup>
            </div>

            <div className="d-flex align-items-center gap-3">
                <button className="btn btn-light rounded-circle p-2 position-relative">
                    <Bell size={20} />
                    <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle">
                        <span className="visually-hidden">New alerts</span>
                    </span>
                </button>
                <div className="d-flex align-items-center gap-2">
                    <div className="text-end d-none d-sm-block">
                        <div className="fw-bold small">Admin User</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>Super Admin</div>
                    </div>
                    <div className="bg-dark rounded-circle text-white d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                        Ad
                    </div>
                </div>
            </div>
        </header>
    );
};

export default AdminLayout;
