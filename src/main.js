import Phaser from 'phaser';
import { config } from './game/config';
import '../style.css';

const game = new Phaser.Game(config);

// HUD Elements
const scoreValue = document.getElementById('score-value');
const healthBar = document.getElementById('health-bar');
const scorePanel = document.getElementById('score-panel');
const healthPanel = document.getElementById('health-panel');
const restartBtn = document.getElementById('restart-btn');
const gameOverScreen = document.getElementById('game-over');
const titleScreen = document.getElementById('title-screen');
const startGameBtn = document.getElementById('start-game-btn');
const topHud = document.getElementById('top-hud');
const bottomHud = document.getElementById('bottom-hud');
const pauseBtn = document.getElementById('pause-btn');
const pauseMenu = document.getElementById('pause-menu');
const resumeBtn = document.getElementById('resume-btn');
const mainMenuBtn = document.getElementById('main-menu-btn');

// Initialize Game Events
game.events.once('ready', () => {
    const scene = game.scene.getScene('GameScene');

    // Start Game Trigger
    startGameBtn.addEventListener('click', () => {
        titleScreen.style.opacity = '0';
        setTimeout(() => {
            titleScreen.classList.add('hidden');
            topHud.classList.remove('opacity-0');
            bottomHud.classList.remove('opacity-0');
            scene.events.emit('start-game');
        }, 700);
    });

    // Pause Logic
    pauseBtn.addEventListener('click', () => {
        pauseMenu.classList.remove('hidden');
        scene.scene.pause();
    });

    resumeBtn.addEventListener('click', () => {
        pauseMenu.classList.add('hidden');
        scene.scene.resume();
    });

    mainMenuBtn.addEventListener('click', () => {
        window.location.reload(); // Simple way to go back to main menu
    });

    // Score Update
    scene.events.on('update-score', (score) => {
        scoreValue.innerText = score.toString().padStart(6, '0');
        triggerGlitch(scorePanel);
    });

    // Health Update
    scene.events.on('player-damaged', (health) => {
        healthBar.style.width = `${health}%`;
        triggerGlitch(healthPanel);
        
        if (health <= 30) {
            healthBar.classList.remove('bg-neon-cyan');
            healthBar.classList.add('bg-neon-magenta');
        }
    });

    // Game Over
    scene.events.on('game-over', () => {
        gameOverScreen.classList.remove('hidden');
    });

    // Special Charge Update
    const chargeHud = document.getElementById('charge-hud');
    const chargeBar = document.getElementById('charge-bar');
    const mobileSpecialBtn = document.getElementById('mobile-special-btn');

    scene.events.on('update-charge', (percent) => {
        if (percent > 0) {
            chargeHud.classList.remove('opacity-0');
            chargeBar.style.height = `${percent}%`;
        } else {
            chargeHud.classList.add('opacity-0');
            chargeBar.style.height = '0%';
        }
    });

    // Mobile Special Button Events
    mobileSpecialBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        scene.events.emit('mobile-special-start');
    });
    mobileSpecialBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        scene.events.emit('mobile-special-end');
    });
    // Support mouse for testing on desktop browser with mobile mode
    mobileSpecialBtn.addEventListener('mousedown', () => {
        scene.events.emit('mobile-special-start');
    });
    mobileSpecialBtn.addEventListener('mouseup', () => {
        scene.events.emit('mobile-special-end');
    });
});

// Helper: Trigger Glitch Effect
function triggerGlitch(element) {
    element.classList.add('glitch-active');
    setTimeout(() => {
        element.classList.remove('glitch-active');
    }, 300);
}

// UI Controls
restartBtn.addEventListener('click', () => {
    window.location.reload();
});
