import mongoose from "mongoose";

const errorHandler = (err, req, res, next) => {
  // Default error object
  let error = {
    Status: "failure",
    Error: {
      message: "Something went wrong, please try again later.",
      name: "ServerError",
      code: "EX-500",
    },
  };

  // Handle Mongoose validation errors
  if (err instanceof mongoose.Error.ValidationError) {
    error.Error = {
      message: Object.values(err.errors)
        .map((val) => val.message)
        .join(", "),
      name: "ValidationError",
      code: "EX-00105",
    };
    return res.status(400).json(error);
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    error.Error = {
      message: "Invalid token. Please authenticate again.",
      name: "AuthenticationError",
      code: "EX-00103",
    };
    return res.status(401).json(error);
  }

  // Handle JWT expiration
  if (err.name === "TokenExpiredError") {
    error.Error = {
      message: "Token expired. Please login again.",
      name: "AuthenticationError",
      code: "EX-00103",
    };
    return res.status(401).json(error);
  }

  // Handle duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error.Error = {
      message: `${
        field.charAt(0).toUpperCase() + field.slice(1)
      } already exists.`,
      name: "DuplicateError",
      code: "EX-00102",
    };
    return res.status(400).json(error);
  }

  // Handle specific custom errors with status code
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      Status: "failure",
      Error: {
        message: err.message || "An error occurred",
        name: err.name || "Error",
        code: err.code || "EX-500",
      },
    });
  }

  // Default 500 server error
  res.status(500).json(error);
};

export default errorHandler;
