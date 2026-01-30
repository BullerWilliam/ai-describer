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

        const imgRes = await fetch(imageUrl);
        if (!imgRes.ok) {
            res.json({ error: "failed to fetch image" });
            return;
        }

        const buffer = Buffer.from(await imgRes.arrayBuffer());
        const base64 = buffer.toString("base64");

        const r = await fetch("https://api.openai.com/v1/responses", {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + process.env.OPENAI_API_KEY,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "gpt-4.1-mini",
                input: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "input_text",
                                text: "Describe this image briefly and list key labels separated by commas."
                            },
                            {
                                type: "input_image",
                                image_url: "data:image/jpeg;base64," + base64
                            }
                        ]
                    }
                ],
                max_output_tokens: 150
            })
        });

        const data = await r.json();

        let text = "";

        if (Array.isArray(data.output)) {
            for (const block of data.output) {
                if (Array.isArray(block.content)) {
                    for (const c of block.content) {
                        if (typeof c.text === "string") {
                            text += c.text + " ";
                        }
                    }
                }
            }
        }

        text = text.trim();

        if (!text) {
            res.json({ error: "model returned no text", raw: data });
            return;
        }

        const labels = text
            .toLowerCase()
            .replace(/[^a-z0-9, ]/g, "")
            .split(",")
            .map(x => x.trim())
            .filter(Boolean);

        res.json({
            description: text,
            labels
        });
    } catch (e) {
        res.json({ error: String(e) });
    }
});

app.listen(process.env.PORT || 3000);
