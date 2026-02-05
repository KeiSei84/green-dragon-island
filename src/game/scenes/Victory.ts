import { Scene } from 'phaser';
import { VirtualGamepad } from '../utils/VirtualGamepad';

export class Victory extends Scene {
    constructor() {
        super('Victory');
    }

    create() {
        VirtualGamepad.getInstance().hide();
        this.cameras.main.setBackgroundColor('#0a2a0a');

        if (this.textures.exists('bg_rice_terraces')) {
            const bg = this.add.image(400, 300, 'bg_rice_terraces');
            bg.setDisplaySize(800, 600);
            this.add.rectangle(400, 300, 800, 600, 0x0a2a0a, 0.7);
        }

        this.add.text(400, 120, 'VICTORY!', {
            fontFamily: 'Arial Black, Arial',
            fontSize: '64px',
            color: '#ffd700',
            stroke: '#2d8b46',
            strokeThickness: 6
        }).setOrigin(0.5);

        this.add.text(400, 210, 'Andre Frey has been defeated!', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ff6600'
        }).setOrigin(0.5);

        this.add.text(400, 260, 'The investors of Bali are safe.\nNaga Basuki protects the island once more.', {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#ffffff',
            align: 'center',
            lineSpacing: 6
        }).setOrigin(0.5);

        const dragon = this.add.sprite(400, 380, 'dragon', 0);
        dragon.setScale(4);
        dragon.play('dragon-walk');

        // Score display
        const score = this.registry.get('score') || 0;
        this.add.text(400, 460, `Nagamani Collected: ${score}`, {
            fontFamily: 'Arial',
            fontSize: '22px',
            color: '#ffd700'
        }).setOrigin(0.5);

        this.add.text(400, 510, 'Invest wisely at green-dragon.id', {
            fontFamily: 'Georgia, serif',
            fontSize: '16px',
            color: '#2d8b46'
        }).setOrigin(0.5);

        const restart = this.add.text(400, 560, '[ SPACE — Play Again ]', {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: restart,
            alpha: 0.3,
            duration: 600,
            yoyo: true,
            repeat: -1
        });

        this.input.keyboard!.once('keydown-SPACE', () => {
            this.registry.set('score', 0);
            this.registry.set('health', 3);
            VirtualGamepad.getInstance().show();
            this.scene.start('Level1');
        });

        // Touch — tap to play again
        this.input.once('pointerdown', () => {
            this.registry.set('score', 0);
            this.registry.set('health', 3);
            VirtualGamepad.getInstance().show();
            this.scene.start('Level1');
        });
    }
}
