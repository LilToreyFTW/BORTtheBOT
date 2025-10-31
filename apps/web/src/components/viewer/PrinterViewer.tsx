import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

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
};

export function PrinterViewer({ specs, calibration }: { specs: PrinterSpecs; calibration?: Calibration }) {
    const mountRef = useRef<HTMLDivElement | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const requestRef = useRef<number | null>(null);

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

        const animate = () => {
            if (!rendererRef.current) return;
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

        // 8 downward lasers as red lines from roof to base centerline positions
        const laserMat = new THREE.LineBasicMaterial({ color: 0xff0033 });
        const count = 8;
        const positions = calibration?.downwardArray ?? Array.from({ length: count }, (_, i) => {
            const x = (plateW / (count - 1)) * i - plateW / 2;
            const y = encH;
            const z = 0;
            return { index: i, xCm: x, yCm: y, zCm: z };
        });
        for (const p of positions) {
            const points = [] as THREE.Vector3[];
            points.push(new THREE.Vector3(p.xCm - plateW / 2, p.yCm, p.zCm));
            points.push(new THREE.Vector3(p.xCm - plateW / 2, 0, p.zCm));
            const geom = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geom, laserMat);
            scene.add(line);
        }

        // Roof sphere lattice as small points
        const sphereGroup = new THREE.Group();
        const [gx, gy, gz] = [9, 9, 9];
        // # UPDATED VERSION: mark 'gy' as used to satisfy noUnusedLocals
        void gy;
        const emitter = specs.roofSphere.singleEmitterSizeCm;
        const spacing = Math.min(encW / gx, encD / gz);
        const dotGeom = new THREE.SphereGeometry(Math.max(0.05, Math.min(emitter.w, emitter.h, emitter.d) * 0.05));
        const dotMat = new THREE.MeshBasicMaterial({ color: 0xffd166 });
        for (let x = 0; x < gx; x++) {
            for (let z = 0; z < gz; z++) {
                const dot = new THREE.Mesh(dotGeom, dotMat);
                dot.position.set(-encW / 2 + x * spacing, encH, -encD / 2 + z * spacing);
                sphereGroup.add(dot);
            }
        }
        scene.add(sphereGroup);
    }, [specs, calibration, sceneSetup]);

    return <div ref={mountRef} className="h-[420px] w-full rounded-md border" />;
}


