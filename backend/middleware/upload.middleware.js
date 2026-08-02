import multer from 'multer';

import AppError from '../utils/app-error.js';

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
  fileFilter: (_request, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(new AppError('Only JPEG, PNG, WebP, and AVIF images are accepted.', 415));
      return;
    }
    callback(null, true);
  },
});

export const uploadProductImages = (request, response, next) => {
  upload.array('images', 10)(request, response, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      const statusCode = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      next(new AppError(error.message, statusCode));
      return;
    }
    next(error);
  });
};

export const uploadGovtId = (request, response, next) => {
  upload.single('govtIdImage')(request, response, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      const statusCode = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      next(new AppError(error.message, statusCode));
      return;
    }
    next(error);
  });
};

export const uploadPaymentScreenshot = (request, response, next) => {
  upload.single('paymentScreenshot')(request, response, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      const statusCode = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      next(new AppError(error.message, statusCode));
      return;
    }
    next(error);
  });
};
