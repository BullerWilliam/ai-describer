import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("ok");
});

app.get("/analyze", async (req, res) => {
    try {
        const imageUrl = req.query.image;
        if (!imageUrl) {
            res.json({ error: "no imageUrl" });
            return;
        }

        // Fallback: simple simulated labels
        const fallbackLabels = ["dog", "animal", "pet", "outdoor", "cute", "grass", "fun"];
        const fallbackDescription = "This is a sample image description";

        res.json({
            description: fallbackDescription,
            labels: fallbackLabels
        });

    } catch (e) {
        res.json({ error: String(e) });
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log("Server running on port", process.env.PORT || 3000);
});
