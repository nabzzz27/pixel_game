import { PHYSICS } from '../config/physics.js';
import { Bullet } from './Bullet.js';

export class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'player');
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setOrigin(0.5, 1);
        this.body.setSize(PHYSICS.playerStandSize.w, PHYSICS.playerStandSize.h);
        this.setCollideWorldBounds(true);

        this.spawnX = x;
        this.spawnY = y;

        this.cursors = scene.input.keyboard.createCursorKeys();
        this.wasd = scene.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });
        this.shiftKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
        this.kKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);

        this.jumpsUsed = 0;
        this.isDashing = false;
        this.dashEndsAt = 0;
        this.dashCooldownUntil = 0;
        this.dashDir = 1;

        this.health = PHYSICS.maxHealth;
        this.invulnerableUntil = 0;
        this.knockbackUntil = 0;
        this.isDead = false;
        this.isFrozen = false;

        this.ammo = 0;
        this.fireCooldownUntil = 0;
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        if (this.isDead || this.isFrozen) return;

        const now = time;

        // shooting — allowed in any state
        if (Phaser.Input.Keyboard.JustDown(this.kKey) && this.ammo > 0 && now >= this.fireCooldownUntil) {
            this.fireBullet();
        }

        // dash state machine
        if (this.isDashing && now >= this.dashEndsAt) {
            this.isDashing = false;
            this.dashCooldownUntil = now + PHYSICS.dashCooldownMs;
        }

        const dashPressed = Phaser.Input.Keyboard.JustDown(this.shiftKey);
        if (dashPressed && !this.isDashing && now >= this.dashCooldownUntil) {
            this.isDashing = true;
            this.dashEndsAt = now + PHYSICS.dashDurationMs;
            const leftHeld = this.cursors.left.isDown || this.wasd.left.isDown;
            const rightHeld = this.cursors.right.isDown || this.wasd.right.isDown;
            if (leftHeld) this.dashDir = -1;
            else if (rightHeld) this.dashDir = 1;
            else this.dashDir = this.flipX ? -1 : 1;
        }

        if (this.isDashing) {
            this.setVelocityX(this.dashDir * PHYSICS.dashSpeed);
            this.setVelocityY(0);
            this.setFlipX(this.dashDir < 0);
            return;
        }

        // knockback stun
        if (now < this.knockbackUntil) return;

        // horizontal movement
        const left = this.cursors.left.isDown || this.wasd.left.isDown;
        const right = this.cursors.right.isDown || this.wasd.right.isDown;

        if (left) {
            this.setVelocityX(-PHYSICS.runSpeed);
            this.setFlipX(true);
        } else if (right) {
            this.setVelocityX(PHYSICS.runSpeed);
            this.setFlipX(false);
        } else {
            this.setVelocityX(0);
        }

        // jump + double-jump
        const onGround = this.body.blocked.down;
        if (onGround && this.body.velocity.y >= 0) {
            this.jumpsUsed = 0;
        }

        const jumpPressed =
            Phaser.Input.Keyboard.JustDown(this.cursors.space) ||
            Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
            Phaser.Input.Keyboard.JustDown(this.wasd.up);

        if (jumpPressed && this.jumpsUsed < PHYSICS.maxJumps) {
            this.setVelocityY(-PHYSICS.jumpVel);
            this.jumpsUsed++;
        }
    }

    fireBullet() {
        const direction = this.flipX ? -1 : 1;
        const bulletX = this.x + direction * 20;
        const bulletY = this.body.bottom - PHYSICS.bulletSpawnYOffset;
        const bullet = new Bullet(this.scene, bulletX, bulletY, 'bullet', direction);
        this.scene.bullets.add(bullet);
        this.ammo--;
        this.fireCooldownUntil = this.scene.time.now + PHYSICS.fireCooldownMs;
        this.scene.updateAmmoUI();
    }

    addAmmo(amount) {
        this.ammo += amount;
        this.scene.updateAmmoUI();
    }

    isInvulnerable() {
        return this.isDashing || this.isDead || this.scene.time.now < this.invulnerableUntil;
    }

    onEnemyOverlap(enemy) {
        if (!enemy.isAlive || this.isInvulnerable()) return;

        const falling = this.body.velocity.y > 0;
        const feetAboveHead = this.body.bottom <= enemy.body.top + 15;

        if (falling && feetAboveHead) {
            enemy.takeStomp();
            this.setVelocityY(-PHYSICS.stompBounceVel);
            this.jumpsUsed = 0;
        } else {
            this.takeHit(enemy);
        }
    }

    takeHit(enemy) {
        this.health--;
        this.scene.updateHealthUI();

        if (this.health <= 0) {
            this.triggerDeath();
            return;
        }

        this.invulnerableUntil = this.scene.time.now + PHYSICS.hitIframesMs;
        this.knockbackUntil = this.scene.time.now + PHYSICS.knockbackDurationMs;

        const knockbackDir = this.x < enemy.x ? -1 : 1;
        this.setVelocity(knockbackDir * PHYSICS.knockbackVelX, -PHYSICS.knockbackVelY);

        this.scene.tweens.add({
            targets: this,
            alpha: 0.35,
            duration: 120,
            yoyo: true,
            repeat: Math.floor(PHYSICS.hitIframesMs / 240) - 1,
            onComplete: () => this.setAlpha(1)
        });
    }

    triggerDeath() {
        this.isDead = true;
        this.setVelocity(0, 0);
        this.body.enable = false;
        this.setTint(0xff3333);
        this.setAlpha(1);

        this.scene.tweens.add({
            targets: this,
            alpha: 0.2,
            duration: PHYSICS.deathDelayMs,
            ease: 'Quad.easeOut'
        });

        this.scene.time.delayedCall(PHYSICS.deathDelayMs, () => this.respawn());
    }

    respawn() {
        this.scene.tweens.killTweensOf(this);
        this.clearTint();
        this.setAlpha(1);

        this.body.enable = true;
        this.body.reset(this.spawnX, this.spawnY);

        this.health = PHYSICS.maxHealth;
        this.invulnerableUntil = 0;
        this.knockbackUntil = 0;
        this.isDead = false;
        this.isDashing = false;
        this.jumpsUsed = 0;
        this.ammo = 0;
        this.scene.updateHealthUI();
        this.scene.updateAmmoUI();
    }
}
