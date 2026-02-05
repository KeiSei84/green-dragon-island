import { Scene } from 'phaser';
import { VirtualGamepad } from '../utils/VirtualGamepad';

export class GameOver extends Scene {
    constructor() {
        super('GameOver');
    }

    create() {
        VirtualGamepad.getInstance().hide();
        this.cameras.main.setBackgroundColor('#1a0000');

        this.add.text(400, 150, 'GAME OVER', {
            fontFamily: 'Arial Black, Arial',
            fontSize: '64px',
            color: '#ff2222',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        this.add.text(400, 240, 'Andre Frey escaped with the money...', {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#ff6600'
        }).setOrigin(0.5);

        this.add.text(400, 290, 'But Naga Basuki never gives up.\nTry again!', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#cccccc',
            align: 'center',
            lineSpacing: 6
        }).setOrigin(0.5);

        const score = this.registry.get('score') || 0;
        this.add.text(400, 360, `Nagamani Collected: ${score}`, {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#ffd700'
        }).setOrigin(0.5);

        const restart = this.add.text(400, 440, '[ SPACE — Try Again ]', {
            fontFamily: 'Arial',
            fontSize: '22px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: restart,
            alpha: 0.3,
            duration: 600,
            yoyo: true,
            repeat: -1
        });

        this.add.text(400, 490, '[ M — Main Menu ]', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#888888'
        }).setOrigin(0.5);

        this.input.keyboard!.once('keydown-SPACE', () => {
            this.registry.set('score', 0);
            this.registry.set('health', 3);
            VirtualGamepad.getInstance().show();
            this.scene.start('Level1');
        });

        this.input.keyboard!.once('keydown-M', () => {
            this.registry.set('score', 0);
            this.registry.set('health', 3);
            this.scene.start('MainMenu');
        });

        // Touch — tap to retry
        this.input.once('pointerdown', () => {
            this.registry.set('score', 0);
            this.registry.set('health', 3);
            VirtualGamepad.getInstance().show();
            this.scene.start('Level1');
        });
    }
}
