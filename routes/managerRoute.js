import { Router } from "express";
import { add_poduct, edit_product } from "../controllers/manager.js";
import { validate as isValidUUID } from "uuid";

const router = Router();

router.post("/add-product", async (req, res) => {
    try {
        const { name, description, price, img, category } = req.body;

        if (!name || !price || !img || !category) return res.status(400).json({msg:"All fields are required."});
        if (!['starters', 'main dishes', 'desserts', 'drinks'].includes(category)) return res.status(400).json({msg:"Invalid category"});

        const do_add = await add_poduct(name, description, Number(price), img, category);
        return res.status(do_add.status).json({msg: do_add.msg});

    } catch(error) {
        console.error("Error on /manager/add-product:",error.message);
        return res.status(500).json({msg: "Something went wrong, try again."});
    };
});

router.post("/edit-product", async (req, res) => {
    try {
        const { id, name, description, price, img, category } = req.body;
        console.log(id, name, description, price, img, category)
        if (!id || !name || !price || !img || !category) return res.status(400).json({msg:"All fields are required."});
        if (!isValidUUID(id)) return res.status(400).json({msg:"Product not found."});

        const do_edit = await edit_product(id, name, description, Number(price), img, category);

        return res.status(do_edit.status).json({msg:do_edit.msg});

    } catch(error) {
        console.error("Error on /manager/edit-product:",error.message);
        return res.status(500).json({msg: "Something went wrong, try again."});
    };
});
    
export default router;