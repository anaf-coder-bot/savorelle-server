import { Router } from "express";
import { add_order, do_fail_order, do_success_order, get_order, get_product, get_table, retry_payment } from "../controllers/customer.js";
import { validate as isValidUUID } from "uuid";
import { confirmEmail, confirmPaymentEmail } from "../utils/email.js";
import { start_payment, verify_payment } from "../service/chapa.js";

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
        const do_pay = await start_payment(do_order.msg.first_tx, do_order.msg.first_price, name, email, phone, url);
        if (do_pay.status!==200)
            await do_fail_order(do_order.msg.first_tx);
        return res.status(do_pay.status).json({msg:do_pay.msg});
    } catch(error) {
        console.error("Error on /customer/start-payment:",error.message);
        return res.status(500).json({msg:"Something went wrong, try again."});
    };
});

router.get("/verify-payment", async (req, res) => {
    try {
        const { trx_ref } = req.body;
        const do_verify = await verify_payment(trx_ref);
        if (do_verify.status!==200) return res.status(do_verify.status).json({msg:do_verify.msg});
        if (do_verify.payment==="failed") {

            const is_round_1 = await do_fail_order(trx_ref, "first");

            if (is_round_1.status===400) {

                const is_round_2 = await do_fail_order(trx_ref, "last");

                if (is_round_2.status!==200) return res.status(is_round_2.status).json({msg:is_round_2.msg});

            } else if (is_round_1.status!==200) return res.status(is_round_1.status).json({msg:is_round_1.msg});

        } else if (do_verify.payment==="success") {

            const is_round_1 = await do_success_order(trx_ref, "first", do_verify.amount);

            if (is_round_1.status===400) {

                const is_round_2 = await do_success_order(trx_ref, "last", do_verify.amount);

                if (is_round_2.status!==200) return res.status(is_round_2.status).json({msg:is_round_2.msg});

            } else if (is_round_1.status!==200) return res.status(is_round_1.status).json({msg:is_round_1.msg});

            else if (is_round_1.status===200) {

                const get_ref = (await verify_payment(is_round_1.order.first_tx_ref)).ref_id;

                is_round_1.order["reciept"] = `https://chapa.link/payment-receipt/${get_ref}`;

                confirmPaymentEmail(is_round_1.order);

                const io = req.app.get("io");

                io.to("kitchen").emit("new-order", is_round_1.order);
            };
        };
        return res.status(200).json({msg:"Success."});
    } catch(error) {
        console.error("Error on /customer/verify-payment:",error.message);
        return res.status(500).json({msg:"Something went wrong, try again."});
    };

});

router.get("/check-payment/:tx", async (req, res) => {
    try {
        const tx = req.params.tx;
        let order = {}
        const is_round_1 = (await get_order({first_tx_ref:tx})).msg;
        if (is_round_1.length)
            order = {status:is_round_1[0].first_status, round:"first"};
        else {
            const is_round_2 = (await get_order({last_tx_ref:tx})).msg;
            if (is_round_2.length)
                order = {status:is_round_2[0].last_status, round:"last"};
            else return res.status(400).json({msg:"Order not found."});
        };
        return res.status(200).json({order});
    } catch(error) {
        console.error("Error on /customer/check-payment:",error.message);
        return res.status(500).json({msg:"Something went wrong, try again."});
    };
});

router.get("/get-order/:round/:tx", async (req, res) => {
    try {
        const { round, tx } = req.params;
        if (!['first', 'last'].includes(round)) return res.status(400).json({msg:"Invalid round."});
        let order;
        if (round==="first") {
            order = (await get_order({first_tx_ref:tx})).msg
            if (order.length===0) return res.status(400).json({msg:"Order not found"});
        } else {
            order = (await get_order({last_tx_ref:tx})).msg;
            if (order.length===0) return res.status(400).json({msg:"Order not found."});
        };
        const get_ref = (await verify_payment(tx)).ref_id;

        order[0]["reciept"] = `https://chapa.link/payment-receipt/${get_ref}`

        return res.status(200).json({order:order[0]});

    } catch(error) {
        console.error("Error on /customer/get-order/:round/:tx:",error.message);
        return res.status(500).json({msg:"Something went wrong, try to refresh."});
    };
});

router.post("/retry-payment", async (req, res) => {
    try {
        const { id, round } = req.body;
        if (!id || !round) return res.status(400).json({msg:"All fields are required."});
        if (!['first', 'last'].includes(round)) return res.status(400).json({msg:"Invlid round."});
        
        const do_retry = await retry_payment(id, round);
        if (do_retry.status!==200) return res.status(do_retry.status).json({msg:do_retry.msg});
        const protocol = req.protocol;
        const host = req.get("host");
        const url = `${protocol}://${host}`;
        const do_pay = await start_payment(do_retry.data.tx_ref, do_retry.data.amount, do_retry.data.name, do_retry.data.email, do_retry.data.phone, url);
        return res.status(do_pay.status).json({msg:do_pay.msg});
    } catch(error) {
        console.error("Error on /customer/retry-payment:",error.message);
        return res.status(500).json({msg:"Something went wrong, try again."});
    };
}); 

export default router;