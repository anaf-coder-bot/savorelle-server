import { pool } from "../models/db.js";

export const get_order = async (id="") => {
    try {
        const fin_orders = [];
        let order
        if (id)
            order = (await pool.query(`
                    SELECT o.id, o.customer_name, o.status, o.first_at, t.table_no, w.username AS waiter_name 
                    FROM orders o JOIN tables t ON t.id = o.table_id 
                    JOIN staff w ON w.id = o.waiter_id 
                    WHERE o.id = $1 AND o.status IN ('pending', 'preparing') AND o.first_status = 'paid' AND o.created_at >= CURRENT_DATE
                    ORDER BY status`,
            [id])).rows;
        else
            order = (await pool.query(`
                    SELECT o.id, o.customer_name, o.status, o.first_at, t.table_no, w.username AS waiter_name 
                    FROM orders o JOIN tables t ON t.id = o.table_id 
                    JOIN staff w ON w.id = o.waiter_id 
                    WHERE o.status IN ('pending', 'preparing') AND o.first_status = 'paid' AND o.created_at >= CURRENT_DATE
                    ORDER BY status`
            )).rows;
        
        for (const o of order) {
            const items = (await pool.query(`
                    SELECT i.id, i.quantity, m.name 
                    FROM order_items i 
                    JOIN menus m ON m.id = i.menu_id 
                    WHERE i.order_id = $1`,
            [o.id])).rows;
            fin_orders.push({...o, items})
        };
        return {status:200, order:fin_orders};
    } catch(error) {
        console.error("Error on chef: get_order:",error.message);
        return {status:500, msg:"Something went wrong, try again."};
    };
};

export const update_status = async (id, status) => {
    try {
        const order = (await get_order(id)).order;
        if (order.length===0) return {status:400, msg:"Order not found."};
        if (status==="preparing") {
            if (order[0].status!=="pending") return {status:403, msg:"Order is not pending."};
            await pool.query(`
                UPDATE orders
                SET status = 'preparing'
                WHERE id = $1;
            `, [id]);
            order[0]["status"] = "preparing";
        } else if (status==="done") {
            if (order[0].status!=="preparing") return {status:403, msg:"Order is not preparing."};
            await pool.query(`
                UPDATE orders
                SET status = 'serving'
                WHERE id = $1;
            `, [id]);
            order[0]["status"] = "serving";
        };
        return {status:200, msg:"Success", order};
    } catch(error) {
        console.error("Error on chef: update_status:",error.message);
    }
};