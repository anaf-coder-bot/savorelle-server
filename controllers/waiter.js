import { pool } from "../models/db.js";


export const get_order = async (id) => {
    try {
        let order;
        const order_f = [];
        if (id)
            order = (await pool.query(`
                SELECT o.id, o.customer_name, t.table_no, o.price, o.status
                FROM orders o
                JOIN tables t ON t.id = o.table_id
                WHERE o.id = $1 AND o.first_status <> 'pending' AND o.created_at >= CURRENT_DATE;
            `, [id])).rows;
        else
            order = (await pool.query(`
                SELECT o.id, o.customer_name, t.table_no, o.price, o.status
                FROM orders o
                JOIN tables t ON t.id = o.table_id
                WHERE o.first_status <> 'pending' AND o.created_at >= CURRENT_DATE;
            `)).rows;
        
        for (const o of order) {
            const items = (await pool.query(`
                    SELECT m.name, i.quantity
                    FROM order_items i
                    JOIN menus m ON m.id = i.menu_id
                    WHERE i.order_id = $1;
                `, [o.id])).rows;
            order_f.push({...o, items});
        };

        return { status:200, order:order_f };

    } catch(error) {
        console.error("Error on waiter: get_order:",error.message);
        return {status:500, msg:"Something went wrong, try again."};
    };
};

export const update_status = async (id, status) => {
    try {
        const order = (await get_order(id)).order;
        if (order.length===0) return {status:400, msg:"Order not found."};
        if (status==="paying") {
            if (order[0].status!=="serving") return {status:403, msg:"Order is not ready for serving."};
            await pool.query(`
                UPDATE orders
                SET status = 'paying'
                WHERE id = $1;
            `, [id]);
            order[0]['status'] = "served";
        } else if (status==="cash") {
            if (order[0].status!=="served") return {status:403, msg:"Order is not served."}
            // SOON
        };
        return {status:200, msg:"Success", order};
    } catch(error) {
        console.error("Error on waiter: update_status",error.message);
        return {status:500, msg:"Something went wrong, try again."};
    };
};