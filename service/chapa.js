import { Chapa } from "chapa-nodejs";
import dotenv from "dotenv";
dotenv.config();

const chapa = new Chapa({
    secretKey: process.env.CHAPA_SECRET,
});

export const get_tx_ref = async () => await chapa.genTxRef();

export const start_payment = async (tx_ref, amount, name, email, phone, url) => {
    try {
        const req = await chapa.initialize({
            first_name: name,
            email:email,
            phone_number: phone,
            currency: "ETB",
            amount: String(amount),
            tx_ref:tx_ref,
            return_url: `${process.env.FRONTEND}/check-payment?tx-ref=${tx_ref}`,
            callback_url: `${url}/customer/verify-payment`,
        });
        return {status:200, msg:req};
    } catch(error) {
        console.log("Error on start_payment:",error.message);
        return {status:500, msg:"Something went wrong, try again."};
    };
};

export const verify_payment = async (tx_ref) => {
    try {
        const req = await chapa.verify({tx_ref:tx_ref});
        const status = req.data.status;
        const amount = req.data.amount;
        const ref_id = req.data.reference;
        return {status:200, payment:status, amount, ref_id};
    } catch(error) {
        console.error("Error on verify_payment:",error.message);
        return {status:500, msg:"Something went wrong, try again."};
    };
};