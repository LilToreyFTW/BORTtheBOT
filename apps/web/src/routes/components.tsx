import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Search, Package, Wrench, Cpu, Zap } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/components")({
    component: ComponentsPage,
});

const componentCategories = [
    {
        id: "lasers",
        name: "Laser Components",
        icon: Zap,
        description: "Laser emitters, arrays, and control systems",
        items: [
            { name: "8-Port Downward Laser Array", specs: "900x900mm coverage", price: "$2,500" },
            { name: "Roof Sphere Emitter Grid", specs: "9x9x9 configuration", price: "$5,000" },
            { name: "Laser Focus Lens Kit", specs: "Adjustable focus", price: "$150" },
        ],
    },
    {
        id: "mechanical",
        name: "Mechanical Parts",
        icon: Wrench,
        description: "Arms, joints, and structural components",
        items: [
            { name: "6-DOF Robot Arm", specs: "Full range motion", price: "$3,200" },
            { name: "Servo Motor Set", specs: "High torque x8", price: "$800" },
            { name: "Structural Frame Kit", specs: "900x900x900mm", price: "$1,500" },
        ],
    },
    {
        id: "electronics",
        name: "Electronics",
        icon: Cpu,
        description: "Controllers, sensors, and processors",
        items: [
            { name: "Main Control Unit", specs: "Quad-core processor", price: "$450" },
            { name: "Sensor Array Pack", specs: "Multi-sensor integration", price: "$320" },
            { name: "Power Distribution Board", specs: "24V/48V support", price: "$180" },
        ],
    },
    {
        id: "base",
        name: "Base Components",
        icon: Package,
        description: "Base plates, mounts, and foundations",
        items: [
            { name: "900x900x900mm Base Plate", specs: "Steel construction", price: "$2,000" },
            { name: "Mounting Hardware Kit", specs: "Bolts, brackets, rails", price: "$250" },
            { name: "Enclosure Frame", specs: "Modular assembly", price: "$1,800" },
        ],
    },
];

function ComponentsPage() {
    const [searchQuery, setSearchQuery] = useState("");

    return (
        <div className="container mx-auto max-w-7xl p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Component Library</h1>
                    <p className="text-muted-foreground mt-1">Browse and select components for your robots</p>
                </div>
            </div>

            <div className="flex gap-4">
                <div className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search components..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>
            </div>

            <Tabs defaultValue={componentCategories[0].id} className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                    {componentCategories.map((cat) => {
                        const Icon = cat.icon;
                        return (
                            <TabsTrigger key={cat.id} value={cat.id} className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                {cat.name}
                            </TabsTrigger>
                        );
                    })}
                </TabsList>

                {componentCategories.map((category) => {
                    const Icon = category.icon;
                    const filteredItems = category.items.filter((item) =>
                        item.name.toLowerCase().includes(searchQuery.toLowerCase())
                    );

                    return (
                        <TabsContent key={category.id} value={category.id} className="space-y-4">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <Icon className="h-6 w-6 text-primary" />
                                    <h2 className="text-2xl font-semibold">{category.name}</h2>
                                </div>
                                <p className="text-muted-foreground">{category.description}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredItems.map((item, idx) => (
                                    <Card key={idx} className="p-4 hover:border-primary transition-colors">
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="font-semibold">{item.name}</h3>
                                            <Badge variant="secondary">{item.price}</Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-4">{item.specs}</p>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" className="flex-1">
                                                View Details
                                            </Button>
                                            <Button size="sm" className="flex-1">
                                                Add to Build
                                            </Button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>
                    );
                })}
            </Tabs>
        </div>
    );
}
