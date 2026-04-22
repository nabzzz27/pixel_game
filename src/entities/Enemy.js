export class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture, patrolSpeed, patrolRadius = 150) {
        super(scene, x, y, texture);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setOrigin(0.5, 1);

        this.patrolSpeed = patrolSpeed;
        this.patrolMinX = x - patrolRadius;
        this.patrolMaxX = x + patrolRadius;
        this.isAlive = true;

        this.setVelocityX(this.patrolSpeed);
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        if (!this.isAlive) return;

        if (this.x <= this.patrolMinX && this.body.velocity.x < 0) {
            this.setVelocityX(this.patrolSpeed);
            this.setFlipX(false);
        } else if (this.x >= this.patrolMaxX && this.body.velocity.x > 0) {
            this.setVelocityX(-this.patrolSpeed);
            this.setFlipX(true);
        }
    }

    takeStomp() {
        if (!this.isAlive) return;
        this.isAlive = false;
        this.setVelocity(0, 0);
        if (this.body) this.body.enable = false;
        this.scene.tweens.add({
            targets: this,
            scaleY: 0.2,
            alpha: 0,
            duration: 200,
            onComplete: () => this.destroy()
        });
    }
}
