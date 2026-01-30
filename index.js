import express from "express";
import cors from "cors";
import { InferenceClient } from "@huggingface/inference";

const app = express();
app.use(cors());
app.use(express.json());

const client = new InferenceClient(process.env.HF_KEY);

app.get("/", (req, res) => {
    res.send("ok");
});

app.get("/analyze", async (req, res) => {
    try {
        const imageUrl = req.query.image;
        if (!imageUrl) return res.json({ error: "no imageUrl" });

        const result = await client.imageClassification(imageUrl);

        if (Array.isArray(result))
            return res.json({ labels: result.map(x => x.label) });

        return res.json({ error: "no valid result" });
    } catch (e) {
        return res.json({ error: String(e) });
    }
});

app.listen(process.env.PORT || 3000);
