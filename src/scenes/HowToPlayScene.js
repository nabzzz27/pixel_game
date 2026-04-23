export class HowToPlayScene extends Phaser.Scene {
    constructor() {
        super({ key: 'HowToPlayScene' });
    }

    create() {
        this.cameras.main.setBackgroundColor('#1a0f22');

        this.add.text(400, 50, 'HOW TO PLAY', {
            fontSize: '42px',
            color: '#ffd6e0',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const controlsText =
`CONTROLS
  Move         <-  ->   or  A  D
  Jump         SPACE    (press again in air = double jump)
  Dash         SHIFT    (invincible during dash)
  Crouch       DOWN     or  S
  Shoot        K        (uses 1 ammo per shot)
  Stomp        land on an enemy from above

DAMAGE
  Stomp        50 dmg
  Bullet       35 dmg
  Light enemy  50 HP     (mochi)
  Heavy enemy  100 HP    (blocker)

GOAL
  Collect the chicken ingredient to beat the level.
  Pick up ammo gems (+3 ammo each) along the way.
  3 hits from an enemy and you respawn.`;

        this.add.text(80, 110, controlsText, {
            fontSize: '15px',
            color: '#ffffff',
            fontFamily: 'monospace',
            lineSpacing: 6
        });

        const backBtn = this.add.text(400, 540, '< BACK', {
            fontSize: '24px',
            color: '#ffffff',
            backgroundColor: '#3a2a4a',
            padding: { x: 20, y: 8 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        backBtn.on('pointerover', () => backBtn.setColor('#ffd966'));
        backBtn.on('pointerout', () => backBtn.setColor('#ffffff'));
        backBtn.on('pointerdown', () => this.scene.start('TitleScene'));

        this.input.keyboard.once('keydown-ESC', () => this.scene.start('TitleScene'));
        this.input.keyboard.once('keydown-BACKSPACE', () => this.scene.start('TitleScene'));
    }
}
