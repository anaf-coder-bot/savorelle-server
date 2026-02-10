import jwt from "jsonwebtoken";

export const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader.authHeade?.split(" ")[1];

    if (!token) return res.status(401).json({msg: "Access denied."});

    jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
        if (err) return res.status(403).json({msg: "Access denied."});
        req.user = payload;
        next();
    });
};

export const allowRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) return res.status(403).json({msg: "Access denied."});
        next();
    };
};