import { createFileRoute } from "@tanstack/react-router";
import { trpc } from "@/utils/trpc";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/")({
	component: HomeComponent,
});

const TITLE_TEXT = `
 ██████╗ ███████╗████████╗████████╗███████╗██████╗
 ██╔══██╗██╔════╝╚══██╔══╝╚══██╔══╝██╔════╝██╔══██╗
 ██████╔╝█████╗     ██║      ██║   █████╗  ██████╔╝
 ██╔══██╗██╔══╝     ██║      ██║   ██╔══╝  ██╔══██╗
 ██████╔╝███████╗   ██║      ██║   ███████╗██║  ██║
 ╚═════╝ ╚══════╝   ╚═╝      ╚═╝   ╚══════╝╚═╝  ╚═╝

 ████████╗    ███████╗████████╗ █████╗  ██████╗██╗  ██╗
 ╚══██╔══╝    ██╔════╝╚══██╔══╝██╔══██╗██╔════╝██║ ██╔╝
    ██║       ███████╗   ██║   ███████║██║     █████╔╝
    ██║       ╚════██║   ██║   ██╔══██║██║     ██╔═██╗
    ██║       ███████║   ██║   ██║  ██║╚██████╗██║  ██╗
    ╚═╝       ╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝
 `;

function HomeComponent() {
	const healthCheck = useQuery(trpc.healthCheck.queryOptions());
    const [messages, setMessages] = useState<{ role: "user" | "bot"; content: string }[]>([]);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const sendMessage = useMutation(trpc.bot.sendMessage.mutationOptions());

    const handleSend = useCallback(async () => {
        const value = inputRef.current?.value ?? "";
        const trimmed = value.trim();
        if (!trimmed || sendMessage.isPending) return;
        setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
        inputRef.current!.value = "";
        const res = await sendMessage.mutateAsync({ message: trimmed });
        setMessages((prev) => [...prev, { role: "bot", content: res.reply }]);
    }, [sendMessage]);

	return (
		<div className="container mx-auto max-w-3xl px-4 py-2">
			<pre className="overflow-x-auto font-mono text-sm">{TITLE_TEXT}</pre>
			<div className="grid gap-6">
				<section className="rounded-lg border p-4">
					<h2 className="mb-2 font-medium">API Status</h2>
					<div className="flex items-center gap-2">
						<div
							className={`h-2 w-2 rounded-full ${healthCheck.data ? "bg-green-500" : "bg-red-500"}`}
						/>
						<span className="text-sm text-muted-foreground">
							{healthCheck.isLoading
								? "Checking..."
								: healthCheck.data
									? "Connected"
									: "Disconnected"}
						</span>
					</div>
				</section>
                <section className="rounded-lg border p-4">
                    <h2 className="mb-3 font-medium">BORTtheBOT</h2>
                    <Card className="mb-3 max-h-72 overflow-y-auto p-3">
                        <div className="flex flex-col gap-2">
                            {messages.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Say hi to BORT to get started.</p>
                            ) : (
                                messages.map((m, idx) => (
                                    <div key={idx} className={m.role === "user" ? "text-right" : "text-left"}>
                                        <span className="inline-block rounded-md border px-2 py-1 text-sm">
                                            {m.content}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>
                    <div className="flex items-center gap-2">
                        <Input
                            ref={inputRef}
                            placeholder="Type your message"
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                        />
                        <Button onClick={handleSend} disabled={sendMessage.isPending}>
                            {sendMessage.isPending ? "Sending..." : "Send"}
                        </Button>
                    </div>
                </section>
			</div>
		</div>
	);
}
