import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
// # ADDED: Import laser printer sound effects
import laserPrinterOne from "./sound_effects/laser-printerone_loop.mp3";
import laserPrinterTwo from "./sound_effects/laser-printertwo_loop.mp3";
import laserPrinterThree from "./sound_effects/laser-printerthree_loop.mp3";
import laserPrinterFour from "./sound_effects/laser-printerfour_loop.mp3";
import laserPrinterFive from "./sound_effects/laser-printerfive_loop.mp3";
import laserPrinterSix from "./sound_effects/laser-printersix_loop.mp3";
import laserPrinterSeven from "./sound_effects/laser-printerseven_loop.mp3";
import laserPrinterEight from "./sound_effects/laser-printereight_loop.mp3";

export type PrinterSpecs = {
    enclosureCm: { w: number; h: number; d: number };
    basePlateMm: { w: number; d: number; h: number };
    downwardLasers: { count: 8; footprintCm: { w: number; d: number; h: number } };
    roofSphere: { grid: [9, 9, 9]; singleEmitterSizeCm: { w: number; h: number; d: number } };
};

export type Calibration = {
    ok: true;
    safe: boolean;
    plateWcm: number;
    plateDcm: number;
    marginsCm: { w: number; d: number };
    downwardArray: { index: number; xCm: number; yCm: number; zCm: number }[];
    // # ADDED: Arm rotation data for calibration
    armRotations?: { index: number; shoulderYaw: number; shoulderPitch: number; elbow: number; wristYaw: number; wristPitch: number }[];
};

// # ADDED: Laser arm structure with joints
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

export function PrinterViewer({ specs, calibration }: { specs: PrinterSpecs; calibration?: Calibration }) {
    const mountRef = useRef<HTMLDivElement | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const requestRef = useRef<number | null>(null);
    const laserArmsRef = useRef<LaserArm[]>([]);
    const roofEmittersRef = useRef<THREE.Group[]>([]);
    const calibratingRef = useRef(false);
    const calibrationProgressRef = useRef(0);
    // # ADDED: Audio references for each laser printer (1-8)
    const audioRefsRef = useRef<(HTMLAudioElement | null)[]>([]);

    const sceneSetup = useMemo(() => {
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0b0e14);

        const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 2000);
        camera.position.set(0, specs.enclosureCm.h, specs.enclosureCm.d * 1.5);
        camera.lookAt(0, 0, 0);

        const light = new THREE.DirectionalLight(0xffffff, 1.0);
        light.position.set(50, 100, 50);
        scene.add(light);

        const ambient = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambient);

        return { scene, camera };
    }, [specs]);

    useEffect(() => {
        if (!mountRef.current) return;
        const mount = mountRef.current;

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(mount.clientWidth, mount.clientHeight);
        mount.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        const onResize = () => {
            const { clientWidth, clientHeight } = mount;
            renderer.setSize(clientWidth, clientHeight);
        };
        const ro = new ResizeObserver(onResize);
        ro.observe(mount);

        let lastTime = Date.now();
        const animate = () => {
            if (!rendererRef.current) return;
            // Update arm rotations if calibrating
            if (calibratingRef.current) {
                const now = Date.now();
                const delta = (now - lastTime) / 1000; // seconds
                lastTime = now;
                
                calibrationProgressRef.current += delta * 0.2; // Slow rotation
                if (calibrationProgressRef.current >= 1) {
                    calibrationProgressRef.current = 0;
                }
                
                const progress = calibrationProgressRef.current;
                const plateSize = 90; // 900mm = 90cm plate

                laserArmsRef.current.forEach((arm, idx) => {
                    // Full 360° rotation
                    const yawAngle = (progress * Math.PI * 2) + (idx * Math.PI / 4);
                    arm.shoulderGroup.rotation.y = yawAngle;
                    
                    // Pitch down to plate (45°)
                    arm.shoulderGroup.rotation.x = Math.PI / 4;
                    
                    // Elbow fine adjustments
                    arm.elbowGroup.rotation.x = Math.sin(progress * 2 + idx) * 0.3;
                    
                    // Wrist adjustments for beam direction
                    arm.wristGroup.rotation.x = Math.cos(progress * 3 + idx) * 0.2;
                    arm.wristGroup.rotation.z = Math.sin(progress * 2.5 + idx) * 0.3;

                    // Update beam to point at plate scanning position
                    const emitterWorldPos = new THREE.Vector3();
                    arm.laserEmitter.getWorldPosition(emitterWorldPos);
                    const scanRadius = plateSize * 0.4;
                    const beamTargetX = Math.cos(yawAngle) * scanRadius;
                    const beamTargetZ = Math.sin(yawAngle) * scanRadius;
                    const beamTarget = new THREE.Vector3(beamTargetX, 0, beamTargetZ);
                    const direction = beamTarget.clone().sub(emitterWorldPos).normalize();
                    const beamEnd = emitterWorldPos.clone().add(direction.multiplyScalar(50));
                    arm.laserBeam.geometry.setFromPoints([emitterWorldPos, beamEnd]);
                });

                // Roof emitters - full 360° rotation
                roofEmittersRef.current.forEach((emitter, idx) => {
                    emitter.rotation.y = (progress * Math.PI * 2) + (idx * 0.1);
                    const emitterArm = emitter.children[1] as THREE.Group;
                    if (emitterArm) {
                        // Point down at plate (30° from horizontal)
                        emitterArm.rotation.z = Math.PI / 2 - Math.PI / 6;
                    }
                });
            }
            rendererRef.current.render(sceneSetup.scene, sceneSetup.camera);
            requestRef.current = requestAnimationFrame(animate);
        };
        animate();

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            ro.disconnect();
            renderer.dispose();
            mount.removeChild(renderer.domElement);
        };
    }, [sceneSetup]);

    // Build scene contents on specs/calibration change
    useEffect(() => {
        const renderer = rendererRef.current;
        if (!renderer) return;
        const { scene } = sceneSetup;

        // Clear existing
        while (scene.children.length > 0) {
            const child = scene.children.pop()!;
            if ((child as any).dispose) (child as any).dispose();
        }

        // Lights
        const light = new THREE.DirectionalLight(0xffffff, 1.0);
        light.position.set(50, 100, 50);
        scene.add(light);
        const ambient = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambient);

        // Axes helper
        scene.add(new THREE.AxesHelper(50));

        // # UPDATED: Detailed machinery models
        
        // Enclosure dimensions
        const encW = specs.enclosureCm.w;
        const encH = specs.enclosureCm.h;
        const encD = specs.enclosureCm.d;
        
        // # ADDED: Structural frame/support columns (4 corners)
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x4a5568, metalness: 0.9, roughness: 0.1 });
        const frameWidth = 2; // 2cm thick columns
        const frameGroup = new THREE.Group();
        
        const corners = [
            { x: -encW / 2 + frameWidth / 2, z: -encD / 2 + frameWidth / 2 },
            { x: encW / 2 - frameWidth / 2, z: -encD / 2 + frameWidth / 2 },
            { x: encW / 2 - frameWidth / 2, z: encD / 2 - frameWidth / 2 },
            { x: -encW / 2 + frameWidth / 2, z: encD / 2 - frameWidth / 2 },
        ];
        
        corners.forEach((corner) => {
            const column = new THREE.Mesh(
                new THREE.BoxGeometry(frameWidth, encH, frameWidth),
                frameMat
            );
            column.position.set(corner.x, encH / 2, corner.z);
            frameGroup.add(column);
        });
        
        // # ADDED: Horizontal frame beams (top and bottom)
        const beamHeight = 1.5;
        const topBeam = new THREE.Mesh(
            new THREE.BoxGeometry(encW - frameWidth, beamHeight, encD - frameWidth),
            frameMat
        );
        topBeam.position.set(0, encH - beamHeight / 2, 0);
        frameGroup.add(topBeam);
        
        const bottomBeam = new THREE.Mesh(
            new THREE.BoxGeometry(encW - frameWidth, beamHeight, encD - frameWidth),
            frameMat
        );
        bottomBeam.position.set(0, beamHeight / 2, 0);
        frameGroup.add(bottomBeam);
        
        scene.add(frameGroup);
        
        // # ADDED: Side panels (clear material to show internals)
        const panelMat = new THREE.MeshStandardMaterial({ 
            color: 0x2d3748, 
            metalness: 0.3, 
            roughness: 0.7,
            transparent: true,
            opacity: 0.3
        });
        const panelThickness = 0.5;
        
        // Front panel
        const frontPanel = new THREE.Mesh(
            new THREE.BoxGeometry(encW, encH, panelThickness),
            panelMat
        );
        frontPanel.position.set(0, encH / 2, encD / 2 - panelThickness / 2);
        scene.add(frontPanel);
        
        // Back panel
        const backPanel = new THREE.Mesh(
            new THREE.BoxGeometry(encW, encH, panelThickness),
            panelMat
        );
        backPanel.position.set(0, encH / 2, -encD / 2 + panelThickness / 2);
        scene.add(backPanel);
        
        // Side panels
        const leftPanel = new THREE.Mesh(
            new THREE.BoxGeometry(panelThickness, encH, encD),
            panelMat
        );
        leftPanel.position.set(-encW / 2 + panelThickness / 2, encH / 2, 0);
        scene.add(leftPanel);
        
        const rightPanel = new THREE.Mesh(
            new THREE.BoxGeometry(panelThickness, encH, encD),
            panelMat
        );
        rightPanel.position.set(encW / 2 - panelThickness / 2, encH / 2, 0);
        scene.add(rightPanel);
        
        // # ADDED: Roof panel with mounting points
        const roofPanel = new THREE.Mesh(
            new THREE.BoxGeometry(encW, 2, encD),
            new THREE.MeshStandardMaterial({ color: 0x1a202c, metalness: 0.8, roughness: 0.2 })
        );
        roofPanel.position.set(0, encH - 1, 0);
        scene.add(roofPanel);
        
        // # UPDATED: Base plate - detailed with mounting hardware
        const plateW = specs.basePlateMm.w / 10;
        const plateD = specs.basePlateMm.d / 10;
        const plateH = specs.basePlateMm.h / 10; // Use actual height from specs
        
        // Main base plate (900x900x900 mm = 90x90x90 cm)
        const plateGeom = new THREE.BoxGeometry(plateW, plateH, plateD);
        const plateMat = new THREE.MeshStandardMaterial({ 
            color: 0x718096, 
            metalness: 0.95, 
            roughness: 0.1,
            envMapIntensity: 1.0
        });
        const plate = new THREE.Mesh(plateGeom, plateMat);
        plate.position.set(0, plateH / 2, 0);
        scene.add(plate);
        
        // # ADDED: Base plate mounting bolts/corners
        const boltMat = new THREE.MeshStandardMaterial({ color: 0x4a5568, metalness: 0.9, roughness: 0.2 });
        const boltRadius = 1.5;
        const boltHeight = 3;
        const boltGeom = new THREE.CylinderGeometry(boltRadius, boltRadius, boltHeight, 16);
        
        const plateCorners = [
            { x: -plateW / 2 + 5, z: -plateD / 2 + 5 },
            { x: plateW / 2 - 5, z: -plateD / 2 + 5 },
            { x: plateW / 2 - 5, z: plateD / 2 - 5 },
            { x: -plateW / 2 + 5, z: plateD / 2 - 5 },
        ];
        
        plateCorners.forEach((corner) => {
            const bolt = new THREE.Mesh(boltGeom, boltMat);
            bolt.rotation.x = Math.PI / 2;
            bolt.position.set(corner.x, plateH + boltHeight / 2, corner.z);
            scene.add(bolt);
        });
        
        // # ADDED: Base plate surface texture/grating pattern
        const gratingGroup = new THREE.Group();
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
            line.position.set(x, plateH + 0.15, 0);
            gratingGroup.add(line);
        }
        
        for (let z = -plateD / 2; z <= plateD / 2; z += gratingSpacing) {
            const line = new THREE.Mesh(
                new THREE.BoxGeometry(plateW, 0.3, 0.2),
                gratingMat
            );
            line.position.set(0, plateH + 0.15, z);
            gratingGroup.add(line);
        }
        
        scene.add(gratingGroup);
        
        // # ADDED: Support rails for laser arm mounts
        const railMat = new THREE.MeshStandardMaterial({ color: 0x2d3748, metalness: 0.9, roughness: 0.1 });
        const railWidth = 3;
        const railHeight = 2;
        
        // Mounting rails on roof
        for (let i = 0; i < 3; i++) {
            const railZ = -encD / 2 + (encD / 2) * i;
            const rail = new THREE.Mesh(
                new THREE.BoxGeometry(encW - 10, railHeight, railWidth),
                railMat
            );
            rail.position.set(0, encH - railHeight / 2 - 2, railZ);
            scene.add(rail);
        }

        // # ADDED: Create rotatable laser arms with joints for 8 downward lasers
        const count = 8;
        const positions = calibration?.downwardArray ?? Array.from({ length: count }, (_, i) => {
            const x = (plateW / (count - 1)) * i - plateW / 2;
            const y = encH;
            const z = 0;
            return { index: i, xCm: x, yCm: y, zCm: z };
        });

        laserArmsRef.current = [];
        const armGroup = new THREE.Group();
        const armMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.9, roughness: 0.1 });
        const jointMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8, roughness: 0.2 });
        const laserBeamMat = new THREE.LineBasicMaterial({ color: 0xff0033, linewidth: 2 });

        positions.forEach((p, idx) => {
            // Create arm structure: shoulder -> upper arm -> elbow -> lower arm -> wrist -> laser emitter
            const arm: Partial<LaserArm> = {};
            
            // Base mount position at roof
            const baseX = p.xCm;
            const baseY = p.yCm;
            const baseZ = p.zCm;
            arm.basePosition = new THREE.Vector3(baseX, baseY, baseZ);
            
            // Use idx to ensure each arm has unique positioning (satisfies noUnusedLocals)
            void idx;

            // Shoulder joint (can rotate Y and pitch)
            arm.shoulderGroup = new THREE.Group();
            arm.shoulderGroup.position.set(baseX, baseY, baseZ);
            
            // # UPDATED: Detailed shoulder joint with mounting bracket
            const mountBracket = new THREE.Mesh(
                new THREE.BoxGeometry(4, 3, 4),
                new THREE.MeshStandardMaterial({ color: 0x2d3748, metalness: 0.9, roughness: 0.1 })
            );
            mountBracket.position.set(0, 1.5, 0);
            arm.shoulderGroup.add(mountBracket);
            
            const shoulderJoint = new THREE.Mesh(new THREE.SphereGeometry(2.5, 16, 16), jointMat);
            arm.shoulderGroup.add(shoulderJoint);
            
            // # ADDED: Shoulder servo motor housing
            const servoHousing = new THREE.Mesh(
                new THREE.BoxGeometry(3.5, 2, 3.5),
                new THREE.MeshStandardMaterial({ color: 0x1a202c, metalness: 0.8, roughness: 0.3 })
            );
            servoHousing.position.set(0, -1, 0);
            arm.shoulderGroup.add(servoHousing);

            // # UPDATED: Upper arm with more detail
            const upperArmLen = encH * 0.4; // 40% of enclosure height
            // Main arm segment
            arm.upperArm = new THREE.Mesh(
                new THREE.CylinderGeometry(1.8, 2.2, upperArmLen, 16),
                armMat
            );
            arm.upperArm.rotation.z = Math.PI / 2;
            arm.upperArm.position.y = -upperArmLen / 2;
            arm.shoulderGroup.add(arm.upperArm);
            
            // # ADDED: Arm segment joints/couplings
            const coupling1 = new THREE.Mesh(
                new THREE.CylinderGeometry(2.5, 2.5, 1.5, 16),
                jointMat
            );
            coupling1.rotation.z = Math.PI / 2;
            coupling1.position.y = -upperArmLen * 0.3;
            arm.shoulderGroup.add(coupling1);
            
            const coupling2 = new THREE.Mesh(
                new THREE.CylinderGeometry(2.2, 2.2, 1.5, 16),
                jointMat
            );
            coupling2.rotation.z = Math.PI / 2;
            coupling2.position.y = -upperArmLen * 0.7;
            arm.shoulderGroup.add(coupling2);

            // # UPDATED: Detailed elbow joint with servo
            arm.elbowGroup = new THREE.Group();
            arm.elbowGroup.position.set(0, -upperArmLen, 0);
            
            const elbowServo = new THREE.Mesh(
                new THREE.BoxGeometry(3, 2.5, 3),
                new THREE.MeshStandardMaterial({ color: 0x1a202c, metalness: 0.8, roughness: 0.3 })
            );
            arm.elbowGroup.add(elbowServo);
            
            const elbowJoint = new THREE.Mesh(new THREE.SphereGeometry(2, 16, 16), jointMat);
            elbowJoint.position.y = -0.5;
            arm.elbowGroup.add(elbowJoint);

            // # UPDATED: Lower arm with detail
            const lowerArmLen = encH * 0.35;
            arm.lowerArm = new THREE.Mesh(
                new THREE.CylinderGeometry(1.2, 1.8, lowerArmLen, 16),
                armMat
            );
            arm.lowerArm.rotation.z = Math.PI / 2;
            arm.lowerArm.position.y = -lowerArmLen / 2 - 0.5;
            arm.elbowGroup.add(arm.lowerArm);
            
            // # ADDED: Lower arm reinforcement
            const reinforcement = new THREE.Mesh(
                new THREE.BoxGeometry(1.5, lowerArmLen * 0.8, 1.5),
                new THREE.MeshStandardMaterial({ color: 0x4a5568, metalness: 0.9, roughness: 0.2 })
            );
            reinforcement.rotation.z = Math.PI / 4;
            reinforcement.position.y = -lowerArmLen / 2 - 0.5;
            arm.elbowGroup.add(reinforcement);
            
            arm.shoulderGroup.add(arm.elbowGroup);

            // # UPDATED: Detailed wrist joint with mounting
            arm.wristGroup = new THREE.Group();
            arm.wristGroup.position.set(0, -lowerArmLen - 0.5, 0);
            
            const wristMount = new THREE.Mesh(
                new THREE.BoxGeometry(2.5, 2, 2.5),
                new THREE.MeshStandardMaterial({ color: 0x2d3748, metalness: 0.9, roughness: 0.1 })
            );
            arm.wristGroup.add(wristMount);
            
            const wristJoint = new THREE.Mesh(new THREE.SphereGeometry(1.5, 16, 16), jointMat);
            wristJoint.position.y = -1;
            arm.wristGroup.add(wristJoint);

            // # UPDATED: Detailed laser emitter head with housing
            const emitterHousing = new THREE.Mesh(
                new THREE.CylinderGeometry(2, 2, 2.5, 16),
                new THREE.MeshStandardMaterial({ color: 0x1a202c, metalness: 0.9, roughness: 0.2 })
            );
            emitterHousing.position.y = -2.75;
            arm.wristGroup.add(emitterHousing);
            
            const emitterGeom = new THREE.ConeGeometry(1.8, 4, 16);
            const emitterMat = new THREE.MeshStandardMaterial({ color: 0xff0033, emissive: 0xff0033, emissiveIntensity: 0.7 });
            arm.laserEmitter = new THREE.Mesh(emitterGeom, emitterMat);
            arm.laserEmitter.rotation.z = Math.PI;
            arm.laserEmitter.position.y = -4;
            
            // # ADDED: Laser emitter lens/focus ring
            const focusRing = new THREE.Mesh(
                new THREE.TorusGeometry(1.5, 0.2, 8, 16),
                new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.95, roughness: 0.05 })
            );
            focusRing.rotation.x = Math.PI / 2;
            focusRing.position.y = -5.8;
            arm.wristGroup.add(focusRing);
            
            arm.wristGroup.add(arm.laserEmitter);
            arm.elbowGroup.add(arm.wristGroup);

            // Laser beam (initially pointing down)
            const beamPoints = [
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0, -50, 0) // Extend down 50cm
            ];
            const beamGeom = new THREE.BufferGeometry().setFromPoints(beamPoints);
            arm.laserBeam = new THREE.Line(beamGeom, laserBeamMat);
            arm.wristGroup.add(arm.laserBeam);

            armGroup.add(arm.shoulderGroup);
            laserArmsRef.current.push(arm as LaserArm);
        });
        scene.add(armGroup);

        // # UPDATED: Roof sphere lattice with detailed rotatable emitter arms
        const sphereGroup = new THREE.Group();
        const [gx, gy, gz] = [9, 9, 9];
        void gy;
        const emitter = specs.roofSphere.singleEmitterSizeCm;
        const spacing = Math.min(encW / gx, encD / gz);
        roofEmittersRef.current = [];

        for (let x = 0; x < gx; x++) {
            for (let z = 0; z < gz; z++) {
                const emitterGroup = new THREE.Group();
                const baseX = -encW / 2 + x * spacing;
                const baseZ = -encD / 2 + z * spacing;
                emitterGroup.position.set(baseX, encH - 1, baseZ);

                // # UPDATED: Detailed rotatable mount base with servo housing
                const servoBase = new THREE.Mesh(
                    new THREE.BoxGeometry(1.5, 1.2, 1.5),
                    new THREE.MeshStandardMaterial({ color: 0x1a202c, metalness: 0.8, roughness: 0.3 })
                );
                servoBase.position.y = 0.6;
                emitterGroup.add(servoBase);
                
                const mountBase = new THREE.Mesh(
                    new THREE.CylinderGeometry(1, 1.2, 1.5, 16),
                    jointMat
                );
                emitterGroup.add(mountBase);

                // # UPDATED: Detailed rotatable arm assembly
                const emitterArm = new THREE.Group();
                const armLen = 4;
                
                // Main arm segment
                const armCylinder = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.4, 0.5, armLen, 12),
                    armMat
                );
                armCylinder.rotation.z = Math.PI / 2;
                armCylinder.position.x = armLen / 2;
                emitterArm.add(armCylinder);
                
                // # ADDED: Arm joint/bracket
                const armBracket = new THREE.Mesh(
                    new THREE.BoxGeometry(0.8, 0.8, 0.8),
                    new THREE.MeshStandardMaterial({ color: 0x4a5568, metalness: 0.9, roughness: 0.2 })
                );
                armBracket.position.x = armLen;
                emitterArm.add(armBracket);

                // # UPDATED: Detailed laser emitter at end
                const emitterHousing = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.8, 0.8, 1.5, 12),
                    new THREE.MeshStandardMaterial({ color: 0x2d3748, metalness: 0.9, roughness: 0.2 })
                );
                emitterHousing.position.x = armLen;
                emitterHousing.rotation.z = Math.PI / 2;
                emitterArm.add(emitterHousing);
                
                const emitterDot = new THREE.Mesh(
                    new THREE.SphereGeometry(Math.max(0.15, Math.min(emitter.w, emitter.h, emitter.d) * 0.04), 16, 16),
                    new THREE.MeshStandardMaterial({ color: 0xffd166, emissive: 0xffd166, emissiveIntensity: 0.5 })
                );
                emitterDot.position.x = armLen + 1;
                emitterArm.add(emitterDot);
                
                // # ADDED: Emitter lens
                const emitterLens = new THREE.Mesh(
                    new THREE.SphereGeometry(0.2, 12, 12),
                    new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 })
                );
                emitterLens.position.x = armLen + 1.3;
                emitterArm.add(emitterLens);

                // # UPDATED: Laser beam from emitter (more visible)
                const beamPoints = [
                    new THREE.Vector3(armLen + 1, 0, 0),
                    new THREE.Vector3(armLen + 15, 0, 0)
                ];
                const beamGeom = new THREE.BufferGeometry().setFromPoints(beamPoints);
                const emitterBeam = new THREE.Line(beamGeom, new THREE.LineBasicMaterial({ color: 0xffd166, linewidth: 2 }));
                emitterArm.add(emitterBeam);

                emitterGroup.add(emitterArm);
                sphereGroup.add(emitterGroup);
                roofEmittersRef.current.push(emitterGroup);
            }
        }
        scene.add(sphereGroup);
        
        // # ADDED: Control panel/interface box
        const controlBox = new THREE.Mesh(
            new THREE.BoxGeometry(15, 10, 5),
            new THREE.MeshStandardMaterial({ color: 0x1a202c, metalness: 0.7, roughness: 0.4 })
        );
        controlBox.position.set(encW / 2 - 10, encH / 2, -encD / 2 + 3);
        scene.add(controlBox);
        
        // # ADDED: Display screen on control box
        const screen = new THREE.Mesh(
            new THREE.PlaneGeometry(8, 6),
            new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x001100, emissiveIntensity: 0.3 })
        );
        screen.position.set(0, 1, 2.6);
        controlBox.add(screen);
        
        // # ADDED: Ventilation fans
        const fanMat = new THREE.MeshStandardMaterial({ color: 0x4a5568, metalness: 0.8, roughness: 0.3 });
        for (let i = 0; i < 2; i++) {
            const fan = new THREE.Mesh(
                new THREE.CylinderGeometry(3, 3, 1, 16),
                fanMat
            );
            fan.rotation.x = Math.PI / 2;
            fan.position.set(-encW / 2 + 5, encH - 5, -encD / 2 + 10 + i * 20);
            scene.add(fan);
        }

        // # ADDED: Calibration animation - scan the 900x900x900 plate
        if (calibration) {
            calibratingRef.current = true;
            calibrationProgressRef.current = 0;
        }
    }, [specs, calibration, sceneSetup]);

    // # ADDED: Initialize audio players for each laser printer (1-8)
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

        audioRefsRef.current = soundFiles.map((soundFile) => {
            const audio = new Audio(soundFile);
            audio.loop = true;
            audio.volume = 0.3; // Set volume to 30% to avoid being too loud
            return audio;
        });

        return () => {
            // Cleanup: stop and remove all audio players
            audioRefsRef.current.forEach((audio) => {
                if (audio) {
                    audio.pause();
                    audio.src = "";
                }
            });
            audioRefsRef.current = [];
        };
    }, []);

    // # ADDED: Start calibration animation and sound effects when calibration data is provided
    useEffect(() => {
        if (calibration) {
            calibratingRef.current = true;
            calibrationProgressRef.current = 0;
            
            // # ADDED: Start playing sound effects for each laser printer
            audioRefsRef.current.forEach((audio, idx) => {
                if (audio) {
                    audio.currentTime = 0; // Reset to beginning
                    audio.play().catch((err) => {
                        console.warn(`Could not play sound for laser printer ${idx + 1}:`, err);
                    });
                }
            });
        } else {
            calibratingRef.current = false;
            
            // # ADDED: Stop all sound effects when calibration stops
            audioRefsRef.current.forEach((audio) => {
                if (audio) {
                    audio.pause();
                    audio.currentTime = 0;
                }
            });
        }

        return () => {
            // Cleanup: stop all sounds when component unmounts or calibration changes
            audioRefsRef.current.forEach((audio) => {
                if (audio) {
                    audio.pause();
                    audio.currentTime = 0;
                }
            });
        };
    }, [calibration]);

    return <div ref={mountRef} className="h-[420px] w-full rounded-md border" />;
}


