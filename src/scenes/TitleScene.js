export class TitleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TitleScene' });
    }

    create() {
        this.cameras.main.setBackgroundColor('#1a0f22');

        this.add.text(400, 140, 'MOCHI QUEST', {
            fontSize: '72px',
            color: '#ffd6e0',
            fontStyle: 'bold',
            stroke: '#2a1a3a',
            strokeThickness: 6
        }).setOrigin(0.5);

        this.add.text(400, 210, 'a gift game', {
            fontSize: '18px',
            color: '#a97abc',
            fontStyle: 'italic'
        }).setOrigin(0.5);

        this.makeButton(400, 340, 'PLAY', () => {
            this.scene.start('GameScene');
        });

        this.makeButton(400, 420, 'HOW TO PLAY', () => {
            this.scene.start('HowToPlayScene');
        });

        this.add.text(400, 570, 'SPACE / ENTER = play     H = how to play', {
            fontSize: '14px',
            color: '#6a5a7a'
        }).setOrigin(0.5);

        this.input.keyboard.once('keydown-SPACE', () => this.scene.start('GameScene'));
        this.input.keyboard.once('keydown-ENTER', () => this.scene.start('GameScene'));
        this.input.keyboard.once('keydown-H', () => this.scene.start('HowToPlayScene'));
    }

    makeButton(x, y, label, onClick) {
        const btn = this.add.text(x, y, label, {
            fontSize: '32px',
            color: '#ffffff',
            backgroundColor: '#3a2a4a',
            padding: { x: 30, y: 12 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        btn.on('pointerover', () => btn.setColor('#ffd966'));
        btn.on('pointerout', () => btn.setColor('#ffffff'));
        btn.on('pointerdown', onClick);
        return btn;
    }
}
