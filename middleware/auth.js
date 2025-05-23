const jwt = require("jsonwebtoken");
const ApiError = require("../utils/ApiError");
const User = require("../models/User");

// const authMiddleware = async (req, res, next) => {
//   try {
//     let token;
    
//     // Check for token in cookies
//     if (req.cookies?.token) {
//       token = req.cookies.token;
//     }
//     // Check for Authorization header
//     else if (req.headers.authorization?.startsWith("Bearer")) {
//       token = req.headers.authorization.split(" ")[1];
//     }

//     if (!token) {
//       throw new ApiError(401, "Not authenticated");
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     const user = await User.findById(decoded.userId).select("-password");

//     if (!user) {
//       throw new ApiError(401, "User not found");
//     }

//     req.user = user;
//     next();
//   } catch (error) {
//     next(error);
//   }
// };
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Assumes decoded token contains userId
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = authMiddleware;