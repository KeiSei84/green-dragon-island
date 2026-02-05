import { Scene } from 'phaser';
import { Nostalgist } from 'nostalgist';

/**
 * EmulatorMode: Runs actual Yoshi's Island ROM via SNES emulation.
 * User provides their own ROM file.
 * We apply palette hacks on-the-fly to re-skin Yoshi → Green Dragon.
 */
export class EmulatorMode extends Scene {
    private nostalgist: any = null;
    private romLoaded = false;
    private fileInput: HTMLInputElement | null = null;
    private clickHandler: (() => void) | null = null;
    private dragOverHandler: ((e: DragEvent) => void) | null = null;
    private dragLeaveHandler: (() => void) | null = null;
    private dropHandler: ((e: DragEvent) => void) | null = null;

    constructor() {
        super('EmulatorMode');
    }

    create() {
        this.cameras.main.setBackgroundColor('#0a0a1a');

        // Title
        this.add.text(400, 40, 'GREEN DRAGON ISLAND', {
            fontFamily: 'Arial Black, Arial',
            fontSize: '32px',
            color: '#2d8b46',
            stroke: '#ffd700',
            strokeThickness: 3
        }).setOrigin(0.5);

        this.add.text(400, 80, 'SNES Emulator Mode', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#888888'
        }).setOrigin(0.5);

        // Instructions
        this.add.text(400, 200, 'Drop your Yoshi\'s Island ROM here\nor click to select file', {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#ffffff',
            align: 'center',
            lineSpacing: 8
        }).setOrigin(0.5);

        this.add.text(400, 260, '(Super Mario World 2: Yoshi\'s Island - USA v1.0 or v1.1)', {
            fontFamily: 'Arial',
            fontSize: '12px',
            color: '#666666'
        }).setOrigin(0.5);

        // Drop zone visual
        const dropZone = this.add.rectangle(400, 320, 400, 150, 0x1a2a1a, 0.5);
        dropZone.setStrokeStyle(2, 0x2d8b46);

        this.add.text(400, 320, '\u{1F4C1} Click or Drag & Drop .sfc / .smc ROM', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#2d8b46'
        }).setOrigin(0.5);

        // Status text
        const statusText = this.add.text(400, 430, '', {
            fontFamily: 'Arial',
            fontSize: '14px',
            color: '#ffd700'
        }).setOrigin(0.5);

        // Back button
        this.add.text(400, 560, '[ ESC \u2014 Back to Menu ]', {
            fontFamily: 'Arial',
            fontSize: '14px',
            color: '#666666'
        }).setOrigin(0.5);

        this.input.keyboard!.on('keydown-ESC', () => {
            this.cleanupEmulator();
            this.scene.start('MainMenu');
        });

        // File input handling via DOM
        this.createFileInput(statusText);
        this.createDragDrop(statusText);
    }

    private createFileInput(statusText: Phaser.GameObjects.Text): void {
        const canvas = this.game.canvas;

        // Click on canvas to open file picker
        this.fileInput = document.createElement('input');
        this.fileInput.type = 'file';
        this.fileInput.accept = '.sfc,.smc,.zip';
        this.fileInput.style.display = 'none';
        document.body.appendChild(this.fileInput);

        const fileInput = this.fileInput;

        this.clickHandler = () => {
            if (!this.romLoaded) {
                fileInput.click();
            }
        };
        canvas.addEventListener('click', this.clickHandler);

        fileInput.addEventListener('change', async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                statusText.setText('Loading ROM...');
                await this.loadROM(file, statusText);
            }
        });
    }

    private createDragDrop(statusText: Phaser.GameObjects.Text): void {
        const canvas = this.game.canvas;

        this.dragOverHandler = (e: DragEvent) => {
            e.preventDefault();
            canvas.style.border = '3px solid #2d8b46';
        };

        this.dragLeaveHandler = () => {
            canvas.style.border = 'none';
        };

        this.dropHandler = async (e: DragEvent) => {
            e.preventDefault();
            canvas.style.border = 'none';

            const file = e.dataTransfer?.files[0];
            if (file) {
                statusText.setText('Loading ROM...');
                await this.loadROM(file, statusText);
            }
        };

        canvas.addEventListener('dragover', this.dragOverHandler);
        canvas.addEventListener('dragleave', this.dragLeaveHandler);
        canvas.addEventListener('drop', this.dropHandler);
    }

    private async loadROM(file: File, statusText: Phaser.GameObjects.Text): Promise<void> {
        try {
            statusText.setText('Reading ROM file...');

            const arrayBuffer = await file.arrayBuffer();
            let romData = new Uint8Array(arrayBuffer);

            // Remove SMC header if present (512 bytes)
            if (romData.length % 1024 === 512) {
                statusText.setText('Removing SMC header...');
                romData = romData.slice(512);
            }

            // Apply Green Dragon palette hack
            statusText.setText('Applying Green Dragon palette hack...');
            romData = this.applyPaletteHack(romData);

            // Create a Blob from the modified ROM
            const romBlob = new Blob([romData], { type: 'application/octet-stream' });
            const romUrl = URL.createObjectURL(romBlob);

            statusText.setText('Starting SNES emulator...');

            // Hide Phaser canvas, show emulator
            this.game.canvas.style.display = 'none';

            // Create emulator container
            const emuContainer = document.createElement('div');
            emuContainer.id = 'emu-container';
            emuContainer.style.cssText = 'display:flex;justify-content:center;align-items:center;height:100vh;background:#000;';
            document.body.appendChild(emuContainer);

            // Create a canvas for the emulator
            const emuCanvas = document.createElement('canvas');
            emuCanvas.width = 800;
            emuCanvas.height = 600;
            emuContainer.appendChild(emuCanvas);

            // Launch Nostalgist SNES emulator
            this.nostalgist = await Nostalgist.launch({
                core: 'snes9x',
                rom: romUrl,
                element: emuCanvas,
                resolveCoreJs(core: any) {
                    const name = typeof core === 'string' ? core : core.name;
                    return `https://cdn.jsdelivr.net/gh/nicholasgasior/nostalgist-cores@main/${name}_libretro.js`;
                },
                resolveCoreWasm(core: any) {
                    const name = typeof core === 'string' ? core : core.name;
                    return `https://cdn.jsdelivr.net/gh/nicholasgasior/nostalgist-cores@main/${name}_libretro.wasm`;
                }
            } as any);

            this.romLoaded = true;

            // Add ESC listener to go back
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.cleanupEmulator();
                    this.game.canvas.style.display = 'block';
                    this.scene.start('MainMenu');
                }
            }, { once: true });

        } catch (err: any) {
            statusText.setText(`Error: ${err.message}`);
            console.error('Emulator error:', err);
        }
    }

    /**
     * Apply palette modifications to the ROM to re-skin Yoshi's Island:
     * - Change Yoshi's palette to Green Dragon colors
     * - Modify some text palettes
     *
     * Palette data is at ROM offset $3FA000-$3FFFFF (uncompressed!)
     * SNES color format: 15-bit BGR: 0bbbbbgggggrrrrr (little-endian word)
     */
    private applyPaletteHack(rom: Uint8Array): Uint8Array {
        const modified = new Uint8Array(rom);

        // Helper: create SNES 15-bit color from RGB
        const snesColor = (r: number, g: number, b: number): [number, number] => {
            const r5 = Math.round(r / 255 * 31) & 0x1F;
            const g5 = Math.round(g / 255 * 31) & 0x1F;
            const b5 = Math.round(b / 255 * 31) & 0x1F;
            const word = (b5 << 10) | (g5 << 5) | r5;
            return [word & 0xFF, (word >> 8) & 0xFF];
        };

        // Green Yoshi palette colors → Green Dragon (Naga Basuki) colors
        // The green egg palette is at ROM offset $51F65
        // Main Yoshi palette entries are at $3FA200+ area
        //
        // Dragon palette:
        // - Body: deep emerald green (#2d8b46)
        // - Belly: light green (#7ec88b)
        // - Crown: gold (#ffd700)
        // - Gem: red (#ff4444)
        // - Shoes/claws: gold (#daa520)

        // Modify palette at known green Yoshi palette offset
        const greenPaletteOffset = 0x051F65;
        if (greenPaletteOffset + 32 < modified.length) {
            // Palette is 16 colors × 2 bytes each = 32 bytes
            const dragonPalette = [
                snesColor(0, 0, 0),       // 0: transparent
                snesColor(45, 139, 70),    // 1: body dark green
                snesColor(126, 200, 139),  // 2: belly light green
                snesColor(26, 107, 48),    // 3: shadow green
                snesColor(255, 215, 0),    // 4: crown gold
                snesColor(218, 165, 32),   // 5: dark gold
                snesColor(255, 68, 68),    // 6: gem red
                snesColor(200, 50, 50),    // 7: dark red
                snesColor(255, 255, 255),  // 8: eye white
                snesColor(255, 0, 0),      // 9: eye pupil red
                snesColor(20, 80, 35),     // A: outline dark
                snesColor(160, 220, 170),  // B: highlight
                snesColor(255, 236, 128),  // C: gold highlight
                snesColor(100, 60, 30),    // D: claw brown
                snesColor(180, 180, 180),  // E: smoke grey
                snesColor(240, 240, 240),  // F: white highlight
            ];

            for (let i = 0; i < 16; i++) {
                modified[greenPaletteOffset + i * 2] = dragonPalette[i][0];
                modified[greenPaletteOffset + i * 2 + 1] = dragonPalette[i][1];
            }
        }

        return modified;
    }

    private cleanupEmulator(): void {
        if (this.nostalgist) {
            try {
                this.nostalgist.exit();
            } catch (e) {}
            this.nostalgist = null;
        }

        const emuContainer = document.getElementById('emu-container');
        if (emuContainer) {
            emuContainer.remove();
        }

        this.romLoaded = false;
    }

    private removeDOMListeners(): void {
        const canvas = this.game.canvas;

        if (this.clickHandler) {
            canvas.removeEventListener('click', this.clickHandler);
            this.clickHandler = null;
        }
        if (this.dragOverHandler) {
            canvas.removeEventListener('dragover', this.dragOverHandler);
            this.dragOverHandler = null;
        }
        if (this.dragLeaveHandler) {
            canvas.removeEventListener('dragleave', this.dragLeaveHandler);
            this.dragLeaveHandler = null;
        }
        if (this.dropHandler) {
            canvas.removeEventListener('drop', this.dropHandler);
            this.dropHandler = null;
        }
        if (this.fileInput) {
            this.fileInput.remove();
            this.fileInput = null;
        }
    }

    shutdown(): void {
        this.removeDOMListeners();
        this.cleanupEmulator();
    }

    destroy(): void {
        this.removeDOMListeners();
        this.cleanupEmulator();
    }
}
