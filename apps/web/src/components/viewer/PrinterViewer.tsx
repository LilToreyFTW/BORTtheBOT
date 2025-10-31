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

        // Enclosure box (wireframe)
        const encW = specs.enclosureCm.w;
        const encH = specs.enclosureCm.h;
        const encD = specs.enclosureCm.d;
        const encGeom = new THREE.BoxGeometry(encW, encH, encD);
        const encMat = new THREE.MeshBasicMaterial({ color: 0x3a86ff, wireframe: true });
        const enc = new THREE.Mesh(encGeom, encMat);
        enc.position.set(0, encH / 2, 0);
        scene.add(enc);

        // Base plate (thin box) in cm
        const plateW = specs.basePlateMm.w / 10;
        const plateD = specs.basePlateMm.d / 10;
        const plateH = 1; // 1 cm visual thickness
        const plateGeom = new THREE.BoxGeometry(plateW, plateH, plateD);
        const plateMat = new THREE.MeshStandardMaterial({ color: 0x778da9, metalness: 0.8, roughness: 0.2 });
        const plate = new THREE.Mesh(plateGeom, plateMat);
        plate.position.set(0, plateH / 2, 0);
        scene.add(plate);

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
            
            // Shoulder joint visual
            const shoulderJoint = new THREE.Mesh(new THREE.SphereGeometry(2, 16, 16), jointMat);
            arm.shoulderGroup.add(shoulderJoint);

            // Upper arm (shoulder to elbow)
            const upperArmLen = encH * 0.4; // 40% of enclosure height
            arm.upperArm = new THREE.Mesh(
                new THREE.CylinderGeometry(1.5, 2, upperArmLen, 16),
                armMat
            );
            arm.upperArm.rotation.z = Math.PI / 2; // Rotate to horizontal
            arm.upperArm.position.y = -upperArmLen / 2;
            arm.shoulderGroup.add(arm.upperArm);

            // Elbow joint
            arm.elbowGroup = new THREE.Group();
            arm.elbowGroup.position.set(0, -upperArmLen, 0);
            const elbowJoint = new THREE.Mesh(new THREE.SphereGeometry(1.5, 16, 16), jointMat);
            arm.elbowGroup.add(elbowJoint);

            // Lower arm (elbow to wrist)
            const lowerArmLen = encH * 0.35;
            arm.lowerArm = new THREE.Mesh(
                new THREE.CylinderGeometry(1, 1.5, lowerArmLen, 16),
                armMat
            );
            arm.lowerArm.rotation.z = Math.PI / 2;
            arm.lowerArm.position.y = -lowerArmLen / 2;
            arm.elbowGroup.add(arm.lowerArm);
            arm.shoulderGroup.add(arm.elbowGroup);

            // Wrist joint
            arm.wristGroup = new THREE.Group();
            arm.wristGroup.position.set(0, -lowerArmLen, 0);
            const wristJoint = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 16), jointMat);
            arm.wristGroup.add(wristJoint);

            // Laser emitter head
            const emitterGeom = new THREE.ConeGeometry(1.5, 3, 16);
            const emitterMat = new THREE.MeshStandardMaterial({ color: 0xff0033, emissive: 0xff0033, emissiveIntensity: 0.5 });
            arm.laserEmitter = new THREE.Mesh(emitterGeom, emitterMat);
            arm.laserEmitter.rotation.z = Math.PI;
            arm.laserEmitter.position.y = -2;
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

        // # UPDATED: Roof sphere lattice with rotatable emitter arms
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
                emitterGroup.position.set(baseX, encH, baseZ);

                // Rotatable mount base
                const mountBase = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.8, 1, 1, 16),
                    jointMat
                );
                emitterGroup.add(mountBase);

                // Rotatable arm
                const emitterArm = new THREE.Group();
                const armLen = 3;
                const armCylinder = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.3, 0.3, armLen, 8),
                    armMat
                );
                armCylinder.rotation.z = Math.PI / 2;
                armCylinder.position.x = armLen / 2;
                emitterArm.add(armCylinder);

                // Laser emitter at end
                const emitterDot = new THREE.Mesh(
                    new THREE.SphereGeometry(Math.max(0.1, Math.min(emitter.w, emitter.h, emitter.d) * 0.03), 16, 16),
                    new THREE.MeshStandardMaterial({ color: 0xffd166, emissive: 0xffd166, emissiveIntensity: 0.3 })
                );
                emitterDot.position.x = armLen;
                emitterArm.add(emitterDot);

                // Laser beam from emitter
                const beamPoints = [
                    new THREE.Vector3(armLen, 0, 0),
                    new THREE.Vector3(armLen + 10, 0, 0)
                ];
                const beamGeom = new THREE.BufferGeometry().setFromPoints(beamPoints);
                const emitterBeam = new THREE.Line(beamGeom, new THREE.LineBasicMaterial({ color: 0xffd166, linewidth: 1 }));
                emitterArm.add(emitterBeam);

                emitterGroup.add(emitterArm);
                sphereGroup.add(emitterGroup);
                roofEmittersRef.current.push(emitterGroup);
            }
        }
        scene.add(sphereGroup);

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

        audioRefsRef.current = soundFiles.map((soundFile, idx) => {
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


