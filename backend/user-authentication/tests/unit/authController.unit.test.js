/**
 * Unit Tests for Authentication Controller
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { register, login, logout } = require('../../controllers/authController');
const { createUser, getUserByUsername } = require('../../models/userModel');

// Mock the models
jest.mock('../../models/userModel');

describe('AuthController Unit Tests', () => {
    let req, res;

    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();

        // Mock request and response objects
        req = {
            body: {},
            cookies: {}
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            clearCookie: jest.fn().mockReturnThis()
        };
    });

    describe('register', () => {
        test('should register a new user with valid data', async () => {
            req.body = {
                username: 'testuser',
                password: 'password123',
                email: 'test@example.com'
            };

            createUser.mockResolvedValue();

            await register(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({ message: 'User registered successfully' });
            expect(createUser).toHaveBeenCalledWith(
                'testuser',
                expect.any(String), // hashed password
                'test@example.com'
            );
        });

        test('should return 400 if username is missing', async () => {
            req.body = {
                password: 'password123',
                email: 'test@example.com'
            };

            await register(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'All fields are required' });
            expect(createUser).not.toHaveBeenCalled();
        });

        test('should return 400 if password is missing', async () => {
            req.body = {
                username: 'testuser',
                email: 'test@example.com'
            };

            await register(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'All fields are required' });
            expect(createUser).not.toHaveBeenCalled();
        });

        test('should return 400 if email is missing', async () => {
            req.body = {
                username: 'testuser',
                password: 'password123'
            };

            await register(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'All fields are required' });
            expect(createUser).not.toHaveBeenCalled();
        });

        test('should hash password before storing', async () => {
            req.body = {
                username: 'testuser',
                password: 'plainpassword',
                email: 'test@example.com'
            };

            createUser.mockResolvedValue();

            await register(req, res);

            const hashedPassword = createUser.mock.calls[0][1];
            expect(hashedPassword).not.toBe('plainpassword');
            expect(hashedPassword).toMatch(/^\$2[ayb]\$.{56}$/); // bcrypt format
        });
    });

    describe('login', () => {
        test('should login with valid credentials', async () => {
            req.body = {
                username: 'testuser',
                password: 'password123'
            };

            const hashedPassword = await bcrypt.hash('password123', 10);
            getUserByUsername.mockResolvedValue({
                id: 1,
                username: 'testuser',
                password_hash: hashedPassword
            });

            await login(req, res);

            expect(res.json).toHaveBeenCalledWith({
                token: expect.any(String),
                username: 'testuser', 
                message: 'Login successful'
            });
            expect(getUserByUsername).toHaveBeenCalledWith('testuser');
        });

        test('should return 401 if user does not exist', async () => {
            req.body = {
                username: 'nonexistent',
                password: 'password123'
            };

            getUserByUsername.mockResolvedValue(null);

            await login(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
        });

        test('should return 401 if password is incorrect', async () => {
            req.body = {
                username: 'testuser',
                password: 'wrongpassword'
            };

            const hashedPassword = await bcrypt.hash('correctpassword', 10);
            getUserByUsername.mockResolvedValue({
                id: 1,
                username: 'testuser',
                password_hash: hashedPassword
            });

            await login(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
        });

        test('should generate valid JWT token', async () => {
            req.body = {
                username: 'testuser',
                password: 'password123'
            };

            const hashedPassword = await bcrypt.hash('password123', 10);
            getUserByUsername.mockResolvedValue({
                id: 1,
                username: 'testuser',
                password_hash: hashedPassword
            });

            await login(req, res);

            const token = res.json.mock.calls[0][0].token;
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
            
            expect(decoded).toHaveProperty('id', 1);
            expect(decoded).toHaveProperty('iat');
            expect(decoded).toHaveProperty('exp');
        });

        test('should set token expiration to 30 minutes', async () => {
            req.body = {
                username: 'testuser',
                password: 'password123'
            };

            const hashedPassword = await bcrypt.hash('password123', 10);
            getUserByUsername.mockResolvedValue({
                id: 1,
                username: 'testuser',
                password_hash: hashedPassword
            });

            await login(req, res);

            const token = res.json.mock.calls[0][0].token;
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
            
            const expectedExpiration = 30 * 60; // 30 minutes in seconds
            const actualExpiration = decoded.exp - decoded.iat;
            
            expect(actualExpiration).toBe(expectedExpiration);
        });
    });

    describe('logout', () => {
        test('should logout successfully', async () => {
            await logout(req, res);

            expect(res.clearCookie).toHaveBeenCalledWith('token');
            expect(res.json).toHaveBeenCalledWith({ message: 'Logout successful on client side' });
        });

        test('should clear token cookie on logout', async () => {
            await logout(req, res);

            expect(res.clearCookie).toHaveBeenCalledWith('token');
        });
    });
});
