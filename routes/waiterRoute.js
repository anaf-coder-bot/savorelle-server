import { Router } from "express";
import { get_order } from "../controllers/waiter.js";

const router = Router();

router.get("/get-order", async (req, res) => {
    try {
        const do_order = await get_order();
        return res.status(do_order.status).json({msg:do_order.msg&&do_order.msg, order:do_order.order&&do_order.order});
    } catch(error) {
        console.error("Error on /waiter/get-order:",error.message);
        return res.status(500).json({msg:"Something went wrong, try again."});
    };
});

router.post("/update-status", async (req, res) => {
    try {
        // DO UPDATE
    } catch(error) {
        console.error("Error on /waiter/update-status:",error.message);
        return res.status(500).json({msg:"Something went wrong, try again."});
    };
});

export default router;