import { getAllBases, deleteBase } from "../api/base.js";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
    const navigate = useNavigate();
    const [bases, setBases] = useState([]);

    useEffect(() => {
        async function fetchBases() {
            try {
                const data = await getAllBases();
                setBases(data);
            } catch (error) {
                console.error("Erreur lors du chargement des bases :", error);
            }
        }

        fetchBases();
    }, []);

    async function handleDelete(id) {
        if (!window.confirm("Voulez-vous vraiment supprimer cette base ?")) {
            return;
        }

        try {
            await deleteBase(id);
            setBases((currentBases) =>
                currentBases.filter((base) => base.id !== id)
            );
        } catch (error) {
            console.error("Erreur lors de la suppression :", error);
            alert("Impossible de supprimer cette base.");
        }
    }

    return (
        <main>
            <h1>Welcome to the Home Page of SafeBase</h1>

            <button onClick={() => navigate("/create")}>
                Créer une base
            </button>

            <h2>Bases disponibles</h2>

            {bases.map((base) => (
                <article key={base.id}>
                    <h3>{base.name}</h3>
                    <p>{base.description}</p>

                    <button onClick={() => navigate(`/modify/${base.id}`)}>
                        Modifier
                    </button>

                    <button onClick={() => handleDelete(base.id)}>
                        Supprimer
                    </button>
                </article>
            ))}
        </main>
    );
}