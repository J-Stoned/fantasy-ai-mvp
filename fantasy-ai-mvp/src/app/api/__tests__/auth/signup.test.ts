import { POST } from '@/app/api/auth/signup/route';
import { NextRequest } from 'next/server';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
}));

const { prisma } = require('@/lib/prisma');

describe('/api/auth/signup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a new user successfully', async () => {
    // Mock user doesn't exist
    prisma.user.findUnique.mockResolvedValue(null);
    
    // Mock user creation
    prisma.user.create.mockResolvedValue({
      id: 'user-123',
      name: 'John Doe',
      email: 'john@example.com',
      createdAt: new Date(),
    });

    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.message).toBe('User created successfully');
    expect(data.user).toEqual({
      id: 'user-123',
      name: 'John Doe',
      email: 'john@example.com',
    });
  });

  it('returns error if user already exists', async () => {
    // Mock user exists
    prisma.user.findUnique.mockResolvedValue({
      id: 'existing-user',
      email: 'john@example.com',
    });

    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('User with this email already exists');
  });

  it('validates input data', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        name: 'A', // Too short
        email: 'invalid-email',
        password: '123', // Too short
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Name must be at least 2 characters');
  });

  it('handles missing required fields', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: 'john@example.com',
        // Missing name and password
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });
});