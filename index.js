import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const HF_KEY = process.env.HF_KEY;

app.post("/analyze", async (req, res) => {
    try {
        const { imageUrl } = req.body;

        const img = await fetch(imageUrl);
        if (!img.ok) {
            res.status(400).json({ error: "image fetch failed" });
            return;
        }

        const buffer = await img.arrayBuffer();

        const r = await fetch(
            "https://api-inference.huggingface.co/models/google/vit-base-patch16-224",
            {
                method: "POST",
                headers: {
                    "Authorization": "Bearer " + HF_KEY,
                    "Content-Type": "application/octet-stream"
                },
                body: Buffer.from(buffer)
            }
        );

        const data = await r.json();

        if (Array.isArray(data)) {
            res.json({
                labels: data.map(x => x.label)
            });
            return;
        }

        if (data.estimated_time) {
            res.json({ loading: true });
            return;
        }

        if (data.error) {
            res.status(500).json({ error: data.error });
            return;
        }

        res.json({ error: "unknown response" });
    } catch {
        res.status(500).json({ error: "server failed" });
    }
});

app.listen(3000, () => {});
