import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '@lms/db';
import { requireAuth } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET!;

// POST /auth/login - Email-only login (no password)
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, name } = req.body;

    if (!email || typeof email !== 'string') {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    // Find the demo tenant (assuming it exists from seed script)
    const tenant = await prisma.tenant.findFirst({
      where: { slug: 'demo' }
    });

    if (!tenant) {
      res.status(500).json({ error: 'Demo tenant not found. Please run the seed script first.' });
      return;
    }

    // Look up user by email and tenant
    let user = await prisma.user.findFirst({
      where: {
        email,
        tenantId: tenant.id
      }
    });

    // If user doesn't exist, create a new one
    if (!user) {
      const userName = name || email.split('@')[0];
      user = await prisma.user.create({
        data: {
          email,
          name: userName,
          role: 'student',
          tenantId: tenant.id
        }
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        tenantId: user.tenantId,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /auth/me - Get current user info
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId
      }
    });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
