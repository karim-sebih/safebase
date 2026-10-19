import Base from "../models/baseModel.js";

async function createBase(req, res) {
    try {
        console.log("BODY :", req.body);

        const base = await Base.create(req.body);

        res.status(201).json(base);
    } catch (error) {
        console.error("Erreur création base :", error);

        res.status(500).json({
            message: error.message
        });
    }
};

async function getAllBases(req, res) {
    try {
        const bases = await Base.findAll();
        res.status(200).json(bases);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}


async function getBaseById(req, res) {
    try {
        const base = await Base.findByPk(req.params.id);
        if (base) {
            res.status(200).json(base);
        } else {
            res.status(404).json({ error: "Base not found" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

async function updateBase(req, res) {
    try {
        const { name, description } = req.body;
        const [updated] = await Base.update({ name, description }, {
            where: { id: req.params.id }
        });
        if (updated) {
            const updatedBase = await Base.findByPk(req.params.id);
            res.status(200).json(updatedBase);
        } else {
            res.status(404).json({ error: "Base not found" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

async function deleteBase(req, res) {
    try {
        const deleted = await Base.destroy({
            where: { id: req.params.id }
        });
        if (deleted) {
            res.status(200).json({ message: "Base deleted successfully" });
        } else {
            res.status(404).json({ error: "Base not found" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

async function downloadBase(req, res) {
    try {
        const base = await Base.findByPk(req.params.id);
        if (base) {
            res.setHeader('Content-Disposition', `attachment; filename=${base.name}.json`);
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send(JSON.stringify(base, null, 2));
        } else {
            res.status(404).json({ error: "Base not found" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export { createBase, getAllBases, getBaseById, updateBase, deleteBase, downloadBase };