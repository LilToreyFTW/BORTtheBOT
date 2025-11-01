# 3D Printer Array Model - Documentation

## Overview

The `PrinterArray3D` component generates a fully detailed, scaled 3D model of an array of eight (8) identical, enclosed laser sintering/additive manufacturing systems. The printers are ceiling-mounted and arranged in a 2x4 grid pattern.

## Features

### Physical Configuration
- **Array Layout**: 2 rows × 4 columns (8 total printers)
- **Grid Spacing**: 50cm apart horizontally
- **Ceiling Height**: 4.0m (400cm)
- **Suspension**: 50cm below ceiling via steel I-beam support rails
- **Total Array Span**: 4m (width) × 2.5m (depth)

### Individual Printer Specifications
- **Enclosure**: 100cm (W) × 120cm (H) × 100cm (D)
- **Base Plate**: 900mm × 900mm × 900mm (90cm cube)
- **Downward Laser Arms**: 8 per printer (64 total across array)
- **Roof Sphere Emitters**: 729 per printer (5,832 total across array)

### Laser Arm System
Each of the 64 downward laser arms features:
- **Base Mount**: Roof bracket with integrated servo
- **Shoulder Joint**: 360° yaw + pitch rotation
- **Upper Arm**: 48cm length (40% of enclosure height)
- **Elbow Joint**: Single servo with 0-180° range
- **Lower Arm**: 42cm length (35% of enclosure height), tapered design
- **Wrist Joint**: Dual-axis (yaw 360°, pitch ±45°)
- **Laser Emitter**: 5cm housing with focus ring and red laser (RGB: 0xff0033)

### Roof Sphere Grid
- **Layout**: 9×9×9 cubic lattice (729 emitters per printer)
- **Emitter Size**: 2cm × 2cm × 2cm modules
- **Functionality**: Volumetric scanning with pan/tilt capability

### Materials & Aesthetics
- **Frame**: Welded aluminum square tubing (brushed metal, 5cm × 5cm)
- **Panels**: Semi-transparent acrylic (70% opacity for internal visibility)
- **Base Plate**: Perforated steel grating with fiducial markers
- **Support Rails**: Steel I-beams (5cm thick)
- **Laser Elements**: Glowing red accents (RGB: 0xff0033)

## Calibration Animation

### Activation
Trigger calibration via the "Start Calibration" button or programmatically:

```typescript
const componentRef = useRef<PrinterArray3DRef>(null);
componentRef.current?.startCalibration();
```

### Animation Details
- **Duration**: Continuous loop (30-second cycles)
- **Speed**: 0.2x normal (slow, hypnotic motion)
- **Arm Rotation**: All 64 arms rotate 360° simultaneously
- **Staggered Starts**: Each printer's arms offset by 45° (8-armed wave pattern)
- **Beam Tracking**: Laser beams dynamically track scan positions on base plates
- **Roof Emitters**: Pulse sequence (row-by-row) forming calibration grid

### Audio Integration
- **8 Unique Sounds**: Each printer plays its own looping MP3
- **Spatial Audio**: 3D positioning based on printer location
- **Volume**: 30% default (adjustable)
- **Synchronization**: Audio loops match animation cycles

## Export Formats

### GLTF Export
- **Format**: GLTF 2.0 (JSON)
- **Compatibility**: Unity, Blender, Unreal Engine, Three.js
- **Includes**: Geometry, materials, textures, animations
- **Usage**: Click "Export GLTF" button

### OBJ Export
- **Format**: Wavefront OBJ
- **Compatibility**: Universal (all major 3D software)
- **Includes**: Geometry and material groups
- **Usage**: Click "Export OBJ" button

## Integration

### Basic Usage

```tsx
import { PrinterArray3D, PrinterSpecs } from "@/components/viewer/PrinterArray3D";

const specs: PrinterSpecs = {
    enclosureCm: { w: 100, h: 120, d: 100 },
    basePlateMm: { w: 900, d: 900, h: 900 },
    downwardLasers: { count: 8, footprintCm: { w: 5, d: 5, h: 10 } },
    roofSphere: { grid: [9, 9, 9], singleEmitterSizeCm: { w: 2, h: 2, d: 2 } },
};

<PrinterArray3D
    specs={specs}
    config={{
        gridCols: 4,
        gridRows: 2,
        spacing: 50,
        ceilingHeight: 400,
        suspendHeight: 50,
    }}
    onCalibrationStart={() => console.log("Calibration started")}
    onCalibrationEnd={() => console.log("Calibration ended")}
/>
```

### Custom Configuration

```typescript
const customConfig: PrinterArrayConfig = {
    gridCols: 3,      // 3 columns instead of 4
    gridRows: 3,      // 3 rows instead of 2
    spacing: 75,      // 75cm spacing
    ceilingHeight: 500, // 5m ceiling
    suspendHeight: 75,  // 75cm suspension
};
```

## Performance Considerations

### Level of Detail (LOD)
The model supports LOD optimization:
- **High**: Full geometry with all details
- **Medium**: Simplified arm meshes
- **Low**: Wireframe representation

### Optimization Tips
1. **Reduce Roof Emitters**: For performance, consider reducing the roof grid size (e.g., 5×5×5 instead of 9×9×9)
2. **Disable Shadows**: Set `renderer.shadowMap.enabled = false` for faster rendering
3. **Limit Animations**: Only animate active printers during calibration
4. **Texture Compression**: Use compressed textures for materials

## File Structure

```
apps/web/src/components/viewer/
├── PrinterArray3D.tsx          # Main component
├── sound_effects/              # Audio files
│   ├── laser-printerone_loop.mp3
│   ├── laser-printertwo_loop.mp3
│   └── ... (8 total)
└── README-ARRAY-3D.md          # This file
```

## Technical Specifications

### Coordinate System
- **Origin**: Center of array (0, 0, 0)
- **Y-Axis**: Vertical (up is positive, floor at y=0)
- **X-Axis**: Horizontal (left-to-right)
- **Z-Axis**: Depth (forward/backward)

### Units
- All dimensions in centimeters (cm) for consistency
- Base plate dimensions in millimeters (mm) converted to cm
- Scale: 1:1 (real-world dimensions)

### Collision Detection
- Arms have limit stops to prevent enclosure collisions
- Beam footprint validation ensures lasers stay within base plate bounds
- Safety margins calculated: `(90cm - 5cm) / 2 = 42.5cm`

## Troubleshooting

### Audio Not Playing
- Check browser autoplay policies (user interaction required)
- Verify audio file paths are correct
- Check browser console for CORS errors

### Performance Issues
- Reduce roof emitter count
- Lower render resolution
- Disable shadows
- Use LOD levels

### Export Failures
- Ensure Three.js exporters are loaded
- Check browser console for errors
- Verify scene has geometry before exporting

## Future Enhancements

- [ ] Physics simulation for arm movements
- [ ] Particle effects for laser sintering
- [ ] Heat haze visualization
- [ ] VR/AR support
- [ ] Multi-resolution texture support
- [ ] Advanced IK solver for arm positioning

