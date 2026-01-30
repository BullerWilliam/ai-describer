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

        const key = process.env.IMAGGA_KEY;
        const secret = process.env.IMAGGA_SECRET;

        if (!key || !secret) {
            res.json({ error: "Missing IMAGGA_KEY or IMAGGA_SECRET in env" });
            return;
        }

        const auth = Buffer.from(`${key}:${secret}`).toString("base64");

        const url = `https://api.imagga.com/v3/tags?image_url=${encodeURIComponent(imageUrl)}&model=pro&include_caption=true`;

        const r = await fetch(url, {
            headers: {
                "Authorization": "Basic " + auth
            }
        });

        const data = await r.json();

        if (!data.result) {
            res.json({ error: "no tags", raw: data });
            return;
        }

        // Pull labels (flat list) and caption
        const labels = [];
        if (Array.isArray(data.result.tags)) {
            for (const tag of data.result.tags) {
                if (tag.tag && tag.tag.en) labels.push(tag.tag.en);
            }
        }

        const description = data.result.caption?.en || "Image analyzed";

        res.json({
            description,
            labels: labels.slice(0, 15) // top 15 tags
        });
    } catch (e) {
        res.json({ error: String(e) });
    }
});

app.listen(process.env.PORT || 3000);
