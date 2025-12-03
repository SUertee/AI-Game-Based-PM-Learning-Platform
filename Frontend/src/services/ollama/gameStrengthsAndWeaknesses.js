// gameStrengthsAndWeaknesses.js
const LOCAL = true; // true = local ngrok, false = Vercel

const AI_CONFIG = {
    model: "llama3.2:1b",
    max_tokens: 2000, // enough for a 100-word summary
    localUrl: "http://localhost:11434/v1/chat/completions",
    remoteApi: "/api/ollama",
};

/**
 * Build prompt for generating a concise strengths & weaknesses report
 */
function buildSWPrompt() {
    return `You are a project management instructor. 
You have the following student evaluation texts from multiple tasks.

Generate a concise strengths and weaknesses summary in <100 words:
- Clearly separate "Strengths" and "Weaknesses"
- Speak directly to the student in a constructive tone
- Avoid repeating trivial points
- Keep it readable and actionable
- Focus on project management skills demonstrated
- Speak generally, not about specific tasks or decisions

Output format:

Strengths:
- ...
Weaknesses:
- ...`;
}

/**
 * Generic Ollama call helper
 */
async function callModel(prompt, userContent) {
    const payload = {
        model: AI_CONFIG.model,
        max_tokens: AI_CONFIG.max_tokens,
        temperature: 0,
        messages: [
            { role: "system", content: prompt },
            { role: "user", content: userContent },
        ],
    };

    const url = LOCAL ? AI_CONFIG.localUrl : AI_CONFIG.remoteApi;
    const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    const data = await resp.json();
    return data.reply || data.choices?.[0]?.message?.content || data.content || JSON.stringify(data);
}

/**
 * Generate a combined strengths & weaknesses report from all tasks
 * @param {string} concatenatedEvalText - All task evalText concatenated
 */
export async function generateStrengthsAndWeaknesses(concatenatedEvalText) {
    try {
        const prompt = buildSWPrompt();
        const report = await callModel(prompt, concatenatedEvalText);
        return report;
    } catch (err) {
        console.error("generateStrengthsAndWeaknesses error:", err);
        return "No strengths and weaknesses could be generated.";
    }
}
