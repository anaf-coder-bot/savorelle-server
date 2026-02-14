import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
dotenv.config();
import { initalizeTable } from "./models/initalizeTable.js";
import { allowRoles, authenticate } from "./middleware/protectRoute.js";
import customerRoute from "./routes/customerRoute.js"
import managerRoute from "./routes/managerRoute.js";
import authRoute from "./routes/authRoute.js";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*"
    }
});

app.use(cors({
    origin: process.env.FRONTEND,
    credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.set("trust proxy", true);

app.use("/auth", authRoute);
app.use("/customer", customerRoute);
app.use("/manager", authenticate, allowRoles("manager"), managerRoute);

httpServer.listen(PORT, () => {
    initalizeTable();
    console.log("Server running on PORT:",PORT);
});