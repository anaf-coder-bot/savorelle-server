import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
dotenv.config();
import { initalizeTable } from "./models/initalizeTable.js";
import managerRoute from "./routes/managerRoute.js";
import authRoute from "./routes/authRouter.js";
import { authenticate } from "./middleware/protectRoute.js";

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

app.use("/auth", authRoute);

httpServer.listen(PORT, () => {
    initalizeTable();
    console.log("Server running on PORT:",PORT);
});