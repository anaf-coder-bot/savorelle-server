import { Router } from "express";
import { get_all_staff, get_product, get_table } from "../controllers/customer.js";
import { validate as isValidUUID } from "uuid";

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

router.get("/get-staff", async (req, res) => {
    try {
        const do_get = await get_all_staff();
        return res.status(do_get.status).json({msg:do_get.msg});
    } catch(error) {
        console.error("Error on /manager/get-staff", error.message);
        return res.status(500).json({msg:"Something went wrong, try again."});
    };
});

export default router;