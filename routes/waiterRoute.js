import { Router } from "express";
import { get_order, update_status } from "../controllers/waiter.js";
import { payRestEmail } from "../utils/email.js";

const router = Router();

router.get("/get-order", async (req, res) => {
    try {
        const do_order = await get_order({waiter_id:req.user.staffId});
        return res.status(do_order.status).json({msg:do_order.msg&&do_order.msg, order:do_order.order&&do_order.order});
    } catch(error) {
        console.error("Error on /waiter/get-order:",error.message);
        return res.status(500).json({msg:"Something went wrong, try again."});
    };
});

router.post("/update-status", async (req, res) => {
    try {
        const { id, status } = req.body;
        if (!id || !status) return res.status(400).json({msg:"All fields are required."});
        if (!["paying", "cash"].includes(status)) return res.status(400).json({msg:"Invalid status."});
        const do_status = await update_status(id, status, req.user.staffId);
        if (do_status.status===200) {
            const io = req.app.get("io");
            io.to(do_status.order[0].waiter_name).emit("order-updated", do_status.order[0]);
            if (status==="paying") 
                payRestEmail(do_status.order[0]);
        };
        return res.status(do_status.status).json({msg:do_status.msg, order:do_status.order&&do_status.order[0]});
    } catch(error) {
        console.error("Error on /waiter/update-status:",error.message);
        return res.status(500).json({msg:"Something went wrong, try again."});
    };
});

export default router;