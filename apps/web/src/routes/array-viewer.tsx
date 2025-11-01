import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { PrinterArray3D, PrinterSpecs } from "@/components/viewer/PrinterArray3D";
import { Factory, Download, Play, Square } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/array-viewer")({
    component: ArrayViewerPage,
});

function ArrayViewerPage() {
    const [calibrating, setCalibrating] = useState(false);

    // Default printer specs
    const defaultSpecs: PrinterSpecs = {
        enclosureCm: { w: 100, h: 120, d: 100 },
        basePlateMm: { w: 900, d: 900, h: 900 },
        downwardLasers: { count: 8, footprintCm: { w: 5, d: 5, h: 10 } },
        roofSphere: { grid: [9, 9, 9], singleEmitterSizeCm: { w: 2, h: 2, d: 2 } },
    };

    return (
        <div className="container mx-auto max-w-full p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Factory className="h-8 w-8 text-primary" />
                        Industrial Printer Array - 3D Model
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Full-scale 3D visualization of 8 ceiling-mounted laser sintering systems
                    </p>
                </div>
            </div>

            <Card className="p-6">
                <div className="mb-4">
                    <h2 className="text-xl font-semibold mb-2">Array Configuration</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <span className="text-muted-foreground">Grid Layout:</span>
                            <span className="ml-2 font-medium">2 rows × 4 columns</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Total Printers:</span>
                            <span className="ml-2 font-medium">8 units</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Ceiling Height:</span>
                            <span className="ml-2 font-medium">4.0m</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Array Span:</span>
                            <span className="ml-2 font-medium">4m × 2.5m</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Laser Arms:</span>
                            <span className="ml-2 font-medium">64 total (8×8)</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Roof Emitters:</span>
                            <span className="ml-2 font-medium">5,832 total (729×8)</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Base Plate:</span>
                            <span className="ml-2 font-medium">900×900×900mm</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Spacing:</span>
                            <span className="ml-2 font-medium">50cm apart</span>
                        </div>
                    </div>
                </div>

                <div className="border rounded-lg overflow-hidden" style={{ height: "800px" }}>
                    <PrinterArray3D
                        specs={defaultSpecs}
                        config={{
                            gridCols: 4,
                            gridRows: 2,
                            spacing: 50,
                            ceilingHeight: 400,
                            suspendHeight: 50,
                        }}
                        laserColor="orange"
                        onCalibrationStart={() => setCalibrating(true)}
                        onCalibrationEnd={() => setCalibrating(false)}
                        onPrintStart={(printerIndex) => {
                            console.log(`Printer ${printerIndex} started printing`);
                        }}
                        onPrintEnd={(printerIndex) => {
                            console.log(`Printer ${printerIndex} finished printing`);
                        }}
                    />
                </div>

                <div className="mt-4 p-4 bg-muted rounded-lg">
                    <h3 className="font-semibold mb-2">Particle Laser System Features</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        <li><strong>Bidirectional Gateway:</strong> Digitization (entry to Grid) and Reconstruction (exit to reality)</li>
                        <li><strong>Accurate Calibration:</strong> All 8 printers calibrated simultaneously with precise positioning</li>
                        <li><strong>360° Arm Rotation:</strong> Full rotation capability for complete base plate coverage</li>
                        <li><strong>Particle Visualization:</strong> Digital "cubes" representing matter-energy conversion</li>
                        <li><strong>Layer-by-Layer Printing:</strong> Fast materialization at molecular speeds</li>
                        <li><strong>Resin Scaffold:</strong> Temporary gelatinous matrix that entities break out of</li>
                        <li><strong>Temporal Decay:</strong> 29-30 minute time limit before derezzing (disintegration)</li>
                        <li><strong>Permanence Code:</strong> Optional algorithm to make prints indefinite</li>
                        <li><strong>Orange/Blue Lasers:</strong> User-configurable laser colors</li>
                        <li><strong>64 Laser Arms:</strong> Coordinated operation across all 8 printers</li>
                    </ul>
                </div>
            </Card>

            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Export Options</h2>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => {
                        // Export will be handled by the component
                    }}>
                        <Download className="h-4 w-4 mr-2" />
                        Export GLTF (Unity/Blender)
                    </Button>
                    <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export OBJ (Universal)
                    </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                    Exported models include all geometry, materials, and can be imported into Unity, Blender, 
                    Unreal Engine, or any 3D software that supports GLTF/OBJ formats.
                </p>
            </Card>
        </div>
    );
}

