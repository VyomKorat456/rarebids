import React, { useState } from 'react';
import { Container, Row, Col, Card, Badge } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { Search, PlusCircle, ShieldCheck, Gavel, Clock, CreditCard, Award, UserCheck } from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';

const HowItWorks = () => {
    const [isScrolled, setIsScrolled] = useState(false);

    return (
        <div
            style={{ background: 'var(--color-bg)', height: '100vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}
            onScroll={(e) => setIsScrolled(e.currentTarget.scrollTop > 20)}
        >
            <Navbar isScrolled={isScrolled} />

            {/* Hero Section */}
            <section className="py-5 mt-5">
                <Container className="text-center pt-5">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <Badge bg="secondary" className="mb-3 px-3 py-2 text-uppercase ls-1" style={{ letterSpacing: '2px', backgroundColor: '#D9A05B' }}>
                            Platform Guide
                        </Badge>
                        <h1 className="display-4 fw-bold mb-4" style={{ color: '#2C3E50', fontFamily: 'Playfair Display' }}>
                            How the Auction Works
                        </h1>
                        <p className="lead text-muted mx-auto" style={{ maxWidth: '700px' }}>
                            A completely transparent and fair marketplace. From listing your unique items to securing the winning bid, here is your guide to mastering the platform.
                        </p>
                    </motion.div>
                </Container>
            </section>

            {/* Steps Section */}
            <section className="py-5 mb-5">
                <Container>
                    <div className="position-relative">
                        {/* Vertical Line (Hidden on mobile) */}
                        <div className="d-none d-md-block position-absolute start-50 translate-middle-x h-100" style={{ width: '2px', background: 'var(--color-border)' }}></div>

                        {/* Step 1: Explore & Create */}
                        <StepRow
                            number="01"
                            title="Discover & Create Listings"
                            icon={<Search size={24} color="white" />}
                            description="Users can explore active auctions on the dashboard. Sellers can create new auctions by providing details and images. Every listing starts as a draft pending validation."
                            align="left"
                            details={[
                                "Browse distinct categories",
                                "Upload high-quality images",
                                "Set your starting price"
                            ]}
                        />

                        {/* Step 2: Admin Verification */}
                        <StepRow
                            number="02"
                            title="Secure Verification Process"
                            icon={<ShieldCheck size={24} color="white" />}
                            description="To ensure safety, every new auction is reviewed by our Admin team. Once approved, your auction goes live for the world to see. Admin rejection provides immediate feedback for correction."
                            align="right"
                            details={[
                                "Manual content review",
                                "Anti-fraud checks",
                                "Instant 'Go-Live' upon approval"
                            ]}
                        />

                        {/* Step 3: Dynamic Bidding */}
                        <StepRow
                            number="03"
                            title="The Bidding Arena"
                            icon={<Gavel size={24} color="white" />}
                            description="Engage in real-time bidding battles. The system ensures fair play with dynamic timer extensions."
                            align="left"
                            highlight
                            details={[
                                "Standard 30-second decision timer",
                                "Final Showdown: Last 2 bidders get 40 seconds",
                                "Highest bid at timer expiry wins"
                            ]}
                        />

                        {/* Step 4: Payment & Fulfillment */}
                        <StepRow
                            number="04"
                            title="Victory & Payment"
                            icon={<CreditCard size={24} color="white" />}
                            description="Winners must secure their item promptly. We offer a strict payment window to ensure sellers are paid without delay."
                            align="right"
                            details={[
                                "30-Minute Payment Window",
                                "Failure to pay passes opportunity to the runner-up",
                                "Secure transaction processing"
                            ]}
                        />
                    </div>
                </Container>
            </section>

            <Footer />
        </div>
    );
};

const StepRow = ({ number, title, description, icon, align, details, highlight }) => {
    const isRight = align === 'right';

    return (
        <Row className={`align-items-center mb-5 ${isRight ? 'flex-row-reverse' : ''}`}>
            {/* Content Column */}
            <Col md={5} className={`text-${isRight ? 'start' : 'end'} ${isRight ? 'text-md-start' : 'text-md-end'}`}>
                <motion.div
                    initial={{ opacity: 0, x: isRight ? 20 : -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="d-flex flex-column align-items-center d-md-none mb-3">
                        {/* Mobile Icon View */}
                        <div className="rounded-circle d-flex align-items-center justify-content-center shadow-sm mb-2"
                            style={{ width: '60px', height: '60px', background: highlight ? 'var(--color-primary)' : '#2C3E50' }}>
                            {icon}
                        </div>
                    </div>

                    <h2 style={{ fontFamily: 'Playfair Display', color: highlight ? 'var(--color-primary)' : '#2C3E50' }}>{title}</h2>
                    <p className="text-muted">{description}</p>
                    <ul className={`list-unstyled mt-3 ${isRight ? 'text-start' : 'text-end'} d-none d-md-block`}>
                        {details.map((item, i) => (
                            <li key={i} className="mb-2 text-muted small"><span style={{ color: 'var(--color-primary)' }}>•</span> {item}</li>
                        ))}
                    </ul>
                </motion.div>
            </Col>

            {/* Center Icon Column (Desktop) */}
            <Col md={2} className="text-center d-none d-md-flex justify-content-center">
                <div
                    className="rounded-circle d-flex align-items-center justify-content-center shadow"
                    style={{
                        width: '60px', height: '60px',
                        background: highlight ? 'var(--color-primary)' : '#2C3E50',
                        zIndex: 2,
                        border: '4px solid white'
                    }}
                >
                    {icon}
                </div>
            </Col>

            {/* Empty/Image Column */}
            <Col md={5}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className={`d-flex ${isRight ? 'justify-content-end' : 'justify-content-start'}`}
                >
                    <Card className="border-0 shadow-sm overflow-hidden" style={{ width: '100%', maxWidth: '350px', background: '#fff' }}>
                        <Card.Body className="p-4 position-relative">
                            <h1 className="position-absolute" style={{
                                top: '-10px', right: '10px', fontSize: '5rem', opacity: 0.05, fontWeight: 'bold'
                            }}>
                                {number}
                            </h1>
                            <div className="mb-3">
                                {details.map((item, i) => (
                                    <div key={i} className="d-flex align-items-center gap-2 mb-2">
                                        <UserCheck size={16} className="text-success" />
                                        <span className="small text-muted">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </Card.Body>
                    </Card>
                </motion.div>
            </Col>
        </Row>
    );
};

export default HowItWorks;
