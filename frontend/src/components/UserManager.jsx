import React, { useState, useEffect } from 'react';
import { Table, Button, Form, Modal, Alert, Pagination, Spinner, Badge } from 'react-bootstrap';
import api from '../api/axios'; // Centralized API Use
import { Trash2, Edit2, User, Search, Shield, ShieldOff, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const UserManager = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Add User Modal State
    const [showAddModal, setShowAddModal] = useState(false);
    const [addFormData, setAddFormData] = useState({
        username: '', email: '', password: '', firstName: '', lastName: ''
    });

    // Pagination State
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const PAGE_SIZE = 10;

    // Edit User Modal State
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [editFormData, setEditFormData] = useState({
        firstName: '', lastName: '', email: '', enabled: false
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(0); // Reset to first page on search
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        fetchUsers();
    }, [page, debouncedSearch]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = { page, size: PAGE_SIZE };
            if (debouncedSearch) {
                params.search = debouncedSearch;
            }

            // Fetch Count for Pagination
            const countResponse = await api.get('/auth-service/auth/users/count', { params: { search: debouncedSearch } });
            setTotalPages(Math.ceil(countResponse.data / PAGE_SIZE));

            // Fetch Users
            const response = await api.get('/auth-service/auth/users', { params });
            setUsers(response.data);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch users", err);
            setError("Failed to load users.");
            setLoading(false);
        }
    };

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/auth-service/auth/register', addFormData);
            setShowAddModal(false);
            setAddFormData({ username: '', email: '', password: '', firstName: '', lastName: '' });
            fetchUsers();
            alert("User created successfully");
        } catch (err) {
            alert("Failed to create user. " + (err.response?.data || err.message));
        }
    };

    const handleEditClick = (user) => {
        setSelectedUser(user);
        setEditFormData({
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || '',
            enabled: user.enabled
        });
        setShowEditModal(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/auth-service/auth/users/${selectedUser.id}`, {
                ...selectedUser,
                ...editFormData
            });
            setShowEditModal(false);
            fetchUsers();
        } catch (err) {
            alert("Failed to update user");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this user? This cannot be undone.")) return;
        try {
            await api.delete(`/auth-service/auth/users/${id}`);
            fetchUsers();
        } catch (err) {
            alert("Failed to delete user");
        }
    };

    const handleToggleStatus = async (user) => {
        try {
            await api.put(`/auth-service/auth/users/${user.id}`, {
                ...user,
                enabled: !user.enabled
            });
            fetchUsers(); // Refresh to show new status
        } catch (err) {
            alert("Failed to change status");
        }
    };

    return (
        <div className="p-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4 gap-3">
                <h3 className="text-secondary d-flex align-items-center gap-2 m-0">
                    <User size={24} /> User Management
                </h3>
                <div className="d-flex gap-2 w-100 w-md-auto">
                    <div className="position-relative flex-grow-1">
                        <Search size={18} className="position-absolute text-muted" style={{ top: '50%', left: '10px', transform: 'translateY(-50%)' }} />
                        <Form.Control
                            type="text"
                            placeholder="Search users..."
                            className="ps-5"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Button variant="primary" onClick={() => setShowAddModal(true)}>
                        + Add User
                    </Button>
                    <Button variant="outline-primary" onClick={fetchUsers} disabled={loading}>
                        Refresh
                    </Button>
                </div>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            {loading ? (
                <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
            ) : (
                <div className="glass-panel text-dark">
                    <Table responsive hover className="mb-0">
                        <thead className="bg-light">
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Username</th>
                                <th>Status</th>
                                <th className="text-end">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id}>
                                    <td>{user.firstName} {user.lastName}</td>
                                    <td>{user.email}</td>
                                    <td><Badge bg="light" text="dark">{user.username}</Badge></td>
                                    <td>
                                        <div
                                            className={`d-flex align-items-center gap-1 cursor-pointer badge ${user.enabled ? 'bg-success' : 'bg-danger'}`}
                                            onClick={() => handleToggleStatus(user)}
                                            style={{ cursor: 'pointer', width: 'fit-content' }}
                                            title="Click to toggle status"
                                        >
                                            {user.enabled ? <><CheckCircle size={12} /> Active</> : <><ShieldOff size={12} /> Disabled</>}
                                        </div>
                                    </td>
                                    <td className="text-end">
                                        <Button variant="link" className="text-primary p-0 me-3" onClick={() => handleEditClick(user)}>
                                            <Edit2 size={18} />
                                        </Button>
                                        <Button variant="link" className="text-danger p-0" onClick={() => handleDelete(user.id)}>
                                            <Trash2 size={18} />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="text-center py-4 text-muted">No users found.</td>
                                </tr>
                            )}
                        </tbody>
                    </Table>

                    <div className="p-3 d-flex justify-content-between align-items-center border-top">
                        <Button
                            variant="outline-secondary"
                            size="sm"
                            disabled={page === 0}
                            onClick={() => setPage(p => p - 1)}
                        >
                            Previous
                        </Button>
                        <span className="text-muted small">Page {page + 1} of {totalPages}</span>
                        <Button
                            variant="outline-secondary"
                            size="sm"
                            disabled={page >= totalPages - 1} // Correct logic for 0-indexed page
                            onClick={() => setPage(p => p + 1)}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}

            {/* Add User Modal */}
            <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered>
                <Modal.Header closeButton className="border-0">
                    <Modal.Title>Add New User</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleAddSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Username</Form.Label>
                            <Form.Control
                                type="text"
                                required
                                value={addFormData.username}
                                onChange={e => setAddFormData({ ...addFormData, username: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Email</Form.Label>
                            <Form.Control
                                type="email"
                                required
                                value={addFormData.email}
                                onChange={e => setAddFormData({ ...addFormData, email: e.target.value })}
                            />
                        </Form.Group>
                        <div className="row">
                            <div className="col-6 mb-3">
                                <Form.Label>First Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    required
                                    value={addFormData.firstName}
                                    onChange={e => setAddFormData({ ...addFormData, firstName: e.target.value })}
                                />
                            </div>
                            <div className="col-6 mb-3">
                                <Form.Label>Last Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    required
                                    value={addFormData.lastName}
                                    onChange={e => setAddFormData({ ...addFormData, lastName: e.target.value })}
                                />
                            </div>
                        </div>
                        <Form.Group className="mb-3">
                            <Form.Label>Password</Form.Label>
                            <Form.Control
                                type="password"
                                required
                                value={addFormData.password}
                                onChange={e => setAddFormData({ ...addFormData, password: e.target.value })}
                            />
                        </Form.Group>
                        <div className="d-flex justify-content-end gap-2">
                            <Button variant="light" onClick={() => setShowAddModal(false)}>Cancel</Button>
                            <Button variant="primary" type="submit">Create User</Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>

            {/* Edit User Modal */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered size="sm">
                <Modal.Header closeButton className="border-0">
                    <Modal.Title>Edit User</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleEditSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>First Name</Form.Label>
                            <Form.Control
                                type="text"
                                value={editFormData.firstName}
                                onChange={e => setEditFormData({ ...editFormData, firstName: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Last Name</Form.Label>
                            <Form.Control
                                type="text"
                                value={editFormData.lastName}
                                onChange={e => setEditFormData({ ...editFormData, lastName: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Email</Form.Label>
                            <Form.Control
                                type="email"
                                value={editFormData.email}
                                onChange={e => setEditFormData({ ...editFormData, email: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Check
                            type="switch"
                            id="custom-switch"
                            label="Account Enabled"
                            checked={editFormData.enabled}
                            onChange={e => setEditFormData({ ...editFormData, enabled: e.target.checked })}
                            className="mb-3"
                        />
                        <div className="d-flex justify-content-end gap-2">
                            <Button variant="light" onClick={() => setShowEditModal(false)}>Cancel</Button>
                            <Button variant="primary" type="submit">Save Changes</Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default UserManager;
