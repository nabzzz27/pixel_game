import { PHYSICS } from '../config/physics.js';
import { Enemy } from '../entities/Enemy.js';

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        this.load.image('player', 'assets/sprites/player.png');
        this.load.image('player_duck', 'assets/sprites/player_duck.png');
        this.load.image('ground', 'assets/sprites/ground.png');
        this.load.image('enemy_mochi', 'assets/sprites/enemy_mochi.png');
        this.load.image('heart_full', 'assets/sprites/heart_full.png');
        this.load.image('heart_empty', 'assets/sprites/heart_empty.png');
        this.load.image('ingredient_chicken', 'assets/sprites/ingredient_chicken.png');
    }

    create() {
        const TILE = 70;

        const ground = this.physics.add.staticGroup();
        const cols = Math.ceil(800 / TILE);
        for (let i = 0; i < cols; i++) {
            ground.create(i * TILE + TILE / 2, 600 - TILE / 2, 'ground');
        }

        this.spawnX = 100;
        this.spawnY = 400;
        this.player = this.physics.add.sprite(this.spawnX, this.spawnY, 'player');
        this.player.setOrigin(0.5, 1);
        this.player.body.setSize(PHYSICS.playerStandSize.w, PHYSICS.playerStandSize.h);
        this.player.setCollideWorldBounds(true);
        this.physics.add.collider(this.player, ground);

        this.enemy = new Enemy(this, 500, 400, 'enemy_mochi', PHYSICS.enemyPatrolSpeed, 150);
        this.physics.add.collider(this.enemy, ground);
        this.physics.add.overlap(this.player, this.enemy, this.onPlayerEnemyOverlap, null, this);

        this.ingredient = this.physics.add.image(740, 490, 'ingredient_chicken');
        this.ingredient.body.setAllowGravity(false);
        this.ingredient.body.setImmovable(true);
        this.tweens.add({
            targets: this.ingredient,
            y: this.ingredient.y - 12,
            yoyo: true,
            repeat: -1,
            duration: 900,
            ease: 'Sine.easeInOut'
        });
        this.physics.add.overlap(this.player, this.ingredient, this.onIngredientPickup, null, this);
        this.isLevelComplete = false;

        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });
        this.shiftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);

        this.jumpsUsed = 0;
        this.isDashing = false;
        this.dashEndsAt = 0;
        this.dashCooldownUntil = 0;
        this.dashDir = 1;
        this.isCrouching = false;

        this.health = PHYSICS.maxHealth;
        this.invulnerableUntil = 0;
        this.knockbackUntil = 0;
        this.isDead = false;

        this.hearts = [];
        for (let i = 0; i < PHYSICS.maxHealth; i++) {
            const h = this.add.image(20 + i * 36, 20, 'heart_full').setOrigin(0, 0).setScale(0.55);
            h.setScrollFactor(0);
            this.hearts.push(h);
        }
    }

    update() {
        if (this.isDead || this.isLevelComplete) return;

        const now = this.time.now;

        // --- dash state machine ---
        if (this.isDashing && now >= this.dashEndsAt) {
            this.isDashing = false;
            this.dashCooldownUntil = now + PHYSICS.dashCooldownMs;
        }

        const dashPressed = Phaser.Input.Keyboard.JustDown(this.shiftKey);
        if (dashPressed && !this.isDashing && !this.isCrouching && now >= this.dashCooldownUntil) {
            this.isDashing = true;
            this.dashEndsAt = now + PHYSICS.dashDurationMs;
            const leftHeld = this.cursors.left.isDown || this.wasd.left.isDown;
            const rightHeld = this.cursors.right.isDown || this.wasd.right.isDown;
            if (leftHeld) this.dashDir = -1;
            else if (rightHeld) this.dashDir = 1;
            else this.dashDir = this.player.flipX ? -1 : 1;
        }

        if (this.isDashing) {
            this.player.setVelocityX(this.dashDir * PHYSICS.dashSpeed);
            this.player.setVelocityY(0);
            this.player.setFlipX(this.dashDir < 0);
            return;
        }

        // --- knockback stun: physics carries the player, input ignored ---
        if (now < this.knockbackUntil) {
            return;
        }

        // --- crouch (allowed mid-air) ---
        const onGround = this.player.body.blocked.down;
        const crouchHeld = this.cursors.down.isDown || this.wasd.down.isDown;

        if (crouchHeld && !this.isCrouching) {
            this.isCrouching = true;
            this.player.setTexture('player_duck');
            this.player.body.setSize(PHYSICS.playerDuckSize.w, PHYSICS.playerDuckSize.h);
        } else if (!crouchHeld && this.isCrouching) {
            this.isCrouching = false;
            this.player.setTexture('player');
            this.player.body.setSize(PHYSICS.playerStandSize.w, PHYSICS.playerStandSize.h);
        }

        // --- horizontal movement ---
        const left = this.cursors.left.isDown || this.wasd.left.isDown;
        const right = this.cursors.right.isDown || this.wasd.right.isDown;
        const speed = this.isCrouching ? PHYSICS.runSpeed * PHYSICS.crouchSpeedMul : PHYSICS.runSpeed;

        if (left) {
            this.player.setVelocityX(-speed);
            this.player.setFlipX(true);
        } else if (right) {
            this.player.setVelocityX(speed);
            this.player.setFlipX(false);
        } else {
            this.player.setVelocityX(0);
        }

        // --- jump + double-jump ---
        if (onGround && this.player.body.velocity.y >= 0) {
            this.jumpsUsed = 0;
        }

        const jumpPressed =
            Phaser.Input.Keyboard.JustDown(this.cursors.space) ||
            Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
            Phaser.Input.Keyboard.JustDown(this.wasd.up);

        if (jumpPressed && this.jumpsUsed < PHYSICS.maxJumps) {
            this.player.setVelocityY(-PHYSICS.jumpVel);
            this.jumpsUsed++;
        }
    }

    isInvulnerable() {
        return this.isDashing || this.isDead || this.time.now < this.invulnerableUntil;
    }

    onPlayerEnemyOverlap(player, enemy) {
        if (!enemy.isAlive) return;
        if (this.isInvulnerable()) return;

        const falling = player.body.velocity.y > 0;
        const feetAboveHead = player.body.bottom <= enemy.body.top + 15;

        if (falling && feetAboveHead) {
            enemy.takeStomp();
            player.setVelocityY(-PHYSICS.stompBounceVel);
            this.jumpsUsed = 0;
        } else {
            this.takeHit(player, enemy);
        }
    }

    takeHit(player, enemy) {
        this.health--;
        this.updateHealthUI();

        if (this.health <= 0) {
            this.triggerDeath();
            return;
        }

        this.invulnerableUntil = this.time.now + PHYSICS.hitIframesMs;
        this.knockbackUntil = this.time.now + PHYSICS.knockbackDurationMs;

        const knockbackDir = player.x < enemy.x ? -1 : 1;
        player.setVelocity(knockbackDir * PHYSICS.knockbackVelX, -PHYSICS.knockbackVelY);

        this.tweens.add({
            targets: player,
            alpha: 0.35,
            duration: 120,
            yoyo: true,
            repeat: Math.floor(PHYSICS.hitIframesMs / 240) - 1,
            onComplete: () => player.setAlpha(1)
        });
    }

    triggerDeath() {
        this.isDead = true;
        this.player.setVelocity(0, 0);
        this.player.body.enable = false;
        this.player.setTint(0xff3333);
        this.player.setAlpha(1);

        this.tweens.add({
            targets: this.player,
            alpha: 0.2,
            duration: PHYSICS.deathDelayMs,
            ease: 'Quad.easeOut'
        });

        this.time.delayedCall(PHYSICS.deathDelayMs, () => this.respawnPlayer());
    }

    respawnPlayer() {
        this.tweens.killTweensOf(this.player);
        this.player.clearTint();
        this.player.setAlpha(1);

        if (this.isCrouching) {
            this.isCrouching = false;
            this.player.setTexture('player');
            this.player.body.setSize(PHYSICS.playerStandSize.w, PHYSICS.playerStandSize.h);
        }

        this.player.body.enable = true;
        this.player.body.reset(this.spawnX, this.spawnY);

        this.health = PHYSICS.maxHealth;
        this.invulnerableUntil = 0;
        this.knockbackUntil = 0;
        this.isDead = false;
        this.isDashing = false;
        this.jumpsUsed = 0;
        this.updateHealthUI();
    }

    updateHealthUI() {
        for (let i = 0; i < this.hearts.length; i++) {
            this.hearts[i].setTexture(i < this.health ? 'heart_full' : 'heart_empty');
        }
    }

    onIngredientPickup(_player, ingredient) {
        if (this.isLevelComplete) return;
        this.isLevelComplete = true;

        this.tweens.killTweensOf(ingredient);
        this.tweens.add({
            targets: ingredient,
            y: ingredient.y - 60,
            alpha: 0,
            scale: 1.4,
            duration: 400,
            ease: 'Quad.easeOut',
            onComplete: () => ingredient.destroy()
        });

        this.player.setVelocity(0, 0);
        this.cameras.main.fade(600, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('EndScene', { ingredient: 'chicken' });
        });
    }
}

