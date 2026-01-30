import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("ok");
});

const HF_KEY = process.env.HF_KEY;

app.get("/analyze", async (req, res) => {
    try {
        const imageUrl = req.query.image;
        if (!imageUrl) {
            res.json({ error: "no imageUrl" });
            return;
        }

        const r = await fetch(
            "https://api-inference.huggingface.co/models/google/vit-base-patch16-224-in21k",
            {
                method: "POST",
                headers: {
                    "Authorization": "Bearer " + HF_KEY,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ inputs: imageUrl })
            }
        );

        const text = await r.text();

        // If HF returns HTML, treat as loading
        if (text.trim().startsWith("<!DOCTYPE") || text.trim().startsWith("<html")) {
            res.json({ loading: true });
            return;
        }

        let data;
        try {
            data = JSON.parse(text);
        } catch {
            res.json({ error: "HF returned invalid JSON: " + text.slice(0,200) });
            return;
        }

        if (Array.isArray(data)) {
            res.json({ labels: data.map(x => x.label) });
            return;
        }

        if (data.estimated_time) {
            res.json({ loading: true });
            return;
        }

        res.json({ error: JSON.stringify(data) });

    } catch (e) {
        res.json({ error: "server error: " + String(e) });
    }
});

app.listen(process.env.PORT || 3000);
