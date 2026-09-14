import express from "express";
import { createBase, getAllBases, getBaseById, updateBase, deleteBase, downloadBase } from "../controllers/base.controller.js";
const router = express.Router();

router.post("/", createBase);
router.get("/", getAllBases);
router.get("/:id", getBaseById);
router.put("/:id", updateBase);
router.delete("/:id", deleteBase);
router.get("/download/:id", downloadBase);

export default router;



