import { Router } from "express";
import { add_poduct } from "../controllers/manager.js";

const router = Router();

router.post("/add-product", async (req, res) => {
    try {
        const { name, description, price, img, category } = req.body;
        console.log(name, description, price, img, category)
        if (!name || !price || !img || !category) return res.status(400).json({msg:"All fields are required."});

        const do_add = await add_poduct(name, description, Number(price), img, category);
        return res.status(do_add.status).json({msg: do_add.msg});

    } catch(error) {
        console.error("Error on /manager/add-product:",error.message);
        return res.status(500).json({msg: "Something went wrong, try again."});
    };
});
    
export default router;