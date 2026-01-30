import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));

const HF_KEY = process.env.HF_KEY;

app.post("/analyze", async (req, res) => {
    try {
        const { imageUrl } = req.body;

        const r = await fetch(
            "https://api-inference.huggingface.co/models/google/vit-base-patch16-224",
            {
                method: "POST",
                headers: {
                    "Authorization": "Bearer " + HF_KEY,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ inputs: imageUrl })
            }
        );

        const data = await r.json();

        if (Array.isArray(data)) {
            res.json({
                labels: data.map(x => x.label)
            });
            return;
        }

        if (data.error) {
            res.status(500).json({ error: data.error });
            return;
        }

        res.status(202).json({ loading: true });
    } catch {
        res.status(500).json({ error: "failed" });
    }
});

app.listen(3000, () => {});
