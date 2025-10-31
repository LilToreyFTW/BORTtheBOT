import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Save, Bell, Shield, Database, Palette } from "lucide-react";

export const Route = createFileRoute("/settings")({
    component: SettingsPage,
});

function SettingsPage() {
    return (
        <div className="container mx-auto max-w-4xl p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Settings</h1>
                <p className="text-muted-foreground mt-1">Manage your application preferences</p>
            </div>

            <Tabs defaultValue="general" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="notifications">Notifications</TabsTrigger>
                    <TabsTrigger value="appearance">Appearance</TabsTrigger>
                    <TabsTrigger value="storage">Storage</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                </TabsList>

                <TabsContent value="general">
                    <Card className="p-6 space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold mb-4">General Settings</h2>
                            <Separator className="mb-4" />
                        </div>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="bot-storage">Bot Storage Directory</Label>
                                <Input
                                    id="bot-storage"
                                    defaultValue={process.env.BOT_STORAGE_DIR || "./bot_storage"}
                                    placeholder="./bot_storage"
                                />
                                <p className="text-sm text-muted-foreground mt-1">
                                    Directory where robot programs are stored
                                </p>
                            </div>
                            <div>
                                <Label htmlFor="server-url">Server URL</Label>
                                <Input
                                    id="server-url"
                                    defaultValue={import.meta.env.VITE_SERVER_URL || "http://localhost:3000"}
                                    placeholder="http://localhost:3000"
                                />
                            </div>
                            <Button>
                                <Save className="h-4 w-4 mr-2" />
                                Save Changes
                            </Button>
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="notifications">
                    <Card className="p-6 space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                <Bell className="h-5 w-5" />
                                Notification Settings
                            </h2>
                            <Separator className="mb-4" />
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label>Email Notifications</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Receive email updates about robot status
                                    </p>
                                </div>
                                <input type="checkbox" defaultChecked />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label>Calibration Alerts</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Get notified when calibration completes
                                    </p>
                                </div>
                                <input type="checkbox" defaultChecked />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label>Build Completion</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Notify when robot builds finish
                                    </p>
                                </div>
                                <input type="checkbox" />
                            </div>
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="appearance">
                    <Card className="p-6 space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                <Palette className="h-5 w-5" />
                                Appearance
                            </h2>
                            <Separator className="mb-4" />
                        </div>
                        <div className="space-y-4">
                            <div>
                                <Label>Theme</Label>
                                <select className="w-full mt-2 p-2 rounded border bg-background">
                                    <option>Dark</option>
                                    <option>Light</option>
                                    <option>System</option>
                                </select>
                            </div>
                            <div>
                                <Label>3D Viewer Quality</Label>
                                <select className="w-full mt-2 p-2 rounded border bg-background">
                                    <option>Low (Performance)</option>
                                    <option>Medium (Balanced)</option>
                                    <option>High (Quality)</option>
                                </select>
                            </div>
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="storage">
                    <Card className="p-6 space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                <Database className="h-5 w-5" />
                                Storage Management
                            </h2>
                            <Separator className="mb-4" />
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-lg border">
                                <div>
                                    <p className="font-medium">Robot Data</p>
                                    <p className="text-sm text-muted-foreground">Bot configurations and specs</p>
                                </div>
                                <Button variant="outline" size="sm">Export</Button>
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-lg border">
                                <div>
                                    <p className="font-medium">Programs</p>
                                    <p className="text-sm text-muted-foreground">Python program files</p>
                                </div>
                                <Button variant="outline" size="sm">Export</Button>
                            </div>
                            <Separator />
                            <Button variant="destructive">Clear All Data</Button>
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="security">
                    <Card className="p-6 space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Security Settings
                            </h2>
                            <Separator className="mb-4" />
                        </div>
                        <div className="space-y-4">
                            <div>
                                <Label>API Key</Label>
                                <Input type="password" placeholder="••••••••" />
                                <p className="text-sm text-muted-foreground mt-1">
                                    Secure API access token
                                </p>
                            </div>
                            <div>
                                <Label>Session Timeout</Label>
                                <select className="w-full mt-2 p-2 rounded border bg-background">
                                    <option>15 minutes</option>
                                    <option>30 minutes</option>
                                    <option>1 hour</option>
                                    <option>Never</option>
                                </select>
                            </div>
                            <Button>
                                <Save className="h-4 w-4 mr-2" />
                                Save Security Settings
                            </Button>
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
