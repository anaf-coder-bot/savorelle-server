import { Server } from "socket.io";
import dotenv from "dotenv";
dotenv.config();


export const initalizeSocket = (httpServer, app) => {

    const io = new Server(httpServer, {
        cors: {
            origin: process.env.FRONTEND,
        },
    });

    app.set("io", io);

    io.on("connection", socket => {
        console.log("Client connected:",socket.id);

        socket.on("join-kitchen", () => {
            socket.join("kitchen");
            console.log("Client joined kitchen room.");
        });

        socket.on("disconnect", () => {
            console.log("Client disconnect:", socket.id);
        });
    });
};