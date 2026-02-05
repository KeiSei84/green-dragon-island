import { Scene, Physics, GameObjects, Types } from 'phaser';
import { VirtualGamepad } from '../utils/VirtualGamepad';

type ArcadeObject = Types.Physics.Arcade.GameObjectWithBody | Physics.Arcade.Body | Physics.Arcade.StaticBody | Phaser.Tilemaps.Tile;

const LEVEL_WIDTH = 6400;
const LEVEL_HEIGHT = 600;
const PLAYER_SPEED = 220;
const JUMP_VELOCITY = -480;
const FLUTTER_VELOCITY = -320;
const FIREBALL_SPEED = 500;
const FIRE_COOLDOWN = 400;

interface DragonPlayer {
    sprite: Physics.Arcade.Sprite;
    rider: GameObjects.Sprite;
    facingRight: boolean;
    canFlutter: boolean;
    isFluttering: boolean;
}

export class Level1 extends Scene {
    private dragon!: DragonPlayer;
    private cursors!: Types.Input.Keyboard.CursorKeys;
    private fireKey!: Phaser.Input.Keyboard.Key;
    private platforms!: Physics.Arcade.StaticGroup;
    private coins!: Physics.Arcade.Group;
    private enemies!: Physics.Arcade.Group;
    private fireballs!: Physics.Arcade.Group;
    private score = 0;
    private health = 3;
    private scoreText!: GameObjects.Text;
    private hearts: GameObjects.Image[] = [];
    private lastFireTime = 0;
    private bgFar!: GameObjects.TileSprite;
    private bgMid!: GameObjects.TileSprite;
    private invulnerable = false;

    constructor() {
        super('Level1');
    }

    create() {
        this.score = this.registry.get('score') || 0;
        this.health = this.registry.get('health') || 3;
        this.hearts = [];
        this.invulnerable = false;
        this.lastFireTime = 0;

        // Physics bounds
        this.physics.world.setBounds(0, 0, LEVEL_WIDTH, LEVEL_HEIGHT);

        // Parallax backgrounds — use DALL-E generated if available, fallback to procedural
        const hasDalleBg = this.textures.exists('bg_rice_terraces');

        if (hasDalleBg) {
            // DALL-E background as parallax layer
            this.bgFar = this.add.tileSprite(0, 0, 800, 600, 'bg_rice_terraces')
                .setOrigin(0, 0).setScrollFactor(0);
            this.bgMid = this.add.tileSprite(0, 0, 800, 600, 'bg_rice_terraces')
                .setOrigin(0, 0).setScrollFactor(0).setAlpha(0);
        } else {
            this.bgFar = this.add.tileSprite(0, 0, 800, 600, 'bg_far')
                .setOrigin(0, 0).setScrollFactor(0);
            this.bgMid = this.add.tileSprite(0, 0, 800, 600, 'bg_mid')
                .setOrigin(0, 0).setScrollFactor(0);
        }

        // Platforms
        this.platforms = this.physics.add.staticGroup();
        this.buildLevel();

        // Coins
        this.coins = this.physics.add.group({ allowGravity: false });
        this.spawnCoins();

        // Enemies
        this.enemies = this.physics.add.group({ allowGravity: false });
        this.spawnEnemies();

        // Fireballs group
        this.fireballs = this.physics.add.group({
            allowGravity: false,
            maxSize: 10
        });

        // Dragon + rider
        this.createPlayer(100, 400);

        // Collisions
        this.physics.add.collider(this.dragon.sprite, this.platforms);
        this.physics.add.overlap(this.dragon.sprite, this.coins, this.collectCoin, undefined, this);
        this.physics.add.overlap(this.dragon.sprite, this.enemies, this.hitEnemy, undefined, this);
        this.physics.add.overlap(this.fireballs, this.enemies, this.fireballHitEnemy, undefined, this);
        this.physics.add.collider(this.enemies, this.platforms);

        // Camera
        this.cameras.main.setBounds(0, 0, LEVEL_WIDTH, LEVEL_HEIGHT);
        this.cameras.main.startFollow(this.dragon.sprite, true, 0.1, 0.1);
        this.cameras.main.setDeadzone(100, 50);

        // HUD (fixed to camera)
        this.createHUD();

        // Controls
        this.cursors = this.input.keyboard!.createCursorKeys();
        this.fireKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.F);

        // Decorative gates as checkpoints
        this.addGates();
    }

    private createPlayer(x: number, y: number): void {
        const sprite = this.physics.add.sprite(x, y, 'dragon', 0);
        sprite.setCollideWorldBounds(true);
        sprite.setBounce(0.05);
        sprite.setSize(50, 36);
        sprite.setOffset(7, 10);

        const rider = this.add.sprite(x, y - 20, 'player', 0);
        rider.setScale(0.8);

        this.dragon = {
            sprite,
            rider,
            facingRight: true,
            canFlutter: false,
            isFluttering: false
        };
    }

    private buildLevel(): void {
        // Ground floor — rice terrace base
        for (let x = 0; x < LEVEL_WIDTH; x += 32) {
            // Ground with gaps for pits
            const isGap = (x > 800 && x < 900) ||
                          (x > 1600 && x < 1700) ||
                          (x > 2800 && x < 2920) ||
                          (x > 4200 && x < 4340);

            if (!isGap) {
                const tile = this.add.image(x + 16, LEVEL_HEIGHT - 16, 'ground');
                this.platforms.add(tile);
                // Second layer of ground (visual depth only, no physics)
                this.add.image(x + 16, LEVEL_HEIGHT - 48, 'ground');
            }
        }

        // Water in pits
        this.addWaterPit(800, 900);
        this.addWaterPit(1600, 1700);
        this.addWaterPit(2800, 2920);
        this.addWaterPit(4200, 4340);

        // Terrace platforms — ascending staircase pattern
        const terraces = [
            // Section 1: Intro terraces
            { x: 200, y: 480, w: 4 },
            { x: 350, y: 400, w: 3 },
            { x: 500, y: 340, w: 4 },
            { x: 680, y: 420, w: 3 },

            // Section 2: After first gap
            { x: 960, y: 440, w: 5 },
            { x: 1100, y: 360, w: 3 },
            { x: 1250, y: 300, w: 4 },
            { x: 1400, y: 380, w: 3 },
            { x: 1500, y: 460, w: 3 },

            // Section 3: Climbing section
            { x: 1780, y: 480, w: 3 },
            { x: 1900, y: 400, w: 3 },
            { x: 2020, y: 320, w: 3 },
            { x: 2150, y: 260, w: 4 },
            { x: 2350, y: 340, w: 3 },
            { x: 2500, y: 420, w: 5 },
            { x: 2700, y: 360, w: 3 },

            // Section 4: Temple area
            { x: 3000, y: 440, w: 6 },
            { x: 3200, y: 360, w: 4 },
            { x: 3400, y: 300, w: 3 },
            { x: 3550, y: 380, w: 4 },
            { x: 3750, y: 440, w: 5 },

            // Section 5: Final approach to boss
            { x: 4000, y: 380, w: 3 },
            { x: 4120, y: 300, w: 3 },
            { x: 4400, y: 440, w: 6 },
            { x: 4650, y: 380, w: 4 },
            { x: 4850, y: 320, w: 3 },
            { x: 5000, y: 400, w: 5 },
            { x: 5250, y: 460, w: 4 },
            { x: 5500, y: 400, w: 6 },

            // Boss arena entrance
            { x: 5800, y: 440, w: 8 },
        ];

        for (const t of terraces) {
            for (let i = 0; i < t.w; i++) {
                const px = t.x + i * 32;
                const img = this.add.image(px + 16, t.y, 'platform');
                this.platforms.add(img);
            }
        }

        // Stone platforms near temple areas
        const stones = [
            { x: 3000, y: 360, w: 3 },
            { x: 3300, y: 280, w: 2 },
            { x: 5700, y: 380, w: 4 },
        ];

        for (const s of stones) {
            for (let i = 0; i < s.w; i++) {
                const px = s.x + i * 32;
                const img = this.add.image(px + 16, s.y, 'stone_platform');
                this.platforms.add(img);
            }
        }
    }

    private addWaterPit(startX: number, endX: number): void {
        for (let x = startX; x < endX; x += 32) {
            const water = this.add.image(x + 16, LEVEL_HEIGHT - 16, 'water');
            water.setAlpha(0.7);
            // Animated wave effect
            this.tweens.add({
                targets: water,
                y: water.y - 3,
                duration: 1000 + Math.random() * 500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }

    private addGates(): void {
        // Candi Bentar gates as visual checkpoints
        const gatePositions = [1500, 3000, 5600];
        for (const x of gatePositions) {
            this.add.image(x, LEVEL_HEIGHT - 112, 'gate').setDepth(0);
        }
    }

    private spawnCoins(): void {
        const coinPositions = [
            // Arcs and lines of coins along the path
            ...this.generateCoinArc(250, 440, 5),
            ...this.generateCoinArc(500, 300, 4),
            ...this.generateCoinArc(1000, 400, 6),
            ...this.generateCoinArc(1300, 260, 4),
            ...this.generateCoinArc(1900, 360, 5),
            ...this.generateCoinArc(2200, 220, 5),
            ...this.generateCoinArc(2600, 320, 4),
            ...this.generateCoinArc(3100, 320, 6),
            ...this.generateCoinArc(3500, 260, 4),
            ...this.generateCoinArc(4000, 340, 5),
            ...this.generateCoinArc(4500, 400, 6),
            ...this.generateCoinArc(5100, 360, 5),
            ...this.generateCoinArc(5400, 360, 4),
        ];

        for (const pos of coinPositions) {
            const coin = this.coins.create(pos.x, pos.y, 'coin', 0) as Physics.Arcade.Sprite;
            coin.play('coin-spin');
            coin.setSize(12, 12);
        }
    }

    private generateCoinArc(startX: number, baseY: number, count: number): { x: number; y: number }[] {
        const result: { x: number; y: number }[] = [];
        for (let i = 0; i < count; i++) {
            const t = count <= 1 ? 0 : i / (count - 1);
            result.push({
                x: startX + i * 30,
                y: baseY - Math.sin(t * Math.PI) * 40
            });
        }
        return result;
    }

    private spawnEnemies(): void {
        // Monkeys — ground patrol enemies
        const monkeyPositions = [
            { x: 600, y: 536 }, { x: 1050, y: 536 },
            { x: 1800, y: 536 }, { x: 2400, y: 536 },
            { x: 3200, y: 536 }, { x: 3800, y: 536 },
            { x: 4600, y: 536 }, { x: 5200, y: 536 },
        ];

        for (const pos of monkeyPositions) {
            const monkey = this.enemies.create(pos.x, pos.y, 'monkey', 0) as Physics.Arcade.Sprite;
            monkey.play('monkey-walk');
            monkey.setData('type', 'monkey');
            monkey.setData('startX', pos.x);
            (monkey.body as Physics.Arcade.Body).setAllowGravity(true);
            monkey.setSize(24, 28);
            monkey.setVelocityX(60);
            monkey.setData('patrolRange', 120);
        }

        // Leyaks — flying enemies
        const leyakPositions = [
            { x: 900, y: 300 }, { x: 1400, y: 250 },
            { x: 2100, y: 200 }, { x: 2800, y: 280 },
            { x: 3500, y: 220 }, { x: 4100, y: 260 },
            { x: 4800, y: 200 }, { x: 5400, y: 250 },
        ];

        for (const pos of leyakPositions) {
            const leyak = this.enemies.create(pos.x, pos.y, 'leyak', 0) as Physics.Arcade.Sprite;
            leyak.play('leyak-float');
            leyak.setData('type', 'leyak');
            leyak.setData('startX', pos.x);
            leyak.setData('startY', pos.y);
            leyak.setSize(24, 28);

            // Float in a sine wave pattern
            this.tweens.add({
                targets: leyak,
                y: pos.y - 40,
                duration: 1500 + Math.random() * 1000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }

    private createHUD(): void {
        // Hearts
        for (let i = 0; i < 3; i++) {
            const heart = this.add.image(30 + i * 28, 30, 'heart')
                .setScrollFactor(0).setDepth(100);
            this.hearts.push(heart);
        }
        this.updateHearts();

        // Score
        this.scoreText = this.add.text(680, 18, `${this.score}`, {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#ffd700',
            stroke: '#000000',
            strokeThickness: 3
        }).setScrollFactor(0).setDepth(100);

        // Coin icon next to score
        const coinIcon = this.add.sprite(660, 28, 'coin', 0)
            .setScrollFactor(0).setDepth(100);
        coinIcon.play('coin-spin');

        // Fire breath indicator
        this.add.text(15, 560, '[F] Fire', {
            fontFamily: 'Arial',
            fontSize: '12px',
            color: '#ff6600',
            stroke: '#000000',
            strokeThickness: 2
        }).setScrollFactor(0).setDepth(100);

        // Level name
        this.add.text(400, 18, 'Tegallalang Rice Terraces', {
            fontFamily: 'Arial',
            fontSize: '14px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setScrollFactor(0).setDepth(100).setOrigin(0.5, 0);
    }

    private updateHearts(): void {
        for (let i = 0; i < this.hearts.length; i++) {
            this.hearts[i].setTexture(i < this.health ? 'heart' : 'heart_empty');
        }
    }

    private collectCoin(_player: ArcadeObject, coinObj: ArcadeObject): void {
        const coin = coinObj as Physics.Arcade.Sprite;
        coin.destroy();
        this.score++;
        this.scoreText.setText(`${this.score}`);
        this.registry.set('score', this.score);

        // Sparkle effect
        if (this.add.particles) {
            const emitter = this.add.particles(coin.x, coin.y, 'particle_sparkle', {
                speed: { min: 30, max: 80 },
                lifespan: 400,
                quantity: 6,
                scale: { start: 1.5, end: 0 },
                emitting: false
            });
            emitter.explode(6);
            this.time.delayedCall(500, () => emitter.destroy());
        }
    }

    private hitEnemy(_player: ArcadeObject, _enemy: ArcadeObject): void {
        if (this.invulnerable) return;

        const enemy = _enemy as Physics.Arcade.Sprite;
        const body = this.dragon.sprite.body as Physics.Arcade.Body;

        // Stomp: if dragon is falling and above the enemy → kill enemy
        if (body.velocity.y > 0 && this.dragon.sprite.y < enemy.y - 10) {
            this.stompEnemy(enemy);
            return;
        }

        // Otherwise take damage
        this.health--;
        this.registry.set('health', this.health);
        this.updateHearts();

        if (this.health <= 0) {
            this.registry.set('score', this.score);
            this.scene.start('GameOver');
            return;
        }

        // Knockback
        this.invulnerable = true;
        this.dragon.sprite.setVelocityY(-300);
        this.dragon.sprite.setVelocityX(this.dragon.facingRight ? -200 : 200);

        // Flash effect
        this.tweens.add({
            targets: [this.dragon.sprite, this.dragon.rider],
            alpha: 0.3,
            duration: 100,
            yoyo: true,
            repeat: 8,
            onComplete: () => {
                this.invulnerable = false;
                this.dragon.sprite.setAlpha(1);
                this.dragon.rider.setAlpha(1);
            }
        });
    }

    private stompEnemy(enemy: Physics.Arcade.Sprite): void {
        // Bounce dragon up
        this.dragon.sprite.setVelocityY(-350);
        this.dragon.canFlutter = true;

        // Squash animation + destroy enemy
        this.tweens.add({
            targets: enemy,
            scaleY: 0.1,
            scaleX: 1.5,
            alpha: 0,
            duration: 200,
            onComplete: () => enemy.destroy()
        });

        this.score += 3;
        this.scoreText.setText(`${this.score}`);
        this.registry.set('score', this.score);

        // Particles
        if (this.add.particles) {
            const emitter = this.add.particles(enemy.x, enemy.y, 'particle_smoke', {
                speed: { min: 30, max: 70 },
                lifespan: 300,
                quantity: 5,
                scale: { start: 1.2, end: 0 },
                emitting: false
            });
            emitter.explode(5);
            this.time.delayedCall(400, () => emitter.destroy());
        }
    }

    private fireballHitEnemy(fireballObj: ArcadeObject, enemyObj: ArcadeObject): void {
        const fireball = fireballObj as Physics.Arcade.Sprite;
        const enemy = enemyObj as Physics.Arcade.Sprite;

        fireball.destroy();

        // Fire explosion effect
        if (this.add.particles) {
            const emitter = this.add.particles(enemy.x, enemy.y, 'particle_fire', {
                speed: { min: 40, max: 100 },
                lifespan: 300,
                quantity: 8,
                scale: { start: 1.5, end: 0 },
                emitting: false
            });
            emitter.explode(8);
            this.time.delayedCall(400, () => emitter.destroy());
        }

        enemy.destroy();
        this.score += 5;
        this.scoreText.setText(`${this.score}`);
        this.registry.set('score', this.score);
    }

    private shootFireball(): void {
        const now = this.time.now;
        if (now - this.lastFireTime < FIRE_COOLDOWN) return;
        this.lastFireTime = now;

        const dir = this.dragon.facingRight ? 1 : -1;
        const x = this.dragon.sprite.x + dir * 35;
        const y = this.dragon.sprite.y - 5;

        const fb = this.fireballs.create(x, y, 'fireball') as Physics.Arcade.Sprite;
        if (!fb) return;

        fb.setVelocityX(FIREBALL_SPEED * dir);
        fb.setSize(12, 12);

        // Destroy after 2 seconds
        this.time.delayedCall(2000, () => {
            if (fb.active) fb.destroy();
        });

        // Smoke puff at dragon mouth
        if (this.add.particles) {
            const emitter = this.add.particles(x, y, 'particle_smoke', {
                speed: { min: 10, max: 30 },
                lifespan: 200,
                quantity: 3,
                scale: { start: 1, end: 0 },
                emitting: false
            });
            emitter.explode(3);
            this.time.delayedCall(300, () => emitter.destroy());
        }
    }

    update(_time: number, _delta: number) {
        const gp = VirtualGamepad.getInstance();
        gp.tick();

        const body = this.dragon.sprite.body as Physics.Arcade.Body;
        const onGround = body.blocked.down;

        const kbJumpJust = Phaser.Input.Keyboard.JustDown(this.cursors.space!) ||
            Phaser.Input.Keyboard.JustDown(this.cursors.up!);

        // Horizontal movement
        if (this.cursors.left.isDown || gp.state.left) {
            this.dragon.sprite.setVelocityX(-PLAYER_SPEED);
            this.dragon.sprite.setFlipX(true);
            this.dragon.facingRight = false;
            this.dragon.sprite.play('dragon-walk', true);
        } else if (this.cursors.right.isDown || gp.state.right) {
            this.dragon.sprite.setVelocityX(PLAYER_SPEED);
            this.dragon.sprite.setFlipX(false);
            this.dragon.facingRight = true;
            this.dragon.sprite.play('dragon-walk', true);
        } else {
            this.dragon.sprite.setVelocityX(0);
            this.dragon.sprite.stop();
        }

        // Jump
        if (onGround) {
            this.dragon.canFlutter = true;
            this.dragon.isFluttering = false;

            if (kbJumpJust || gp.state.jumpJustDown) {
                this.dragon.sprite.setVelocityY(JUMP_VELOCITY);
            }
        } else {
            // Flutter jump (double jump / hold for float)
            if (this.dragon.canFlutter && (kbJumpJust || gp.state.jumpJustDown)) {
                this.dragon.sprite.setVelocityY(FLUTTER_VELOCITY);
                this.dragon.canFlutter = false;
                this.dragon.isFluttering = true;

                // Wing flap particles
                if (this.add.particles) {
                    const emitter = this.add.particles(
                        this.dragon.sprite.x, this.dragon.sprite.y + 10,
                        'particle_smoke',
                        {
                            speed: { min: 20, max: 50 },
                            lifespan: 200,
                            quantity: 4,
                            scale: { start: 0.8, end: 0 },
                            emitting: false
                        }
                    );
                    emitter.explode(4);
                    this.time.delayedCall(300, () => emitter.destroy());
                }
            }
        }

        // Fire breath
        if (Phaser.Input.Keyboard.JustDown(this.fireKey) || gp.state.fireJustDown) {
            this.shootFireball();
        }

        // Rider follows dragon
        this.dragon.rider.setPosition(
            this.dragon.sprite.x + (this.dragon.facingRight ? -5 : 5),
            this.dragon.sprite.y - 22
        );
        this.dragon.rider.setFlipX(!this.dragon.facingRight);

        // Parallax scrolling
        this.bgFar.tilePositionX = this.cameras.main.scrollX * 0.1;
        this.bgMid.tilePositionX = this.cameras.main.scrollX * 0.4;

        // Enemy AI — patrol
        this.enemies.children.each((child): boolean => {
            const enemy = child as Physics.Arcade.Sprite;
            if (!enemy.active) return true;

            if (enemy.getData('type') === 'monkey') {
                const startX = enemy.getData('startX') as number;
                const range = enemy.getData('patrolRange') as number;
                const vx = (enemy.body as Physics.Arcade.Body).velocity.x;

                if (enemy.x > startX + range && vx > 0) {
                    enemy.setVelocityX(-60);
                    enemy.setFlipX(false);
                } else if (enemy.x < startX - range && vx < 0) {
                    enemy.setVelocityX(60);
                    enemy.setFlipX(true);
                }
            }

            if (enemy.getData('type') === 'leyak') {
                const startX = enemy.getData('startX') as number;
                const dx = this.dragon.sprite.x - enemy.x;
                if (Math.abs(dx) < 400) {
                    enemy.setVelocityX(dx > 0 ? 30 : -30);
                } else {
                    const homeDx = startX - enemy.x;
                    enemy.setVelocityX(homeDx > 0 ? 20 : -20);
                }
            }

            return true;
        });

        // Fall into pit = instant death
        if (this.dragon.sprite.y > LEVEL_HEIGHT - 10) {
            this.health = 0;
            this.registry.set('health', 0);
            this.registry.set('score', this.score);
            this.scene.start('GameOver');
        }

        // Reach end of level = boss fight
        if (this.dragon.sprite.x > LEVEL_WIDTH - 200) {
            this.registry.set('score', this.score);
            this.registry.set('health', this.health);
            this.scene.start('BossFight');
        }
    }
}
