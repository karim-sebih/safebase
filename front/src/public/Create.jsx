import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createBase } from "../api/base";

export default function Create() {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            await createBase({ name, description });
            navigate("/");
        } catch (error) {
            console.error("Erreur lors de la création :", error);
        }
    };

    return (
        <>
            <h1>Créer une base — SafeBase</h1>

            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="name">Nom :</label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>

                <div>
                    <label htmlFor="description">Description :</label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>

                <button type="submit">Créer la base</button>
            </form>
        </>
    );
}