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
        if (!imageUrl) {
            res.json({ error: "no imageUrl" });
            return;
        }

        const result = await client.imageClassification({
            model: "google/vit-base-patch16-224",
            data: imageUrl
        });

        if (Array.isArray(result)) {
            res.json({ labels: result.map(x => x.label) });
            return;
        }

        res.json({ error: "no result" });
    } catch (e) {
        res.json({ error: String(e) });
    }
});

app.listen(process.env.PORT || 3000);
