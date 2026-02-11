import jwt from "jsonwebtoken";

export const authenticate = (req, res, next) => {
    
    const authHeader = req.headers.authorization ? req.headers.authorization : "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

    if (!token) return res.status(401).json({msg: "Access denied. No token provided."});

    jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
        if (err) return res.status(403).json({msg: "Invalid or expired token."});
        req.user = payload;
        next();
    });
};

export const allowRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) return res.status(403).json({msg: "You do not have permision to access this page."});
        next();
    };
};