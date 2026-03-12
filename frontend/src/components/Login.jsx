import { useState } from 'react';
import { Form, Button, Container, Card, Alert, Spinner } from 'react-bootstrap';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Using the centralized axios instance for consistent baseURL and interceptors
            const apiURL = import.meta.env.PROD ? '/api' : (import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080');
            const response = await axios.post(
                `${apiURL}/auth-service/auth/login`,
                { username, password },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log("LOGIN RESPONSE:", response.data);
            const { access_token, refresh_token } = response.data;
            localStorage.setItem('token', access_token);
            if (refresh_token) {
                localStorage.setItem('refresh_token', refresh_token);
            }

            try {
                const decoded = jwtDecode(access_token);
                localStorage.setItem('userId', decoded.sub);

                // Custom auth roles are prefixed with ROLE_ and in 'roles' claim
                const isAdmin = decoded.roles?.includes('ROLE_ADMIN');

                if (isAdmin) {
                    navigate('/admin');
                } else {
                    navigate('/home');
                }
            } catch (roleError) {
                console.warn("Failed to decode token for redirection", roleError);
                navigate('/home');
            }
        } catch (err) {
            console.error(err);
            setError('Invalid credentials or server error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
            <Card style={{ width: '400px' }} className="p-4 shadow">
                <h2 className="text-center mb-4">Login</h2>
                {error && <Alert variant="danger">{error}</Alert>}
                <Form onSubmit={handleLogin}>
                    <Form.Group className="mb-3">
                        <Form.Label>Username</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Enter username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Password</Form.Label>
                        <Form.Control
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </Form.Group>

                    <Button variant="primary" type="submit" className="w-100 mb-3" disabled={loading}>
                        {loading ? (
                            <>
                                <Spinner
                                    as="span"
                                    animation="border"
                                    size="sm"
                                    role="status"
                                    aria-hidden="true"
                                    className="me-2"
                                />
                                Logging in...
                            </>
                        ) : (
                            'Login'
                        )}
                    </Button>
                </Form>
                <div className="text-center">
                    Don't have an account? <Link to="/register">Register</Link>
                </div>
            </Card>
        </Container>
    );
};

export default Login;
