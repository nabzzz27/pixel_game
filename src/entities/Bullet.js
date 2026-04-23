import { PHYSICS } from '../config/physics.js';

export class Bullet extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture, direction) {
        super(scene, x, y, texture);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.body.setAllowGravity(false);
        this.setScale(0.4);
        this.setVelocityX(direction * PHYSICS.bulletSpeed);
        this.setFlipX(direction < 0);

        this.lifetimeEvent = scene.time.delayedCall(PHYSICS.bulletLifetimeMs, () => {
            if (this.active) this.destroy();
        });
    }

    destroy(fromScene) {
        if (this.lifetimeEvent) {
            this.lifetimeEvent.remove(false);
            this.lifetimeEvent = null;
        }
        super.destroy(fromScene);
    }
}
