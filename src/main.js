import { TitleScene } from './scenes/TitleScene.js';
import { HowToPlayScene } from './scenes/HowToPlayScene.js';
import { GameScene } from './scenes/GameScene.js';
import { PauseScene } from './scenes/PauseScene.js';
import { EndScene } from './scenes/EndScene.js';
import { PHYSICS } from './config/physics.js';

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#1a1a1a',
    pixelArt: true,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: PHYSICS.gravity },
            debug: false
        }
    },
    scene: [TitleScene, HowToPlayScene, GameScene, PauseScene, EndScene]
};

new Phaser.Game(config);
