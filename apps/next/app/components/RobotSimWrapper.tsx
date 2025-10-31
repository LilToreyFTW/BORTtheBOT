"use client";
import { RobotBuilderSim } from "@/components/viewer/RobotBuilderSim";

export function RobotSimWrapper({ plateW, plateD, height, botName }: any) {
  return (
    <div>
      <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Build Simulation: {botName}</div>
      <RobotBuilderSim plateSizeCm={{ w: plateW, d: plateD }} enclosureHeightCm={height} />
    </div>
  );
}

export default RobotSimWrapper;


