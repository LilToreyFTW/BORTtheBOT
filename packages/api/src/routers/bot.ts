import { publicProcedure, router } from "../index";

type SendMessageInput = {
    message: string;
};

function generateLocalReply(message: string): string {
    const trimmed = message.trim();
    if (!trimmed) return "Say something to BORT!";

    const lower = trimmed.toLowerCase();

    // Simple built-in commands
    if (lower === "help" || lower === "/help") {
        return [
            "BORT commands:",
            "- help: show this help",
            "- time: current time",
            "- date: today’s date",
            "- echo <text>: repeat back",
            "- upper <text>: UPPERCASE",
            "- lower <text>: lowercase",
            "- reverse <text>: esrever",
        ].join("\n");
    }
    if (lower === "time" || lower === "/time") {
        return new Date().toLocaleTimeString();
    }
    if (lower === "date" || lower === "/date") {
        return new Date().toLocaleDateString();
    }
    if (lower.startsWith("echo ")) {
        return trimmed.slice(5);
    }
    if (lower.startsWith("upper ")) {
        return trimmed.slice(6).toUpperCase();
    }
    if (lower.startsWith("lower ")) {
        return trimmed.slice(6).toLowerCase();
    }
    if (lower.startsWith("reverse ")) {
        return trimmed.slice(8).split("").reverse().join("");
    }

    // Default local behavior
    return `BORT heard: "${trimmed}"`;
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
        .mutation(({ input }) => {
            const reply = generateLocalReply(input.message);
            return { reply };
        }),
});


