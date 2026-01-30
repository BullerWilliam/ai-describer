import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("AI Describer Server is alive");
});

const HF_KEY = process.env.HF_KEY;

// Use a model that supports image classification via URL
const MODEL = "google/vit-base-patch16-224-in21k";

app.get("/analyze", async (req, res) => {
    try {
        const imageUrl = req.query.image;
        if (!imageUrl) {
            res.json({ error: "no imageUrl" });
            return;
        }

        // HuggingFace router API expects { inputs: { image: URL } }
        const r = await fetch(`https://api-inference.huggingface.co/models/${MODEL}`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${HF_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ inputs: { image: imageUrl } })
        });

        const text = await r.text();

        // If HF returns HTML (model loading page or error), treat as loading
        if (text.trim().startsWith("<!DOCTYPE") || text.trim().startsWith("<html")) {
            res.json({ loading: true });
            return;
        }

        let data;
        try {
            data = JSON.parse(text);
        } catch {
            res.json({ error: "HF returned invalid JSON: " + text.slice(0, 200) });
            return;
        }

        // Expected successful response: array of labels with scores
        if (Array.isArray(data)) {
            res.json({ labels: data.map(x => x.label) });
            return;
        }

        // Model still processing
        if (data.estimated_time) {
            res.json({ loading: true });
            return;
        }

        // Unexpected data
        res.json({ error: JSON.stringify(data) });

    } catch (e) {
        res.json({ error: "server error: " + String(e) });
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log("Server running on port " + (process.env.PORT || 3000));
});
