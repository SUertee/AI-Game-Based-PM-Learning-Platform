const LOCAL = true; // true = local ngrok, false = Vercel

const AI_CONFIG = {
    model: "llama3.2:1b",
    max_tokens: 10000,
    localUrl: "http://localhost:11434/v1/chat/completions",
    remoteApi: "/api/ollama",
};

// Step 1: Feedback only
function buildEvalPrompt(projectBrief, scenarioBrief) {

    return `
    You are a project-management instructor evaluating a student’s answer.
Speak directly to the student in a conversational tone.

The project is ${projectBrief.title}: ${projectBrief.description}
Context:\nProject: Time=${projectBrief.time}, Scope=${projectBrief.scope}, Budget=${projectBrief.budget}\n
Scenario:\nName: ${scenarioBrief.name}\nDescription: ${scenarioBrief.description}\nActions To Do: ${scenarioBrief.actionsToDo}\nFurther Constraint: ${scenarioBrief.furtherConstraint}\nSample Answer: ${scenarioBrief.sampleAnswer ?? "None"}

Check their answer against the framework: Scope, Requirements, Timeline, Budget, Stakeholders.

If the Decision and Rationale appear empty, numeric, or meaningless, respond that the student has not provided a valid answer.

For each criterion provide:
- Criterion name
- What’s addressed: concise note
- What’s missing: concise one-line note
- Actionable fix: concrete recommendation

Do NOT give a mark or overall score here. Keep it under 200 words.

IMPORTANT: Evaluate ONLY the Decision and Rationale provided in the user content. Do NOT consult or incorporate any external project/scenario fields when writing the feedback — treat other project data as background only and do not reference it.`;
}

function buildMarkPrompt(projectBrief, scenarioBrief, evalRaw) {
    return `You are an experienced and fair project-management assessor.
Your job is to assign an overall score out of 100 based on the quality and completeness of the evaluation feedback provided.

The project is ${projectBrief.title}: ${projectBrief.description}
Context:\nProject: Time=${projectBrief.time}, Scope=${projectBrief.scope}, Budget=${projectBrief.budget}\n
Scenario:\nName: ${scenarioBrief.name}\nDescription: ${scenarioBrief.description}\nActions To Do: ${scenarioBrief.actionsToDo}\nFurther Constraint: ${scenarioBrief.furtherConstraint}\nSample Answer: ${scenarioBrief.sampleAnswer ?? "None"}

The evaluation of the students response was as follows:
${evalRaw}

IMPORTANT: **You MUST base your mark ONLY on the feedback text supplied in the user content.** Do NOT consult the original student answer, projectBrief, scenario, or any other context. Do not fact-check the feedback against external context — judge the feedback's clarity, depth, feasibility, and professionalism by itself.

Scoring guidelines (be realistic and consistent):
- Consider all key aspects such as scope, requirements, timeline, budget, and stakeholders as they are discussed in the feedback.
- Focus on clarity, depth of understanding, feasibility, and professionalism of the feedback.
- Assign marks proportionally — not just in fixed steps.
- Give higher marks for well-detailed, practical, and coherent evaluations; lower marks for vague, incomplete, or unrealistic ones.
- Be objective and balanced — Not too generous.
- Use any number between 0–100.
- No explanations, just the mark.

Output format:
Overall Mark: XX/100

If the evaluation text or student answer appears empty, nonsensical, or under two words (e.g., numeric codes like "123"), output strictly:
Overall Mark: 0/100

Nothing else.`;
}




// Sample answer generator
function buildSamplePrompt() {
    return `You are an expert project manager.

Based on a student's FINAL DECISION and RATIONALE, generate a SAMPLE ANSWER:
- Decision: concise example decision
- Rationale: short explanation of decision

Return in plain text with headings:

Sample Answer:
Decision: ...
Rationale: ...
`;
}

async function callModel(prompt, userContent) {
    console.log("Evaluating task", prompt, userContent);

    const payload = {
        model: AI_CONFIG.model,
        max_tokens: AI_CONFIG.max_tokens,
        temperature: 0,
        messages: [
            { role: "system", content: prompt },
            { role: "user", content: userContent }
        ]
    };

    const url = LOCAL ? AI_CONFIG.localUrl : AI_CONFIG.remoteApi;
    const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    const data = await resp.json();
    return data.reply || data.choices?.[0]?.message?.content || data.content || JSON.stringify(data);
}

export async function evaluateTask({ decision, rationale, projectBrief = {}, scenarioBrief = {} }) {
    try {
        // --- Input Validation ---
        const isMeaningless = (str) =>
            !str ||
            /^\s*$/.test(str) ||                 // empty or spaces
            /^\d+$/.test(str.trim()) ||          // only numbers
            /^[^a-zA-Z0-9]+$/.test(str.trim()) ||// only symbols
            (str.replace(/[^a-zA-Z]/g, "").length < 5); // not enough letters

        const wordCount = (str) => str.trim().split(/\s+/).filter(Boolean).length;
        const totalWords = wordCount(decision) + wordCount(rationale);

        // Automatically fail short or meaningless answers
        if (isMeaningless(decision) || isMeaningless(rationale) || totalWords < 15) {
            return {
                ok: true,
                evalRaw: "Invalid or insufficient response — your Decision and Rationale must have sufficient length, include meaningful text.",
                markRaw: "Overall Mark: 0/100",
                sampleRaw: ""
            };
        }

        const context = `
My answer for you to mark. ONLY consider the following response and use other information as contextual only.):
Decision:\n${decision}\n\nRationale:\n${rationale}\n\n
`
        ;
        const markContext = `
My answer for you to mark. ONLY consider the following response and use other information as contextual only:
[Decision:\n${decision}. Rationale:${rationale}]

If my decision or rationale is invalid, not complete, under 2 sentences, give 0/100.
`
        ;
        // Step 1: Feedback evaluation
        const evalRaw = await callModel(buildEvalPrompt(projectBrief, scenarioBrief), context);
        // Step 2: Marking based on evaluation
        const markRaw = await callModel(buildMarkPrompt(projectBrief, scenarioBrief, evalRaw), markContext);
        // Step 3: Sample answer
        const sampleContext = `Context:\nProject: Time=${projectBrief.time}, Scope=${projectBrief.scope}, Budget=${projectBrief.budget}\nScenario: ${scenarioBrief.description}`;
        const sampleRaw = await callModel(buildSamplePrompt(), sampleContext);
        return { ok: true, evalRaw, markRaw, sampleRaw };

    } catch (err) {
        console.error("TaskEvaluationService error:", err);
        return { ok: false, error: err.message || String(err) };
    }
}
