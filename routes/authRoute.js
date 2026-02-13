import { Router } from "express";
import { get_auth_user, login_user } from "../controllers/auth.js";
import jwt from "jsonwebtoken";

const router = Router();

const IS_PRO = process.env.NODE_ENV === "pro";

router.post("/login", async (req, res) => {
    try {
        const { username, password, client } = req.body;
        if (!username || !password || !['web', 'app'].includes(client))
            return res.status(400).json({msg: "All Fields are required."});

        const req_login_user = await login_user(String(username).trim(), password.trim(), client);
        if (req_login_user.status===200) {
            const accessToken = jwt.sign(req_login_user.payload, process.env.JWT_SECRET, {expiresIn: "15m"});
            const refreshToken = jwt.sign(req_login_user.payload, process.env.JWT_SECRET, {expiresIn: "5d"});
            if (client==="web")
                res.cookie("refreshToken", refreshToken, {
                    httpOnly: true,
                    secure: IS_PRO,
                    sameSite: IS_PRO ? "strict" : "lax",
                    expires: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
                });
            return res.status(200).json({user: { username: req_login_user.username, role: req_login_user.payload.role }, accessToken, refreshToken: client==="app"?refreshToken:undefined});
            
        } else return res.status(req_login_user.status).json({msg: req_login_user.msg});

    } catch(error) {
        console.error("Error on /auth/login:",error.message);
        return res.status(500).json({msg: "Something went wrong, try again."});
    };
});

router.post("/refresh", (req, res) => {
    try {
        const token = req.cookies?.refreshToken || req.body.refreshToken;

        if (!token) return res.sendStatus(401);
        
        jwt.verify(token, process.env.JWT_SECRET, async (err, payload) => {
            if (err) return res.sendStatus(403);

            const { iat, exp, ...rest } = payload;

            const is_staff = await get_auth_user(rest.staffId);
            if (is_staff.status!==200) {
                res.clearCookie("refreshToken", {
                    httpOnly: true,
                    secure: IS_PRO,
                    sameSite: IS_PRO ? "strict" : "lax",
                });
                return res.sendStatus(401);
            };

            const newAccessToken = jwt.sign(rest, process.env.JWT_SECRET, { expiresIn: "5d" });
            res.json({accessToken:newAccessToken, user: { role: rest.role, username: rest.username }});
        });
    } catch(error) {
        console.error("Error on /auth/refresh:",error.message);
        return res.status(500).json({msg: "Something went wrong, try again."})
    }
});

router.post("/logout", (req, res) => {
    try {
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: IS_PRO,
            sameSite: IS_PRO ? "strict": "lax",
        });
        return res.sendStatus(204);
    } catch(error) {
        console.error("Error on /auth/logout:",error.message);
        return res.status(500).json({msg: "Something went wrong, try again."});
    };
});

export default router;