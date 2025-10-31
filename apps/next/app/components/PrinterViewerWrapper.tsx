"use client";
import { PrinterViewer } from "@/components/viewer/PrinterViewer";

export function PrinterViewerWrapper({ bot, calibration, onSave, onCalibrate }: any) {
  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <button onClick={() => onSave(bot.specs)}>Save Specs</button>
        <button style={{ marginLeft: 8 }} onClick={() => onCalibrate()}>Calibrate</button>
      </div>
      <PrinterViewer specs={bot.specs.printer} calibration={calibration} />
    </div>
  );
}

export default PrinterViewerWrapper;


