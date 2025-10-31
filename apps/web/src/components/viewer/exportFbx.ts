import * as THREE from "three";
import { FBXExporter } from "three/examples/jsm/exporters/FBXExporter.js";

export type RobotSpec = {
    plateSizeCm: { w: number; d: number };
    enclosureHeightCm: number;
};

export function buildRobotHierarchy(spec: RobotSpec): THREE.Group {
    const group = new THREE.Group();
    group.name = "RobotRoot";

    const height = Math.min(spec.enclosureHeightCm * 0.9, 180);
    const legH = height * 0.45;
    const torsoH = height * 0.35;
    const headH = height * 0.12;
    const armLen = height * 0.35;
    const shoulderW = height * 0.25;

    const mat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9, roughness: 0.2 });

    const pelvis = new THREE.Group();
    pelvis.name = "Pelvis";
    pelvis.position.set(0, legH, 0);
    group.add(pelvis);

    const spine = new THREE.Group();
    spine.name = "Spine";
    spine.position.set(0, torsoH / 2, 0);
    pelvis.add(spine);

    const chestBox = new THREE.Mesh(new THREE.BoxGeometry(shoulderW, torsoH, 20), mat);
    chestBox.name = "Chest";
    chestBox.position.set(0, 0, 0);
    spine.add(chestBox);

    const head = new THREE.Mesh(new THREE.SphereGeometry(headH / 2, 24, 24), mat);
    head.name = "Head";
    head.position.set(0, torsoH / 2 + headH / 2, 0);
    spine.add(head);

    const leftArm = new THREE.Mesh(new THREE.BoxGeometry(armLen, 8, 8), mat);
    leftArm.name = "LeftArm";
    leftArm.position.set(-shoulderW / 2 - armLen / 2, torsoH * 0.3, 0);
    spine.add(leftArm);
    const rightArm = new THREE.Mesh(new THREE.BoxGeometry(armLen, 8, 8), mat);
    rightArm.name = "RightArm";
    rightArm.position.set(shoulderW / 2 + armLen / 2, torsoH * 0.3, 0);
    spine.add(rightArm);

    const legs = new THREE.Mesh(new THREE.BoxGeometry(15, legH, 15), mat);
    legs.name = "Legs";
    legs.position.set(0, -torsoH / 2, 0);
    pelvis.add(legs);

    const feet = new THREE.Mesh(new THREE.BoxGeometry(20, 5, 10), mat);
    feet.name = "Feet";
    feet.position.set(0, -legH - 2.5, 0);
    pelvis.add(feet);

    return group;
}

export function exportRobotAsFBX(spec: RobotSpec, filename = "robot.fbx") {
    const root = buildRobotHierarchy(spec);
    const scene = new THREE.Scene();
    scene.add(root);

    const exporter = new FBXExporter();
    const result = exporter.parse(scene);

    const blob = new Blob([result as ArrayBuffer], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}


