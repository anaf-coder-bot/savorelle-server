import { Chapa } from "chapa-nodejs";
import dotenv from "dotenv";
dotenv.config();

const chapa = new Chapa({
    secretKey: process.env.CHAPA_SECRET,
});

export const get_tx_ref = async () => await chapa.genTxRef();

