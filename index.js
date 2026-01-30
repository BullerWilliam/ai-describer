import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/", (req, res) => {
    res.send("server alive");
});

const HF_KEY = process.env.HF_KEY;

app.post("/analyze", async (req, res) => {
    try {
        const imageUrl = req.body.imageUrl;
        if (!imageUrl) {
            res.json({ error: "no imageUrl" });
            return;
        }

        const img = await fetch(imageUrl);
        if (!img.ok) {
            res.json({ error: "image fetch failed" });
            return;
        }

        const buffer = await img.arrayBuffer();

        const hf = await fetch(
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

        const data = await hf.json();

        if (Array.isArray(data)) {
            res.json({ labels: data.map(x => x.label) });
            return;
        }

        if (data.estimated_time) {
            res.json({ loading: true });
            return;
        }

        res.json({ error: JSON.stringify(data) });
    } catch {
        res.json({ error: "server crash" });
    }
});

app.listen(process.env.PORT || 3000);
