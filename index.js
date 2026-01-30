import express from "express";
import cors from "cors";
import { HfInference } from "@huggingface/inference";

const app = express();
app.use(cors());
app.use(express.json());

const hf = new HfInference(process.env.HF_KEY);

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

        const imgRes = await fetch(imageUrl);
        const arrayBuffer = await imgRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const result = await hf.imageClassification({
            model: "google/vit-base-patch16-224",
            data: buffer
        });

        if (Array.isArray(result)) {
            res.json({
                labels: result.map(x => x.label)
            });
            return;
        }

        res.json({ error: "no result" });
    } catch (e) {
        res.json({ error: String(e) });
    }
});

app.listen(process.env.PORT || 3000);
