/**
 * Unit Tests for Authentication Middleware
 */

const jwt = require('jsonwebtoken');
const authMiddleware = require('../../middleware/authMiddleware');

const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';

describe('AuthMiddleware Unit Tests', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            headers: {},
            cookies: {}
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };

        next = jest.fn();
    });

    describe('Authorization Header', () => {
        test('should accept valid token in Authorization header', () => {
            const token = jwt.sign({ id: 1 }, JWT_SECRET, { expiresIn: '30m' });
            req.headers.authorization = `Bearer ${token}`;

            authMiddleware(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(req.userId).toBe(1);
            expect(res.status).not.toHaveBeenCalled();
        });

        test('should reject invalid token in Authorization header', () => {
            req.headers.authorization = 'Bearer invalid.token.here';

            authMiddleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid or expired token' });
            expect(next).not.toHaveBeenCalled();
        });

        test('should reject expired token', () => {
            const token = jwt.sign({ id: 1 }, JWT_SECRET, { expiresIn: '-1s' });
            req.headers.authorization = `Bearer ${token}`;

            authMiddleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid or expired token' });
            expect(next).not.toHaveBeenCalled();
        });

        test('should reject malformed Authorization header', () => {
            req.headers.authorization = 'NotBearer token';

            authMiddleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Authentication token missing' });
            expect(next).not.toHaveBeenCalled();
        });

        test('should handle Authorization header without Bearer prefix', () => {
            const token = jwt.sign({ id: 1 }, JWT_SECRET, { expiresIn: '30m' });
            req.headers.authorization = token;

            authMiddleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Authentication token missing' });
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('Cookie Authentication', () => {
        test('should accept valid token in cookie', () => {
            const token = jwt.sign({ id: 2 }, JWT_SECRET, { expiresIn: '30m' });
            req.cookies.token = token;

            authMiddleware(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(req.userId).toBe(2);
            expect(res.status).not.toHaveBeenCalled();
        });

        test('should reject invalid token in cookie', () => {
            req.cookies.token = 'invalid.token.here';

            authMiddleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid or expired token' });
            expect(next).not.toHaveBeenCalled();
        });

        test('should reject expired token in cookie', () => {
            const token = jwt.sign({ id: 2 }, JWT_SECRET, { expiresIn: '-1s' });
            req.cookies.token = token;

            authMiddleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid or expired token' });
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('Priority and Fallback', () => {
        test('should prioritize Authorization header over cookie', () => {
            const headerToken = jwt.sign({ id: 1 }, JWT_SECRET, { expiresIn: '30m' });
            const cookieToken = jwt.sign({ id: 2 }, JWT_SECRET, { expiresIn: '30m' });
            
            req.headers.authorization = `Bearer ${headerToken}`;
            req.cookies.token = cookieToken;

            authMiddleware(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(req.userId).toBe(1); // Should use header token (id: 1)
        });

        test('should fallback to cookie if Authorization header is missing', () => {
            const token = jwt.sign({ id: 2 }, JWT_SECRET, { expiresIn: '30m' });
            req.cookies.token = token;

            authMiddleware(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(req.userId).toBe(2);
        });
    });

    describe('Missing Token', () => {
        test('should reject request without token', () => {
            authMiddleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Authentication token missing' });
            expect(next).not.toHaveBeenCalled();
        });

        test('should reject request with empty Authorization header', () => {
            req.headers.authorization = '';

            authMiddleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Authentication token missing' });
            expect(next).not.toHaveBeenCalled();
        });

        test('should reject request with only "Bearer " in Authorization header', () => {
            req.headers.authorization = 'Bearer ';

            authMiddleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Authentication token missing' });
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('Token Payload', () => {
        test('should extract user ID from token', () => {
            const token = jwt.sign({ id: 123 }, JWT_SECRET, { expiresIn: '30m' });
            req.headers.authorization = `Bearer ${token}`;

            authMiddleware(req, res, next);

            expect(req.userId).toBe(123);
        });

        test('should handle token with additional claims', () => {
            const token = jwt.sign({ 
                id: 456, 
                username: 'testuser',
                role: 'admin'
            }, JWT_SECRET, { expiresIn: '30m' });
            req.headers.authorization = `Bearer ${token}`;

            authMiddleware(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(req.userId).toBe(456);
        });
    });
});
