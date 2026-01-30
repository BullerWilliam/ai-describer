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

        const apiKey = process.env.GOOGLE_VISION_KEY;
        if (!apiKey) {
            res.json({ error: "missing GOOGLE_VISION_KEY" });
            return;
        }

        const r = await fetch(
            "https://vision.googleapis.com/v1/images:annotate?key=" + apiKey,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    requests: [
                        {
                            image: { source: { imageUri: imageUrl } },
                            features: [
                                { type: "LABEL_DETECTION", maxResults: 10 }
                            ]
                        }
                    ]
                })
            }
        );

        const data = await r.json();

        const labels =
            data.responses?.[0]?.labelAnnotations?.map(l => l.description) || [];

        if (labels.length === 0) {
            res.json({ error: "no labels", raw: data });
            return;
        }

        res.json({
            description: "Image contains: " + labels.join(", "),
            labels
        });
    } catch (e) {
        res.json({ error: String(e) });
    }
});

app.listen(process.env.PORT || 3000);
