import { publicProcedure, router } from "../index";

type SendMessageInput = {
    message: string;
};

async function generateBotReply(message: string): Promise<string> {
    const trimmed = message.trim();
    if (!trimmed) return "Say something to BORT!";

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        // Fallback simple bot
        return `BORT heard: "${trimmed}"`;
    }

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: "You are BORTtheBOT, a concise helpful assistant." },
                    { role: "user", content: trimmed },
                ],
                temperature: 0.6,
            }),
        });

        if (!response.ok) {
            return `BORT fallback: ${trimmed}`;
        }
        const json = (await response.json()) as any;
        const content: string | undefined = json?.choices?.[0]?.message?.content;
        return content ?? "I'm not sure how to respond to that.";
    } catch {
        return `BORT fallback: ${trimmed}`;
    }
}

export const botRouter = router({
    sendMessage: publicProcedure
        .input((val: unknown): SendMessageInput => {
            if (
                typeof val === "object" &&
                val !== null &&
                "message" in val &&
                typeof (val as any).message === "string"
            ) {
                return { message: (val as any).message };
            }
            throw new Error("Invalid input: expected { message: string }");
        })
        .mutation(async ({ input }) => {
            const reply = await generateBotReply(input.message);
            return { reply };
        }),
});


