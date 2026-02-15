import { Router } from "express";
import { get_order, update_status } from "../controllers/kitchen.js";

const router = Router();

router.get("/get-orders", async (req, res) => {
    try {
        const do_orders = await get_order();
        return res.status(do_orders.status).json({msg:do_orders.msg&&do_orders.msg, orders:do_orders.order&&do_orders.order});
    } catch(error) {
        console.error("Error on /kitchen/get-order:",error.message);
        return res.status(500).json({msg:"Something went wrong, try again."});
    };
});

router.post("/update-status", async (req, res) => {
    try {
        const { id, status } = req.body;
        if (!id || !status) return res.status(400).json({msg:"All fields are required."});
        if (!['preparing', 'done'].includes(status)) return res.status(400).json({msg:"Invalid status."});
        const do_status = await update_status(id, status);
        if (do_status.status===200) {
            const io = req.app.get("io");
            io.to("kitchen").emit("order-updated", do_status.order[0]);
        };
        return res.status(do_status.status).json({msg:do_status.msg, order:do_status.order&&do_status.status});
    } catch(error) {
        console.error("Error on /kitchen/update-status:",error.message);
        return res.status(500).json({msg:"Something went wrong, try again"});
    };
});

export default router;