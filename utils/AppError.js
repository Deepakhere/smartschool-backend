/**
 * Custom application error class
 * Allows for creating consistent error objects throughout the application
 */
class AppError extends Error {
  /**
   * Create a new AppError
   * @param {string} message - Error message
   * @param {string} name - Error name/type
   * @param {string} code - Error code for tracking
   * @param {number} statusCode - HTTP status code
   */
  constructor(
    message,
    name = "ServerError",
    code = "EX-500",
    statusCode = 500
  ) {
    super(message);
    this.name = name;
    this.code = code;
    this.statusCode = statusCode;

    // Maintain proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
