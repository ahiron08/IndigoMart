import User from '../models/user.model.js';
import AppError from '../utils/app-error.js';
import { verifyAccessToken } from '../utils/token.js';
import asyncHandler from '../utils/async-handler.js';

export const authenticate = asyncHandler(async (request, _response, next) => {
  const authorization = request.get('authorization');
  const bearerToken = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null;
  const token = request.cookies.accessToken || bearerToken;

  if (!token) throw new AppError('Authentication is required.', 401);

  const payload = verifyAccessToken(token);
  const user = await User.findById(payload.sub).select('+tokenVersion');

  if (!user || user.tokenVersion !== payload.version) {
    throw new AppError('This session is no longer valid.', 401);
  }
  if (user.isBlocked) throw new AppError('This account has been blocked.', 403);

  request.user = user;
  next();
});

export const authorize = (...roles) => (request, _response, next) => {
  if (!request.user || !roles.includes(request.user.role)) {
    next(new AppError('You do not have permission to perform this action.', 403));
    return;
  }
  next();
};
