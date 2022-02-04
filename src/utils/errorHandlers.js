/* eslint-disable no-console */
exports.validationErrorHandler = (err, req, res, next) => {
  if (err.isJoi) {
    res.status(400).json({
      code: 400,
      error: 'BAD_REQUEST',
      message: err.message,
    });
  } else {
    next(err);
  }
};

exports.logErrors = (err, req, res, next) => {
  console.error('Error Message: ', err.message);
  console.error('Error Stack: ', err.stack);
  next(err);
};

exports.clientErrorHandler = (err, req, res, next) => {
  if (req.xhr) {
    res.status(500).json({
      code: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Unable to process the request',
    });
  } else {
    next(err);
  }
};

// eslint-disable-next-line no-unused-vars
exports.errorHandler = (err, req, res, next) => {
  res.status(500).send('Unable to process the request');
};
