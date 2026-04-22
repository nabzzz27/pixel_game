export class EndScene extends Phaser.Scene {
    constructor() {
        super({ key: 'EndScene' });
    }

    init(data) {
        this.ingredient = data && data.ingredient ? data.ingredient : 'ingredient';
    }

    create() {
        this.cameras.main.fadeIn(600, 0, 0, 0);

        this.add.text(400, 220, 'LEVEL COMPLETE', {
            fontSize: '52px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(400, 290, `you got the ${this.ingredient}!`, {
            fontSize: '28px',
            color: '#ffd966'
        }).setOrigin(0.5);

        this.add.text(400, 420, 'press R to restart', {
            fontSize: '18px',
            color: '#888888'
        }).setOrigin(0.5);

        this.input.keyboard.once('keydown-R', () => {
            this.cameras.main.fadeOut(400, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('GameScene');
            });
        });
    }
}
