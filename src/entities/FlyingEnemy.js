import { PHYSICS } from '../config/physics.js';

export class FlyingEnemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, hp = PHYSICS.lightEnemyHP) {
        super(scene, x, y, 'enemy_fly');
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setOrigin(0.5, 0.5);
        this.body.setAllowGravity(false);

        this.boundsMinX = x - PHYSICS.flyingBoundsW / 2;
        this.boundsMaxX = x + PHYSICS.flyingBoundsW / 2;
        this.boundsMinY = y - PHYSICS.flyingBoundsH / 2;
        this.boundsMaxY = y + PHYSICS.flyingBoundsH / 2;

        this.maxHealth = hp;
        this.currentHealth = hp;
        this.isAlive = true;

        this.pickNewTarget();
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        if (!this.isAlive) return;

        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 15) {
            this.pickNewTarget();
            return;
        }

        const angle = Math.atan2(dy, dx);
        this.setVelocity(
            Math.cos(angle) * PHYSICS.flyingEnemySpeed,
            Math.sin(angle) * PHYSICS.flyingEnemySpeed
        );
        this.setFlipX(Math.cos(angle) < 0);
    }

    pickNewTarget() {
        this.targetX = Phaser.Math.Between(this.boundsMinX, this.boundsMaxX);
        this.targetY = Phaser.Math.Between(this.boundsMinY, this.boundsMaxY);
    }

    takeDamage(amount) {
        if (!this.isAlive) return;
        this.currentHealth -= amount;

        this.setTintFill(0xffffff);
        this.scene.time.delayedCall(80, () => {
            if (this.isAlive) this.clearTint();
        });

        if (this.currentHealth <= 0) {
            this.die();
        }
    }

    takeStomp() {
        this.takeDamage(PHYSICS.stompDamage);
    }

    takeBullet() {
        this.takeDamage(PHYSICS.bulletDamage);
    }

    die() {
        this.isAlive = false;
        this.setVelocity(0, 0);
        if (this.body) this.body.enable = false;
        this.clearTint();
        this.scene.tweens.add({
            targets: this,
            angle: 180,
            alpha: 0,
            y: this.y + 80,
            duration: 500,
            ease: 'Quad.easeIn',
            onComplete: () => this.destroy()
        });
    }
}
