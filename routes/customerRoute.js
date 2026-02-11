import { Router } from "express";
import { get_product } from "../controllers/customer.js";

const router = Router();

router.get("/get-product", async (req, res) => {
    try {
        const do_product = await get_product();
        return res.status(200).json(do_product);
    } catch(error) {
        console.error("Error on /manager/get-product:",error.message);
        return res.status(500).json({msg: "Something went wrong, try again."});
    };
});

export default router;