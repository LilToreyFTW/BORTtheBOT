import { createFileRoute, Link } from "@tanstack/react-router";
import { trpc } from "@/utils/trpc";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, ArrowRight, Wrench, Code, LayoutDashboard, Sparkles } from "lucide-react";

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

    const bots = useQuery(trpc.bots.list.queryOptions());

	return (
		<div className="container mx-auto max-w-6xl p-6 space-y-8">
			{/* Hero Section */}
			<div className="text-center space-y-4 py-12">
				<div className="flex items-center justify-center gap-3 mb-4">
					<Bot className="h-12 w-12 text-primary" />
					<h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
						BORTtheBOT
					</h1>
				</div>
				<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
					Build, program, and deploy custom robots with advanced 3D printing capabilities
				</p>
				<div className="flex items-center justify-center gap-4 pt-4">
					<Link to="/builder">
                        <Button size="lg">
                            <Wrench className="h-5 w-5 mr-2" />
                            Start Building
                            <ArrowRight className="h-5 w-5 ml-2" />
                        </Button>
                    </Link>
                    <Link to="/dashboard">
                        <Button variant="outline" size="lg">
                            <LayoutDashboard className="h-5 w-5 mr-2" />
                            View Dashboard
                        </Button>
                    </Link>
				</div>
			</div>

			{/* Quick Stats */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<Card className="p-6">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium text-muted-foreground">Total Robots</p>
							<p className="text-3xl font-bold mt-2">{bots.data?.length || 0}</p>
						</div>
						<Bot className="h-10 w-10 text-primary opacity-50" />
					</div>
				</Card>
				<Card className="p-6">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium text-muted-foreground">System Status</p>
							<p className="text-3xl font-bold mt-2 capitalize">
								{healthCheck.data ? "Online" : "Offline"}
							</p>
						</div>
						<div
							className={`h-10 w-10 rounded-full ${healthCheck.data ? "bg-green-500" : "bg-red-500"} opacity-20`}
						/>
					</div>
				</Card>
				<Card className="p-6">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium text-muted-foreground">Features</p>
							<p className="text-3xl font-bold mt-2">8+</p>
						</div>
						<Sparkles className="h-10 w-10 text-primary opacity-50" />
					</div>
				</Card>
			</div>

			{/* Main Content Grid */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* BORT Chat */}
				<Card className="p-6">
					<div className="flex items-center gap-2 mb-4">
						<Bot className="h-5 w-5 text-primary" />
						<h2 className="text-xl font-semibold">Chat with BORT</h2>
					</div>
					<div className="mb-4 max-h-72 overflow-y-auto space-y-3">
						{messages.length === 0 ? (
							<div className="text-center py-8 text-muted-foreground">
								<p className="mb-2">Say hi to BORT to get started!</p>
								<p className="text-sm">Ask about robots, programming, or features.</p>
							</div>
						) : (
							messages.map((m, idx) => (
								<div key={idx} className={m.role === "user" ? "text-right" : "text-left"}>
									<Badge variant={m.role === "user" ? "default" : "secondary"} className="mb-1">
										{m.role === "user" ? "You" : "BORT"}
									</Badge>
									<div className={`inline-block rounded-lg border px-4 py-2 text-sm ${
										m.role === "user" 
											? "bg-primary/10 border-primary/20 ml-auto" 
											: "bg-muted"
									}`}>
										{m.content}
									</div>
								</div>
							))
						)}
					</div>
					<div className="flex items-center gap-2">
						<Input
							ref={inputRef}
							placeholder="Type your message..."
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
				</Card>

				{/* Quick Links */}
				<Card className="p-6">
					<h2 className="text-xl font-semibold mb-4">Quick Access</h2>
					<div className="grid grid-cols-2 gap-3">
						<Link to="/builder">
							<Card className="p-4 hover:border-primary transition-colors cursor-pointer h-full">
								<Wrench className="h-6 w-6 text-primary mb-2" />
								<h3 className="font-semibold">Robot Builder</h3>
								<p className="text-sm text-muted-foreground mt-1">
									Create and configure robots
								</p>
							</Card>
						</Link>
						<Link to="/programs">
							<Card className="p-4 hover:border-primary transition-colors cursor-pointer h-full">
								<Code className="h-6 w-6 text-primary mb-2" />
								<h3 className="font-semibold">Programs</h3>
								<p className="text-sm text-muted-foreground mt-1">
									Manage robot programs
								</p>
							</Card>
						</Link>
						<Link to="/components">
							<Card className="p-4 hover:border-primary transition-colors cursor-pointer h-full">
								<Bot className="h-6 w-6 text-primary mb-2" />
								<h3 className="font-semibold">Components</h3>
								<p className="text-sm text-muted-foreground mt-1">
									Browse component library
								</p>
							</Card>
						</Link>
						<Link to="/dashboard">
							<Card className="p-4 hover:border-primary transition-colors cursor-pointer h-full">
								<LayoutDashboard className="h-6 w-6 text-primary mb-2" />
								<h3 className="font-semibold">Dashboard</h3>
								<p className="text-sm text-muted-foreground mt-1">
									View statistics & overview
								</p>
							</Card>
						</Link>
					</div>
				</Card>
			</div>

			{/* Recent Robots */}
			{bots.data && bots.data.length > 0 && (
				<Card className="p-6">
					<div className="flex items-center justify-between mb-4">
						<h2 className="text-xl font-semibold">Recent Robots</h2>
						<Link to="/builder">
							<Button variant="outline" size="sm">
								View All
								<ArrowRight className="h-4 w-4 ml-2" />
							</Button>
						</Link>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						{bots.data.slice(0, 3).map((bot) => (
							<Link key={bot.id} to="/builder">
								<Card className="p-4 hover:border-primary transition-colors cursor-pointer">
									<div className="flex items-center gap-2 mb-2">
										<Bot className="h-5 w-5 text-primary" />
										<h3 className="font-semibold">{bot.name}</h3>
									</div>
									<p className="text-sm text-muted-foreground">
										{bot.description || "No description"}
									</p>
								</Card>
							</Link>
						))}
					</div>
				</Card>
			)}
		</div>
	);
}
