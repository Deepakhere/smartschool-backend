/**
 * Standardizes successful responses throughout the application
 * This middleware adds custom methods to the response object
 * to ensure a consistent response format
 */
const responseHandler = (req, res, next) => {
  // Send a success response with data
  res.success = (data, statusCode = 200) => {
    return res.status(statusCode).json({
      Status: "success",
      Data: data,
    });
  };

  // Send a success response with a message
  res.successMessage = (message, statusCode = 200) => {
    return res.status(statusCode).json({
      Status: "success",
      Data: {
        message,
      },
    });
  };

  // Send an error response
  res.error = (
    message,
    name = "ServerError",
    code = "EX-500",
    statusCode = 500
  ) => {
    return res.status(statusCode).json({
      Status: "failure",
      Error: {
        message,
        name,
        code,
      },
    });
  };

  // For custom errors with detailed information
  res.customError = (errorObj, statusCode = 500) => {
    return res.status(statusCode).json({
      Status: "failure",
      Error: errorObj,
    });
  };

  next();
};

export default responseHandler;
