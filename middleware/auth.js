import jwt from "jsonwebtoken";

const secret = process.env.SECRET;

const auth = async (req, res, next) => {
  try {
    const token = req.headers["accesstoken"]?.split(" ")[1];

    if (!token) {
      return next(
        new AppError(
          "Unauthorized. Token is required.",
          "AuthenticationError",
          "EX-00103",
          401
        )
      );
    }

    const decoded = jwt.verify(token, secret);
    req.userId = decoded.id;
    next();
  } catch (error) {
    next(error);
  }
};

export default auth;
