let particles = [];
let animationComplete = false;
let yesButtonSize = 1;
const maxYesButtonSize = 4;
const canvas = document.getElementById('animation-canvas');
const ctx = canvas.getContext('2d');
const valentineText = document.getElementById('valentine-text');
const buttonsContainer = document.getElementById('buttons-container');
const yesBtn = document.getElementById('yes-btn');
const noBtn = document.getElementById('no-btn');
const successMessage = document.getElementById('success-message');
const floatingHearts = document.getElementById('floating-hearts');
let isMobile = false;
let noClicks = 0;

function detectDevice() {
    isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
    return isMobile;
}

function resizeCanvas() {
    const container = canvas.parentElement;
    const dpr = window.devicePixelRatio || 1;
    
    const displayWidth = container.clientWidth;
    const displayHeight = container.clientHeight;
    
    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    
    canvas.style.width = displayWidth + 'px';
    canvas.style.height = displayHeight + 'px';
    
    ctx.scale(dpr, dpr);
    
    return { width: displayWidth, height: displayHeight };
}

function initFloatingHearts() {
    floatingHearts.innerHTML = '';
    const heartCount = isMobile ? 10 : 15;
    
    for (let i = 0; i < heartCount; i++) {
        const heart = document.createElement('i');
        heart.className = 'fas fa-heart';
        heart.style.left = `${Math.random() * 100}%`;
        heart.style.top = `${Math.random() * 100}%`;
        heart.style.animationDelay = `${Math.random() * 20}s`;
        heart.style.fontSize = `${Math.random() * (isMobile ? 20 : 25) + 10}px`;
        floatingHearts.appendChild(heart);
    }
}

class Particle {
    constructor(targetX, targetY, color) {
        const dimensions = resizeCanvas();
        this.startX = Math.random() * dimensions.width;
        this.startY = Math.random() * dimensions.height;
        this.x = this.startX;
        this.y = this.startY;
        this.targetX = targetX;
        this.targetY = targetY;
        this.size = Math.random() * (isMobile ? 0.2 : 2) + 2;
        this.color = color;
        this.speed = Math.random() * 0.01 + 0.2;
        this.arrived = false;
        this.progress = 0;
    }
    
    update() {
        if (this.arrived) return;
        
        this.progress += 0.001;
        
        this.x = this.startX + (this.targetX - this.startX) * this.progress;
        this.y = this.startY + (this.targetY - this.startY) * this.progress;
        
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 2 || this.progress >= 1) {
            this.arrived = true;
            this.x = this.targetX;
            this.y = this.targetY;
        }
    }
    
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }
}

function drawText(tempCtx_)
{
    tempCtx_.fillStyle = 'white';
    tempCtx_.font = `bold ${fontSize}px Arial`;
    tempCtx_.textAlign = 'center';
    tempCtx_.textBaseline = 'middle';
    tempCtx_.fillText('Will you be my valentine?', dimensions.width / 2, dimensions.height / 2);
}

function createTextParticles() {
    const dimensions = resizeCanvas();
    
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    tempCanvas.width = dimensions.width;
    tempCanvas.height = dimensions.height;
    
    const fontSize = isMobile ? 
        Math.min(40, dimensions.width / 10) : 
        Math.min(70, dimensions.width / 15);

    tempCtx.fillStyle = 'white';
    tempCtx.font = `bold ${fontSize}px Arial`;
    tempCtx.textAlign = 'center';
    tempCtx.textBaseline = 'middle';
    tempCtx.fillText('Will you be my valentine?', dimensions.width / 2, dimensions.height / 2);
    
    const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const data = imageData.data;
    
    const particlesCount = isMobile ? 500 : 1500;
    const createdParticles = [];
    
    const colors = ['#ff4d6d', '#ff8fa3', '#ffccd5', '#ffafbd', '#ffc3a0'];
    
    for (let i = 0; i < particlesCount; i++) {
        let x, y, alpha;
        let attempts = 0;
        
        do {
            x = Math.floor(Math.random() * tempCanvas.width);
            y = Math.floor(Math.random() * tempCanvas.height);
            
            const index = (y * tempCanvas.width + x) * 4;
            alpha = data[index + 3];
            attempts++;
        } while (alpha < 128 && attempts < 1000);
        
        if (alpha < 128) {
            x = Math.random() * tempCanvas.width;
            y = Math.random() * tempCanvas.height;
        }
        
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        createdParticles.push(new Particle(x, y, color));
    }
    
    return createdParticles;
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    let allArrived = true;
    
    particles.forEach(particle => {
        particle.update();
        particle.draw();
        
        if (!particle.arrived) {
            allArrived = false;
        }
    });
    
    if (allArrived && !animationComplete) {
        animationComplete = true;
        setTimeout(endAnimation, 800);
    }
    
    requestAnimationFrame(animate);
}

function endAnimation() {
    valentineText.style.opacity = '1';
    
    setTimeout(() => {
        buttonsContainer.style.opacity = '1';
    }, 250);
}

function handleYesClick() {
    successMessage.style.display = 'block';
    buttonsContainer.style.display = 'none';
    
    createConfetti();
    
    createHeartsAnimation();
    
    yesBtn.removeEventListener('click', handleYesClick);
    noBtn.removeEventListener('click', handleNoClick);
    
    setTimeout(() => {
        window.location.href = 'rose.html';
    }, 3000);
}

function handleNoClick() {
    noClicks++;
    
    yesButtonSize += 0.3;
    
    if (yesButtonSize > maxYesButtonSize) {
        yesButtonSize = maxYesButtonSize;
    }
    
    yesBtn.style.transform = `scale(${yesButtonSize})`;
    
    const noTexts = ['Are you sure?', 'Really?', 'Think again', 'Nuhh UHH!', 'Last chance', 'OK, I give up'];
    const currentIndex = Math.min(noClicks - 1, noTexts.length - 1);
    noBtn.textContent = noTexts[currentIndex];
    
    moveNoButtonRandomly();
    
    if (noBtn.textContent === 'OK, I give up!') {
        setTimeout(() => {
            noBtn.style.opacity = '0';
            noBtn.style.transform = 'scale(0.8)';
            setTimeout(() => {
                noBtn.style.display = 'none';
            }, 300);
        }, 800);
    }
}

function moveNoButtonRandomly() {
    const container = buttonsContainer.getBoundingClientRect();
    const btnRect = noBtn.getBoundingClientRect();
    
    const yesBtnRect = yesBtn.getBoundingClientRect();
    const padding = 20;
    
    const availableWidth = window.innerWidth - btnRect.width - padding * 2;
    const availableHeight = window.innerHeight - btnRect.height - padding * 2;
    
    if (availableWidth > 0 && availableHeight > 0) {
        let randomX, randomY;
        let attempts = 0;
        const maxAttempts = 10;
        
        do {
            randomX = Math.random() * availableWidth + padding;
            randomY = Math.random() * availableHeight + padding;
            attempts++;
            
            const distanceToYes = Math.sqrt(
                Math.pow(randomX + btnRect.width/2 - (yesBtnRect.left + yesBtnRect.width/2), 2) +
                Math.pow(randomY + btnRect.height/2 - (yesBtnRect.top + yesBtnRect.height/2), 2)
            );
            
            if (distanceToYes > btnRect.width + yesBtnRect.width || attempts >= maxAttempts) {
                break;
            }
        } while (true);
        
        noBtn.style.position = 'fixed';
        noBtn.style.left = `${randomX}px`;
        noBtn.style.top = `${randomY}px`;
        noBtn.style.zIndex = '1000';
        
        noBtn.style.transform += ' translateZ(0)';
    }
}

function createConfetti() {
    const confettiCount = isMobile ? 80 : 150;
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.position = 'fixed';
        confetti.style.width = `${Math.random() * 10 + 5}px`;
        confetti.style.height = `${Math.random() * 10 + 5}px`;
        confetti.style.backgroundColor = getRandomColor();
        confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
        confetti.style.left = `${Math.random() * 100}%`;
        confetti.style.top = '-20px';
        confetti.style.zIndex = '9999';
        confetti.style.opacity = '0.9';
        confetti.style.pointerEvents = 'none';
        
        document.body.appendChild(confetti);
        
        const animation = confetti.animate([
            { transform: `translate(0, 0) rotate(0deg)`, opacity: 1 },
            { transform: `translate(${Math.random() * 200 - 100}px, ${window.innerHeight}px) rotate(${Math.random() * 720}deg)`, opacity: 0 }
        ], {
            duration: Math.random() * 3000 + 2000,
            easing: 'cubic-bezier(0.215, 0.61, 0.355, 1)'
        });
        
        animation.onfinish = () => {
            if (confetti.parentNode) {
                confetti.remove();
            }
        };
    }
}

function getRandomColor() {
    const colors = ['#ff4d6d', '#ff8fa3', '#ffccd5', '#4361ee', '#4cc9f0', '#7209b7', '#3a0ca3', '#f72585'];
    return colors[Math.floor(Math.random() * colors.length)];
}

function createHeartsAnimation() {
    const heartCount = isMobile ? 20 : 30;
    
    for (let i = 0; i < heartCount; i++) {
        const heart = document.createElement('div');
        heart.innerHTML = '❤️';
        heart.style.position = 'fixed';
        heart.style.fontSize = `${Math.random() * 20 + 15}px`;
        heart.style.left = `${Math.random() * 100}%`;
        heart.style.top = `${Math.random() * 100}%`;
        heart.style.zIndex = '9998';
        heart.style.opacity = '0';
        heart.style.pointerEvents = 'none';
        
        document.body.appendChild(heart);
        
        const animation = heart.animate([
            { transform: 'scale(0) translateY(0)', opacity: 0 },
            { transform: 'scale(1) translateY(-20px)', opacity: 1 },
            { transform: 'scale(1) translateY(-40px)', opacity: 0 }
        ], {
            duration: Math.random() * 2000 + 2000,
            delay: Math.random() * 1000,
            easing: 'ease-out'
        });
        
        animation.onfinish = () => {
            if (heart.parentNode) {
                heart.remove();
            }
        };
    }
}

function init() {
    detectDevice();
    resizeCanvas();
    initFloatingHearts();
    particles = createTextParticles();
    
    yesBtn.addEventListener('click', handleYesClick);
    yesBtn.addEventListener('touchend', function(e) {
        e.preventDefault();
        handleYesClick();
    });
    
    noBtn.addEventListener('click', handleNoClick);
    noBtn.addEventListener('touchend', function(e) {
        e.preventDefault();
        handleNoClick();
    });
    
    animate();
    
    document.addEventListener('touchmove', function(e) {
        if(e.scale !== 1) {
            e.preventDefault();
        }
    }, { passive: false });
}

let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        detectDevice();
        resizeCanvas();
        initFloatingHearts();
        
        if (!animationComplete) {
            particles = createTextParticles();
        }
    }, 250);
});

window.addEventListener('load', init);

document.addEventListener('contextmenu', function(e) {
    if (e.target.classList.contains('valentine-btn')) {
        e.preventDefault();
        return false;
    }
});