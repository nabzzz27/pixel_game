import { GameScene } from './scenes/GameScene.js';
import { EndScene } from './scenes/EndScene.js';
import { PHYSICS } from './config/physics.js';

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#1a1a1a',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: PHYSICS.gravity },
            debug: false
        }
    },
    scene: [GameScene, EndScene]
};

new Phaser.Game(config);
