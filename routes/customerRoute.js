import { Router } from "express";
import { get_product, get_table } from "../controllers/customer.js";
import { validate as isValidUUID } from "uuid";
import { confirmEmail } from "../utils/email.js";

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

router.get("/get-table", async (req, res) => {
    try {
        const table = await get_table();
        return res.status(table.status).json({tables:table.msg});
    } catch(error) {
        console.error("Error on /manager/get-table:",error.message);
        return res.status(500).json({msg:"Something went wrong, try again."});
    };
});

router.get("/get-table/:id", async (req, res) => {
    try {
        const id = req.params.id;
        if (!isValidUUID(id)) return res.status(400).json({msg:"Table not found."});
        const table = await get_table({id:id});
        if (table.msg.length===0)
            return res.status(400).json({msg:"Table not found."});
        return res.status(200).json({table:table.msg});
    } catch(error) {
        console.error("Error on /manager/get-table/:id", error.message);
        return res.status(500).json({msg:"Something went wrong, try again."});
    };
});

router.post("/verify-email", async (req, res) => {
    try {
        const { name, phone, email } = req.body;
        if (!name || !phone || !email) return res.status(400).json({msg:"All fields are required."});
        const code = Math.floor(1000 + Math.random() * 9000);
        await confirmEmail({name, email, code});
        return res.status(200).json({code});
    } catch(error) {
        console.log("Error on /customer/verify-email.html", error.message);
        return res.status(500).json({msg:"Something went wrong, try again."});
    };
});

export default router;