import { useEffect, useRef } from "react";
import * as THREE from "three";

export type BuildPhase = "feet" | "torso" | "arms" | "head" | "done";

export function RobotBuilderSim({
    plateSizeCm,
    enclosureHeightCm,
    onPhase,
}: {
    plateSizeCm: { w: number; d: number };
    enclosureHeightCm: number;
    onPhase?: (p: BuildPhase) => void;
}) {
    const mountRef = useRef<HTMLDivElement | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

    useEffect(() => {
        if (!mountRef.current) return;
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0b0e14);
        const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 2000);
        camera.position.set(0, enclosureHeightCm * 0.8, plateSizeCm.d * 1.2);
        camera.lookAt(0, 0, 0);

        const light = new THREE.DirectionalLight(0xffffff, 1.0);
        light.position.set(50, 100, 50);
        scene.add(light);
        scene.add(new THREE.AmbientLight(0xffffff, 0.4));

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        mountRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Plate
        const plateGeom = new THREE.BoxGeometry(plateSizeCm.w, 1, plateSizeCm.d);
        const plateMat = new THREE.MeshStandardMaterial({ color: 0x556270 });
        const plate = new THREE.Mesh(plateGeom, plateMat);
        plate.position.set(0, 0.5, 0);
        scene.add(plate);

        // Human proportions (very rough) in cm
        const height = Math.min(enclosureHeightCm * 0.9, 180);
        const legH = height * 0.45;
        const torsoH = height * 0.35;
        const headH = height * 0.12;
        const armLen = height * 0.35;
        const shoulderW = height * 0.25;

        const material = new THREE.MeshBasicMaterial({ color: 0x00ff99 });

        // Geometry builders
        const makeBox = (w: number, h: number, d: number) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);

        // Phases
        const feet = makeBox(20, 5, 10);
        feet.position.set(0, 2.5, 0);

        const legs = makeBox(15, legH, 15);
        legs.position.set(0, 2.5 + legH / 2, 0);

        const torso = makeBox(shoulderW, torsoH, 20);
        torso.position.set(0, 2.5 + legH + torsoH / 2, 0);

        const head = new THREE.Mesh(new THREE.SphereGeometry(headH / 2, 16, 16), material);
        head.position.set(0, 2.5 + legH + torsoH + headH / 2, 0);

        const leftArm = makeBox(armLen, 8, 8);
        leftArm.position.set(-shoulderW / 2 - armLen / 2, 2.5 + legH + torsoH * 0.8, 0);
        const rightArm = makeBox(armLen, 8, 8);
        rightArm.position.set(shoulderW / 2 + armLen / 2, 2.5 + legH + torsoH * 0.8, 0);

        const phases: [BuildPhase, THREE.Object3D][] = [
            ["feet", feet],
            ["torso", legs],
            ["arms", torso],
            ["head", head],
        ];

        let idx = 0;
        let timer: number | null = null;

        const step = () => {
            if (idx < phases.length) {
                const [name, obj] = phases[idx];
                scene.add(obj);
                onPhase?.(name);
                idx += 1;
                timer = window.setTimeout(step, 800);
            } else {
                scene.add(leftArm);
                scene.add(rightArm);
                onPhase?.("done");
            }
        };
        step();

        const animate = () => {
            if (!rendererRef.current) return;
            rendererRef.current.render(scene, camera);
            requestAnimationFrame(animate);
        };
        animate();

        const onResize = () => {
            if (!mountRef.current || !rendererRef.current) return;
            rendererRef.current.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        };
        const ro = new ResizeObserver(onResize);
        ro.observe(mountRef.current);

        return () => {
            if (timer) window.clearTimeout(timer);
            ro.disconnect();
            renderer.dispose();
            if (mountRef.current) mountRef.current.innerHTML = "";
        };
    }, [plateSizeCm, enclosureHeightCm, onPhase]);

    return <div ref={mountRef} className="h-[360px] w-full rounded-md border" />;
}


