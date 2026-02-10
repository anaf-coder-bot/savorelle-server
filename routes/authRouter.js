import { Router } from "express";
import { login_user } from "../controllers/auth.js";
import jwt from "jsonwebtoken";

const router = Router();

router.post("/login", async (req, res) => {
    try {
        const { username, password, client } = req.body;
        if (!username || !password || !['web', 'app'].includes(client))
            return res.status(400).json({msg: "All Fields are required."});

        const req_login_user = await login_user(username, password, client);
        if (req_login_user.status===200) {
            const accessToken = jwt.sign(req_login_user.payload, process.env.JWT_SECRET, {expiresIn: "3d"});
            return res.status(200).json({accessToken});
        } else return res.status(req_login_user.status).json({msg: req_login_user.msg});

    } catch(error) {
        console.log("Error on /auth/login:",error.message);
        return res.status(500).json({msg: "Something went wrong, try again."});
    };
});

export default router;