import { authService } from '../services/auth.service.js';
import { sendResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  return sendResponse(res, 201, 'User registered successfully', result);
});

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  return sendResponse(res, 200, 'Login successful', result);
});

export const refreshToken = asyncHandler(async (req, res) => {
  const result = await authService.refreshToken(req.body.refreshToken);
  return sendResponse(res, 200, 'Token refreshed successfully', result);
});

export const logout = asyncHandler(async (req, res) => {
  const result = await authService.logout(req.body.refreshToken);
  return sendResponse(res, 200, 'Logged out successfully', result);
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user._id);
  return sendResponse(res, 200, 'Authenticated user profile fetched', user);
});

