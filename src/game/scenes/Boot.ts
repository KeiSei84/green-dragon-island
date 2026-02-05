import { Scene } from 'phaser';
import { generateAllAssets } from '../utils/AssetGenerator';

export class Boot extends Scene {
    constructor() {
        super('Boot');
    }

    preload() {
        // Progress bar
        const bar = this.add.rectangle(400, 320, 4, 28, 0xffd700);
        this.add.rectangle(400, 320, 468, 32).setStrokeStyle(1, 0xffd700);

        this.add.text(400, 280, 'Loading Green Dragon Island...', {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#2d8b46'
        }).setOrigin(0.5);

        this.load.on('progress', (progress: number) => {
            bar.width = 4 + 460 * progress;
        });

        // === DALL-E Generated Assets ===

        // Backgrounds (full images)
        this.load.image('bg_rice_terraces', 'assets/backgrounds/bg_rice_terraces.png');
        this.load.image('bg_boss_arena', 'assets/backgrounds/bg_boss_arena.png');

        // Character spritesheets — DALL-E generates non-uniform layouts,
        // so we load as images and will create frames manually
        this.load.image('dragon_sheet', 'assets/sprites/dragon.png');
        this.load.image('player_sheet', 'assets/sprites/player.png');
        this.load.image('boss_sheet', 'assets/sprites/boss_frey.png');
        this.load.image('monkey_sheet', 'assets/sprites/monkey.png');
        this.load.image('leyak_sheet', 'assets/sprites/leyak.png');
        this.load.image('items_sheet', 'assets/sprites/items.png');
        this.load.image('tileset_img', 'assets/tiles/tileset.png');
    }

    create() {
        // Generate procedural fallback assets (for tiles, particles, HUD elements)
        // These are small and work well procedurally
        generateAllAssets(this);

        // Create animations from procedural sprites (they have proper frames)
        this.anims.create({
            key: 'dragon-walk',
            frames: this.anims.generateFrameNumbers('dragon', { start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'player-walk',
            frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'monkey-walk',
            frames: this.anims.generateFrameNumbers('monkey', { start: 0, end: 1 }),
            frameRate: 4,
            repeat: -1
        });

        this.anims.create({
            key: 'leyak-float',
            frames: this.anims.generateFrameNumbers('leyak', { start: 0, end: 1 }),
            frameRate: 4,
            repeat: -1
        });

        this.anims.create({
            key: 'boss-walk',
            frames: this.anims.generateFrameNumbers('boss_frey', { start: 0, end: 3 }),
            frameRate: 6,
            repeat: -1
        });

        this.anims.create({
            key: 'coin-spin',
            frames: this.anims.generateFrameNumbers('coin', { start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1
        });

        this.scene.start('MainMenu');
    }
}
