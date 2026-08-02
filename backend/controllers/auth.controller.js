import { env } from '../config/env.js';
import {
  loginUser,
  registerUser,
  registerCustomer,
  registerSeller,
  requestPasswordReset,
  resetUserPassword,
  revokeSession,
  rotateRefreshToken,
} from '../services/auth.service.js';
import AppError from '../utils/app-error.js';
import asyncHandler from '../utils/async-handler.js';

const cookieBase = () => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
});

const setAuthCookies = (response, { accessToken, refreshToken }) => {
  response.cookie('accessToken', accessToken, {
    ...cookieBase(),
    maxAge: env.ACCESS_COOKIE_MS,
    path: '/api',
  });

  response.cookie('refreshToken', refreshToken, {
    ...cookieBase(),
    maxAge: env.REFRESH_COOKIE_MS,
    path: '/api/auth',
  });
};

const clearAuthCookies = (response) => {
  response.clearCookie('accessToken', {
    ...cookieBase(),
    path: '/api',
  });

  response.clearCookie('refreshToken', {
    ...cookieBase(),
    path: '/api/auth',
  });
};

export const register = asyncHandler(async (request, response) => {
  const result = await registerUser(request.body);

  setAuthCookies(response, result);

  response.status(201).json({
    success: true,
    message: 'Account created.',
    data: {
      user: result.user,
    },
  });
});

export const registerAsCustomer = asyncHandler(async (request, response) => {
  const result = await registerCustomer(request.body);

  setAuthCookies(response, result);

  response.status(201).json({
    success: true,
    message: 'Account created.',
    data: {
      user: result.user,
    },
  });
});

export const registerAsSeller = asyncHandler(async (request, response) => {
  const result = await registerSeller(request.body, request.file);

  setAuthCookies(response, result);

  response.status(201).json({
    success: true,
    message: 'Seller account created. Awaiting verification.',
    data: {
      user: result.user,
    },
  });
});

export const login = asyncHandler(async (request, response) => {
  const result = await loginUser(request.body);

  setAuthCookies(response, result);

  response.status(200).json({
    success: true,
    message: 'Signed in.',
    data: {
      user: result.user,
    },
  });
});

export const refresh = asyncHandler(async (request, response) => {
  const refreshToken = request.cookies?.refreshToken;

  if (!refreshToken) {
    throw new AppError('Refresh token is required.', 401);
  }

  const result = await rotateRefreshToken(refreshToken);

  setAuthCookies(response, result);

  response.status(200).json({
    success: true,
    message: 'Session refreshed.',
    data: {
      user: result.user,
    },
  });
});

export const logout = asyncHandler(async (request, response) => {
  const refreshToken = request.cookies?.refreshToken;

  if (refreshToken) {
    await revokeSession(refreshToken);
  }

  clearAuthCookies(response);

  response.status(200).json({
    success: true,
    message: 'Signed out successfully.',
  });
});

export const forgotPassword = asyncHandler(async (request, response) => {
  await requestPasswordReset(request.body.email);

  response.status(200).json({
    success: true,
    message:
      'If an account exists for that email, password reset instructions have been sent.',
  });
});

export const resetPassword = asyncHandler(async (request, response) => {
  const result = await resetUserPassword({
    token: request.params.token,
    password: request.body.password,
  });

  setAuthCookies(response, result);

  response.status(200).json({
    success: true,
    message: 'Password reset successfully.',
    data: {
      user: result.user,
    },
  });
});

export const getCurrentUser = (request, response) => {
  response.status(200).json({
    success: true,
    data: {
      user: request.user,
    },
  });
};

export const updateCurrentUser = asyncHandler(async (request, response) => {
  const { name, phone } = request.body;
  const user = request.user;

  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;

  await user.save();
  response.status(200).json({ success: true, data: { user } });
});
