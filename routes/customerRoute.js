import { Router } from "express";
import { get_product } from "../controllers/customer.js";

const router = Router();

router.get("/get-product", async (req, res) => {
    try {
        const do_product = await get_product();
        return res.status(do_product.status).json({product:do_product.msg});
    } catch(error) {
        console.error("Error on /manager/get-product:",error.message);
        return res.status(500).json({msg: "Something went wrong, try again."});
    };
});

export default router;