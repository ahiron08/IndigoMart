import {
  getRefundRequests,
  getRefundRequestById,
  processRefund,
} from '../services/refund.service.js';
import asyncHandler from '../utils/async-handler.js';

export const adminGetRefunds = asyncHandler(async (request, response) => {
  const page = parseInt(request.query.page, 10) || 1;
  const limit = parseInt(request.query.limit, 10) || 20;
  const status = request.query.status;
  const result = await getRefundRequests({ page, limit, status });
  response.status(200).json({ success: true, data: result });
});

export const adminGetRefund = asyncHandler(async (request, response) => {
  const refund = await getRefundRequestById(request.params.id);
  response.status(200).json({ success: true, data: { refund } });
});

export const adminProcessRefund = asyncHandler(async (request, response) => {
  const { action, rejectionReason } = request.body;
  const refund = await processRefund({
    refundId: request.params.id,
    adminId: request.user.id,
    action,
    rejectionReason,
  });
  response.status(200).json({
    success: true,
    message: `Refund ${refund.status}.`,
    data: { refund },
  });
});