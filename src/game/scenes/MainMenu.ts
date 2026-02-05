import { Scene } from 'phaser';

export class MainMenu extends Scene {
    constructor() {
        super('MainMenu');
    }

    create() {
        // DALL-E background: rice terraces
        const bg = this.add.image(400, 300, 'bg_rice_terraces');
        bg.setDisplaySize(800, 600);

        // Dark overlay for readability
        this.add.rectangle(400, 300, 800, 600, 0x000000, 0.4);

        // Title shadow
        this.add.text(402, 82, 'GREEN DRAGON\nISLAND', {
            fontFamily: 'Arial Black, Arial',
            fontSize: '52px',
            color: '#000000',
            align: 'center',
            lineSpacing: 8
        }).setOrigin(0.5).setAlpha(0.5);

        // Title
        this.add.text(400, 80, 'GREEN DRAGON\nISLAND', {
            fontFamily: 'Arial Black, Arial',
            fontSize: '52px',
            color: '#2d8b46',
            align: 'center',
            stroke: '#ffd700',
            strokeThickness: 5,
            lineSpacing: 8
        }).setOrigin(0.5);

        // Subtitle
        this.add.text(400, 185, 'Bali Adventure', {
            fontFamily: 'Georgia, serif',
            fontSize: '26px',
            color: '#ffd700',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        // DALL-E dragon character (using the generated sheet as a static showcase)
        const dragonImg = this.add.image(400, 340, 'dragon_sheet');
        // Scale to show the main dragon from the center of the spritesheet
        dragonImg.setDisplaySize(280, 160);
        dragonImg.setCrop(300, 50, 500, 450);

        // Floating animation for dragon showcase
        this.tweens.add({
            targets: dragonImg,
            y: 330,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Level info
        this.add.text(400, 430, 'Level 1: Rice Terraces of Tegallalang', {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        this.add.text(400, 460, 'Boss: Andre Frey — The Scammer of Ubud', {
            fontFamily: 'Arial',
            fontSize: '14px',
            color: '#ff6600',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        // Start button
        const startText = this.add.text(400, 520, '[ PRESS SPACE TO START ]', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        this.tweens.add({
            targets: startText,
            alpha: 0.3,
            duration: 600,
            yoyo: true,
            repeat: -1
        });

        // Credits
        this.add.text(400, 575, 'Dedicated to green-dragon.id — Premium Resort in Ubud, Bali', {
            fontFamily: 'Arial',
            fontSize: '11px',
            color: '#cccccc',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        // Controls
        this.add.text(15, 565, 'Controls: Arrow Keys + Space (jump) + F (fire breath)', {
            fontFamily: 'Arial',
            fontSize: '11px',
            color: '#aaaaaa',
            stroke: '#000000',
            strokeThickness: 2
        });

        // SNES Emulator mode button
        this.add.text(400, 490, '[ E — SNES Classic Mode (load ROM) ]', {
            fontFamily: 'Arial',
            fontSize: '13px',
            color: '#8888ff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        // Input
        this.input.keyboard!.once('keydown-SPACE', () => {
            this.scene.start('Level1');
        });

        this.input.keyboard!.once('keydown-E', () => {
            this.scene.start('EmulatorMode');
        });
    }
}
