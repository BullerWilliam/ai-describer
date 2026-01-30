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
                            { type: "input_text", text: "Describe this image briefly and list key labels separated by commas." },
                            { type: "input_image", image_url: imageUrl }
                        ]
                    }
                ]
            })
        });

        const data = await r.json();

        let text = "";

        if (data.output && data.output[0] && data.output[0].content) {
            for (const c of data.output[0].content) {
                if (c.type === "output_text") {
                    text += c.text;
                }
            }
        }

        const labels = text
            .toLowerCase()
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
