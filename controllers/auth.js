import { pool } from "../models/db.js";
import bcrypt from "bcrypt";

export const login_user = async (username, password, client) => {
    try {
        const get_staff = (await pool.query(`
            SELECT id, username, password, role FROM staff WHERE username = $1 AND is_delete = FALSE;
        `, [username])).rows;
        
        if (get_staff.length===0) return {status: 401, msg: "Invalid username or password."};
        const check_pass = await bcrypt.compare(password, get_staff[0].password);
        if (!check_pass) return {status: 401, msg:"Invalid username or password."};
        if (['manager', 'kitchen', 'cashier'].includes(get_staff[0].role) && client==="app") return {status:403, msg:"Go to the website to login."};
        if (['waiter'].includes(get_staff[0].role) && client==="web") return {status:403, msg:"Go to the app to login."};

        return {status:200,  payload: {staffId: get_staff[0].id, role: get_staff[0].role}};

    } catch(error) {
        console.error("Error on login_user() :",error.message);
        return {status: 500, msg:"Something went wrong, try again."};
    };

};