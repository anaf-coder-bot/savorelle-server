import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
dotenv.config();
import { initalizeTable } from "./models/initalizeTable.js";
import ManagerRout from "./routes/managerRoute.js";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*"
    }
});

app.use(cors({
    origin: "*",
}));
app.use(cookieParser());
app.use(express.json());


httpServer.listen(PORT, () => {
    initalizeTable();
    console.log("Server running on PORT:",PORT);
});