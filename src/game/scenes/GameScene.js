import Phaser from 'phaser';
import Player from '../entities/Player';
import Bullet from '../entities/Bullet';
import Enemy from '../entities/Enemy';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    preload() {
        this.load.image('background', '/background.jpg');
        this.load.image('player', '/player.png');
        this.load.image('player_hit', '/player_hit.png'); // 충격 시 이미지
        this.load.image('enemy1', '/enemy1.png');
        this.load.image('enemy2', '/enemy2.png');
        this.load.image('enemy3', '/enemy3.png');
        this.load.image('bullet', '/bullet.png');
        this.load.image('support', '/support.png'); // 필살기 시 등장할 캐릭터

        // Stars/Background particles
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(2, 2, 2);
        graphics.generateTexture('star', 4, 4);
    }

    create() {
        const { width, height } = this.scale;

        // Background TileSprite
        const bgTexture = this.textures.get('background').getSourceImage();
        this.bg = this.add.tileSprite(0, 0, width, height, 'background').setOrigin(0);
        
        // 배경 이미지가 화면을 가득 채우도록 스케일 조정 (Cover 방식)
        if (bgTexture) {
            const scaleX = width / bgTexture.width;
            const scaleY = height / bgTexture.height;
            const scale = Math.max(scaleX, scaleY);
            this.bg.setTileScale(scale, scale);
        }
        
        this.bg.setDepth(0);

        // Background Particles (Starfield)
        this.stars = this.add.particles(0, 0, 'star', {
            x: width + 50,
            y: { min: 0, max: height },
            speedX: { min: -400, max: -100 },
            scale: { min: 0.1, max: 0.5 },
            alpha: { min: 0.2, max: 0.8 },
            lifespan: 10000,
            quantity: 1
        });
        this.stars.setDepth(1);

        // Groups
        this.bullets = this.physics.add.group({
            classType: Bullet,
            maxSize: 30,
            runChildUpdate: true
        });

        this.enemies = this.physics.add.group({
            classType: Enemy,
            maxSize: 20,
            runChildUpdate: true
        });

        // Player
        this.player = new Player(this, 100, height / 2);

        // Collisions
        this.physics.add.overlap(this.bullets, this.enemies, (bullet, enemy) => {
            if (bullet.active && enemy.active) {
                bullet.deactivate();
                enemy.explode();
            }
        });

        this.physics.add.overlap(this.player.sprite, this.enemies, (playerSprite, enemy) => {
            if (enemy.active) {
                enemy.explode();
                this.player.takeDamage(10);
            }
        });

        // Spawning Timer
        this.spawnTimer = this.time.addEvent({
            delay: 1000,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        });

        // Input: Charging Special
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.chargeTime = 0;
        this.isUltimateActive = false;
        this.isMobileCharging = false;

        // Game State
        this.score = 0;
        this.isGameOver = false;
        this.isPlaying = false;
        
        // Disable physics until start
        this.physics.pause();

        // Difficulty & Stages
        this.currentStage = 1;
        this.maxStages = 10;
        this.gameTime = 0;
        this.difficultyLevel = 1;

        // UI Events
        this.events.on('start-game', () => {
            this.isPlaying = true;
            this.physics.resume();
        });

        this.events.on('mobile-special-start', () => {
            this.isMobileCharging = true;
        });

        this.events.on('mobile-special-end', () => {
            this.isMobileCharging = false;
        });

        this.events.on('enemy-killed', (pts) => {
            this.score += pts;
            this.events.emit('update-score', this.score);
        });
    }

    spawnEnemy() {
        if (this.isGameOver || !this.isPlaying) return;
        
        // 난이도에 따른 생성 수 조절
        const spawnCount = Math.floor(this.difficultyLevel);
        for (let i = 0; i < (spawnCount || 1); i++) {
            const enemyType = Phaser.Math.Between(1, 3);
            const enemy = this.enemies.get();
            if (enemy) {
                // 화면 하단 충돌 문제를 해결하기 위해 스폰 범위 조정 (100 ~ height-100)
                const spawnY = Phaser.Math.Between(100, this.scale.height - 100);
                enemy.spawn(this.scale.width + 100 + (i * 50), spawnY, `enemy${enemyType}`, this.difficultyLevel);
            }
        }
    }

    fireBullet() {
        if (this.isGameOver || this.player.isDead || !this.isPlaying) return;

        const bullet = this.bullets.get();
        if (bullet) {
            bullet.fire(this.player.sprite.x + 30, this.player.sprite.y);
            this.player.shootEffect();
        }
    }

    update(time, delta) {
        if (this.isGameOver || !this.isPlaying) {
            // 메인 화면에서도 배경은 천천히 흐르게 설정
            if (this.bg) this.bg.tilePositionX += 0.5;
            return;
        }

        // 스테이지 및 난이도 상승 로직
        this.gameTime += delta;
        
        // 20초마다 스테이지 상승
        const nextStage = Math.min(Math.floor(this.gameTime / 20000) + 1, 10);
        if (nextStage > this.currentStage) {
            this.currentStage = nextStage;
            this.events.emit('update-stage', this.currentStage);
            // 스테이지 클리어 연출 (잠시 후 난이도 확 상승)
            this.cameras.main.flash(500, 255, 0, 255, true);
        }

        // 극악의 난이도로 조정 (스테이지에 따라 기하급수적 상승)
        this.difficultyLevel = this.currentStage * (1 + (this.gameTime % 20000) / 20000);

        // 배경 스크롤 속도 (스테이지에 비례)
        this.bg.tilePositionX += 2 * (1 + this.currentStage * 0.2);
        
        this.player.update();

        // 1. 자동 발사 (Normal Auto-fire)
        if (!this.isUltimateActive) {
            if (time > (this.lastFired || 0)) {
                this.fireBullet();
                this.lastFired = time + 250; // 0.25초 간격 자동 발사
            }
        }

        // 2. 필살기 차지 (Special Charge)
        if ((this.spaceKey.isDown || this.isMobileCharging) && !this.isUltimateActive) {
            this.chargeTime += delta;
            
            const chargePercent = Math.min((this.chargeTime / 3000) * 100, 100);
            this.events.emit('update-charge', chargePercent);

            // 차지 이펙트 (화면 흔들림 등)
            if (this.chargeTime > 500) {
                this.cameras.main.shake(100, 0.002 * (this.chargeTime / 3000));
            }

            if (this.chargeTime >= 3000) {
                this.triggerUltimate();
                this.chargeTime = 0;
                this.events.emit('update-charge', 0);
            }
        } else {
            if (this.chargeTime > 0) {
                this.chargeTime = 0;
                this.events.emit('update-charge', 0);
            }
        }
    }

    triggerUltimate() {
        this.isUltimateActive = true;
        this.player.useUltimate(() => {
            this.isUltimateActive = false;
        });
    }
}
