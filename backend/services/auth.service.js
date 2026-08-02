import crypto from 'node:crypto';

import mongoose from 'mongoose';

import User from '../models/user.model.js';
import AppError from '../utils/app-error.js';
import {
  createRandomToken,
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../utils/token.js';
import { env } from '../config/env.js';
import { sendPasswordResetEmail } from './email.service.js';
import { uploadImage, deleteImages } from './image.service.js';

const sessionExpiry = () => new Date(Date.now() + env.REFRESH_COOKIE_MS);

const issueSession = async (user) => {
  const sessionId = new mongoose.Types.ObjectId();
  const refreshToken = signRefreshToken(user, sessionId.toString());

  user.sessions = (user.sessions || []).filter((session) => session.expiresAt > new Date());
  user.sessions.push({ _id: sessionId, tokenHash: hashToken(refreshToken), expiresAt: sessionExpiry() });
  await user.save({ validateModifiedOnly: true });

  return { accessToken: signAccessToken(user), refreshToken };
};

export const registerUser = async ({ name, email, password, phone }) => {
  const existingUser = await User.exists({ email });
  if (existingUser) throw new AppError('An account with this email already exists.', 409);

  const user = await User.create({ name, email, password, phone });
  const hydratedUser = await User.findById(user.id).select('+sessions +sessions.tokenHash +tokenVersion');
  const tokens = await issueSession(hydratedUser);
  return { user: hydratedUser, ...tokens };
};

export const registerCustomer = async ({ name, email, password, phone }) => {
  const existingUser = await User.exists({ email });
  if (existingUser) throw new AppError('An account with this email already exists.', 409);

  const user = await User.create({ name, email, password, phone, role: 'customer' });
  const hydratedUser = await User.findById(user.id).select('+sessions +sessions.tokenHash +tokenVersion');
  const tokens = await issueSession(hydratedUser);
  return { user: hydratedUser, ...tokens };
};

export const registerSeller = async (sellerData, govtIdFile) => {
  const { name, email, password, phone, shopName, businessType, gstNumber, panNumber, shopAddress, city, state, pinCode, shopDescription, categoriesSold, accountHolderName, bankName, accountNumber, ifscCode, govtIdType, govtIdNumber } = sellerData;

  if (!govtIdFile) throw new AppError('A government ID image is required for verification.', 422);

  const existingUser = await User.exists({ email });
  if (existingUser) throw new AppError('An account with this email already exists.', 409);

  const govtIdImage = await uploadImage(govtIdFile, 'indigomart/seller-govt-ids');
  try {
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: 'seller',
      isVerified: false,
      shopName,
      businessType,
      gstNumber,
      panNumber,
      shopAddress,
      city,
      state,
      pinCode,
      shopDescription,
      categoriesSold,
      accountHolderName,
      bankName,
      accountNumber,
      ifscCode,
      govtIdType,
      govtIdNumber,
      govtIdImage,
    });
    const hydratedUser = await User.findById(user.id).select('+sessions +sessions.tokenHash +tokenVersion');
    const tokens = await issueSession(hydratedUser);
    return { user: hydratedUser, ...tokens };
  } catch (error) {
    await deleteImages([govtIdImage.publicId]);
    throw error;
  }
};

export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password +sessions +sessions.tokenHash +tokenVersion');
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Email or password is incorrect.', 401);
  }
  if (user.isBlocked) throw new AppError('This account has been blocked.', 403);

  const tokens = await issueSession(user);
  return { user, ...tokens };
};

export const rotateRefreshToken = async (refreshToken) => {
  const payload = verifyRefreshToken(refreshToken);
  const user = await User.findById(payload.sub).select('+sessions +sessions.tokenHash +tokenVersion');
  const session = user?.sessions.id(payload.sessionId);

  if (!user || !session || session.tokenHash !== hashToken(refreshToken) || session.expiresAt <= new Date()) {
    throw new AppError('Refresh token is invalid or expired.', 401);
  }
  if (user.isBlocked) throw new AppError('This account has been blocked.', 403);

  session.deleteOne();
  return { user, ...(await issueSession(user)) };
};

export const revokeSession = async (refreshToken) => {
  if (!refreshToken) return;

  try {
    const payload = verifyRefreshToken(refreshToken);
    await User.updateOne(
      { _id: payload.sub },
      { $pull: { sessions: { _id: payload.sessionId, tokenHash: hashToken(refreshToken) } } },
    );
  } catch {
    // Logout remains idempotent when the cookie is missing, expired, or malformed.
  }
};

export const requestPasswordReset = async (email) => {
  const user = await User.findOne({ email }).select('+passwordResetToken +passwordResetExpiresAt');
  if (!user) return;

  const token = createRandomToken();
  user.passwordResetToken = hashToken(token);
  user.passwordResetExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
  await user.save({ validateModifiedOnly: true });

  const resetUrl = `${env.PASSWORD_RESET_URL}/${token}`;
  try {
    await sendPasswordResetEmail({ email: user.email, name: user.name, resetUrl });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpiresAt = undefined;
    await user.save({ validateModifiedOnly: true });
    throw error;
  }
};

export const resetUserPassword = async ({ token, password }) => {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    passwordResetToken: tokenHash,
    passwordResetExpiresAt: { $gt: new Date() },
  }).select('+passwordResetToken +passwordResetExpiresAt +sessions +sessions.tokenHash +tokenVersion');

  if (!user) throw new AppError('Password reset token is invalid or expired.', 400);

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpiresAt = undefined;
  user.sessions = [];
  user.tokenVersion += 1;
  await user.save();

  return { user, ...(await issueSession(user)) };
};