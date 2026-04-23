import { PHYSICS } from '../config/physics.js';
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        this.load.image('player', 'assets/sprites/player.png');
        this.load.image('player_duck', 'assets/sprites/player_duck.png');
        this.load.image('enemy_mochi', 'assets/sprites/enemy_mochi.png');
        this.load.image('enemy_medium', 'assets/sprites/enemy_medium.png');
        this.load.image('heart_full', 'assets/sprites/heart_full.png');
        this.load.image('heart_empty', 'assets/sprites/heart_empty.png');
        this.load.image('ingredient_chicken', 'assets/sprites/ingredient_chicken.png');
        this.load.image('bullet', 'assets/sprites/bullet.png');
        this.load.image('ammo_pickup', 'assets/sprites/ammo_pickup.png');

        this.load.image('candy_tileset', 'assets/kenney_platformer/Candy expansion/sheet.png');
        this.load.tilemapTiledJSON('level1', 'assets/tilemaps/level1.json');
    }

    create() {
        const map = this.make.tilemap({ key: 'level1' });
        const tiles = map.addTilesetImage('candy', 'candy_tileset');
        map.createLayer('Background', tiles);
        const platforms = map.createLayer('Platforms', tiles);
        platforms.setCollisionBetween(1, 999);

        this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

        this.bullets = this.add.group();
        this.enemies = [];
        this.isLevelComplete = false;

        const objects = map.getObjectLayer('Object').objects;
        const spawnObj = objects.find(o => o.name === 'spawn');
        const spawnX = spawnObj ? spawnObj.x : 100;
        const spawnY = spawnObj ? spawnObj.y : 400;

        this.player = new Player(this, spawnX, spawnY);
        this.physics.add.collider(this.player, platforms);
        this.physics.add.collider(this.bullets, platforms, (bullet) => bullet.destroy());

        for (const obj of objects) {
            if (obj.name === 'mochi') {
                this.spawnEnemy(obj.x, obj.y, 'enemy_mochi', PHYSICS.enemyPatrolSpeed, 150, PHYSICS.lightEnemyHP, platforms);
            } else if (obj.name === 'medium') {
                this.spawnEnemy(obj.x, obj.y, 'enemy_medium', PHYSICS.mediumEnemyPatrolSpeed, 80, PHYSICS.mediumEnemyHP, platforms);
            } else if (obj.name === 'chicken') {
                this.createIngredient(obj.x, obj.y);
            } else if (obj.name === 'ammo') {
                this.createAmmoPickup(obj.x, obj.y);
            }
        }

        this.hearts = [];
        for (let i = 0; i < PHYSICS.maxHealth; i++) {
            const h = this.add.image(20 + i * 36, 20, 'heart_full').setOrigin(0, 0).setScale(0.55);
            h.setScrollFactor(0);
            this.hearts.push(h);
        }
        this.ammoText = this.add.text(20, 60, 'AMMO: 0', {
            fontSize: '18px',
            color: '#ffd966',
            fontStyle: 'bold'
        }).setScrollFactor(0);

        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    }

    spawnEnemy(x, y, texture, patrolSpeed, patrolRadius, hp, platforms) {
        const enemy = new Enemy(this, x, y, texture, patrolSpeed, patrolRadius, hp);
        this.enemies.push(enemy);
        this.physics.add.collider(enemy, platforms);
        this.physics.add.overlap(this.player, enemy, (p, e) => this.player.onEnemyOverlap(e), null, this);
        this.physics.add.overlap(this.bullets, enemy, this.onBulletEnemyHit, null, this);
    }

    createIngredient(x, y) {
        const ingredient = this.physics.add.image(x, y, 'ingredient_chicken');
        ingredient.body.setAllowGravity(false);
        ingredient.body.setImmovable(true);
        this.tweens.add({
            targets: ingredient,
            y: y - 12,
            yoyo: true,
            repeat: -1,
            duration: 900,
            ease: 'Sine.easeInOut'
        });
        this.physics.add.overlap(this.player, ingredient, this.onIngredientPickup, null, this);
    }

    createAmmoPickup(x, y) {
        const pickup = this.physics.add.image(x, y, 'ammo_pickup');
        pickup.setScale(0.55);
        pickup.body.setAllowGravity(false);
        pickup.body.setImmovable(true);
        this.tweens.add({
            targets: pickup,
            y: y - 10,
            yoyo: true,
            repeat: -1,
            duration: 800,
            ease: 'Sine.easeInOut'
        });
        this.physics.add.overlap(this.player, pickup, this.onAmmoPickup, null, this);
    }

    onBulletEnemyHit(bullet, enemy) {
        if (!enemy.isAlive) return;
        enemy.takeBullet();
        bullet.destroy();
    }

    onAmmoPickup(_player, pickup) {
        if (!pickup.body || !pickup.body.enable) return;
        pickup.body.enable = false;
        this.player.addAmmo(PHYSICS.ammoPerPickup);
        this.tweens.killTweensOf(pickup);
        this.tweens.add({
            targets: pickup,
            y: pickup.y - 40,
            alpha: 0,
            scale: 0.9,
            duration: 300,
            ease: 'Quad.easeOut',
            onComplete: () => pickup.destroy()
        });
    }

    onIngredientPickup(_player, ingredient) {
        if (this.isLevelComplete) return;
        this.isLevelComplete = true;
        this.player.isFrozen = true;

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

    updateHealthUI() {
        for (let i = 0; i < this.hearts.length; i++) {
            this.hearts[i].setTexture(i < this.player.health ? 'heart_full' : 'heart_empty');
        }
    }

    updateAmmoUI() {
        this.ammoText.setText(`AMMO: ${this.player.ammo}`);
    }
}
