
import { Enemy, AshPile } from '../types';
import { drawRoundedRect, drawSpeechBubble } from './utils';

/**
 * Рисует противника в виде сумоиста
 */
export const drawEnemy = (ctx: CanvasRenderingContext2D, e: Enemy) => {
    ctx.save();
    // Сдвигаем к центру клетки (ts=64, враг 40x50)
    ctx.translate(Math.floor(e.x + 20), Math.floor(e.y + 25));

    const isStunned = e.state === 'stunned';
    const isChasing = e.state === 'chase';
    const animTime = e.frame * 0.15;
    
    // Переваливание при ходьбе
    const sway = !isStunned ? Math.sin(animTime) * 3 : 0;
    const bounce = !isStunned ? Math.abs(Math.cos(animTime)) * 2 : 0;

    // 0. Тень под сумоистом
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 20, 22, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Цвета
    const skin = '#fde68a'; // Теплый телесный
    const skinShadow = '#fcd34d';
    const mawashi = '#1e293b'; // Темный пояс
    const hair = '#0f172a';

    // 1. Ноги
    ctx.fillStyle = skin;
    const legOffset = !isStunned ? Math.sin(animTime) * 6 : 0;
    // Левая нога
    ctx.beginPath();
    ctx.ellipse(-10, 15 - bounce + (legOffset > 0 ? -2 : 0), 8, 12, 0.2, 0, Math.PI * 2);
    ctx.fill();
    // Правая нога
    ctx.beginPath();
    ctx.ellipse(10, 15 - bounce + (legOffset < 0 ? -2 : 0), 8, 12, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // 2. Тело (Большой живот)
    ctx.save();
    ctx.translate(0, -bounce);
    ctx.rotate(sway * 0.01);

    const bodyGrad = ctx.createRadialGradient(-5, -5, 5, 0, 0, 25);
    bodyGrad.addColorStop(0, skin);
    bodyGrad.addColorStop(1, skinShadow);
    ctx.fillStyle = bodyGrad;
    
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fill();

    // 3. Пояс Маваси
    ctx.fillStyle = mawashi;
    // Горизонтальная часть
    ctx.fillRect(-22, 2, 44, 10);
    // Вертикальная часть спереди
    ctx.fillRect(-6, 2, 12, 14);
    // Тень на поясе
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(-22, 10, 44, 2);

    // 4. Грудь / Соски
    ctx.fillStyle = 'rgba(185, 28, 28, 0.2)';
    ctx.beginPath(); ctx.arc(-10, -8, 2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(10, -8, 2, 0, Math.PI*2); ctx.fill();

    // 5. Руки
    ctx.fillStyle = skin;
    const armAngle = isChasing ? 0.8 : 0.4;
    // Левая рука
    ctx.save();
    ctx.translate(-18, -5);
    ctx.rotate(armAngle + Math.sin(animTime) * 0.2);
    drawRoundedRect(ctx, -6, 0, 12, 20, 6);
    ctx.fill();
    ctx.restore();
    // Правая рука
    ctx.save();
    ctx.translate(18, -5);
    ctx.rotate(-armAngle - Math.sin(animTime) * 0.2);
    drawRoundedRect(ctx, -6, 0, 12, 20, 6);
    ctx.fill();
    ctx.restore();

    // 6. Голова
    ctx.save();
    ctx.translate(0, -22);
    
    // Лицо
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();

    // Прическа (Chonmage)
    // 6.1 Основа волос с бликом по краю для контраста
    ctx.fillStyle = hair;
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'; // Тонкий светлый ободок
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, -4, 13, Math.PI, 0);
    ctx.fill();
    ctx.stroke();

    // 6.2 Блик на макушке (Gloss effect)
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.ellipse(-4, -8, 5, 2, 0.4, 0, Math.PI*2);
    ctx.fill();

    // 6.3 Пучок сверху (Knot)
    ctx.fillStyle = hair;
    ctx.beginPath();
    ctx.ellipse(0, -14, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Блик на пучке
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.beginPath();
    ctx.ellipse(2, -15, 3, 1, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = hair;
    ctx.fillRect(-2, -14, 4, 6);

    // Глаза
    if (isStunned) {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        const drawX = (cx: number) => {
            ctx.beginPath(); ctx.moveTo(cx-3, -2); ctx.lineTo(cx+3, 2); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx+3, -2); ctx.lineTo(cx-3, 2); ctx.stroke();
        };
        drawX(-5); drawX(5);
    } else {
        ctx.fillStyle = '#000';
        if (isChasing) {
            ctx.beginPath(); ctx.moveTo(-8, -4); ctx.lineTo(-2, -2); ctx.lineTo(-2, 0); ctx.lineTo(-8, -2); ctx.fill();
            ctx.beginPath(); ctx.moveTo(8, -4); ctx.lineTo(2, -2); ctx.lineTo(2, 0); ctx.lineTo(8, -2); ctx.fill();
        } else {
            ctx.beginPath(); ctx.arc(-5, -2, 2, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(5, -2, 2, 0, Math.PI*2); ctx.fill();
        }
    }

    // Рот
    ctx.fillStyle = isChasing ? '#000' : 'rgba(0,0,0,0.3)';
    if (isChasing) {
        ctx.fillRect(-4, 4, 8, 2); 
    } else {
        ctx.beginPath(); ctx.arc(0, 5, 2, 0, Math.PI*2); ctx.fill();
    }

    ctx.restore(); // end head
    ctx.restore(); // end body sway/bounce

    // 7. Эффект оглушения (Звезды)
    if (isStunned) {
        ctx.save();
        const starCount = 3;
        for (let i = 0; i < starCount; i++) {
            const angle = (Date.now() * 0.005) + (i * Math.PI * 2 / starCount);
            const sx = Math.cos(angle) * 20;
            const sy = Math.sin(angle) * 8 - 45;
            
            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.arc(sx, sy, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(sx - 1, sy - 1, 1, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    // 8. Речевой пузырь
    if (e.speechBubble) {
        // Расчет анимации появления (pop in) и исчезновения (fade out)
        const max = e.speechBubble.maxTimer;
        const cur = e.speechBubble.timer;
        
        let scale = 1;
        let alpha = 1;
        
        // Появление
        if (cur > max - 10) {
            scale = (max - cur) / 10;
        }
        // Исчезновение
        if (cur < 10) {
            alpha = cur / 10;
        }
        
        drawSpeechBubble(ctx, 0, -45, e.speechBubble.text, alpha, scale);
    }

    ctx.restore();
};

/**
 * Рисует кучку пепла после взрыва сумоиста
 */
export const drawAshPile = (ctx: CanvasRenderingContext2D, ash: AshPile, ts: number) => {
    const cx = ash.col * ts + ts / 2;
    const cy = ash.row * ts + ts / 2;
    
    ctx.save();
    ctx.translate(cx, cy);
    
    ctx.save();
    ctx.globalAlpha = ash.life;
    ctx.fillStyle = '#4b5563'; 
    
    for (let i = 0; i < 8; i++) {
        const offX = Math.sin(i * 1.2) * 15;
        const offY = Math.cos(i * 0.8) * 8 + 5;
        const size = 5 + Math.sin(i) * 3;
        ctx.beginPath();
        ctx.ellipse(offX, offY, size, size * 0.6, Math.random(), 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-10, 2, 20, 4);
    
    ctx.restore();

    // Речевой пузырь (смертный крик)
    if (ash.speechBubble) {
        const max = ash.speechBubble.maxTimer;
        const cur = ash.speechBubble.timer;
        let scale = 1;
        let alpha = ash.life; // Фейд вместе с пеплом
        
        // Появление
        if (cur > max - 10) {
            scale = (max - cur) / 10;
        }
        
        drawSpeechBubble(ctx, 0, -20, ash.speechBubble.text, alpha, scale);
    }

    ctx.restore();
};
