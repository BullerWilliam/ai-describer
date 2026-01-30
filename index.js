import express from "express";
import cors from "cors";
import fetch from "node-fetch";

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

        const auth = Buffer.from(
            process.env.IMAGGA_KEY + ":" + process.env.IMAGGA_SECRET
        ).toString("base64");

        const r = await fetch(
            "https://api.imagga.com/v2/tags?image_url=" + encodeURIComponent(imageUrl),
            {
                headers: {
                    "Authorization": "Basic " + auth
                }
            }
        );

        const data = await r.json();

        if (!data.result || !data.result.tags) {
            res.json({ error: "no tags", raw: data });
            return;
        }

        const labels = data.result.tags
            .slice(0, 10)
            .map(t => t.tag.en);

        const description = "Image contains: " + labels.join(", ");

        res.json({
            description,
            labels
        });
    } catch (e) {
        res.json({ error: String(e) });
    }
});

app.listen(process.env.PORT || 3000);
