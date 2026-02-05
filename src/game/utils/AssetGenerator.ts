import { Scene } from 'phaser';

/**
 * Generates all game sprites programmatically — no external assets needed.
 * Uses Phaser Graphics API to draw pixel-art sprites.
 */
export function generateAllAssets(scene: Scene): void {
    generateDragonSprite(scene);
    generatePlayerSprite(scene);
    generateFireball(scene);
    generateEnemyMonkey(scene);
    generateEnemyLeyak(scene);
    generateBossAndreFreySprite(scene);
    generateBossProjectile(scene);
    generateCoin(scene);
    generateHeart(scene);
    generatePlatformTiles(scene);
    generateParallaxLayers(scene);
    generateParticles(scene);
}

/** After generateTexture, add numbered frames for spritesheet animations */
function addSpriteFrames(scene: Scene, key: string, frameW: number, frameH: number, count: number): void {
    const texture = scene.textures.get(key);
    for (let i = 0; i < count; i++) {
        texture.add(i, 0, i * frameW, 0, frameW, frameH);
    }
}

function generateDragonSprite(scene: Scene): void {
    const g = scene.make.graphics({ x: 0, y: 0 });
    const frameW = 64, frameH = 48;

    for (let frame = 0; frame < 4; frame++) {
        const ox = frame * frameW;

        // Body
        g.fillStyle(0x2d8b46);
        g.fillRoundedRect(ox + 12, 16, 40, 24, 6);

        // Belly
        g.fillStyle(0x7ec88b);
        g.fillRoundedRect(ox + 16, 24, 32, 14, 4);

        // Head
        g.fillStyle(0x2d8b46);
        g.fillCircle(ox + 52, 16, 10);

        // Eye
        g.fillStyle(0xffffff);
        g.fillCircle(ox + 55, 14, 3);
        g.fillStyle(0xff0000);
        g.fillCircle(ox + 56, 14, 1.5);

        // Crown (Naga Basuki golden crown)
        g.fillStyle(0xffd700);
        g.fillTriangle(ox + 47, 6, ox + 50, 0, ox + 53, 6);
        g.fillTriangle(ox + 50, 6, ox + 53, 0, ox + 56, 6);
        g.fillTriangle(ox + 53, 6, ox + 56, 0, ox + 59, 6);
        g.fillRect(ox + 47, 6, 12, 3);

        // Nagamani gem
        g.fillStyle(0xff4444);
        g.fillCircle(ox + 53, 4, 2);

        // Wings (flapping)
        g.fillStyle(0x1a6b30);
        const wingY = frame % 2 === 0 ? 8 : 12;
        g.fillTriangle(ox + 20, 16, ox + 30, wingY, ox + 38, 16);

        // Tail
        g.lineStyle(3, 0x2d8b46);
        g.beginPath();
        g.moveTo(ox + 12, 28);
        g.lineTo(ox + 4, 32);
        g.lineTo(ox + 0, 28);
        g.strokePath();

        // Legs (animated)
        g.fillStyle(0x2d8b46);
        const legOffset = frame < 2 ? 0 : 3;
        g.fillRect(ox + 20, 38 - legOffset, 5, 10 + legOffset);
        g.fillRect(ox + 38, 38 + legOffset, 5, 10 - legOffset);

        // Claws
        g.fillStyle(0xffd700);
        g.fillRect(ox + 19, 46 - legOffset, 7, 2);
        g.fillRect(ox + 37, 46 + legOffset, 7, 2);

        // Nostrils smoke
        g.fillStyle(0xaaaaaa, 0.5);
        g.fillCircle(ox + 60, 18, 2);
    }

    g.generateTexture('dragon', frameW * 4, frameH);
    addSpriteFrames(scene, 'dragon', frameW, frameH, 4);
    g.destroy();
}

function generatePlayerSprite(scene: Scene): void {
    const g = scene.make.graphics({ x: 0, y: 0 });
    const frameW = 32, frameH = 32;

    for (let frame = 0; frame < 4; frame++) {
        const ox = frame * frameW;

        // Shirt (blue polo)
        g.fillStyle(0x3366cc);
        g.fillRect(ox + 10, 10, 12, 12);

        // Head
        g.fillStyle(0xffcc99);
        g.fillCircle(ox + 16, 7, 6);

        // Hair
        g.fillStyle(0x4a3728);
        g.fillRect(ox + 10, 1, 12, 5);

        // Sunglasses
        g.fillStyle(0x111111);
        g.fillRect(ox + 11, 5, 4, 3);
        g.fillRect(ox + 17, 5, 4, 3);
        g.lineStyle(1, 0x111111);
        g.beginPath();
        g.moveTo(ox + 15, 6);
        g.lineTo(ox + 17, 6);
        g.strokePath();

        // Legs (shorts)
        g.fillStyle(0xd4b896);
        const legOff = frame < 2 ? 0 : 2;
        g.fillRect(ox + 11, 22 - legOff, 5, 8 + legOff);
        g.fillRect(ox + 18, 22 + legOff, 5, 8 - legOff);

        // Shoes
        g.fillStyle(0x8b4513);
        g.fillRect(ox + 10, 29 - legOff, 7, 3);
        g.fillRect(ox + 17, 29 + legOff, 7, 3);

        // Arms
        g.fillStyle(0xffcc99);
        g.fillRect(ox + 7, 11, 4, 8);
        g.fillRect(ox + 21, 11, 4, 8);

        // Briefcase
        g.fillStyle(0x8b4513);
        g.fillRect(ox + 22, 17, 6, 5);
        g.fillStyle(0xffd700);
        g.fillRect(ox + 24, 17, 2, 1);
    }

    g.generateTexture('player', frameW * 4, frameH);
    addSpriteFrames(scene, 'player', frameW, frameH, 4);
    g.destroy();
}

function generateFireball(scene: Scene): void {
    const g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xff6600);
    g.fillCircle(8, 8, 8);
    g.fillStyle(0xffaa00);
    g.fillCircle(8, 8, 5);
    g.fillStyle(0xffff00);
    g.fillCircle(8, 8, 3);
    g.generateTexture('fireball', 16, 16);
    g.destroy();
}

function generateEnemyMonkey(scene: Scene): void {
    const g = scene.make.graphics({ x: 0, y: 0 });
    const frameW = 32, frameH = 32;

    for (let frame = 0; frame < 2; frame++) {
        const ox = frame * frameW;

        // Body
        g.fillStyle(0x8b6914);
        g.fillRoundedRect(ox + 8, 10, 16, 14, 4);

        // Head
        g.fillStyle(0xa07828);
        g.fillCircle(ox + 16, 8, 7);

        // Face
        g.fillStyle(0xdeb887);
        g.fillCircle(ox + 16, 9, 4);

        // Eyes
        g.fillStyle(0x000000);
        g.fillCircle(ox + 14, 7, 1.5);
        g.fillCircle(ox + 18, 7, 1.5);

        // Mouth
        g.lineStyle(1, 0x000000);
        g.beginPath();
        g.arc(ox + 16, 10, 2, 0, Math.PI);
        g.strokePath();

        // Tail
        g.lineStyle(2, 0x8b6914);
        g.beginPath();
        g.moveTo(ox + 8, 18);
        g.lineTo(ox + 3, 14);
        g.lineTo(ox + 2, 8 + frame * 3);
        g.strokePath();

        // Legs
        g.fillStyle(0x8b6914);
        g.fillRect(ox + 10, 23, 4, 7);
        g.fillRect(ox + 18, 23, 4, 7);

        // Arms
        g.fillRect(ox + 5, 12, 4, 8);
        g.fillRect(ox + 23, 12, 4, 8);
    }

    g.generateTexture('monkey', frameW * 2, frameH);
    addSpriteFrames(scene, 'monkey', frameW, frameH, 2);
    g.destroy();
}

function generateEnemyLeyak(scene: Scene): void {
    const g = scene.make.graphics({ x: 0, y: 0 });
    const frameW = 32, frameH = 40;

    for (let frame = 0; frame < 2; frame++) {
        const ox = frame * frameW;

        // Hair — wild
        g.fillStyle(0x222222);
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            g.fillCircle(
                ox + 16 + Math.cos(angle) * 10,
                12 + Math.sin(angle) * 8 + (frame * 2),
                4
            );
        }

        // Head
        g.fillStyle(0x88cc88);
        g.fillCircle(ox + 16, 14, 9);

        // Eyes — glowing red
        g.fillStyle(0xff0000);
        g.fillCircle(ox + 13, 12, 3);
        g.fillCircle(ox + 19, 12, 3);
        g.fillStyle(0xffff00);
        g.fillCircle(ox + 13, 12, 1);
        g.fillCircle(ox + 19, 12, 1);

        // Fangs
        g.fillStyle(0xffffff);
        g.fillTriangle(ox + 12, 18, ox + 14, 24, ox + 16, 18);
        g.fillTriangle(ox + 16, 18, ox + 18, 24, ox + 20, 18);

        // Trailing entrails
        g.fillStyle(0xcc4444);
        const wobble = frame * 3;
        g.fillRect(ox + 13, 22, 3, 16);
        g.fillRect(ox + 17 + wobble, 22, 3, 14);
        g.fillRect(ox + 10 - wobble, 24, 2, 12);
    }

    g.generateTexture('leyak', frameW * 2, frameH);
    addSpriteFrames(scene, 'leyak', frameW, frameH, 2);
    g.destroy();
}

function generateBossAndreFreySprite(scene: Scene): void {
    const g = scene.make.graphics({ x: 0, y: 0 });
    const frameW = 48, frameH = 64;

    for (let frame = 0; frame < 4; frame++) {
        const ox = frame * frameW;

        // Legs (orange prison pants)
        g.fillStyle(0xff6600);
        const legOff = frame < 2 ? 0 : 3;
        g.fillRect(ox + 14, 42 - legOff, 8, 18 + legOff);
        g.fillRect(ox + 26, 42 + legOff, 8, 18 - legOff);

        // Shoes
        g.fillStyle(0x333333);
        g.fillRect(ox + 13, 58 - legOff, 10, 4);
        g.fillRect(ox + 25, 58 + legOff, 10, 4);

        // Body — orange prison shirt
        g.fillStyle(0xff6600);
        g.fillRoundedRect(ox + 10, 20, 28, 24, 3);

        // Prison number
        g.fillStyle(0x000000);
        g.fillRect(ox + 16, 28, 16, 2);
        g.fillRect(ox + 18, 32, 12, 2);

        // Head
        g.fillStyle(0xffcc99);
        g.fillCircle(ox + 24, 14, 10);

        // Hair
        g.fillStyle(0x3a3a3a);
        g.fillRoundedRect(ox + 14, 4, 20, 10, 4);

        // Eyes
        g.fillStyle(0x4488bb);
        g.fillCircle(ox + 20, 13, 2);
        g.fillCircle(ox + 28, 13, 2);
        g.fillStyle(0x000000);
        g.fillCircle(ox + 20, 13, 1);
        g.fillCircle(ox + 28, 13, 1);

        // Eyebrows — angry
        g.lineStyle(2, 0x3a3a3a);
        g.beginPath();
        g.moveTo(ox + 17, 10);
        g.lineTo(ox + 22, 11);
        g.strokePath();
        g.beginPath();
        g.moveTo(ox + 31, 10);
        g.lineTo(ox + 26, 11);
        g.strokePath();

        // Mouth
        g.lineStyle(1, 0x993333);
        g.beginPath();
        g.moveTo(ox + 20, 19);
        g.lineTo(ox + 28, 18);
        g.strokePath();

        // Arms
        g.fillStyle(0xff6600);
        g.fillRect(ox + 4, 22, 7, 16);
        g.fillRect(ox + 37, 22, 7, 16);

        // Hands
        g.fillStyle(0xffcc99);
        g.fillRect(ox + 5, 37, 5, 5);
        g.fillRect(ox + 38, 37, 5, 5);

        // Money bags (stolen investments)
        if (frame < 2) {
            g.fillStyle(0x228b22);
            g.fillCircle(ox + 42, 38, 6);
            g.fillStyle(0xffd700);
            g.fillRect(ox + 40, 36, 4, 4);
        }
    }

    g.generateTexture('boss_frey', frameW * 4, frameH);
    addSpriteFrames(scene, 'boss_frey', frameW, frameH, 4);
    g.destroy();
}

function generateBossProjectile(scene: Scene): void {
    const g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xffffff);
    g.fillRect(0, 0, 16, 20);
    g.fillStyle(0x333333);
    g.fillRect(2, 3, 12, 1);
    g.fillRect(2, 6, 10, 1);
    g.fillRect(2, 9, 12, 1);
    g.fillRect(2, 12, 8, 1);
    g.fillStyle(0xff0000, 0.6);
    g.fillRect(3, 14, 10, 4);
    g.generateTexture('fake_contract', 16, 20);
    g.destroy();
}

function generateCoin(scene: Scene): void {
    const g = scene.make.graphics({ x: 0, y: 0 });
    const frameW = 16, frameH = 16;

    for (let frame = 0; frame < 4; frame++) {
        const ox = frame * frameW;
        const widths = [14, 10, 6, 10];
        const w = widths[frame];

        g.fillStyle(0xffd700);
        g.fillRoundedRect(ox + 8 - w / 2, 1, w, 14, 3);
        g.fillStyle(0xffec80);
        g.fillRoundedRect(ox + 8 - w / 4, 3, w / 2, 10, 2);
    }

    g.generateTexture('coin', frameW * 4, frameH);
    addSpriteFrames(scene, 'coin', frameW, frameH, 4);
    g.destroy();
}

function generateHeart(scene: Scene): void {
    const g = scene.make.graphics({ x: 0, y: 0 });

    g.fillStyle(0xff2222);
    g.fillCircle(6, 6, 5);
    g.fillCircle(14, 6, 5);
    g.fillTriangle(1, 8, 10, 18, 19, 8);
    g.generateTexture('heart', 20, 20);

    g.clear();
    g.lineStyle(2, 0xff2222);
    g.strokeCircle(6, 6, 5);
    g.strokeCircle(14, 6, 5);
    g.beginPath();
    g.moveTo(1, 8);
    g.lineTo(10, 18);
    g.lineTo(19, 8);
    g.closePath();
    g.strokePath();
    g.generateTexture('heart_empty', 20, 20);
    g.destroy();
}

function generatePlatformTiles(scene: Scene): void {
    const g = scene.make.graphics({ x: 0, y: 0 });

    // Ground tile
    g.fillStyle(0x5a8a3c);
    g.fillRect(0, 0, 32, 32);
    g.fillStyle(0x4a7a2c);
    g.fillRect(0, 0, 32, 6);
    g.fillStyle(0x6aaa4c);
    for (let i = 0; i < 8; i++) {
        g.fillRect(i * 4 + 1, 0, 2, 4);
    }
    g.generateTexture('ground', 32, 32);

    // Platform tile
    g.clear();
    g.fillStyle(0x8b6b3d);
    g.fillRect(0, 0, 32, 16);
    g.fillStyle(0xa08050);
    g.fillRect(0, 0, 32, 4);
    g.lineStyle(1, 0x6b4b2d);
    g.beginPath();
    g.moveTo(0, 8);
    g.lineTo(32, 8);
    g.strokePath();
    g.generateTexture('platform', 32, 16);

    // Stone platform
    g.clear();
    g.fillStyle(0x888888);
    g.fillRect(0, 0, 32, 24);
    g.fillStyle(0x999999);
    g.fillRect(0, 0, 32, 4);
    g.fillStyle(0x777777);
    g.fillRect(4, 8, 24, 2);
    g.fillRect(8, 12, 16, 2);
    g.generateTexture('stone_platform', 32, 24);

    // Water tile
    g.clear();
    g.fillStyle(0x4488cc, 0.7);
    g.fillRect(0, 0, 32, 32);
    g.fillStyle(0x66aaee, 0.5);
    g.fillRect(0, 0, 16, 4);
    g.fillRect(16, 8, 16, 4);
    g.generateTexture('water', 32, 32);

    g.destroy();
}

function generateParallaxLayers(scene: Scene): void {
    const g = scene.make.graphics({ x: 0, y: 0 });
    const W = 800, H = 600;

    // Far background — sky + Mount Agung
    g.fillGradientStyle(0x87ceeb, 0x87ceeb, 0xb8e4f0, 0xb8e4f0);
    g.fillRect(0, 0, W, H);
    g.fillStyle(0xffd700, 0.8);
    g.fillCircle(650, 80, 40);
    g.fillStyle(0x5566aa, 0.5);
    g.fillTriangle(500, 400, 700, 100, 900, 400);
    g.fillStyle(0xffffff, 0.3);
    g.fillTriangle(680, 130, 700, 100, 720, 130);
    g.fillStyle(0x336644, 0.4);
    for (let i = 0; i < 10; i++) {
        const x = i * 90 + 20;
        g.fillRect(x, 350, 4, 50);
        g.fillCircle(x + 2, 340, 15);
    }
    g.generateTexture('bg_far', W, H);

    // Mid background — rice terraces
    g.clear();
    for (let i = 0; i < 6; i++) {
        const y = 300 + i * 50;
        const green = 0x3a8a3c + i * 0x080808;
        g.fillStyle(green, 0.7);
        g.fillRect(0, y, W, 50);
        g.fillStyle(0x8b6b3d, 0.5);
        g.fillRect(0, y, W, 3);
    }
    g.fillStyle(0x6aaa4c, 0.6);
    for (let i = 0; i < 80; i++) {
        const x = Math.floor(i * 10 + (i % 3) * 5);
        const row = Math.floor(i / 16);
        const y = 310 + row * 50;
        g.fillRect(x, y, 2, 12);
        g.fillRect(x - 2, y + 2, 6, 2);
    }
    g.generateTexture('bg_mid', W, H);

    // Candi Bentar gate
    g.clear();
    g.fillStyle(0x888888);
    g.fillRect(0, 0, 20, 80);
    g.fillRect(0, 0, 24, 10);
    g.fillRect(2, 10, 22, 8);
    g.fillRect(4, 18, 20, 8);
    g.fillRect(44, 0, 20, 80);
    g.fillRect(40, 0, 24, 10);
    g.fillRect(40, 10, 22, 8);
    g.fillRect(40, 18, 20, 8);
    g.fillStyle(0xffd700);
    g.fillRect(8, 26, 6, 4);
    g.fillRect(50, 26, 6, 4);
    g.generateTexture('gate', 64, 80);

    g.destroy();
}

function generateParticles(scene: Scene): void {
    const g = scene.make.graphics({ x: 0, y: 0 });

    g.fillStyle(0xff6600);
    g.fillCircle(4, 4, 4);
    g.generateTexture('particle_fire', 8, 8);

    g.clear();
    g.fillStyle(0xffd700);
    g.fillRect(1, 0, 2, 4);
    g.fillRect(0, 1, 4, 2);
    g.generateTexture('particle_sparkle', 4, 4);

    g.clear();
    g.fillStyle(0xcccccc, 0.5);
    g.fillCircle(4, 4, 4);
    g.generateTexture('particle_smoke', 8, 8);

    g.destroy();
}
