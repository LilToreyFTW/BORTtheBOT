import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Save, Bell, Shield, Database, Palette, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "@/components/theme-provider";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
    component: SettingsPage,
});

function SettingsPage() {
    const { theme, setTheme } = useTheme();
    const [settings, setSettings] = useState({
        botStorageDir: "./bot_storage",
        serverUrl: import.meta.env.VITE_SERVER_URL || "http://localhost:3000",
        emailNotifications: true,
        calibrationAlerts: true,
        buildCompletion: false,
        viewerQuality: "Medium (Balanced)",
        sessionTimeout: "30 minutes",
        apiKey: "",
    });
    
    // # ADDED: Load settings from localStorage
    useEffect(() => {
        const saved = localStorage.getItem("bortthebot-settings");
        if (saved) {
            try {
                setSettings(JSON.parse(saved));
            } catch (e) {
                // Ignore parse errors
            }
        }
    }, []);
    
    const saveSettings = () => {
        localStorage.setItem("bortthebot-settings", JSON.stringify(settings));
        toast.success("Settings saved successfully!");
    };
    
    const exportData = async (type: "robots" | "programs") => {
        toast.info(`Exporting ${type}...`);
        // In a real app, this would call an API endpoint
        setTimeout(() => {
            toast.success(`${type} exported successfully!`);
        }, 1000);
    };
    
    const clearAllData = () => {
        if (confirm("Are you sure you want to clear all data? This cannot be undone!")) {
            toast.success("All data cleared!");
            // In a real app, this would call an API endpoint
        }
    };
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
                                    value={settings.botStorageDir}
                                    onChange={(e) => setSettings({ ...settings, botStorageDir: e.target.value })}
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
                                    value={settings.serverUrl}
                                    onChange={(e) => setSettings({ ...settings, serverUrl: e.target.value })}
                                    placeholder="http://localhost:3000"
                                />
                            </div>
                            <Button onClick={saveSettings}>
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
                                <input 
                                    type="checkbox" 
                                    checked={settings.emailNotifications}
                                    onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                                />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label>Calibration Alerts</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Get notified when calibration completes
                                    </p>
                                </div>
                                <input 
                                    type="checkbox" 
                                    checked={settings.calibrationAlerts}
                                    onChange={(e) => setSettings({ ...settings, calibrationAlerts: e.target.checked })}
                                />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label>Build Completion</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Notify when robot builds finish
                                    </p>
                                </div>
                                <input 
                                    type="checkbox" 
                                    checked={settings.buildCompletion}
                                    onChange={(e) => setSettings({ ...settings, buildCompletion: e.target.checked })}
                                />
                            </div>
                            <Button onClick={saveSettings} className="mt-4">
                                <Save className="h-4 w-4 mr-2" />
                                Save Notification Settings
                            </Button>
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
                                <select 
                                    className="w-full mt-2 p-2 rounded border bg-background"
                                    value={theme || "dark"}
                                    onChange={(e) => setTheme(e.target.value as "dark" | "light" | "system")}
                                >
                                    <option value="dark">Dark</option>
                                    <option value="light">Light</option>
                                    <option value="system">System</option>
                                </select>
                            </div>
                            <div>
                                <Label>3D Viewer Quality</Label>
                                <select 
                                    className="w-full mt-2 p-2 rounded border bg-background"
                                    value={settings.viewerQuality}
                                    onChange={(e) => setSettings({ ...settings, viewerQuality: e.target.value })}
                                >
                                    <option>Low (Performance)</option>
                                    <option>Medium (Balanced)</option>
                                    <option>High (Quality)</option>
                                </select>
                            </div>
                            <Button onClick={saveSettings}>
                                <Save className="h-4 w-4 mr-2" />
                                Save Appearance Settings
                            </Button>
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
                                <Button variant="outline" size="sm" onClick={() => exportData("robots")}>Export</Button>
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-lg border">
                                <div>
                                    <p className="font-medium">Programs</p>
                                    <p className="text-sm text-muted-foreground">Python program files</p>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => exportData("programs")}>Export</Button>
                            </div>
                            <Separator />
                            <div className="flex items-center gap-2 p-4 rounded-lg border border-destructive/50 bg-destructive/5">
                                <AlertTriangle className="h-5 w-5 text-destructive" />
                                <div className="flex-1">
                                    <p className="font-medium text-destructive">Danger Zone</p>
                                    <p className="text-sm text-muted-foreground">This action cannot be undone</p>
                                </div>
                                <Button variant="destructive" onClick={clearAllData}>Clear All Data</Button>
                            </div>
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
                                <Input 
                                    type="password" 
                                    placeholder="••••••••"
                                    value={settings.apiKey}
                                    onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                                />
                                <p className="text-sm text-muted-foreground mt-1">
                                    Secure API access token
                                </p>
                            </div>
                            <div>
                                <Label>Session Timeout</Label>
                                <select 
                                    className="w-full mt-2 p-2 rounded border bg-background"
                                    value={settings.sessionTimeout}
                                    onChange={(e) => setSettings({ ...settings, sessionTimeout: e.target.value })}
                                >
                                    <option>15 minutes</option>
                                    <option>30 minutes</option>
                                    <option>1 hour</option>
                                    <option>Never</option>
                                </select>
                            </div>
                            <Button onClick={saveSettings}>
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
