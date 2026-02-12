import { Router } from "express";
import { add_poduct, add_staff, edit_product, edit_staff, get_staff } from "../controllers/manager.js";
import { validate as isValidUUID } from "uuid";
import { notifyEmailChange, sendWelcomeEmail } from "../utils/email.js";

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

        if (!id || !name || !price || !img || !category) return res.status(400).json({msg:"All fields are required."});
        if (!isValidUUID(id)) return res.status(400).json({msg:"Product not found."});

        const do_edit = await edit_product(id, name, description, Number(price), img, category);

        return res.status(do_edit.status).json({msg:do_edit.msg});

    } catch(error) {
        console.error("Error on /manager/edit-product:",error.message);
        return res.status(500).json({msg: "Something went wrong, try again."});
    };
});

router.get("/get-staff", async (req, res) => {
    try {
        const do_get = await get_staff();
        return res.status(do_get.status).json({staff:do_get.msg});
    } catch (error) {
        console.error("Error on /manager/get-staff", error.message);
        return res.status(500).json({msg:"Something went wrong, try again."});
    };
});

router.post("/add-staff", async (req, res) => {
    try {
        const { name, email } = req.body;
        if (!name || !email ) return res.status(400).json({msg:"All fields are required."});

        const do_staff = await add_staff(name, email);
        if (do_staff.status===200) sendWelcomeEmail(do_staff.data);

        return res.status(do_staff.status).json({msg:do_staff.msg});
    } catch(error) {
        console.error("Error on /manager/add-staff:",error.message);
        return res.status(500).json({msg:"Something went wrong, try again."});
    };
});

router.post("/edit-staff", async (req, res) => {
    try {
        const { id, email } = req.body;
        if (!id || !email) return res.status(400).json({msg:"All fields are required."});
        if (!isValidUUID(id)) return res.status(400).json({msg:"Staff not found."});
        
        const do_edit = await edit_staff(id, email);
        if (do_edit.status===200) notifyEmailChange(do_edit.data);
        return res.status(do_edit.status).json({msg:do_edit.msg});
    } catch(error) {
        console.error("Error on /manager/edit-staff:",error.message);
        return res.status(500).json({msg:"Something went wrong, try again."});
    };
});
    
export default router;