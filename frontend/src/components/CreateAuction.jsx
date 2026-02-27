import { Modal, Form, Button, Spinner, Alert, Row, Col } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { UploadCloud, CheckCircle, ArrowRight, DollarSign } from 'lucide-react';
import api from '../api/axios';

const CreateAuctionModal = ({ show, onHide }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        startPrice: '',
        buyNowPrice: '',
        categoryId: '',
        itemCondition: 'NEW', // Default
        shippingInfo: '',
        tags: '',
        endTime: '',
        image: null
    });
    const [categories, setCategories] = useState([]);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);

    // Fetch Categories when modal opens
    useEffect(() => {
        if (show) {
            const fetchCategories = async () => {
                try {
                    const res = await api.get('/auction-service/categories');
                    setCategories(res.data);
                } catch (err) {
                    console.error("Failed to load categories", err);
                }
            };
            fetchCategories();
        }
    }, [show]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, image: file });
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const data = new FormData();
        data.append('title', formData.title);
        data.append('description', formData.description);
        data.append('startPrice', formData.startPrice);
        if (formData.buyNowPrice) data.append('buyNowPrice', formData.buyNowPrice);
        if (formData.categoryId) data.append('categoryId', formData.categoryId);
        data.append('itemCondition', formData.itemCondition);
        data.append('shippingInfo', formData.shippingInfo);
        data.append('tags', formData.tags);
        if (formData.endTime) data.append('endTime', formData.endTime);

        if (formData.image) data.append('image', formData.image);

        try {
            await api.post('/auction-service/auctions', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setLoading(false);
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                setFormData({
                    title: '', description: '', startPrice: '', buyNowPrice: '',
                    categoryId: '', itemCondition: 'NEW', shippingInfo: '', tags: '', endTime: '', image: null
                });
                setPreview(null);
                onHide(); // Close modal on success
                // Optionally trigger a refresh of auctions in parent
            }, 2000);
        } catch (err) {
            setLoading(false);
            setError("Failed to create auction. " + (err.response?.data || "Please try again."));
        }
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" centered scrollable={true}>
            <Modal.Header closeButton style={{ background: '#f8f9fa', borderBottom: '1px solid #eee' }}>
                <Modal.Title style={{ fontFamily: 'Playfair Display', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                    Create New Listing
                </Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ padding: '2rem' }}>
                {success ? (
                    <div className="text-center py-5">
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
                            <CheckCircle size={64} color="var(--color-primary)" className="mb-4" />
                        </motion.div>
                        <h3 className="mb-3">Submitted Successfully!</h3>
                        <p className="text-muted">Your auction is now pending approval.</p>
                    </div>
                ) : (
                    <Form id="create-auction-form" onSubmit={handleSubmit}>
                        {error && <Alert variant="danger">{error}</Alert>}

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small text-muted fw-bold">ITEM TITLE *</Form.Label>
                                    <Form.Control type="text" name="title" value={formData.title} onChange={handleChange} required placeholder="e.g. Vintage Camera" style={{ borderRadius: '8px' }} />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small text-muted fw-bold">CATEGORY *</Form.Label>
                                    <Form.Select name="categoryId" value={formData.categoryId} onChange={handleChange} required style={{ borderRadius: '8px' }}>
                                        <option value="">Select Category</option>
                                        {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label className="small text-muted fw-bold">DESCRIPTION *</Form.Label>
                            <Form.Control as="textarea" rows={4} name="description" value={formData.description} onChange={handleChange} required style={{ borderRadius: '8px' }} />
                        </Form.Group>

                        <Row>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small text-muted fw-bold">START PRICE ($) *</Form.Label>
                                    <Form.Control type="number" name="startPrice" value={formData.startPrice} onChange={handleChange} required min="0" step="0.01" style={{ borderRadius: '8px' }} />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small text-muted fw-bold">BUY NOW ($)</Form.Label>
                                    <Form.Control type="number" name="buyNowPrice" value={formData.buyNowPrice} onChange={handleChange} min="0" step="0.01" style={{ borderRadius: '8px' }} />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small text-muted fw-bold">END TIME</Form.Label>
                                    <Form.Control type="datetime-local" name="endTime" value={formData.endTime} onChange={handleChange} style={{ borderRadius: '8px' }} />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small text-muted fw-bold">CONDITION</Form.Label>
                                    <Form.Select name="itemCondition" value={formData.itemCondition} onChange={handleChange} style={{ borderRadius: '8px' }}>
                                        <option value="NEW">New</option>
                                        <option value="USED">Used</option>
                                        <option value="REFURBISHED">Refurbished</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small text-muted fw-bold">SHIPPING INFO</Form.Label>
                                    <Form.Control type="text" name="shippingInfo" value={formData.shippingInfo} onChange={handleChange} placeholder="e.g. Free Shipping" style={{ borderRadius: '8px' }} />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-4">
                            <Form.Label className="small text-muted fw-bold">TAGS</Form.Label>
                            <Form.Control type="text" name="tags" value={formData.tags} onChange={handleChange} placeholder="Comma separated tags" style={{ borderRadius: '8px' }} />
                        </Form.Group>

                        <Form.Group className="mb-4">
                            <Form.Label className="small text-muted fw-bold">UPLOAD IMAGE *</Form.Label>
                            <div className="border rounded p-3 text-center" style={{ borderStyle: 'dashed', borderColor: '#ddd', backgroundColor: '#f9f9f9' }}>
                                <Form.Control type="file" accept="image/*" onChange={handleImageChange} className="d-none" id="fileUpload" />
                                <label htmlFor="fileUpload" style={{ cursor: 'pointer', width: '100%' }}>
                                    <UploadCloud size={24} className="text-muted mb-2" />
                                    <div className="text-primary">{formData.image ? "Change File" : "Click to Upload"}</div>
                                </label>
                            </div>
                            {preview && <img src={preview} alt="Preview" className="mt-3 rounded shadow-sm" style={{ maxHeight: '150px' }} />}
                        </Form.Group>
                    </Form>
                )}
            </Modal.Body>
            <Modal.Footer className="bg-light border-top-0 d-block">
                {!success && (
                    <Button
                        type="submit"
                        form="create-auction-form"
                        className="btn-premium w-100 py-3"
                        disabled={loading}
                    >
                        {loading ? <Spinner animation="border" size="sm" /> : <>Create Listing <ArrowRight size={18} /></>}
                    </Button>
                )}
            </Modal.Footer>
        </Modal>
    );
};

export default CreateAuctionModal;
