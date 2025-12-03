export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        // Forward everything from frontend payload directly to Ollama/ngrok
        // Run Ngrok and then change to this
        const response = await fetch("https://c9e13fbf6732.ngrok-free.app/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(req.body),
        });

        const data = await response.json();
        res.status(200).json({ reply: data.choices?.[0]?.message?.content || "No response" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error contacting Ollama" });
    }
}
