import express from "express";
import baseRouter from "./base.route.js";

const router = express.Router();

router.use("/base", baseRouter);

export default router;