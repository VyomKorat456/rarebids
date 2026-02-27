import React, { useEffect, useState } from 'react';
import { Table, Badge, Spinner, Container } from 'react-bootstrap';
import api from '../api/axios';
import { motion } from 'framer-motion';

const PaymentHistory = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await api.get('/auction-service/payment/all', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPayments(response.data);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch payments", err);
            setLoading(false);
        }
    };

    if (loading) return <div className="text-center py-5"><Spinner animation="border" /></div>;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-4 rounded-4 shadow-sm"
        >
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="m-0" style={{ fontFamily: 'Playfair Display', fontWeight: 'bold' }}>Payment History</h4>
                <Badge bg="primary" className="px-3 py-2 rounded-pill">Total: {payments.length}</Badge>
            </div>

            <Table hover responsive className="align-middle">
                <thead className="bg-light">
                    <tr>
                        <th className="border-0 rounded-start">ID</th>
                        <th className="border-0">Order ID</th>
                        <th className="border-0">User ID</th>
                        <th className="border-0">Auction ID</th>
                        <th className="border-0">Amount</th>
                        <th className="border-0">Status</th>
                        <th className="border-0 rounded-end">Date</th>
                    </tr>
                </thead>
                <tbody>
                    {payments.length === 0 ? (
                        <tr>
                            <td colSpan="7" className="text-center py-4 text-muted">No payments found.</td>
                        </tr>
                    ) : (
                        payments.map((payment) => (
                            <tr key={payment.id}>
                                <td className="text-muted fw-bold">#{payment.id}</td>
                                <td className="small font-monospace text-primary">{payment.orderId}</td>
                                <td>{payment.userId}</td>
                                <td>{payment.auctionId}</td>
                                <td className="fw-bold text-success">₹{payment.amount}</td>
                                <td>
                                    <Badge
                                        bg={payment.status === 'SUCCESS' ? 'success' : payment.status === 'FAILED' ? 'danger' : 'warning'}
                                        className="rounded-pill px-3"
                                    >
                                        {payment.status}
                                    </Badge>
                                </td>
                                <td className="text-muted small">
                                    {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : '-'}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </Table>
        </motion.div>
    );
};

export default PaymentHistory;
