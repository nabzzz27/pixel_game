import { PHYSICS } from '../config/physics.js';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture, patrolSpeed, patrolRadius = 150, hp = PHYSICS.lightEnemyHP) {
        super(scene, x, y, texture);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setOrigin(0.5, 1);

        this.patrolSpeed = patrolSpeed;
        this.patrolMinX = x - patrolRadius;
        this.patrolMaxX = x + patrolRadius;
        this.maxHealth = hp;
        this.currentHealth = hp;
        this.isAlive = true;

        this.setVelocityX(this.patrolSpeed);
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        if (!this.isAlive) return;

        // turn around at patrol radius
        if (this.x <= this.patrolMinX && this.body.velocity.x < 0) {
            this.setVelocityX(this.patrolSpeed);
            this.setFlipX(false);
            return;
        }
        if (this.x >= this.patrolMaxX && this.body.velocity.x > 0) {
            this.setVelocityX(-this.patrolSpeed);
            this.setFlipX(true);
            return;
        }

        // turn around at platform edge (ledge detection)
        if (this.scene.platforms && this.body.blocked.down) {
            const dir = Math.sign(this.body.velocity.x);
            if (dir !== 0) {
                const lookX = this.x + dir * (this.body.width / 2 + 4);
                const lookY = this.body.bottom + 4;
                const tile = this.scene.platforms.getTileAtWorldXY(lookX, lookY);
                if (!tile) {
                    this.setVelocityX(-dir * this.patrolSpeed);
                    this.setFlipX(dir > 0);
                }
            }
        }
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
            scaleY: 0.2,
            alpha: 0,
            duration: 200,
            onComplete: () => this.destroy()
        });
    }
}
