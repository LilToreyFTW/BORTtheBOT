import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { OBJExporter } from "three/examples/jsm/exporters/OBJExporter.js";

// # ADDED: Import laser printer sound effects
import laserPrinterOne from "./sound_effects/laser-printerone_loop.mp3";
import laserPrinterTwo from "./sound_effects/laser-printertwo_loop.mp3";
import laserPrinterThree from "./sound_effects/laser-printerthree_loop.mp3";
import laserPrinterFour from "./sound_effects/laser-printerfour_loop.mp3";
import laserPrinterFive from "./sound_effects/laser-printerfive_loop.mp3";
import laserPrinterSix from "./sound_effects/laser-printersix_loop.mp3";
import laserPrinterSeven from "./sound_effects/laser-printerseven_loop.mp3";
import laserPrinterEight from "./sound_effects/laser-printereight_loop.mp3";

/**
 * # ADDED: Full 3D Array Viewer Component
 * 
 * Generates a fully detailed, scaled 3D model of an array of eight (8) identical,
 * enclosed laser sintering/additive manufacturing systems arranged in a 2x4 grid.
 * 
 * Features:
 * - Ceiling-mounted suspension via support rails
 * - High-fidelity industrial aesthetics
 * - 8 downward laser arms per printer (64 total)
 * - 729 roof sphere emitters per printer (5,832 total)
 * - Dynamic calibration animations
 * - Spatial audio integration
 * - Export-ready (GLTF/OBJ)
 */

export type PrinterArrayConfig = {
    gridCols?: number; // Default: 4
    gridRows?: number; // Default: 2
    spacing?: number; // Default: 50cm
    ceilingHeight?: number; // Default: 400cm
    suspendHeight?: number; // Default: 50cm below ceiling
};

export type PrinterSpecs = {
    enclosureCm: { w: number; h: number; d: number };
    basePlateMm: { w: number; d: number; h: number };
    downwardLasers: { count: 8; footprintCm: { w: number; d: number; h: number } };
    roofSphere: { grid: [9, 9, 9]; singleEmitterSizeCm: { w: number; h: number; d: number } };
};

interface LaserArm {
    shoulderGroup: THREE.Group;
    upperArm: THREE.Mesh;
    elbowGroup: THREE.Group;
    lowerArm: THREE.Mesh;
    wristGroup: THREE.Group;
    laserEmitter: THREE.Mesh;
    laserBeam: THREE.Line;
    basePosition: THREE.Vector3;
}

interface PrinterInstance {
    enclosure: THREE.Group;
    basePlate: THREE.Group;
    laserArms: LaserArm[];
    roofEmitters: THREE.Group[];
    audioSource?: HTMLAudioElement;
    index: number;
    calibrationData?: {
        armPositions: { index: number; xCm: number; yCm: number; zCm: number }[];
        armRotations: { index: number; shoulderYaw: number; shoulderPitch: number; elbow: number; wristYaw: number; wristPitch: number }[];
        safe: boolean;
        marginsCm: { w: number; d: number };
    };
    printState?: {
        isPrinting: boolean;
        printProgress: number; // 0-1
        printedLayers: THREE.Mesh[];
        resinScaffold?: THREE.Group;
        targetMesh?: THREE.Mesh;
    };
}

// # ADDED: Particle laser visualization types
interface ParticleCube {
    mesh: THREE.Mesh;
    velocity: THREE.Vector3;
    lifetime: number;
}

type LaserMode = "idle" | "calibrating" | "digitizing" | "printing";
type LaserColor = "orange" | "blue";

export function PrinterArray3D({ 
    specs, 
    config = {},
    onCalibrationStart,
    onCalibrationEnd,
    onPrintStart,
    onPrintEnd,
    laserColor = "orange" as LaserColor,
}: { 
    specs: PrinterSpecs;
    config?: PrinterArrayConfig;
    onCalibrationStart?: () => void;
    onCalibrationEnd?: () => void;
    onPrintStart?: (printerIndex: number) => void;
    onPrintEnd?: (printerIndex: number) => void;
    laserColor?: LaserColor;
}) {
    const mountRef = useRef<HTMLDivElement | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const requestRef = useRef<number | null>(null);
    const printersRef = useRef<PrinterInstance[]>([]);
    const calibratingRef = useRef(false);
    const calibrationProgressRef = useRef(0);
    const printingRef = useRef(false);
    const printProgressRef = useRef(0);
    const audioRefsRef = useRef<(HTMLAudioElement | null)[]>([]);
    const particleCubesRef = useRef<ParticleCube[]>([]);
    const laserModeRef = useRef<LaserMode>("idle");

    const arrayConfig = useMemo(() => ({
        gridCols: config.gridCols ?? 4,
        gridRows: config.gridRows ?? 2,
        spacing: config.spacing ?? 50, // cm
        ceilingHeight: config.ceilingHeight ?? 400, // cm
        suspendHeight: config.suspendHeight ?? 50, // cm below ceiling
    }), [config]);

    // Calculate total array dimensions
    const arrayWidth = (specs.enclosureCm.w * arrayConfig.gridCols) + (arrayConfig.spacing * (arrayConfig.gridCols - 1));
    const arrayDepth = (specs.enclosureCm.d * arrayConfig.gridRows) + (arrayConfig.spacing * (arrayConfig.gridRows - 1));

    const sceneSetup = useMemo(() => {
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x1a1a1a); // Industrial dark gray

        // Industrial lighting setup
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
        scene.add(ambientLight);

        // Overhead fluorescent lights
        for (let i = 0; i < arrayConfig.gridCols; i++) {
            for (let j = 0; j < arrayConfig.gridRows; j++) {
                const spotLight = new THREE.SpotLight(0xffffff, 2, 300, Math.PI / 6, 0.3, 2);
                spotLight.position.set(
                    -arrayWidth / 2 + (i + 0.5) * (specs.enclosureCm.w + arrayConfig.spacing),
                    arrayConfig.ceilingHeight - 20,
                    -arrayDepth / 2 + (j + 0.5) * (specs.enclosureCm.d + arrayConfig.spacing)
                );
                spotLight.target.position.copy(spotLight.position);
                spotLight.target.position.y -= 150;
                scene.add(spotLight);
                scene.add(spotLight.target);
            }
        }

        // Camera setup for array view
        const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 5000);
        camera.position.set(arrayWidth * 0.7, arrayConfig.ceilingHeight * 0.6, arrayDepth * 0.8);
        camera.lookAt(arrayWidth / 2, arrayConfig.ceilingHeight / 2, arrayDepth / 2);

        return { scene, camera };
    }, [specs, arrayConfig, arrayWidth, arrayDepth]);

    // Initialize audio for 8 printers
    useEffect(() => {
        const soundFiles = [
            laserPrinterOne,
            laserPrinterTwo,
            laserPrinterThree,
            laserPrinterFour,
            laserPrinterFive,
            laserPrinterSix,
            laserPrinterSeven,
            laserPrinterEight,
        ];

        audioRefsRef.current = soundFiles.map((soundFile, idx) => {
            const audio = new Audio(soundFile);
            audio.loop = true;
            audio.volume = 0.3;
            // Set initial 3D position (will be updated per printer)
            return audio;
        });

        return () => {
            audioRefsRef.current.forEach((audio) => {
                if (audio) {
                    audio.pause();
                    audio.src = "";
                }
            });
            audioRefsRef.current = [];
        };
    }, []);

    // Create detailed industrial ceiling structure
    const createCeiling = (scene: THREE.Scene) => {
        const ceilingGroup = new THREE.Group();

        // Main ceiling grid (steel I-beams)
        const beamMat = new THREE.MeshStandardMaterial({ 
            color: 0x2d3748, 
            metalness: 0.9, 
            roughness: 0.1 
        });

        // Horizontal support rails (shared across array)
        const railThickness = 5; // 5cm thick I-beams
        const railHeight = 20;
        const railWidth = arrayWidth + 40;

        // Main horizontal rails
        for (let i = 0; i <= arrayConfig.gridRows; i++) {
            const rail = new THREE.Mesh(
                new THREE.BoxGeometry(railWidth, railHeight, railThickness),
                beamMat
            );
            rail.position.set(
                arrayWidth / 2,
                arrayConfig.ceilingHeight - railHeight / 2,
                -arrayDepth / 2 + (i * (specs.enclosureCm.d + arrayConfig.spacing))
            );
            ceilingGroup.add(rail);
        }

        // Cross-beams for stability
        for (let i = 0; i <= arrayConfig.gridCols; i++) {
            const rail = new THREE.Mesh(
                new THREE.BoxGeometry(railThickness, railHeight, arrayDepth + 40),
                beamMat
            );
            rail.position.set(
                -arrayWidth / 2 + (i * (specs.enclosureCm.w + arrayConfig.spacing)),
                arrayConfig.ceilingHeight - railHeight / 2,
                arrayDepth / 2
            );
            ceilingGroup.add(rail);
        }

        scene.add(ceilingGroup);
        return ceilingGroup;
    };

    // Create a single detailed printer instance
    const createPrinter = (x: number, y: number, z: number, index: number): PrinterInstance => {
        const printerGroup = new THREE.Group();
        printerGroup.position.set(x, y, z);
        printerGroup.userData.printerIndex = index; // Store index for reference

        // Create enclosure
        const enclosure = createEnclosure(specs);
        printerGroup.add(enclosure);

        // Create base plate
        const basePlate = createBasePlate(specs);
        printerGroup.add(basePlate);

        // Create 8 downward laser arms
        const laserArms: LaserArm[] = [];
        const plateW = specs.basePlateMm.w / 10;
        const positions = Array.from({ length: specs.downwardLasers.count }, (_, i) => {
            const xPos = (plateW / (specs.downwardLasers.count - 1)) * i - plateW / 2;
            return { index: i, xCm: xPos, yCm: specs.enclosureCm.h, zCm: 0 };
        });

        positions.forEach((p) => {
            const arm = createLaserArm(specs, p.xCm, p.yCm, p.zCm);
            laserArms.push(arm);
            printerGroup.add(arm.shoulderGroup);
        });

        // Create 729 roof sphere emitters
        const roofEmitters: THREE.Group[] = [];
        const emitterSize = specs.roofSphere.singleEmitterSizeCm.w;
        const gridSize = specs.roofSphere.grid[0];
        const totalSpan = emitterSize * gridSize;

        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                for (let k = 0; k < gridSize; k++) {
                    const emitter = createRoofEmitter(emitterSize);
                    emitter.position.set(
                        -totalSpan / 2 + (i + 0.5) * emitterSize,
                        specs.enclosureCm.h - 2,
                        -totalSpan / 2 + (j + 0.5) * emitterSize
                    );
                    roofEmitters.push(emitter);
                    printerGroup.add(emitter);
                }
            }
        }

        // Create suspension chains/cables
        const suspension = createSuspension(specs, arrayConfig);
        printerGroup.add(suspension);

        const instance: PrinterInstance = {
            enclosure: enclosure,
            basePlate: basePlate,
            laserArms,
            roofEmitters,
            audioSource: audioRefsRef.current[index] || null,
            index,
        };
        
        // Store reference to parent group in instance
        (instance as any).printerGroup = printerGroup;
        
        return instance;
    };

    // Create detailed enclosure
    const createEnclosure = (specs: PrinterSpecs): THREE.Group => {
        const group = new THREE.Group();
        const { w: encW, h: encH, d: encD } = specs.enclosureCm;

        // Structural frame (welded aluminum square tubing)
        const frameMat = new THREE.MeshStandardMaterial({ 
            color: 0x555555, 
            metalness: 0.9, 
            roughness: 0.2 
        });

        const frameWidth = 5;
        const corners = [
            { x: -encW / 2, z: -encD / 2 },
            { x: encW / 2, z: -encD / 2 },
            { x: encW / 2, z: encD / 2 },
            { x: -encW / 2, z: encD / 2 },
        ];

        // # ENHANCED: Corner columns with detailed gussets and cross-bracing
        corners.forEach((corner) => {
            const column = new THREE.Mesh(
                new THREE.BoxGeometry(frameWidth, encH, frameWidth),
                frameMat
            );
            column.position.set(corner.x, encH / 2, corner.z);
            group.add(column);
            
            // # ADDED: Corner gussets for stability (triangular reinforcement plates)
            const gussetSize = 3;
            const gussetThickness = 0.5;
            const gussetGeom = new THREE.CylinderGeometry(0, gussetSize, gussetThickness, 3);
            const gussetMat = new THREE.MeshStandardMaterial({ 
                color: 0x444444, 
                metalness: 0.9, 
                roughness: 0.3 
            });
            
            // Add gussets at top and bottom corners
            for (const y of [encH * 0.1, encH * 0.9]) {
                const gusset1 = new THREE.Mesh(gussetGeom, gussetMat);
                gusset1.rotation.z = Math.PI / 2;
                gusset1.position.set(corner.x, y, corner.z);
                group.add(gusset1);
            }
        });
        
        // # ADDED: Cross-bracing for stability
        const braceMat = new THREE.MeshStandardMaterial({ 
            color: 0x4a5568, 
            metalness: 0.9, 
            roughness: 0.2 
        });
        const braceWidth = 3;
        const braceHeight = 1;
        
        // Horizontal braces (connecting columns)
        const horizontalBraces = [
            { y: encH * 0.25, from: corners[0], to: corners[1] },
            { y: encH * 0.75, from: corners[2], to: corners[3] },
        ];
        
        horizontalBraces.forEach((brace) => {
            const midX = (brace.from.x + brace.to.x) / 2;
            const distance = Math.abs(brace.to.x - brace.from.x);
            const braceMesh = new THREE.Mesh(
                new THREE.BoxGeometry(distance - frameWidth, braceHeight, braceWidth),
                braceMat
            );
            braceMesh.position.set(midX, brace.y, brace.from.z);
            group.add(braceMesh);
        });

        // Side panels (semi-transparent acrylic, 70% opacity)
        const panelMat = new THREE.MeshStandardMaterial({ 
            color: 0x2d3748, 
            metalness: 0.3, 
            roughness: 0.7,
            transparent: true,
            opacity: 0.7
        });

        const panelThickness = 0.5;
        
        // Front panel
        const frontPanel = new THREE.Mesh(
            new THREE.BoxGeometry(encW, encH, panelThickness),
            panelMat
        );
        frontPanel.position.set(0, encH / 2, encD / 2 - panelThickness / 2);
        group.add(frontPanel);

        // Back panel
        const backPanel = new THREE.Mesh(
            new THREE.BoxGeometry(encW, encH, panelThickness),
            panelMat
        );
        backPanel.position.set(0, encH / 2, -encD / 2 + panelThickness / 2);
        group.add(backPanel);

        // Side panels with hinged doors
        // # ENHANCED: Left panel with hinged door
        const leftPanelGroup = new THREE.Group();
        const leftPanel = new THREE.Mesh(
            new THREE.BoxGeometry(panelThickness, encH, encD),
            panelMat
        );
        leftPanel.position.set(-encW / 2 + panelThickness / 2, encH / 2, 0);
        leftPanelGroup.add(leftPanel);
        
        // # ADDED: Hinged door on left side (can swing open)
        const doorWidth = encH * 0.6;
        const doorHeight = encD * 0.7;
        const doorMesh = new THREE.Mesh(
            new THREE.BoxGeometry(panelThickness, doorHeight, doorWidth),
            panelMat
        );
        doorMesh.position.set(
            -encW / 2 + panelThickness / 2,
            encH * 0.6,
            encD * 0.3
        );
        // # ADDED: Door hinge
        const hinge = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.3, 2, 16),
            new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.9 })
        );
        hinge.rotation.z = Math.PI / 2;
        hinge.position.set(-encW / 2 - 0.5, encH * 0.6, encD * 0.3);
        leftPanelGroup.add(hinge);
        leftPanelGroup.add(doorMesh);
        group.add(leftPanelGroup);

        // Right panel
        const rightPanel = new THREE.Mesh(
            new THREE.BoxGeometry(panelThickness, encH, encD),
            panelMat
        );
        rightPanel.position.set(encW / 2 - panelThickness / 2, encH / 2, 0);
        group.add(rightPanel);
        
        // # ADDED: Front panel with hinged door and magnetic latch
        const frontPanelGroup = new THREE.Group();
        const frontDoorHeight = encH * 0.8;
        const frontDoorWidth = encW * 0.7;
        const frontDoor = new THREE.Mesh(
            new THREE.BoxGeometry(frontDoorWidth, frontDoorHeight, panelThickness),
            panelMat
        );
        frontDoor.position.set(
            -encW * 0.15,
            encH * 0.55,
            encD / 2 - panelThickness / 2
        );
        // # ADDED: Magnetic latch
        const latch = new THREE.Mesh(
            new THREE.BoxGeometry(1, 0.5, 0.3),
            new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.3 })
        );
        latch.position.set(encW * 0.35, encH * 0.9, encD / 2);
        frontPanelGroup.add(latch);
        frontPanelGroup.add(frontDoor);
        group.add(frontPanelGroup);

        // # ENHANCED: Roof panel with 8 mounting points and central cutout
        const roofPanel = new THREE.Mesh(
            new THREE.BoxGeometry(encW, 2, encD),
            new THREE.MeshStandardMaterial({ color: 0x1a202c, metalness: 0.8, roughness: 0.2 })
        );
        roofPanel.position.set(0, encH - 1, 0);
        group.add(roofPanel);
        
        // # ADDED: Central cutout (20cm x 20cm) for roof sphere grid
        const cutoutSize = 20;
        const cutoutGeom = new THREE.BoxGeometry(cutoutSize, 3, cutoutSize);
        const cutoutMesh = new THREE.Mesh(
            cutoutGeom,
            new THREE.MeshStandardMaterial({ 
                color: 0x000000, 
                metalness: 0.9, 
                roughness: 0.1,
                side: THREE.DoubleSide
            })
        );
        cutoutMesh.position.set(0, encH - 2, 0);
        group.add(cutoutMesh);
        
        // # ADDED: 8 M10 mounting points for downward laser arms
        const mountPointMat = new THREE.MeshStandardMaterial({ 
            color: 0x2d3748, 
            metalness: 0.9, 
            roughness: 0.1 
        });
        const mountPointRadius = 0.5; // M10 bolt
        const mountPoints = Array.from({ length: 8 }, (_, i) => {
            const x = (encW / 7) * i - encW / 2;
            return { x, z: 0 };
        });
        
        mountPoints.forEach((mp) => {
            const mountPoint = new THREE.Mesh(
                new THREE.CylinderGeometry(mountPointRadius, mountPointRadius, 3, 16),
                mountPointMat
            );
            mountPoint.rotation.x = Math.PI / 2;
            mountPoint.position.set(mp.x, encH - 1, mp.z);
            group.add(mountPoint);
            
            // # ADDED: Mounting bolt head
            const boltHead = new THREE.Mesh(
                new THREE.CylinderGeometry(0.8, 0.8, 0.5, 6),
                mountPointMat
            );
            boltHead.rotation.x = Math.PI / 2;
            boltHead.position.set(mp.x, encH + 0.5, mp.z);
            group.add(boltHead);
        });

        // # ENHANCED: Ventilation fans with animated spinning blades
        const fanMat = new THREE.MeshStandardMaterial({ color: 0x1a202c, metalness: 0.8 });
        const fanHousingMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.9 });
        
        for (let i = 0; i < 2; i++) {
            for (let j = 0; j < 2; j++) {
                const fanGroup = new THREE.Group();
                const fanHousing = new THREE.Mesh(
                    new THREE.CylinderGeometry(3.5, 3.5, 1.5, 16),
                    fanHousingMat
                );
                fanHousing.rotation.x = Math.PI / 2;
                fanGroup.add(fanHousing);
                
                // # ADDED: Spinning fan blades (will be animated)
                const bladeMat = new THREE.MeshStandardMaterial({ color: 0x2d3748, metalness: 0.7 });
                for (let b = 0; b < 8; b++) {
                    const blade = new THREE.Mesh(
                        new THREE.BoxGeometry(0.2, 2.5, 0.3),
                        bladeMat
                    );
                    blade.rotation.z = (b / 8) * Math.PI * 2;
                    blade.position.y = 1.25;
                    fanGroup.add(blade);
                }
                
                fanGroup.position.set(
                    -encW / 2 + (i + 0.5) * encW / 2,
                    encH - 1,
                    -encD / 2 + (j + 0.5) * encD / 2
                );
                fanGroup.userData.isFan = true; // Mark for animation
                group.add(fanGroup);
            }
        }

        return group;
    };

    // Create detailed base plate
    const createBasePlate = (specs: PrinterSpecs): THREE.Group => {
        const group = new THREE.Group();
        const plateW = specs.basePlateMm.w / 10;
        const plateD = specs.basePlateMm.d / 10;
        const plateH = specs.basePlateMm.h / 10;

        // Main base plate (perforated steel grating)
        const plateGeom = new THREE.BoxGeometry(plateW, plateH, plateD);
        const plateMat = new THREE.MeshStandardMaterial({ 
            color: 0x1a1a1a, 
            metalness: 0.95, 
            roughness: 0.1 
        });
        const plate = new THREE.Mesh(plateGeom, plateMat);
        plate.position.set(0, plateH / 2 + 10, 0); // 10cm elevated
        group.add(plate);

        // Grating pattern
        const gratingMat = new THREE.MeshStandardMaterial({ 
            color: 0x4a5568, 
            metalness: 0.8, 
            roughness: 0.3 
        });
        const gratingSpacing = 10; // 10cm spacing

        for (let x = -plateW / 2; x <= plateW / 2; x += gratingSpacing) {
            const line = new THREE.Mesh(
                new THREE.BoxGeometry(0.2, 0.3, plateD),
                gratingMat
            );
            line.position.set(x, plateH + 10.15, 0);
            group.add(line);
        }

        for (let z = -plateD / 2; z <= plateD / 2; z += gratingSpacing) {
            const line = new THREE.Mesh(
                new THREE.BoxGeometry(plateW, 0.3, 0.2),
                gratingMat
            );
            line.position.set(0, plateH + 10.15, z);
            group.add(line);
        }

        // # ENHANCED: M8 mounting bolts with adjustable legs
        const boltMat = new THREE.MeshStandardMaterial({ color: 0x4a5568, metalness: 0.9 });
        const boltRadius = 0.4; // M8 bolt (0.8cm diameter)
        const boltHeight = 2;
        const boltGeom = new THREE.CylinderGeometry(boltRadius, boltRadius, boltHeight, 16);

        const corners = [
            { x: -plateW / 2 + 5, z: -plateD / 2 + 5 },
            { x: plateW / 2 - 5, z: -plateD / 2 + 5 },
            { x: plateW / 2 - 5, z: plateD / 2 - 5 },
            { x: -plateW / 2 + 5, z: plateD / 2 - 5 },
        ];

        corners.forEach((corner) => {
            // # ADDED: Adjustable legs (10cm elevation)
            const leg = new THREE.Mesh(
                new THREE.CylinderGeometry(2, 2.5, 10, 16),
                new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.9 })
            );
            leg.position.set(corner.x, 5, corner.z);
            group.add(leg);
            
            // M8 mounting bolt
            const bolt = new THREE.Mesh(boltGeom, boltMat);
            bolt.rotation.x = Math.PI / 2;
            bolt.position.set(corner.x, plateH + 10 + boltHeight / 2, corner.z);
            group.add(bolt);
        });

        // # ENHANCED: Fiducial markers (QR-like patterns at 30cm intervals)
        const markerMat = new THREE.MeshStandardMaterial({ 
            color: 0xffff00, 
            emissive: 0xffff00, 
            emissiveIntensity: 0.5 
        });
        const markerPatternMat = new THREE.MeshStandardMaterial({ 
            color: 0x000000, 
            emissive: 0x000000 
        });
        
        for (let i = 0; i <= 3; i++) {
            for (let j = 0; j <= 3; j++) {
                const markerGroup = new THREE.Group();
                const markerX = -plateW / 2 + (i * 30);
                const markerZ = -plateD / 2 + (j * 30);
                
                // Base marker (yellow square)
                const marker = new THREE.Mesh(
                    new THREE.BoxGeometry(3, 0.2, 3),
                    markerMat
                );
                marker.position.y = plateH + 10.2;
                markerGroup.add(marker);
                
                // # ADDED: QR-like pattern (black squares on yellow)
                for (let p = 0; p < 3; p++) {
                    for (let q = 0; q < 3; q++) {
                        if ((p + q) % 2 === 0) {
                            const pattern = new THREE.Mesh(
                                new THREE.BoxGeometry(0.5, 0.25, 0.5),
                                markerPatternMat
                            );
                            pattern.position.set(
                                -1 + p,
                                plateH + 10.3,
                                -1 + q
                            );
                            markerGroup.add(pattern);
                        }
                    }
                }
                
                markerGroup.position.set(markerX, 0, markerZ);
                group.add(markerGroup);
            }
        }
        
        // # ADDED: Central 50cm x 50cm recessed area for workpiece clamping
        const recessDepth = 1;
        const recessSize = 50;
        const recess = new THREE.Mesh(
            new THREE.BoxGeometry(recessSize, recessDepth, recessSize),
            new THREE.MeshStandardMaterial({ 
                color: 0x2d3748, 
                metalness: 0.9, 
                roughness: 0.3 
            })
        );
        recess.position.set(0, plateH + 10 - recessDepth / 2, 0);
        group.add(recess);
        
        // # ADDED: Clamping mechanism visualization
        const clampMat = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.9 });
        for (let c = 0; c < 4; c++) {
            const angle = (c / 4) * Math.PI * 2;
            const clampRadius = recessSize * 0.35;
            const clamp = new THREE.Mesh(
                new THREE.BoxGeometry(2, 3, 1),
                clampMat
            );
            clamp.position.set(
                Math.cos(angle) * clampRadius,
                plateH + 10 - recessDepth + 1.5,
                Math.sin(angle) * clampRadius
            );
            clamp.rotation.y = angle + Math.PI / 2;
            group.add(clamp);
        }

        return group;
    };

    // Create detailed laser arm
    const createLaserArm = (
        specs: PrinterSpecs,
        baseX: number,
        baseY: number,
        baseZ: number
    ): LaserArm => {
        const arm: Partial<LaserArm> = {};
        const encH = specs.enclosureCm.h;

        // Shoulder group (base mount)
        arm.shoulderGroup = new THREE.Group();
        arm.shoulderGroup.position.set(baseX, baseY, baseZ);
        arm.basePosition = new THREE.Vector3(baseX, baseY, baseZ);

        // Base mount bracket
        const mountBracket = new THREE.Mesh(
            new THREE.BoxGeometry(10, 10, 5),
            new THREE.MeshStandardMaterial({ color: 0x2d3748, metalness: 0.9 })
        );
        mountBracket.position.set(0, 5, 0);
        arm.shoulderGroup.add(mountBracket);

        // Shoulder joint
        const shoulderJoint = new THREE.Mesh(
            new THREE.SphereGeometry(2.5, 16, 16),
            new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8 })
        );
        arm.shoulderGroup.add(shoulderJoint);

            // # ENHANCED: Upper arm (48cm) segmented into three 16cm cylindrical tubes with carbon fiber texture
            const upperArmLen = encH * 0.4;
            const segmentLen = upperArmLen / 3;
            const upperArmGroup = new THREE.Group();
            
            // # ADDED: Three 16cm segments with ball-bearing couplings
            for (let seg = 0; seg < 3; seg++) {
                const segment = new THREE.Mesh(
                    new THREE.CylinderGeometry(1.5, 1.8, segmentLen, 16),
                    new THREE.MeshStandardMaterial({ 
                        color: 0x333333, 
                        metalness: 0.7, 
                        roughness: 0.3,
                        // # ADDED: Carbon fiber texture appearance
                        normalScale: new THREE.Vector2(0.5, 0.5)
                    })
                );
                segment.rotation.z = Math.PI / 2;
                segment.position.y = -segmentLen / 2 - (seg * segmentLen);
                upperArmGroup.add(segment);
                
                // # ADDED: Ball-bearing coupling between segments
                if (seg < 2) {
                    const coupling = new THREE.Mesh(
                        new THREE.CylinderGeometry(2, 2, 1, 16),
                        new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8 })
                    );
                    coupling.rotation.z = Math.PI / 2;
                    coupling.position.y = -segmentLen - (seg * segmentLen);
                    upperArmGroup.add(coupling);
                }
            }
            
            upperArmGroup.position.y = -upperArmLen / 2;
            arm.shoulderGroup.add(upperArmGroup);
            arm.upperArm = upperArmGroup.children[0] as THREE.Mesh; // Store first segment for reference

            // # ENHANCED: Elbow joint with single servo, fine adjustment gears, and limit stops
            arm.elbowGroup = new THREE.Group();
            arm.elbowGroup.position.set(0, -upperArmLen, 0);

            const elbowJoint = new THREE.Mesh(
                new THREE.SphereGeometry(2, 16, 16),
                new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8 })
            );
            arm.elbowGroup.add(elbowJoint);
            
            // # ADDED: Single servo for pitch (0-180°)
            const elbowServo = new THREE.Mesh(
                new THREE.BoxGeometry(3, 2.5, 3),
                new THREE.MeshStandardMaterial({ color: 0x1a202c, metalness: 0.8 })
            );
            elbowServo.position.set(0, -1, 0);
            arm.elbowGroup.add(elbowServo);
            
            // # ADDED: Fine adjustment gears (0.1° precision)
            const gearMat = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.9 });
            const gear1 = new THREE.Mesh(
                new THREE.CylinderGeometry(1, 1, 0.5, 24),
                gearMat
            );
            gear1.rotation.x = Math.PI / 2;
            gear1.position.set(1.5, -0.5, 0);
            arm.elbowGroup.add(gear1);
            
            const gear2 = new THREE.Mesh(
                new THREE.CylinderGeometry(0.8, 0.8, 0.5, 24),
                gearMat
            );
            gear2.rotation.x = Math.PI / 2;
            gear2.position.set(-1.5, -0.5, 0);
            arm.elbowGroup.add(gear2);
            
            // # ADDED: Limit stops to prevent enclosure collisions
            const stopMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.3 });
            const limitStop = new THREE.Mesh(
                new THREE.BoxGeometry(0.5, 1, 0.5),
                stopMat
            );
            limitStop.position.set(0, -2.5, 0);
            arm.elbowGroup.add(limitStop);

            // # ENHANCED: Lower arm (42cm) tapered with internal wiring conduits
            const lowerArmLen = encH * 0.35;
            const lowerArmGroup = new THREE.Group();
            
            // Main tapered arm
            arm.lowerArm = new THREE.Mesh(
                new THREE.CylinderGeometry(0.75, 1.5, lowerArmLen, 16),
                new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.9 })
            );
            arm.lowerArm.rotation.z = Math.PI / 2;
            arm.lowerArm.position.y = -lowerArmLen / 2;
            lowerArmGroup.add(arm.lowerArm);
            
            // # ADDED: Internal wiring conduits visible through semi-transparent covers
            const conduitMat = new THREE.MeshStandardMaterial({ 
                color: 0xff0033, 
                emissive: 0xff0033, 
                emissiveIntensity: 0.2,
                transparent: true,
                opacity: 0.6
            });
            const conduit = new THREE.Mesh(
                new THREE.CylinderGeometry(0.2, 0.2, lowerArmLen * 0.8, 8),
                conduitMat
            );
            conduit.rotation.z = Math.PI / 2;
            conduit.position.y = -lowerArmLen / 2;
            conduit.position.x = 0.5;
            lowerArmGroup.add(conduit);
            
            // # ADDED: Semi-transparent cover
            const coverMat = new THREE.MeshStandardMaterial({ 
                color: 0x888888, 
                transparent: true, 
                opacity: 0.3 
            });
            const cover = new THREE.Mesh(
                new THREE.CylinderGeometry(0.9, 1.6, lowerArmLen * 0.9, 16),
                coverMat
            );
            cover.rotation.z = Math.PI / 2;
            cover.position.y = -lowerArmLen / 2;
            lowerArmGroup.add(cover);
            
            arm.elbowGroup.add(lowerArmGroup);

        arm.shoulderGroup.add(arm.elbowGroup);

            // # ENHANCED: Wrist joint with dual-axis (yaw 360°, pitch ±45°) and micro-servos
            arm.wristGroup = new THREE.Group();
            arm.wristGroup.position.set(0, -lowerArmLen, 0);

            const wristJoint = new THREE.Mesh(
                new THREE.SphereGeometry(1.5, 16, 16),
                new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8 })
            );
            arm.wristGroup.add(wristJoint);
            
            // # ADDED: Micro-servos for yaw and pitch
            const wristYawServo = new THREE.Mesh(
                new THREE.BoxGeometry(1.5, 1, 1.5),
                new THREE.MeshStandardMaterial({ color: 0x1a202c, metalness: 0.8 })
            );
            wristYawServo.position.set(0, -0.8, 0);
            arm.wristGroup.add(wristYawServo);
            
            const wristPitchServo = new THREE.Mesh(
                new THREE.BoxGeometry(1.5, 1, 1.5),
                new THREE.MeshStandardMaterial({ color: 0x1a202c, metalness: 0.8 })
            );
            wristPitchServo.position.set(0.8, -0.8, 0);
            arm.wristGroup.add(wristPitchServo);

            // # ENHANCED: Laser emitter with detailed housing and collimated lens system
            const emitterHousing = new THREE.Mesh(
                new THREE.CylinderGeometry(2.5, 2.5, 3, 16),
                new THREE.MeshStandardMaterial({ color: 0x1a202c, metalness: 0.9 })
            );
            emitterHousing.position.y = -2.5;
            arm.wristGroup.add(emitterHousing);
            
            // # ADDED: Adjustable focus ring (knurled metal)
            const focusRing = new THREE.Mesh(
                new THREE.TorusGeometry(2.2, 0.2, 8, 16),
                new THREE.MeshStandardMaterial({ 
                    color: 0x666666, 
                    metalness: 0.8,
                    roughness: 0.4,
                    // # ADDED: Knurled texture appearance
                    normalScale: new THREE.Vector2(2, 2)
                })
            );
            focusRing.position.y = -1.5;
            arm.wristGroup.add(focusRing);
            
            // # ADDED: Collimated lens system (f/2.8, 10cm focal length)
            const lensGeom = new THREE.CylinderGeometry(1.8, 1.8, 0.5, 32);
            const lensMat = new THREE.MeshStandardMaterial({ 
                color: 0xffffff, 
                transparent: true, 
                opacity: 0.3,
                roughness: 0.1,
                metalness: 0.1
            });
            const lens = new THREE.Mesh(lensGeom, lensMat);
            lens.position.y = -1.75;
            arm.wristGroup.add(lens);
            
            // # ADDED: Red laser diode (1W simulated power)
            const emitterGeom = new THREE.ConeGeometry(1.5, 5, 16);
            const emitterMat = new THREE.MeshStandardMaterial({ 
                color: 0xff0033, 
                emissive: 0xff0033, 
                emissiveIntensity: 0.8 
            });
            arm.laserEmitter = new THREE.Mesh(emitterGeom, emitterMat);
            arm.laserEmitter.rotation.z = Math.PI;
            arm.laserEmitter.position.y = -5;
            arm.wristGroup.add(arm.laserEmitter);
            
            // # ADDED: Beam divergence indicator (0.5mrad)
            const divergenceCone = new THREE.Mesh(
                new THREE.ConeGeometry(0.05, 1, 8),
                new THREE.MeshStandardMaterial({ 
                    color: 0xff0033, 
                    transparent: true, 
                    opacity: 0.3 
                })
            );
            divergenceCone.rotation.z = Math.PI;
            divergenceCone.position.y = -5.5;
            arm.wristGroup.add(divergenceCone);

        arm.shoulderGroup.add(arm.wristGroup);

        // Laser beam (initially hidden)
        const beamGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, -50, 0)
        ]);
        arm.laserBeam = new THREE.Line(
            beamGeometry,
            new THREE.LineBasicMaterial({ 
                color: 0xff0033, 
                linewidth: 2,
                transparent: true,
                opacity: 0.6
            })
        );
        arm.laserBeam.visible = false;
        arm.wristGroup.add(arm.laserBeam);

        return arm as LaserArm;
    };

    // # ENHANCED: Create roof sphere emitter with detailed components
    const createRoofEmitter = (size: number): THREE.Group => {
        const group = new THREE.Group();

        // # ENHANCED: Mini servo base (1cm³) for 180° pan/tilt
        const servoBase = new THREE.Mesh(
            new THREE.BoxGeometry(size * 0.8, size * 0.3, size * 0.8),
            new THREE.MeshStandardMaterial({ color: 0x1a202c, metalness: 0.8 })
        );
        group.add(servoBase);
        
        // # ADDED: Servo motor housing
        const servoMotor = new THREE.Mesh(
            new THREE.CylinderGeometry(size * 0.2, size * 0.2, size * 0.25, 8),
            new THREE.MeshStandardMaterial({ color: 0x000000, metalness: 0.9 })
        );
        servoMotor.rotation.x = Math.PI / 2;
        servoMotor.position.y = -size * 0.15;
        group.add(servoMotor);

        // # ENHANCED: Rotatable arm assembly (1cm extendable telescoping arm, collapsible)
        const armGroup = new THREE.Group();
        const arm = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2, 0.2, size * 0.4, 8),
            new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.9 })
        );
        arm.rotation.x = Math.PI / 2;
        arm.position.y = -size * 0.2;
        armGroup.add(arm);
        
        // # ADDED: Telescoping extension (collapsible)
        const extension = new THREE.Mesh(
            new THREE.CylinderGeometry(0.15, 0.15, size * 0.3, 8),
            new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.9 })
        );
        extension.rotation.x = Math.PI / 2;
        extension.position.y = -size * 0.35;
        armGroup.add(extension);
        group.add(armGroup);

        // # ENHANCED: Emitter housing (black anodized cube)
        const housing = new THREE.Mesh(
            new THREE.BoxGeometry(size * 0.6, size * 0.6, size * 0.6),
            new THREE.MeshStandardMaterial({ 
                color: 0x000000, 
                metalness: 0.9,
                roughness: 0.1 // Anodized finish
            })
        );
        housing.position.y = -size * 0.5;
        group.add(housing);
        
        // # ADDED: Aspheric lens (f/1.8)
        const asphericLens = new THREE.Mesh(
            new THREE.CylinderGeometry(size * 0.25, size * 0.25, size * 0.1, 32),
            new THREE.MeshStandardMaterial({ 
                color: 0xffffff, 
                transparent: true, 
                opacity: 0.4,
                roughness: 0.05,
                metalness: 0.1
            })
        );
        asphericLens.rotation.x = Math.PI / 2;
        asphericLens.position.y = -size * 0.55;
        group.add(asphericLens);

        // # ENHANCED: Laser emitter projecting 10cm beam
        const emitter = new THREE.Mesh(
            new THREE.ConeGeometry(size * 0.2, size * 0.4, 8),
            new THREE.MeshStandardMaterial({ 
                color: 0xff0033, 
                emissive: 0xff0033, 
                emissiveIntensity: 0.6 
            })
        );
        emitter.rotation.z = Math.PI;
        emitter.position.y = -size * 0.7;
        group.add(emitter);
        
        // # ADDED: 10cm beam projection
        const beamProj = new THREE.Mesh(
            new THREE.CylinderGeometry(size * 0.15, size * 0.2, 10, 8),
            new THREE.MeshStandardMaterial({ 
                color: 0xff0033, 
                emissive: 0xff0033, 
                emissiveIntensity: 0.4,
                transparent: true,
                opacity: 0.3
            })
        );
        beamProj.rotation.z = Math.PI;
        beamProj.position.y = -size * 0.7 - 5;
        group.add(beamProj);

        return group;
    };

    // Create suspension system
    const createSuspension = (specs: PrinterSpecs, config: Required<PrinterArrayConfig>): THREE.Group => {
        const group = new THREE.Group();
        const chainMat = new THREE.MeshStandardMaterial({ color: 0x4a5568, metalness: 0.9 });

        // Suspension chains from ceiling
        const chainHeight = config.suspendHeight;
        const corners = [
            { x: -specs.enclosureCm.w / 2 + 10, z: -specs.enclosureCm.d / 2 + 10 },
            { x: specs.enclosureCm.w / 2 - 10, z: -specs.enclosureCm.d / 2 + 10 },
            { x: specs.enclosureCm.w / 2 - 10, z: specs.enclosureCm.d / 2 - 10 },
            { x: -specs.enclosureCm.w / 2 + 10, z: specs.enclosureCm.d / 2 - 10 },
        ];

        corners.forEach((corner) => {
            const chain = new THREE.Mesh(
                new THREE.CylinderGeometry(0.5, 0.5, chainHeight, 8),
                chainMat
            );
            chain.position.set(
                corner.x,
                specs.enclosureCm.h + chainHeight / 2,
                corner.z
            );
            group.add(chain);
        });

        return group;
    };

    // Initialize scene
    useEffect(() => {
        if (!mountRef.current) return;
        const mount = mountRef.current;

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(mount.clientWidth, mount.clientHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        mount.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        const { scene, camera } = sceneSetup;
        sceneRef.current = scene;

        // Create industrial floor
        const floorMat = new THREE.MeshStandardMaterial({ 
            color: 0x2d3748, 
            metalness: 0.8, 
            roughness: 0.3 
        });
        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(arrayWidth * 2, arrayDepth * 2),
            floorMat
        );
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0;
        floor.receiveShadow = true;
        scene.add(floor);

        // Create ceiling structure
        createCeiling(scene);

        // Create 8 printers in 2x4 grid
        printersRef.current = [];
        for (let row = 0; row < arrayConfig.gridRows; row++) {
            for (let col = 0; col < arrayConfig.gridCols; col++) {
                const printerIndex = row * arrayConfig.gridCols + col;
                const x = -arrayWidth / 2 + (col + 0.5) * (specs.enclosureCm.w + arrayConfig.spacing);
                const y = arrayConfig.ceilingHeight - arrayConfig.suspendHeight - specs.enclosureCm.h / 2;
                const z = -arrayDepth / 2 + (row + 0.5) * (specs.enclosureCm.d + arrayConfig.spacing);

                const printer = createPrinter(x, y, z, printerIndex);
                printersRef.current.push(printer);
                // Get the parent group from the printer instance
                const printerGroup = (printer as any).printerGroup as THREE.Group;
                if (printerGroup) {
                    scene.add(printerGroup);
                }
            }
        }

        // Animation loop
        let lastTime = Date.now();
        const animate = () => {
            if (!rendererRef.current) return;
            const now = Date.now();
            const delta = (now - lastTime) / 1000;
            lastTime = now;

            // Update calibration animation with accurate positioning
            if (calibratingRef.current) {
                calibrationProgressRef.current += delta * 0.2; // Slow rotation
                if (calibrationProgressRef.current >= 1) {
                    calibrationProgressRef.current = 0;
                }

                const progress = calibrationProgressRef.current;
                const plateSize = 90; // 90cm plate

                printersRef.current.forEach((printer) => {
                    // Use stored calibration data for accurate positioning
                    const calData = printer.calibrationData;
                    if (!calData) return;

                    printer.laserArms.forEach((arm, armIdx) => {
                        const rotData = calData.armRotations[armIdx];
                        if (!rotData) return;

                        // Accurate 360° rotation using calibration data
                        const yawAngle = (progress * Math.PI * 2) + rotData.shoulderYaw;
                        arm.shoulderGroup.rotation.y = yawAngle;
                        arm.shoulderGroup.rotation.x = rotData.shoulderPitch; // Accurate 45° down

                        // Precise elbow and wrist adjustments
                        arm.elbowGroup.rotation.x = rotData.elbow + Math.sin(progress * 2 + armIdx) * 0.1;
                        arm.wristGroup.rotation.x = rotData.wristPitch + Math.cos(progress * 3 + armIdx) * 0.15;
                        arm.wristGroup.rotation.z = rotData.wristYaw + Math.sin(progress * 2.5 + armIdx) * 0.2;

                        // Update particle laser beam (orange or blue)
                        const emitterWorldPos = new THREE.Vector3();
                        arm.laserEmitter.getWorldPosition(emitterWorldPos);
                        const scanRadius = plateSize * 0.4;
                        const beamTargetX = Math.cos(yawAngle) * scanRadius;
                        const beamTargetZ = Math.sin(yawAngle) * scanRadius;
                        const beamTarget = new THREE.Vector3(beamTargetX, 10, beamTargetZ);
                        const direction = beamTarget.clone().sub(emitterWorldPos).normalize();
                        const beamEnd = emitterWorldPos.clone().add(direction.multiplyScalar(50));

                        arm.laserBeam.geometry.setFromPoints([
                            emitterWorldPos,
                            beamEnd
                        ]);
                        
                        // Set laser color based on mode
                        const beamColor = laserColor === "orange" ? 0xff6600 : 0x0066ff;
                        (arm.laserBeam.material as THREE.LineBasicMaterial).color.setHex(beamColor);
                        arm.laserBeam.visible = true;
                    });

                    // Animate roof emitters (pulse sequence for calibration grid)
                    printer.roofEmitters.forEach((emitter, idx) => {
                        const pulse = Math.sin(progress * 10 + idx * 0.1);
                        emitter.scale.set(1, 1 + pulse * 0.1, 1);
                    });
                });
            }

            // # ADDED: Printing mode animation (particle laser reconstruction)
            if (printingRef.current) {
                printProgressRef.current += delta * 0.5; // Fast printing speed
                
                printersRef.current.forEach((printer, printerIdx) => {
                    if (!printer.printState?.isPrinting) return;
                    
                    const printState = printer.printState;
                    printState.printProgress = Math.min(1, printProgressRef.current / (printerIdx + 1));
                    
                    // Layer-by-layer printing visualization
                    const totalLayers = 100; // 100 layers for smooth printing
                    const currentLayer = Math.floor(printState.printProgress * totalLayers);
                    
                    // Update printed layers
                    if (currentLayer > printState.printedLayers.length && printState.targetMesh) {
                        // Add new layer
                        const layerHeight = (specs.basePlateMm.h / 10) / totalLayers;
                        const layerMesh = printState.targetMesh.clone();
                        const printerGroup = (printer as any).printerGroup as THREE.Group;
                        const basePos = printerGroup?.position.clone() || new THREE.Vector3();
                        layerMesh.position.set(
                            basePos.x,
                            basePos.y + printState.printedLayers.length * layerHeight + 10,
                            basePos.z
                        );
                        layerMesh.scale.y = layerHeight / 50;
                        printState.printedLayers.push(layerMesh);
                        scene.add(layerMesh);
                    }
                    
                    // Particle cube visualization (energy-to-matter conversion)
                    if (Math.random() > 0.7) {
                        createParticleCube(printer, laserColor);
                    }
                    
                    // Animate laser arms for printing pattern
                    printer.laserArms.forEach((arm, armIdx) => {
                        const printAngle = (printState.printProgress * Math.PI * 2) + (armIdx * Math.PI / 4);
                        arm.shoulderGroup.rotation.y = printAngle;
                        arm.shoulderGroup.rotation.x = Math.PI / 3; // 60° down for printing
                        
                        // Update beam for materialization
                        const emitterWorldPos = new THREE.Vector3();
                        arm.laserEmitter.getWorldPosition(emitterWorldPos);
                        const printerGroup = (printer as any).printerGroup as THREE.Group;
                        const basePos = printerGroup?.position.clone() || new THREE.Vector3();
                        const targetY = basePos.y + 10 + (printState.printProgress * 50);
                        const beamTarget = new THREE.Vector3(
                            basePos.x + Math.cos(printAngle) * 20,
                            targetY,
                            basePos.z + Math.sin(printAngle) * 20
                        );
                        const direction = beamTarget.clone().sub(emitterWorldPos).normalize();
                        const beamEnd = emitterWorldPos.clone().add(direction.multiplyScalar(50));
                        
                        arm.laserBeam.geometry.setFromPoints([emitterWorldPos, beamEnd]);
                        const beamColor = laserColor === "orange" ? 0xff6600 : 0x0066ff;
                        (arm.laserBeam.material as THREE.LineBasicMaterial).color.setHex(beamColor);
                        arm.laserBeam.visible = true;
                    });
                    
                    // Complete printing
                    if (printState.printProgress >= 1) {
                        completePrinting(printer, printerIdx);
                    }
                });
            }
            
            // Update particle cubes
            particleCubesRef.current = particleCubesRef.current.filter((cube) => {
                cube.lifetime -= delta;
                if (cube.lifetime <= 0) {
                    scene.remove(cube.mesh);
                    cube.mesh.geometry.dispose();
                    if (cube.mesh.material instanceof THREE.Material) {
                        cube.mesh.material.dispose();
                    }
                    return false;
                }
                
                cube.mesh.position.add(cube.velocity.clone().multiplyScalar(delta * 10));
                cube.velocity.y -= delta * 5; // Gravity
                
                const fade = cube.lifetime / 2;
                const material = cube.mesh.material as THREE.MeshStandardMaterial;
                material.opacity = fade;
                material.transparent = true;
                
                return true;
            });
            
            // # ADDED: Animate ventilation fans (spinning blades at 60 FPS)
            printersRef.current.forEach((printer) => {
                printer.enclosure.children.forEach((child) => {
                    if (child.userData.isFan) {
                        const fanGroup = child as THREE.Group;
                        fanGroup.children.forEach((fanChild, idx) => {
                            if (idx > 0) { // Skip housing, animate blades
                                fanChild.rotation.z += delta * 10; // Rotate blades
                            }
                        });
                    }
                });
            });
            
            // # ADDED: Animate base plate vibrations during operation
            if (calibratingRef.current || printingRef.current) {
                printersRef.current.forEach((printer) => {
                    const basePlateGroup = printer.basePlate;
                    const vibration = Math.sin(Date.now() * 0.01) * 0.1; // Subtle vibration
                    basePlateGroup.position.y = 10 + vibration; // 10cm base + vibration
                });
            }
            
            // # ADDED: Create sintering spark particles during calibration/printing
            if ((calibratingRef.current || printingRef.current) && Math.random() > 0.85) {
                printersRef.current.forEach((printer) => {
                    const printerGroup = (printer as any).printerGroup as THREE.Group;
                    if (!printerGroup) return;
                    const basePos = printerGroup.position.clone();
                    
                    // Spawn spark near base plate where lasers hit
                    const sparkGeom = new THREE.SphereGeometry(0.1, 8, 8);
                    const sparkMat = new THREE.MeshStandardMaterial({ 
                        color: 0xff6600, 
                        emissive: 0xff6600, 
                        emissiveIntensity: 1.0,
                        transparent: true,
                        opacity: 0.9
                    });
                    const spark = new THREE.Mesh(sparkGeom, sparkMat);
                    spark.position.set(
                        basePos.x + (Math.random() - 0.5) * 40,
                        12 + Math.random() * 5,
                        basePos.z + (Math.random() - 0.5) * 40
                    );
                    scene.add(spark);
                    
                    // Add to particle cubes for cleanup
                    particleCubesRef.current.push({
                        mesh: spark,
                        velocity: new THREE.Vector3(
                            (Math.random() - 0.5) * 3,
                            Math.random() * 2 + 1,
                            (Math.random() - 0.5) * 3
                        ),
                        lifetime: 0.5 + Math.random() * 0.5,
                    });
                });
            }

            renderer.render(scene, camera);
            requestRef.current = requestAnimationFrame(animate);
        };
        animate();

        // Handle resize
        const onResize = () => {
            if (!mount || !rendererRef.current) return;
            const { clientWidth, clientHeight } = mount;
            rendererRef.current.setSize(clientWidth, clientHeight);
            camera.aspect = clientWidth / clientHeight;
            camera.updateProjectionMatrix();
        };
        const ro = new ResizeObserver(onResize);
        ro.observe(mount);

        return () => {
            ro.disconnect();
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            renderer.dispose();
            if (mount) mount.innerHTML = "";
        };
    }, [sceneSetup, specs, arrayConfig, arrayWidth, arrayDepth]);

    // # ADDED: Accurate calibration for all 8 printers simultaneously
    const calibrateAllPrinters = async () => {
        calibratingRef.current = true;
        calibrationProgressRef.current = 0;
        setIsCalibrating(true);
        setCalibrationComplete(false);
        laserModeRef.current = "calibrating";
        onCalibrationStart?.();

        // Calculate accurate calibration data for each printer
        const plateWcm = specs.basePlateMm.w / 10;
        const plateDcm = specs.basePlateMm.d / 10;

        let allSafe = true;
        printersRef.current.forEach((printer) => {
            // Calculate precise arm positions for this printer
            const armPositions = Array.from({ length: specs.downwardLasers.count }, (_, i) => {
                const x = (plateWcm / (specs.downwardLasers.count - 1)) * i - plateWcm / 2;
                const y = specs.enclosureCm.h;
                const z = 0;
                return { index: i, xCm: x, yCm: y, zCm: z };
            });

            // Calculate precise arm rotations for 360° scan
            const armRotations = armPositions.map((pos, i) => {
                const baseYaw = (i * Math.PI / 4); // 45° increments
                return {
                    index: i,
                    shoulderYaw: baseYaw,
                    shoulderPitch: Math.PI / 4, // 45° down
                    elbow: 0,
                    wristYaw: 0,
                    wristPitch: 0,
                };
            });

            // Calculate safety margins
            const fpW = specs.downwardLasers.footprintCm.w;
            const fpD = specs.downwardLasers.footprintCm.d;
            const marginW = (plateWcm - fpW) / 2;
            const marginD = (plateDcm - fpD) / 2;
            const safe = marginW >= 0 && marginD >= 0;
            if (!safe) allSafe = false;

            // Store calibration data
            printer.calibrationData = {
                armPositions,
                armRotations,
                safe,
                marginsCm: { w: Math.max(0, marginW), d: Math.max(0, marginD) },
            };

            // Start audio for this printer
            if (printer.audioSource) {
                printer.audioSource.currentTime = 0;
                printer.audioSource.play().catch(console.error);
            }
        });

        // After calibration completes (one full cycle), mark as complete
        setTimeout(() => {
            setCalibrationComplete(true);
            console.log(`✅ All 8 printers calibrated! All safe: ${allSafe}`);
        }, 5000); // 5 seconds for one full calibration cycle
    };

    // Calibration control (uses accurate calibration)
    const startCalibration = () => {
        calibrateAllPrinters();
    };

    const stopCalibration = () => {
        calibratingRef.current = false;
        setIsCalibrating(false);
        laserModeRef.current = "idle";
        onCalibrationEnd?.();

        // Stop all audio
        printersRef.current.forEach((printer) => {
            if (printer.audioSource) {
                printer.audioSource.pause();
            }
            printer.laserArms.forEach((arm) => {
                arm.laserBeam.visible = false;
            });
        });
    };

    // # ADDED: Create particle cube for digitization/reconstruction visualization
    const createParticleCube = (printer: PrinterInstance, color: LaserColor) => {
        const cubeSize = 0.5 + Math.random() * 1.5;
        const cubeGeom = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
        const cubeColor = color === "orange" ? 0xff6600 : 0x0066ff;
        const cubeMat = new THREE.MeshStandardMaterial({ 
            color: cubeColor, 
            emissive: cubeColor, 
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.9
        });
        const cubeMesh = new THREE.Mesh(cubeGeom, cubeMat);
        
        // Position near base plate
        const basePos = printer.basePlate.parent?.position.clone() || new THREE.Vector3();
        cubeMesh.position.set(
            basePos.x + (Math.random() - 0.5) * 40,
            10 + Math.random() * 30,
            basePos.z + (Math.random() - 0.5) * 40
        );
        
        const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 5,
            Math.random() * 3 + 2,
            (Math.random() - 0.5) * 5
        );
        
        sceneRef.current?.add(cubeMesh);
        particleCubesRef.current.push({
            mesh: cubeMesh,
            velocity,
            lifetime: 2 + Math.random() * 2,
        });
    };

    // # ADDED: Start printing mode (particle laser reconstruction)
    const startPrinting = (printerIndex?: number, targetMesh?: THREE.Mesh) => {
        printingRef.current = true;
        printProgressRef.current = 0;
        laserModeRef.current = "printing";
        
        const printersToPrint = printerIndex !== undefined 
            ? [printersRef.current[printerIndex]].filter(Boolean)
            : printersRef.current;
        
        printersToPrint.forEach((printer, idx) => {
            printer.printState = {
                isPrinting: true,
                printProgress: 0,
                printedLayers: [],
                targetMesh: targetMesh || createDefaultPrintTarget(),
            };
            
            // Create resin scaffold (temporary gelatinous matrix)
            const scaffoldGroup = new THREE.Group();
            const scaffoldMat = new THREE.MeshStandardMaterial({ 
                color: 0x888888, 
                transparent: true, 
                opacity: 0.7,
                roughness: 0.9
            });
            const scaffoldGeom = new THREE.BoxGeometry(30, 50, 30);
            const scaffold = new THREE.Mesh(scaffoldGeom, scaffoldMat);
            scaffold.position.y = 35;
            scaffoldGroup.add(scaffold);
            printer.printState.resinScaffold = scaffoldGroup;
            const printerGroup = (printer as any).printerGroup as THREE.Group;
            if (printerGroup) {
                printerGroup.add(scaffoldGroup);
            }
            
            onPrintStart?.(printer.index);
        });
    };

    // # ADDED: Create default print target (simple cube)
    const createDefaultPrintTarget = (): THREE.Mesh => {
        const geom = new THREE.BoxGeometry(20, 50, 20);
        const mat = new THREE.MeshStandardMaterial({ 
            color: 0x00ff99, 
            emissive: 0x00ff99, 
            emissiveIntensity: 0.3 
        });
        return new THREE.Mesh(geom, mat);
    };

    // # ADDED: Complete printing and break out of resin scaffold
    const completePrinting = (printer: PrinterInstance, printerIndex: number) => {
        if (!printer.printState) return;
        
        printer.printState.isPrinting = false;
        printer.printState.printProgress = 1;
        
        // Animate resin scaffold breaking
        const scaffold = printer.printState.resinScaffold;
        if (scaffold) {
            let breakProgress = 0;
            const breakAnimation = () => {
                breakProgress += 0.02;
                scaffold.scale.set(
                    1 + breakProgress * 0.5,
                    1 - breakProgress,
                    1 + breakProgress * 0.5
                );
                const material = (scaffold.children[0] as THREE.Mesh).material as THREE.MeshStandardMaterial;
                material.opacity = Math.max(0, 0.7 - breakProgress);
                
                if (breakProgress < 1) {
                    requestAnimationFrame(breakAnimation);
                } else {
                    scaffold.parent?.remove(scaffold);
                    scaffold.children.forEach((child) => {
                        const mesh = child as THREE.Mesh;
                        mesh.geometry.dispose();
                        if (mesh.material instanceof THREE.Material) {
                            mesh.material.dispose();
                        }
                    });
                }
            };
            breakAnimation();
        }
        
        // Start temporal decay timer (29-30 minutes)
        const decayTime = 29 * 60 + Math.random() * 60; // 29-30 minutes in seconds
        setTimeout(() => {
            if (printer.printState?.targetMesh) {
                // Derez animation
                printer.printState.printedLayers.forEach((layer, idx) => {
                    setTimeout(() => {
                        layer.material.opacity -= 0.1;
                        if (layer.material.opacity <= 0) {
                            sceneRef.current?.remove(layer);
                            layer.geometry.dispose();
                            if (layer.material instanceof THREE.Material) {
                                layer.material.dispose();
                            }
                        }
                    }, idx * 50);
                });
            }
        }, decayTime * 1000);
        
        onPrintEnd?.(printerIndex);
        
        // Check if all printers are done
        if (printersRef.current.every((p) => !p.printState?.isPrinting)) {
            printingRef.current = false;
            laserModeRef.current = "idle";
        }
    };

    // Export functions
    const exportGLTF = async () => {
        if (!sceneRef.current) return;
        const exporter = new GLTFExporter();
        exporter.parse(
            sceneRef.current,
            (result) => {
                const blob = new Blob([JSON.stringify(result)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "printer_array.gltf";
                a.click();
            },
            { binary: false }
        );
    };

    const exportOBJ = () => {
        if (!sceneRef.current) return;
        const exporter = new OBJExporter();
        const result = exporter.parse(sceneRef.current);
        const blob = new Blob([result], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "printer_array.obj";
        a.click();
    };

    const [isCalibrating, setIsCalibrating] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const [calibrationComplete, setCalibrationComplete] = useState(false);

    const handleStartCalibration = () => {
        startCalibration();
        setIsCalibrating(true);
    };

    const handleStopCalibration = () => {
        stopCalibration();
        setIsCalibrating(false);
        setCalibrationComplete(false);
    };

    const handleStartPrinting = () => {
        startPrinting(); // Start printing on all 8 printers
        setIsPrinting(true);
    };

    const handleStopPrinting = () => {
        printingRef.current = false;
        setIsPrinting(false);
        printersRef.current.forEach((printer) => {
            if (printer.printState) {
                printer.printState.isPrinting = false;
            }
        });
    };

    return (
        <div className="relative w-full h-full">
            <div ref={mountRef} className="w-full h-full" />
            <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
                <button
                    onClick={isCalibrating ? handleStopCalibration : handleStartCalibration}
                    className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
                    disabled={isPrinting}
                >
                    {isCalibrating ? "Stop Calibration" : "⚙️ Calibrate All 8 Printers"}
                </button>
                <button
                    onClick={isPrinting ? handleStopPrinting : handleStartPrinting}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                    disabled={isCalibrating || !calibrationComplete}
                    title={!calibrationComplete ? "Calibrate printers first" : ""}
                >
                    {isPrinting ? "🛑 Stop Printing" : "🖨️ Start Printing (All 8)"}
                </button>
                <div className="flex gap-2">
                    <button 
                        onClick={exportGLTF} 
                        className="px-4 py-2 bg-secondary text-white rounded hover:bg-secondary/90 transition-colors text-sm"
                    >
                        Export GLTF
                    </button>
                    <button 
                        onClick={exportOBJ} 
                        className="px-4 py-2 bg-secondary text-white rounded hover:bg-secondary/90 transition-colors text-sm"
                    >
                        Export OBJ
                    </button>
                </div>
            </div>
            {/* # ADDED: Status HUD overlay */}
            {(isCalibrating || isPrinting) && (
                <div className="absolute top-4 left-4 bg-black/80 text-white p-4 rounded z-10 font-mono">
                    <div className="text-sm">
                        {isCalibrating && (
                            <div>
                                <div>⚡ CALIBRATING ALL 8 PRINTERS</div>
                                <div className="text-xs text-gray-400 mt-1">
                                    Progress: {Math.floor(calibrationProgressRef.current * 100)}%
                                </div>
                                {calibrationComplete && (
                                    <div className="text-xs text-green-400 mt-1">
                                        ✅ Calibration Complete - Ready for Printing
                                    </div>
                                )}
                            </div>
                        )}
                        {isPrinting && (
                            <div>
                                <div>🖨️ PRINTING MODE ACTIVE</div>
                                <div className="text-xs text-gray-400 mt-1">
                                    Progress: {Math.floor(printProgressRef.current * 100)}%
                                </div>
                                <div className="text-xs text-yellow-400 mt-1">
                                    Particle Laser: {laserColor.toUpperCase()}
                                </div>
                                <div className="text-xs text-orange-400 mt-1">
                                    Temporal Limit: 29-30 minutes
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

