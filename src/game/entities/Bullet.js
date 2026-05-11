import Phaser from 'phaser';

export default class Bullet extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'bullet');
        
        // We'll use a Graphics object for the bullet and its trail
        this.trail = scene.add.graphics();
        this.trail.setDepth(5);
        
        // Physics setup is handled by the group
    }

    fire(x, y) {
        this.body.reset(x, y);
        this.setActive(true);
        this.setVisible(true);
        this.setVelocityX(1000);
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        if (this.x > this.scene.scale.width) {
            this.setActive(false);
            this.setVisible(false);
            this.trail.clear();
        } else {
            this.drawTrail();
        }
    }

    drawTrail() {
        this.trail.clear();
        const color = 0xff3c00; // 요청하신 색상으로 변경 (#ff3c00)
        
        // 총알 이미지 크기를 32x16으로 고정
        this.setDisplaySize(32, 16);
        
        // Draw a neon line trail
        const trailLength = 40;
        
        // Use gradient-like opacity for the trail
        for (let i = 0; i < 5; i++) {
            const alpha = 1 - (i / 5);
            const startX = this.x - (i * (trailLength / 5));
            const endX = this.x - ((i + 1) * (trailLength / 5));
            
            this.trail.lineStyle(4 - i, color, alpha);
            this.trail.lineBetween(startX, this.y, endX, this.y);
        }
        
        // Bullet head glow
        this.trail.fillStyle(color, 1);
        this.trail.fillCircle(this.x, this.y, 3);
    }

    deactivate() {
        this.setActive(false);
        this.setVisible(false);
        this.trail.clear();
        this.body.stop();
    }
}
