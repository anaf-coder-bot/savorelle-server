import { Router } from "express";
import { add_order, do_fail_order, get_product, get_table } from "../controllers/customer.js";
import { validate as isValidUUID } from "uuid";
import { confirmEmail } from "../utils/email.js";
import { start_payment } from "../service/chapa.js";

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

router.post("/start-payment", async (req, res) => {
    try {
        const { cart, table_id, name, email, phone } = req.body;
        if (!cart || !table_id || !name || !email || !phone) return res.status(400).json({msg:"All fields are required."});
        if (!isValidUUID(table_id)) return res.status(400).json({msg:"Table not found."});

        const do_order = await add_order(cart, table_id, name, email, phone);
        if (do_order.status!==200) return res.status(do_order.status).json({msg:do_start.msg});
        const protocol = req.protocol;
        const host = req.get('host');
        const url = `${protocol}://${host}`;
        const do_pay = await start_payment(do_order.msg.first_tx, do_order.msg.total, name, email, phone, 1, url);
        if (do_pay.status!==200)
            await do_fail_order(do_order.msg.first_tx);
        return res.status(do_pay.status).json({msg:do_pay.msg});
    } catch(error) {
        console.error("Error on /customer/start-payment:",error.message);
        return res.status(500).json({msg:"Something went wrong, try again."});
    };
});

export default router;