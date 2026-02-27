import React, { useState, useEffect } from 'react';
import { Table, Button, Form, Modal, Alert } from 'react-bootstrap';
import api from '../api/axios';
import { Trash2, Plus, Tag } from 'lucide-react';
import { motion } from 'framer-motion';

const CategoryManager = () => {
    const [categories, setCategories] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [newCategory, setNewCategory] = useState({ name: '', description: '' });
    const [error, setError] = useState('');

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await api.get('/auction-service/categories');
            setCategories(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            await api.post('/auction-service/admin/categories', newCategory);
            setShowModal(false);
            setNewCategory({ name: '', description: '' });
            fetchCategories();
        } catch (err) {
            setError('Failed to add category');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            await api.delete(`/auction-service/admin/categories/${id}`);
            fetchCategories();
        } catch (err) {
            alert('Failed to delete');
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="m-0 text-dark">Category Management</h4>
                <Button onClick={() => setShowModal(true)} className="btn-premium d-flex align-items-center gap-2">
                    <Plus size={18} /> Add Category
                </Button>
            </div>

            <div className="glass-panel p-0 overflow-hidden">
                <Table hover responsive className="m-0 align-middle">
                    <thead className="bg-light">
                        <tr>
                            <th className="border-0 p-3 text-muted" style={{ fontWeight: '600' }}>ID</th>
                            <th className="border-0 p-3 text-muted" style={{ fontWeight: '600' }}>Name</th>
                            <th className="border-0 p-3 text-muted" style={{ fontWeight: '600' }}>Description</th>
                            <th className="border-0 p-3 text-end text-muted" style={{ fontWeight: '600' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categories.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="text-center p-5 text-muted">No categories found.</td>
                            </tr>
                        ) : (
                            categories.map(cat => (
                                <tr key={cat.id}>
                                    <td className="p-3">#{cat.id}</td>
                                    <td className="p-3 fw-bold text-primary">
                                        <div className="d-flex align-items-center gap-2">
                                            <Tag size={16} /> {cat.name}
                                        </div>
                                    </td>
                                    <td className="p-3 text-muted">{cat.description}</td>
                                    <td className="p-3 text-end">
                                        <Button variant="link" className="text-danger p-0" onClick={() => handleDelete(cat.id)}>
                                            <Trash2 size={18} />
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </Table>
            </div>

            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton className="border-0">
                    <Modal.Title>Add New Category</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {error && <Alert variant="danger">{error}</Alert>}
                    <Form onSubmit={handleAdd}>
                        <Form.Group className="mb-3">
                            <Form.Label>Category Name</Form.Label>
                            <Form.Control
                                type="text"
                                required
                                value={newCategory.name}
                                onChange={e => setNewCategory({ ...newCategory, name: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={newCategory.description}
                                onChange={e => setNewCategory({ ...newCategory, description: e.target.value })}
                            />
                        </Form.Group>
                        <div className="d-flex justify-content-end gap-2">
                            <Button variant="light" onClick={() => setShowModal(false)}>Cancel</Button>
                            <Button type="submit" className="btn-premium">Save Category</Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </motion.div>
    );
};

export default CategoryManager;
