import crypto from 'node:crypto';

import jwt from 'jsonwebtoken';

import { env } from '../config/env.js';
import AppError from './app-error.js';

export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
export const createRandomToken = () => crypto.randomBytes(32).toString('hex');

export const signAccessToken = (user) =>
  jwt.sign({ role: user.role, version: user.tokenVersion }, env.JWT_ACCESS_SECRET, {
    subject: user.id,
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    issuer: 'indigomart-api',
    audience: 'indigomart-web',
  });

export const signRefreshToken = (user, sessionId) =>
  jwt.sign({ sessionId }, env.JWT_REFRESH_SECRET, {
    subject: user.id,
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    issuer: 'indigomart-api',
    audience: 'indigomart-web',
  });

const verifyToken = (token, secret, label) => {
  try {
    return jwt.verify(token, secret, {
      issuer: 'indigomart-api',
      audience: 'indigomart-web',
    });
  } catch {
    throw new AppError(`${label} is invalid or expired.`, 401);
  }
};

export const verifyAccessToken = (token) => verifyToken(token, env.JWT_ACCESS_SECRET, 'Access token');
export const verifyRefreshToken = (token) => verifyToken(token, env.JWT_REFRESH_SECRET, 'Refresh token');
