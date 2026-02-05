import { Scene, Physics, GameObjects } from 'phaser';

/**
 * BOSS: Andre Frey — The Scammer of Ubud
 *
 * Context: German entrepreneur who built illegal "Russian Village" (PARQ Ubud)
 * on protected rice field land in Bali. Defrauded hundreds of investors.
 * Arrested January 2025 in orange prison uniform.
 *
 * Boss mechanics:
 * Phase 1 (100%-60% HP): Throws fake contracts, walks back and forth
 * Phase 2 (60%-30% HP): Faster, throws money bags, calls monkey henchmen
 * Phase 3 (30%-0% HP): Tries to flee, desperate attacks, vulnerable when tired
 */

const ARENA_WIDTH = 800;
const ARENA_HEIGHT = 600;
const BOSS_HP = 15;

export class BossFight extends Scene {
    private dragon!: Physics.Arcade.Sprite;
    private rider!: GameObjects.Sprite;
    private boss!: Physics.Arcade.Sprite;
    private platforms!: Physics.Arcade.StaticGroup;
    private fireballs!: Physics.Arcade.Group;
    private bossProjectiles!: Physics.Arcade.Group;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private fireKey!: Phaser.Input.Keyboard.Key;

    private playerHealth = 3;
    private bossHealth = BOSS_HP;
    private score = 0;
    private facingRight = true;
    private invulnerable = false;
    private bossInvulnerable = false;
    private canFlutter = false;
    private lastFireTime = 0;
    private lastBossAttack = 0;
    private bossPhase = 1;

    private bossHpBar!: GameObjects.Rectangle;
    private bossHpBarBg!: GameObjects.Rectangle;
    private bossNameText!: GameObjects.Text;
    private hearts: GameObjects.Image[] = [];
    private scoreText!: GameObjects.Text;
    private phaseText!: GameObjects.Text;

    constructor() {
        super('BossFight');
    }

    create() {
        this.playerHealth = this.registry.get('health') || 3;
        this.score = this.registry.get('score') || 0;
        this.bossHealth = BOSS_HP;
        this.bossPhase = 1;
        this.invulnerable = false;
        this.bossInvulnerable = false;

        // Arena background — DALL-E generated PARQ Ubud night scene
        this.cameras.main.setBackgroundColor('#0a0a1a');

        if (this.textures.exists('bg_boss_arena')) {
            const bg = this.add.image(400, 300, 'bg_boss_arena');
            bg.setDisplaySize(800, 600);
        } else {
            const bg = this.add.graphics();
            bg.fillGradientStyle(0x1a0a2a, 0x1a0a2a, 0x2a1a0a, 0x2a1a0a);
            bg.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
            bg.fillStyle(0xffffcc, 0.8);
            bg.fillCircle(650, 80, 30);
            bg.fillStyle(0x333333);
            bg.fillRect(50, 200, 80, 200);
            bg.fillRect(200, 250, 100, 150);
            bg.fillRect(500, 220, 90, 180);
            bg.fillRect(670, 260, 80, 140);
        }

        // "PARQ UBUD" sign overlay
        this.add.text(400, 180, 'PARQ UBUD — ILLEGAL COMPOUND', {
            fontFamily: 'Arial',
            fontSize: '12px',
            color: '#ff4444',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5, 0).setAlpha(0.7);

        // Platforms
        this.platforms = this.physics.add.staticGroup();

        // Arena floor
        for (let x = 0; x < ARENA_WIDTH; x += 32) {
            const tile = this.add.image(x + 16, ARENA_HEIGHT - 16, 'stone_platform');
            this.platforms.add(tile);
        }

        // Battle platforms
        const platPositions = [
            { x: 100, y: 440, w: 4 },
            { x: 300, y: 360, w: 3 },
            { x: 530, y: 440, w: 4 },
            { x: 650, y: 340, w: 3 },
            { x: 200, y: 280, w: 3 },
            { x: 450, y: 300, w: 3 },
        ];

        for (const p of platPositions) {
            for (let i = 0; i < p.w; i++) {
                const img = this.add.image(p.x + i * 32 + 16, p.y, 'platform');
                this.platforms.add(img);
            }
        }

        // Groups
        this.fireballs = this.physics.add.group({ allowGravity: false, maxSize: 10 });
        this.bossProjectiles = this.physics.add.group({ allowGravity: false, maxSize: 20 });

        // Dragon player
        this.dragon = this.physics.add.sprite(100, 500, 'dragon', 0);
        this.dragon.setCollideWorldBounds(true);
        this.dragon.setBounce(0.05);
        this.dragon.setSize(50, 36);
        this.dragon.setOffset(7, 10);

        this.rider = this.add.sprite(100, 480, 'player', 0).setScale(0.8);

        // Boss — Andre Frey
        this.boss = this.physics.add.sprite(650, 500, 'boss_frey', 0);
        this.boss.setCollideWorldBounds(true);
        this.boss.setBounce(0.1);
        this.boss.setSize(36, 56);
        this.boss.setOffset(6, 6);
        this.boss.play('boss-walk');

        // Collisions
        this.physics.add.collider(this.dragon, this.platforms);
        this.physics.add.collider(this.boss, this.platforms);
        this.physics.add.overlap(this.fireballs, this.boss, this.fireballHitBoss, undefined, this);
        this.physics.add.overlap(this.dragon, this.bossProjectiles, this.projectileHitPlayer, undefined, this);
        this.physics.add.overlap(this.dragon, this.boss, this.touchBoss, undefined, this);

        // HUD
        this.createBossHUD();

        // Controls
        this.cursors = this.input.keyboard!.createCursorKeys();
        this.fireKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.F);

        // Boss intro text
        const introText = this.add.text(400, 200, 'BOSS: ANDRE FREY\n"The Scammer of Ubud"', {
            fontFamily: 'Arial Black, Arial',
            fontSize: '28px',
            color: '#ff6600',
            align: 'center',
            stroke: '#000000',
            strokeThickness: 4,
            lineSpacing: 8
        }).setOrigin(0.5).setDepth(200);

        const subtitle = this.add.text(400, 280, 'Illegal developer | PARQ Ubud | Arrested Jan 2025', {
            fontFamily: 'Arial',
            fontSize: '14px',
            color: '#ff9999',
            align: 'center'
        }).setOrigin(0.5).setDepth(200);

        // Fade out intro text
        this.time.delayedCall(2500, () => {
            this.tweens.add({
                targets: [introText, subtitle],
                alpha: 0,
                duration: 500,
                onComplete: () => {
                    introText.destroy();
                    subtitle.destroy();
                }
            });
        });
    }

    private createBossHUD(): void {
        // Player hearts
        for (let i = 0; i < 3; i++) {
            const heart = this.add.image(30 + i * 28, 30, 'heart')
                .setScrollFactor(0).setDepth(100);
            this.hearts.push(heart);
        }
        this.updateHearts();

        // Score
        const coinIcon = this.add.sprite(660, 28, 'coin', 0)
            .setScrollFactor(0).setDepth(100);
        coinIcon.play('coin-spin');
        this.scoreText = this.add.text(680, 18, `${this.score}`, {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#ffd700',
            stroke: '#000000',
            strokeThickness: 3
        }).setScrollFactor(0).setDepth(100);

        // Boss HP bar
        this.bossNameText = this.add.text(400, 50, 'ANDRE FREY', {
            fontFamily: 'Arial Black, Arial',
            fontSize: '16px',
            color: '#ff6600',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(100);

        this.bossHpBarBg = this.add.rectangle(400, 70, 304, 16, 0x333333)
            .setDepth(100);
        this.bossHpBar = this.add.rectangle(400, 70, 300, 12, 0xff2222)
            .setDepth(101);

        this.phaseText = this.add.text(400, 86, 'Phase 1: Throwing Fake Contracts', {
            fontFamily: 'Arial',
            fontSize: '11px',
            color: '#cccccc'
        }).setOrigin(0.5).setDepth(100);
    }

    private updateHearts(): void {
        for (let i = 0; i < this.hearts.length; i++) {
            this.hearts[i].setTexture(i < this.playerHealth ? 'heart' : 'heart_empty');
        }
    }

    private updateBossHpBar(): void {
        const ratio = Math.max(0, this.bossHealth / BOSS_HP);
        this.bossHpBar.width = 300 * ratio;
        this.bossHpBar.x = 400 - (300 - 300 * ratio) / 2;

        // Color based on health
        if (ratio > 0.6) {
            this.bossHpBar.fillColor = 0xff2222;
        } else if (ratio > 0.3) {
            this.bossHpBar.fillColor = 0xff8800;
        } else {
            this.bossHpBar.fillColor = 0xffcc00;
        }
    }

    private fireballHitBoss(bossObj: any, fireballObj: any): void {
        if (this.bossInvulnerable) return;

        const fireball = fireballObj as Physics.Arcade.Sprite;
        fireball.destroy();

        this.bossHealth--;
        this.updateBossHpBar();

        // Boss flash
        this.bossInvulnerable = true;
        this.tweens.add({
            targets: this.boss,
            alpha: 0.3,
            duration: 80,
            yoyo: true,
            repeat: 4,
            onComplete: () => {
                this.bossInvulnerable = false;
                this.boss.setAlpha(1);
            }
        });

        // Knockback boss
        const dir = this.boss.x > this.dragon.x ? 1 : -1;
        this.boss.setVelocityX(200 * dir);
        this.boss.setVelocityY(-150);

        // Phase transitions
        const ratio = this.bossHealth / BOSS_HP;
        if (ratio <= 0.6 && this.bossPhase === 1) {
            this.bossPhase = 2;
            this.phaseText.setText('Phase 2: Desperate Attacks!');
            this.showBossDialogue('"You can\'t stop development!\nI have 30 businesses!"');
        } else if (ratio <= 0.3 && this.bossPhase === 2) {
            this.bossPhase = 3;
            this.phaseText.setText('Phase 3: Trying to Flee!');
            this.showBossDialogue('"I\'ll be back!\nI\'ll sell everything!"');
        }

        // Check for defeat
        if (this.bossHealth <= 0) {
            this.bossDefeated();
        }

        // Fire particles on hit
        if (this.add.particles) {
            const emitter = this.add.particles(this.boss.x, this.boss.y, 'particle_fire', {
                speed: { min: 50, max: 120 },
                lifespan: 300,
                quantity: 10,
                scale: { start: 2, end: 0 },
                emitting: false
            });
            emitter.explode(10);
            this.time.delayedCall(400, () => emitter.destroy());
        }
    }

    private projectileHitPlayer(playerObj: any, projObj: any): void {
        if (this.invulnerable) return;

        const proj = projObj as Physics.Arcade.Sprite;
        proj.destroy();

        this.playerHealth--;
        this.registry.set('health', this.playerHealth);
        this.updateHearts();

        if (this.playerHealth <= 0) {
            this.registry.set('score', this.score);
            this.scene.start('GameOver');
            return;
        }

        // Knockback
        this.invulnerable = true;
        this.dragon.setVelocityY(-250);
        this.dragon.setVelocityX(this.dragon.x < this.boss.x ? -200 : 200);

        this.tweens.add({
            targets: [this.dragon, this.rider],
            alpha: 0.3,
            duration: 100,
            yoyo: true,
            repeat: 8,
            onComplete: () => {
                this.invulnerable = false;
                this.dragon.setAlpha(1);
                this.rider.setAlpha(1);
            }
        });
    }

    private touchBoss(_player: any, _boss: any): void {
        if (this.invulnerable) return;

        const body = this.dragon.body as Phaser.Physics.Arcade.Body;

        // Stomp on boss from above → deal damage
        if (body.velocity.y > 0 && this.dragon.y < this.boss.y - 20) {
            this.dragon.setVelocityY(-400);

            if (!this.bossInvulnerable) {
                this.bossHealth -= 2;
                this.updateBossHpBar();

                this.bossInvulnerable = true;
                this.tweens.add({
                    targets: this.boss,
                    alpha: 0.3,
                    duration: 80,
                    yoyo: true,
                    repeat: 4,
                    onComplete: () => {
                        this.bossInvulnerable = false;
                        this.boss.setAlpha(1);
                    }
                });

                this.boss.setVelocityY(-200);
                this.showBossDialogue('"Ouch! You can\'t do this to me!"');

                const ratio = this.bossHealth / BOSS_HP;
                if (ratio <= 0.6 && this.bossPhase === 1) {
                    this.bossPhase = 2;
                    this.phaseText.setText('Phase 2: Desperate Attacks!');
                } else if (ratio <= 0.3 && this.bossPhase === 2) {
                    this.bossPhase = 3;
                    this.phaseText.setText('Phase 3: Trying to Flee!');
                }

                if (this.bossHealth <= 0) {
                    this.bossDefeated();
                }
            }
            return;
        }

        // Side/bottom collision → player takes damage
        this.projectileHitPlayer(_player, { destroy: () => {} });
    }

    private showBossDialogue(text: string): void {
        const dialogue = this.add.text(this.boss.x, this.boss.y - 60, text, {
            fontFamily: 'Arial',
            fontSize: '14px',
            color: '#ffffff',
            backgroundColor: '#000000aa',
            padding: { x: 8, y: 4 },
            align: 'center'
        }).setOrigin(0.5).setDepth(150);

        this.tweens.add({
            targets: dialogue,
            y: dialogue.y - 40,
            alpha: 0,
            duration: 2500,
            onComplete: () => dialogue.destroy()
        });
    }

    private bossAttack(): void {
        const now = this.time.now;
        const cooldown = this.bossPhase === 1 ? 1500 : this.bossPhase === 2 ? 800 : 500;

        if (now - this.lastBossAttack < cooldown) return;
        this.lastBossAttack = now;

        const dir = this.dragon.x < this.boss.x ? -1 : 1;

        if (this.bossPhase === 1) {
            // Phase 1: Single fake contract throw
            this.throwContract(dir);
        } else if (this.bossPhase === 2) {
            // Phase 2: Double throw + occasional money bags
            this.throwContract(dir);
            this.time.delayedCall(200, () => this.throwContract(dir, -100));

            if (Math.random() < 0.3) {
                this.throwMoneyBag(dir);
            }
        } else {
            // Phase 3: Scattered desperate throws
            this.throwContract(dir, -50);
            this.throwContract(dir, 50);
            this.throwContract(dir, 0);
        }
    }

    private throwContract(dir: number, yOffset = 0): void {
        const proj = this.bossProjectiles.create(
            this.boss.x + dir * 25,
            this.boss.y - 10 + yOffset,
            'fake_contract'
        ) as Physics.Arcade.Sprite;

        if (!proj) return;

        const speed = this.bossPhase === 1 ? 200 : this.bossPhase === 2 ? 280 : 350;
        proj.setVelocityX(speed * dir);
        proj.setVelocityY(Phaser.Math.Between(-80, 40));
        proj.setAngularVelocity(300 * dir);
        proj.setSize(12, 16);

        this.time.delayedCall(3000, () => {
            if (proj.active) proj.destroy();
        });
    }

    private throwMoneyBag(dir: number): void {
        // Money bag — larger, bouncing projectile
        const proj = this.bossProjectiles.create(
            this.boss.x + dir * 25,
            this.boss.y - 20,
            'fake_contract' // reuse texture, scaled up
        ) as Physics.Arcade.Sprite;

        if (!proj) return;

        proj.setScale(2);
        proj.setTint(0x00ff00); // green for money
        proj.setVelocityX(150 * dir);
        proj.setVelocityY(-200);
        (proj.body as Physics.Arcade.Body).setAllowGravity(true);
        (proj.body as Physics.Arcade.Body).setBounce(0.6);

        this.time.delayedCall(4000, () => {
            if (proj.active) proj.destroy();
        });
    }

    private bossDefeated(): void {
        this.boss.setVelocity(0);
        this.boss.setTint(0x666666);
        this.boss.stop();

        // Boss falls
        this.tweens.add({
            targets: this.boss,
            angle: 90,
            alpha: 0.5,
            duration: 1000
        });

        // Defeat text
        this.add.text(400, 250, 'ANDRE FREY DEFEATED!', {
            fontFamily: 'Arial Black, Arial',
            fontSize: '32px',
            color: '#ffd700',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(200);

        this.add.text(400, 300, '"Justice for the investors of Bali!"', {
            fontFamily: 'Georgia, serif',
            fontSize: '18px',
            color: '#ffffff'
        }).setOrigin(0.5).setDepth(200);

        // Drop coins
        for (let i = 0; i < 20; i++) {
            const coin = this.add.sprite(
                this.boss.x + Phaser.Math.Between(-50, 50),
                this.boss.y + Phaser.Math.Between(-80, -20),
                'coin', 0
            );
            coin.play('coin-spin');
            this.tweens.add({
                targets: coin,
                y: coin.y + Phaser.Math.Between(50, 150),
                x: coin.x + Phaser.Math.Between(-60, 60),
                alpha: 0,
                duration: 2000,
                delay: i * 50,
                ease: 'Bounce.easeOut'
            });
        }

        this.score += 50;
        this.scoreText.setText(`${this.score}`);
        this.registry.set('score', this.score);

        // Transition to victory
        this.time.delayedCall(3000, () => {
            this.scene.start('Victory');
        });
    }

    private shootFireball(): void {
        const now = this.time.now;
        if (now - this.lastFireTime < 350) return;
        this.lastFireTime = now;

        const dir = this.facingRight ? 1 : -1;
        const x = this.dragon.x + dir * 35;
        const y = this.dragon.y - 5;

        const fb = this.fireballs.create(x, y, 'fireball') as Physics.Arcade.Sprite;
        if (!fb) return;

        fb.setVelocityX(500 * dir);
        fb.setSize(12, 12);

        this.time.delayedCall(2000, () => {
            if (fb.active) fb.destroy();
        });
    }

    update() {
        if (this.bossHealth <= 0) return;

        const body = this.dragon.body as Physics.Arcade.Body;
        const onGround = body.blocked.down;

        // Player controls
        if (this.cursors.left.isDown) {
            this.dragon.setVelocityX(-220);
            this.dragon.setFlipX(true);
            this.facingRight = false;
            this.dragon.play('dragon-walk', true);
        } else if (this.cursors.right.isDown) {
            this.dragon.setVelocityX(220);
            this.dragon.setFlipX(false);
            this.facingRight = true;
            this.dragon.play('dragon-walk', true);
        } else {
            this.dragon.setVelocityX(0);
            this.dragon.stop();
        }

        // Jump + flutter
        if (onGround) {
            this.canFlutter = true;
            if (Phaser.Input.Keyboard.JustDown(this.cursors.space!) ||
                Phaser.Input.Keyboard.JustDown(this.cursors.up!)) {
                this.dragon.setVelocityY(-480);
            }
        } else if (this.canFlutter &&
            (Phaser.Input.Keyboard.JustDown(this.cursors.space!) ||
             Phaser.Input.Keyboard.JustDown(this.cursors.up!))) {
            this.dragon.setVelocityY(-320);
            this.canFlutter = false;
        }

        // Fire
        if (Phaser.Input.Keyboard.JustDown(this.fireKey)) {
            this.shootFireball();
        }

        // Rider follows
        this.rider.setPosition(
            this.dragon.x + (this.facingRight ? -5 : 5),
            this.dragon.y - 22
        );
        this.rider.setFlipX(!this.facingRight);

        // Boss AI
        this.updateBossAI();
    }

    private updateBossAI(): void {
        if (this.bossHealth <= 0) return;

        const dx = this.dragon.x - this.boss.x;
        const distance = Math.abs(dx);

        if (this.bossPhase === 1) {
            // Phase 1: Walk toward player, keep medium distance
            if (distance > 250) {
                this.boss.setVelocityX(dx > 0 ? 80 : -80);
            } else if (distance < 150) {
                this.boss.setVelocityX(dx > 0 ? -60 : 60);
            } else {
                this.boss.setVelocityX(0);
            }
            this.boss.setFlipX(dx < 0);
        } else if (this.bossPhase === 2) {
            // Phase 2: More aggressive, jumps
            if (distance > 200) {
                this.boss.setVelocityX(dx > 0 ? 120 : -120);
            } else if (distance < 100) {
                this.boss.setVelocityX(dx > 0 ? -100 : 100);
            }
            this.boss.setFlipX(dx < 0);

            // Occasional jumps
            const bossBody = this.boss.body as Physics.Arcade.Body;
            if (bossBody.blocked.down && Math.random() < 0.02) {
                this.boss.setVelocityY(-350);
            }
        } else {
            // Phase 3: Fleeing! Run away from player
            this.boss.setVelocityX(dx > 0 ? -160 : 160);
            this.boss.setFlipX(dx > 0);

            // Desperate jumps
            const bossBody = this.boss.body as Physics.Arcade.Body;
            if (bossBody.blocked.down && Math.random() < 0.04) {
                this.boss.setVelocityY(-400);
            }

            // Sometimes stop and attack in panic
            if (Math.random() < 0.005) {
                this.boss.setVelocityX(0);
                this.showBossDialogue('"The permits are coming!\nI swear!"');
            }
        }

        // Attack
        this.bossAttack();
    }
}
