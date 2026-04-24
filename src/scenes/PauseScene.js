const CONTROLS_TEXT =
`CONTROLS
  Move         <-  ->   or  A  D
  Jump         SPACE    (press again in air = double jump)
  Dash         SHIFT    (invincible during dash)
  Shoot        K        (uses 1 ammo per shot)
  Stomp        land on an enemy from above
  Pause        ESC

DAMAGE
  Stomp        50 dmg
  Bullet       35 dmg
  Light enemy  50 HP     (mochi slime, fly)
  Heavy enemy  100 HP    (blocker)

GOAL
  Collect the chicken ingredient to beat the level.
  Pick up ammo gems (+3 ammo each) along the way.
  3 hits from an enemy and you respawn.`;

export class PauseScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PauseScene' });
    }

    create() {
        this.add.rectangle(400, 300, 800, 600, 0x000000, 0.65);

        this.titleText = this.add.text(400, 110, 'PAUSED', {
            fontSize: '56px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#2a1a3a',
            strokeThickness: 6
        }).setOrigin(0.5);

        this.currentUI = [];
        this.showMainMenu();

        this.input.keyboard.on('keydown-ESC', () => this.resume());
    }

    clearUI() {
        for (const item of this.currentUI) item.destroy();
        this.currentUI = [];
    }

    showMainMenu() {
        this.titleText.setText('PAUSED');
        this.clearUI();
        this.currentUI.push(
            this.makeButton(400, 220, 'RESUME', () => this.resume()),
            this.makeButton(400, 295, 'HOW TO PLAY', () => this.showHowToPlay()),
            this.makeButton(400, 370, 'RESTART LEVEL', () => this.showConfirm(
                'Restart this level?',
                () => this.doRestart()
            )),
            this.makeButton(400, 445, 'MAIN MENU', () => this.showConfirm(
                'Return to main menu?',
                () => this.doMainMenu()
            ))
        );
    }

    showConfirm(message, onYes) {
        this.clearUI();
        this.currentUI.push(
            this.add.text(400, 250, message, {
                fontSize: '26px',
                color: '#ffffff'
            }).setOrigin(0.5),
            this.makeButton(320, 350, 'YES', onYes),
            this.makeButton(480, 350, 'NO', () => this.showMainMenu())
        );
    }

    showHowToPlay() {
        this.titleText.setText('HOW TO PLAY');
        this.clearUI();
        this.currentUI.push(
            this.add.text(120, 170, CONTROLS_TEXT, {
                fontSize: '15px',
                color: '#ffffff',
                fontFamily: 'monospace',
                lineSpacing: 6
            }),
            this.makeButton(400, 540, '< BACK', () => this.showMainMenu())
        );
    }

    resume() {
        this.scene.resume('GameScene');
        this.scene.stop();
    }

    doRestart() {
        this.scene.stop('GameScene');
        this.scene.start('GameScene');
        this.scene.stop();
    }

    doMainMenu() {
        this.scene.stop('GameScene');
        this.scene.start('TitleScene');
        this.scene.stop();
    }

    makeButton(x, y, label, onClick) {
        const btn = this.add.text(x, y, label, {
            fontSize: '26px',
            color: '#ffffff',
            backgroundColor: '#3a2a4a',
            padding: { x: 24, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        btn.on('pointerover', () => btn.setColor('#ffd966'));
        btn.on('pointerout', () => btn.setColor('#ffffff'));
        btn.on('pointerdown', onClick);
        return btn;
    }
}
