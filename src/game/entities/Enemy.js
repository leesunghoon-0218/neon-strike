import Phaser from 'phaser';
import gsap from 'gsap';

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'enemy');
        this.scene = scene;
        
        // Trail Graphics
        this.trail = scene.add.graphics();
        this.trail.setDepth(4);
        
        this.hp = 1;
        this.points = 100;
    }

    spawn(x, y, textureKey = 'enemy1') {
        this.body.reset(x, y);
        this.setActive(true);
        this.setVisible(true);
        
        // 이미지 로드 여부 확인 후 텍스처 설정
        if (this.scene.textures.exists(textureKey)) {
            this.setTexture(textureKey);
        } else {
            this.drawPlaceholder(textureKey);
        }
        
        // 상대적 스케일 적용
        const scaleBase = Math.min(this.scene.scale.width / 1280, 1);
        let sizeW = 60 * scaleBase;
        let sizeH = 60 * scaleBase;
        
        // 타입별 사이즈 조정
        if (textureKey === 'enemy1') {
            sizeW *= 2;
            sizeH *= 2;
        } else if (textureKey === 'enemy2') {
            sizeW = (102 * 1.5) * scaleBase; // 기존 102에서 1.5배 더 확대 (153x78)
            sizeH = (52 * 1.5) * scaleBase;
        }
        
        this.setDisplaySize(sizeW, sizeH);
        this.currentType = textureKey;
        
        // Randomized movement velocity
        this.setVelocityX(Phaser.Math.Between(-400, -200));
        
        // Sine wave vertical movement
        this.startY = y;
        this.waveFreq = Phaser.Math.FloatBetween(0.002, 0.005);
        this.waveAmp = Phaser.Math.Between(50, 150);
    }

    drawPlaceholder(key) {
        const graphics = this.scene.make.graphics({ x: 0, y: 0, add: false });
        const colors = { enemy1: 0xff00ff, enemy2: 0x00ff00, enemy3: 0xffff00 };
        const color = colors[key] || 0xff00ff;
        
        graphics.lineStyle(2, color, 1);
        graphics.fillStyle(color, 0.3);
        graphics.beginPath();
        graphics.moveTo(15, 0); graphics.lineTo(30, 15); graphics.lineTo(15, 30); graphics.lineTo(0, 15);
        graphics.closePath(); graphics.fillPath(); graphics.strokePath();
        
        const textureKey = `placeholder_${key}`;
        if (!this.scene.textures.exists(textureKey)) {
            graphics.generateTexture(textureKey, 30, 30);
        }
        this.setTexture(textureKey);
        graphics.destroy();
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        if (this.x < -100) {
            this.deactivate();
        } else {
            // Apply sine wave movement
            this.y = this.startY + Math.sin(time * this.waveFreq) * this.waveAmp;
            
            // 모든 적의 잔상 제거
            this.trail.clear();
        }
    }

    drawTrail() {
        this.trail.clear();
        const color = 0xff00ff; // Magenta for enemies
        const trailLength = 50;
        
        for (let i = 0; i < 6; i++) {
            const alpha = 0.8 * (1 - (i / 6));
            const startX = this.x + (i * (trailLength / 6));
            const endX = this.x + ((i + 1) * (trailLength / 6));
            
            this.trail.lineStyle(6 - i, color, alpha);
            this.trail.lineBetween(startX, this.y, endX, this.y);
        }
    }

    onHit() {
        this.hp--;
        if (this.hp <= 0) {
            this.explode();
        }
    }

    explode() {
        // Impact effect: Camera shake only (Flash removed as per request)
        this.scene.cameras.main.shake(100, 0.005);
        
        this.scene.events.emit('enemy-killed', this.points);
        this.deactivate();
    }

    deactivate() {
        this.setActive(false);
        this.setVisible(false);
        this.trail.clear();
        this.body.stop();
    }
}
