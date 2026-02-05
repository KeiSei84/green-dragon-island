import { AUTO, Game, Types } from 'phaser';
import { Boot } from './scenes/Boot';
import { MainMenu } from './scenes/MainMenu';
import { Level1 } from './scenes/Level1';
import { BossFight } from './scenes/BossFight';
import { Victory } from './scenes/Victory';
import { GameOver } from './scenes/GameOver';
import { EmulatorMode } from './scenes/EmulatorMode';

const config: Types.Core.GameConfig = {
    type: AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#87CEEB',
    pixelArt: true,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    input: {
        activePointers: 4,
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 900 },
            debug: false
        }
    },
    scene: [Boot, MainMenu, Level1, BossFight, Victory, GameOver, EmulatorMode]
};

export const StartGame = (parent: string) => {
    return new Game({ ...config, parent });
};
