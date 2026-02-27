import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Gavel, Heart } from 'lucide-react';

const Footer = () => {
    return (
        <footer style={{ backgroundColor: '#1a1a1a', color: '#e0e0e0', paddingTop: '4rem', paddingBottom: '2rem', marginTop: 'auto' }}>
            <Container>
                <Row className="mb-5 border-bottom border-light border-opacity-10 pb-4">
                    <Col md={4} className="mb-4 mb-md-0">
                        <div className="d-flex align-items-center gap-2 mb-3">
                            <Gavel size={24} color="#D9A05B" />
                            <h4 className="m-0 text-white" style={{ fontFamily: 'Playfair Display' }}>BidSystem</h4>
                        </div>
                        <p className="text-white-50 small">
                            The premium marketplace for unique items.
                            Discover, bid, and win exclusive treasures from around the world.
                        </p>
                    </Col>
                    <Col md={2} xs={6}>
                        <h6 className="text-uppercase mb-3 text-white small ls-1">Company</h6>
                        <ul className="list-unstyled small text-white-50">
                            <li className="mb-2"><a href="#" className="text-white-50 text-decoration-none hover-white">About Us</a></li>
                            <li className="mb-2"><a href="#" className="text-white-50 text-decoration-none hover-white">Careers</a></li>
                            <li className="mb-2"><a href="#" className="text-white-50 text-decoration-none hover-white">Press</a></li>
                        </ul>
                    </Col>
                    <Col md={2} xs={6}>
                        <h6 className="text-uppercase mb-3 text-white small ls-1">Support</h6>
                        <ul className="list-unstyled small text-white-50">
                            <li className="mb-2"><a href="#" className="text-white-50 text-decoration-none hover-white">Help Center</a></li>
                            <li className="mb-2"><a href="#" className="text-white-50 text-decoration-none hover-white">Safety</a></li>
                            <li className="mb-2"><a href="#" className="text-white-50 text-decoration-none hover-white">Terms</a></li>
                        </ul>
                    </Col>
                    <Col md={4}>
                        <h6 className="text-uppercase mb-3 text-white small ls-1">Newsletter</h6>
                        <div className="d-flex gap-2">
                            <input type="email" placeholder="Your email" className="form-control bg-dark border-secondary text-white shadow-none placeholder-gray" />
                            <button className="btn btn-primary px-3">Subscribe</button>
                        </div>
                    </Col>
                </Row>
                <div className="text-center small text-white-50">
                    <p>&copy; 2026 BidSystem Inc. All rights reserved.</p>
                </div>
            </Container>
        </footer>
    );
};

export default Footer;
