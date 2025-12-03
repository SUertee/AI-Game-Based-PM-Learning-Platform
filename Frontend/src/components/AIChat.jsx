import { useState, useEffect } from "react";
import { sendToOllama } from "../services/ollama/AIChatService.js";

export default function AIChat({ selectedPersona, setSelectedPersona, onEndDiscussion }) {

    const [chatHistories, setChatHistories] = useState({});
    const projectBrief = {
        title: "Project Brief",
        time: `The original timeline was 10 weeks, but two sprints have been cut due to backend delays. The new target is 8 weeks to align with a final marketing campaign milestone. Critical milestones include parallel development and contractor onboarding. Any time trade-offs must be reviewed with the sponsor.`,
        scope: `Deliver a fully functional mobile app with secure authentication, real-time notifications, and basic analytics. All features must be production-ready and accessible; any scope reduction must be justified with stakeholder approval and risk mitigation.`,
        budget: `Budget is capped at $200,000 AUD with no contingency remaining. Additional funding requires executive approval and ROI. Contractor rates and overtime must be tracked and justified.`,
    };

    const scenarioBrief = {
        description: "Midway through the execution phase, a senior stakeholder from the Strategy & Innovation team requests the integration of an AI-powered recommendation engine into the customer dashboard. The feature was not part of the original scope, and no budget or timeline buffer was allocated for AI development. The stakeholder argues that this addition could significantly boost user engagement and attract investor interest, but the engineering team warns of architectural complexity and potential delays.\n" +
            "Budget: $150,000 AUD remaining, no contingency\n" +
            "Time: 4 weeks left until public launch\n" +
            "Scope: Core dashboard features, analytics, and user settings — AI not included"
    };

    // Ensure default message when a persona is first opened
    useEffect(() => {
        if (selectedPersona && !chatHistories[selectedPersona.name]) {
            setChatHistories((prev) => ({
                ...prev,
                [selectedPersona.name]: [
                    {
                        role: "assistant",
                        by: selectedPersona.name,
                        text: `Hello, I am ${selectedPersona.name}. Talk to me about anything related to the role of ${selectedPersona.role} in the project!`,
                    },
                ],
            }));
        }
    }, [selectedPersona, chatHistories]);

    // Helper to update history
    const updateHistory = (personaName, newMessages) => {
        setChatHistories((prev) => ({
            ...prev,
            [personaName]: newMessages,
        }));
    };

    // Pick the right persona's messages
    const messages = selectedPersona
        ? chatHistories[selectedPersona.name] || []
        : [
            {
                role: "system",
                by: "Stakeholder",
                text:
                    "Can we discuss the feasibility of adding AI this iteration. Try to chat with your teammates! Hints: Consider scope, schedule, skills and stakeholder expectations",
            },
        ];

    const [draft, setDraft] = useState("");

    const quickQsRow1 = [
        "What’s the impact on schedule?",
        "Is this a scope change?",
        "Do we have the skills?",
    ];
    const quickQsRow2 = [
        "Can we defer to next iteration",
        "How should we inform the stakeholders",
    ];

    const handleSend = async (text) => {
        const question = (text || draft)?.trim();
        if (!question) return;

        if (!selectedPersona) {
            alert("Talk to your team before making a decision by clicking the chat button next to their names.")
            // Stakeholder default response if no persona selected
            // updateHistory("Stakeholder", [
            //     ...(chatHistories["Stakeholder"] || []),
            //     {
            //         role: "system",
            //         by: "Stakeholder",
            //         text:
            //             "Talk to your team before making a decision by clicking the chat button next to their names.",
            //     },
            // ]);
            setDraft("");
            return;
        }

        const responder = selectedPersona.name;
        const currentHistory = chatHistories[responder] || [];

        // Add user's message
        let newHistory = [
            ...currentHistory,
            { role: "user", by: "You", text: question },
        ];
        updateHistory(responder, newHistory);
        setDraft("");

        // Add typing placeholder
        const typingMsg = { role: "assistant", by: responder, text: "Typing ..." };
        newHistory = [...newHistory, typingMsg];
        updateHistory(responder, newHistory);

        try {
            console.log("Contacting Ollama");
            const aiReply = await sendToOllama(question, selectedPersona, newHistory, projectBrief, scenarioBrief);

            updateHistory(
                responder,
                newHistory.map((msg) =>
                    msg === typingMsg
                        ? { role: "assistant", by: responder, text: aiReply }
                        : msg
                )
            );
        } catch (err) {
            updateHistory(
                responder,
                newHistory.map((msg) =>
                    msg === typingMsg
                        ? {
                            role: "assistant",
                            by: responder,
                            text:
                                "Oops, something went wrong communicating with the AI.",
                        }
                        : msg
                )
            );
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter") handleSend();
    };

    return (
        <section className="scchat-panel">
            <div className="scchat-messages" aria-label="Discussion messages">
                <div className="panel-label">{messages[0]?.by || "Discussion"}</div>
                <div className="message-hint">{messages[0]?.text}</div>

                <div className="message-stream">
                    {messages.slice(1).map((m, i) => (
                        <div key={i} className={`msg ${m.role}`}>
                            <div className="msg-meta">{m.by}</div>
                            <div className="msg-bubble">{m.text}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="scchat-quickqs">
                {[quickQsRow1, quickQsRow2].map((row, idx) => (
                    <div key={idx} className="chip-row">
                        {row.map((q) => (
                            <button
                                key={q}
                                className="chip chip-btn"
                                onClick={() => handleSend(q)}
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                ))}
            </div>

            <div className="scchat-composer">
                <input
                    className="composer-input"
                    placeholder="Type a question to the team ..."
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={handleKeyPress}
                    aria-label="Type a question to the team"
                />
                <button className="btn-ask" onClick={() => handleSend()}>
                    Ask
                </button>
            </div>

            <div className="scchat-footer">
                <button
                    className="btn-end"
                    onClick={() => onEndDiscussion && onEndDiscussion()}
                    title="Proceed to Task Decision"
                >
                    End Discussion
                </button>
            </div>
        </section>
    );
}
