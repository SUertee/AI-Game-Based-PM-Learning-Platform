// AIChatService.js
export async function sendToOllama(message, persona, message_history, projectBrief, scenarioBrief) {
    try {
        // Construct system prompt
        // --- Construct system prompt ---
        // --- Construct concise and strict system prompt ---
        const systemPrompt = `
        You are ${persona.name}, the ${persona.role} in a project simulation.

        Project Brief:
        Title: ${projectBrief.title || "Untitled Project"}
        Time: ${projectBrief.time || "Not specified"}
        Scope: ${projectBrief.scope || "Not specified"}
        Budget: ${projectBrief.budget || "Not specified"}

        Scenario Context:
        ${scenarioBrief.description || "No scenario provided."}

        Persona Profile:
        Profile: ${persona.profile || "Not specified"}
        Traits: ${Array.isArray(persona.traits) ? persona.traits.join(", ") : persona.traits || "Not specified"}
        Motivation: ${persona.motivation || "Not specified"}
        Attitude: ${persona.attitude || "Not specified"}

        Guidelines:
        - Respond only as ${persona.name}, never mention being an AI or simulation.
        - Output a single concise paragraph, prefixes, names, or formatting marks.
        - Do **not** include any quotation marks (" or “ ”) around the response.
        - Limit responses to a maximum of six sentences.
        - For closed questions (Is, Are, Do, Can, Will, Should, Would, Could, Have, Has): give a short, direct answer such as “Yes.” or “No.” with up to 6 words if clarification is needed.
        - For open questions (What, Why, How, When, Where, Which): provide a clear and specific answer focused on the question’s key point in 1–2 sentences.
        -  Only respond to questions or messages that are relevant to:
            • The project brief (title, time, scope, budget)
            • The current scenario, iteration, any skateholders involved
            • The persona’s role, responsibility, or professional domain
            If the question is unrelated to the project, always reply exactly:
            “I’m sorry, but that’s outside the project scope. Let’s stay focused on the project discussion.”
        - If the message history already contains an explanation for the same question, just repeat the answer.
        - Maintain a professional tone consistent with the persona’s traits, motivation, and attitude.

        Message History:
        ${message_history.map(m => `[${m.role}] ${m.by}: ${m.text}`).join("\n")}

        Now respond to the latest message based on the persona context above.
        `;
        
        // Format history for API
        const formattedHistory = message_history.map(m => ({
            role: m.role, // "user" | "assistant" | "system"
            content: m.text
        }));

        const response = await fetch("http://localhost:11434/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "llama3.2:1b",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: message }
                ],
            }),
        });

        const data = await response.json();
        return data.choices?.[0]?.message?.content || "No response from AI";
    } catch (err) {
        console.error("Error sending to Ollama:", err);
        return "Sorry, something went wrong with the AI.";
    }
}