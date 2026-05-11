import Phaser from 'phaser';
import gsap from 'gsap';

export default class Player {
    constructor(scene, x, y) {
        this.scene = scene;
        
        // 화면 크기에 따른 상대적 스케일 계산 (기본 1280px 기준)
        const scaleBase = Math.min(scene.scale.width / 1280, 1);
        this.baseWidth = 80 * scaleBase;
        this.baseHeight = 80 * scaleBase; // 비율을 1:1로 맞춰서 찌그러짐 방지

        // Sprite setup
        this.sprite = scene.physics.add.sprite(x, y, 'player');
        
        // 초기화 시 텍스처 상태 확인
        this.refreshTexture();
        
        this.sprite.setCollideWorldBounds(true);
        this.sprite.setDepth(10);
        
        // Physics properties
        this.sprite.setDrag(1000);
        this.sprite.setDamping(true);

        // Custom properties
        this.health = 100;
        this.isDead = false;
        
        // Glow effect (Visual)
        this.glow = scene.add.pointlight(x, y, 0x00f3ff, 100, 0.5);
    }

    refreshTexture() {
        if (!this.scene.textures.exists('player')) {
            this.drawPlaceholder();
        } else {
            this.sprite.setTexture('player');
            this.sprite.setDisplaySize(this.baseWidth, this.baseHeight);
        }
    }

    drawPlaceholder() {
        const key = 'player_placeholder';
        if (!this.scene.textures.exists(key)) {
            const graphics = this.scene.make.graphics({ x: 0, y: 0, add: false });
            graphics.lineStyle(2, 0x00f3ff, 1);
            graphics.fillStyle(0x00f3ff, 0.3);
            graphics.fillTriangle(0, 0, 0, 30, 40, 15);
            graphics.strokeTriangle(0, 0, 0, 30, 40, 15);
            graphics.generateTexture(key, 40, 30);
            graphics.destroy();
        }
        this.sprite.setTexture(key);
        this.sprite.setDisplaySize(this.baseWidth, this.baseHeight);
    }

    update() {
        if (this.isDead) return;

        // Sync glow with player position
        this.glow.x = this.sprite.x;
        this.glow.y = this.sprite.y;

        // Mouse/Touch movement
        const pointer = this.scene.input.activePointer;
        if (pointer.isDown) {
            this.updateMovement(pointer.y);
        } else {
            // Optional: Keyboard support
            const cursors = this.scene.input.keyboard.createCursorKeys();
            if (cursors.up.isDown) {
                this.updateMovement(this.sprite.y - 10);
            } else if (cursors.down.isDown) {
                this.updateMovement(this.sprite.y + 10);
            } else {
                // Return to zero tilt when no input
                gsap.to(this.sprite, { angle: 0, duration: 0.5, ease: "elastic.out(1, 0.5)" });
            }
        }
    }

    updateMovement(targetY) {
        gsap.to(this.sprite, {
            y: Phaser.Math.Clamp(targetY, 50, this.scene.scale.height - 50),
            duration: 0.2,
            ease: "power2.out",
            onUpdate: () => {
                // 위로 갈 때와 아래로 갈 때 기체의 각도를 살짝 조절 (퍼블리셔 디테일)
                const tilt = (targetY - this.sprite.y) * 0.1;
                this.sprite.angle = Phaser.Math.Clamp(tilt, -15, 15);
            }
        });
    }

    shootEffect() {
        // 총 쏠 때 기체가 살짝 뒤로 밀리는 반동
        gsap.fromTo(this.sprite, { x: 95 }, { x: 100, duration: 0.1, ease: "back.out(2)" });
    }

    useUltimate(onComplete) {
        const { scene } = this;
        
        // 1. 서포트 캐릭터 등장
        const support = scene.add.sprite(this.sprite.x - 50, this.sprite.y, 'support');
        support.setDisplaySize(60, 60);
        support.setAlpha(0);
        support.setDepth(15);

        // 서포트 캐릭터 등장 애니메이션
        gsap.to(support, {
            x: this.sprite.x - 10,
            y: this.sprite.y - 60,
            alpha: 1,
            duration: 0.5,
            ease: "back.out(1.7)",
            onComplete: () => {
                // 2. 광선 발사 시작
                this.fireBeam(support, onComplete);
            }
        });
    }

    fireBeam(support, onComplete) {
        const { scene } = this;
        const beam = scene.add.graphics();
        beam.setDepth(20);
        
        // 광선 사운드 및 이펙트 대용 진동
        scene.cameras.main.shake(1500, 0.02);

        let beamActive = true;
        
        // 1.5초 동안 광선 유지
        const beamDuration = 1500;
        const startTime = scene.time.now;

        const updateBeam = () => {
            if (!beamActive) return;

            const now = scene.time.now;
            const progress = (now - startTime) / beamDuration;
            
            beam.clear();
            
            // 광선 두께가 변하는 연출 (펄스)
            const thickness = 40 + Math.sin(now * 0.05) * 10;
            const beamColor = 0x00f3ff;
            const innerColor = 0xffffff;

            // 외곽 광선
            beam.lineStyle(thickness, beamColor, 0.6);
            beam.lineBetween(support.x + 20, support.y, scene.scale.width, support.y);
            
            // 내부 핵심 광선
            beam.lineStyle(thickness * 0.4, innerColor, 1);
            beam.lineBetween(support.x + 20, support.y, scene.scale.width, support.y);

            // 적 충돌 판정 (광선 궤적 내의 적들 제거)
            scene.enemies.getChildren().forEach(enemy => {
                if (enemy.active && Math.abs(enemy.y - support.y) < thickness) {
                    enemy.explode();
                }
            });

            if (progress < 1) {
                requestAnimationFrame(updateBeam);
            } else {
                // 광선 종료
                beamActive = false;
                beam.destroy();
                
                // 서포트 캐릭터 퇴장
                gsap.to(support, {
                    y: support.y - 100,
                    alpha: 0,
                    duration: 0.5,
                    onComplete: () => {
                        support.destroy();
                        if (onComplete) onComplete();
                    }
                });
            }
        };

        updateBeam();
    }

    takeDamage(amount) {
        this.health -= amount;
        
        // Screen shake and impact effect
        this.scene.cameras.main.shake(100, 0.01);
        
        // HUD Glitch Trigger (via Custom Event)
        this.scene.events.emit('player-damaged', this.health);
        
        // 충격 시 이미지 변경
        this.sprite.setTexture('player_hit');
        this.sprite.setTint(0xff0000);
        
        this.scene.time.delayedCall(200, () => {
            if (!this.isDead) {
                this.sprite.setTexture('player');
                this.sprite.clearTint();
            }
        });

        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        this.isDead = true;
        this.sprite.setVisible(false);
        this.glow.setVisible(false);
        this.scene.events.emit('game-over');
        
        // Explosion effect (can add particles later)
    }
}
