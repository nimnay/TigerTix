
// src/setupTests.js

import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;


import { setupServer } from 'msw/node';
//import { handlers } from './mocks/handlers';
import '@testing-library/jest-dom';



// src/mocks/handlers.js
import { rest } from 'msw';

export const handlers = [
    //register
    rest.post('http://localhost:3001/auth/register', async (req, res, ctx) => {
        const { username } = await req.json();

        return res(
            ctx.status(201),
            ctx.json({
                username,
                token: 'mock-jwt',
                message: 'User registered successfully',
            })
        );
    }),

    //login
    rest.post('http://localhost:3001/auth/login', async (req, res, ctx) => {
        const { username } = await req.json()
        return res(
            ctx.status(200),
            ctx.json({
                username,
                token: 'mock-jwt',
                message: 'Login successful',
            })
        );
    }),

    rest.get('http://localhost:6001/api/events', (req, res, ctx) => {
        return res(
            ctx.status(200),
            ctx.json([
                { id: 1, name: 'Concert', date: '2025-12-01', available_tickets: 100 },
                { id: 2, name: 'Play', date: '2025-12-10', available_tickets: 50 },
            ])
        );
    }),



    // PROTECTED ROUTE
    rest.get('http://localhost:3001/protected', (req, res, ctx) => {
        const auth = req.headers.get('authorization');

        if (!auth || !auth.includes('mock-jwt')) {
            return res(
                ctx.status(401),
                ctx.json({ message: 'Unauthorized' })
            );
        }
        return res(
            ctx.status(200),
            ctx.json({ data: 'Protected content' })
          );
        })
];


const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
