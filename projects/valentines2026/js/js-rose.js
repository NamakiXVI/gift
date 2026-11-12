        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(() => {
                document.querySelector('.container').classList.remove('container');
            }, 500);
            
            setTimeout(() => {
                addBabysBreathFlowers();
                
                setTimeout(() => {
                    startHeartsAnimation();
                }, 1000);
            }, 1500);
        });
        
        function addBabysBreathFlowers() {
            for (let i = 1; i <= 6; i++) {
                const stem = document.getElementById(`bb-stem-${i}`);
                if (!stem) continue;
                
                const stemHeight = parseInt(getComputedStyle(stem).height);
                const flowerCount = Math.floor(stemHeight / 15) + 3;
                
                for (let j = 0; j < flowerCount; j++) {
                    const flower = document.createElement('div');
                    flower.className = 'bb-flower';
                    
                    const position = (j / flowerCount) * stemHeight;
                    const offsetX = (Math.random() - 0.5) * 60;
                    
                    flower.style.left = `${offsetX}px`;
                    flower.style.top = `${stemHeight - position}px`;
                    
                    const delay = 3 + (i * 0.3) + (j * 0.1);
                    flower.style.setProperty('--flower-delay', `${delay}s`);
                    
                    stem.appendChild(flower);
                }
            }
        }
        
        const canvas = document.getElementById('hearts-canvas');
        const ctx = canvas.getContext('2d');
        let hearts = [];
        let animationComplete = false;
        
        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        
        class Heart {
            constructor(x, y, size, color, velocityX = 0, velocityY = 0) {
                this.x = x;
                this.y = y;
                this.size = size;
                this.color = color;
                this.velocityX = velocityX;
                this.velocityY = velocityY;
                this.opacity = 1;
                this.growth = 0;
                this.life = 150;
                this.rotation = Math.random() * Math.PI * 2;
                this.rotationSpeed = (Math.random() - 0.5) * 0.05;
                this.floatOffset = Math.random() * Math.PI * 2;
            }
            
            update() {
                this.x += this.velocityX;
                this.y += this.velocityY;
                
                this.floatOffset += 0.05;
                this.x += Math.sin(this.floatOffset) * 0.3;
                this.y += Math.cos(this.floatOffset) * 0.2;
                
                this.velocityX *= 0.97;
                this.velocityY *= 0.97;
                
                if (this.growth < 1) {
                    this.growth += 0.08;
                }
                
                this.rotation += this.rotationSpeed;
                
                this.life--;
                
                if (this.life < 50) {
                    this.opacity = this.life / 50;
                }
                
                this.velocityY -= 0.08;
                
                const speed = Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);
                const maxSpeed = 6;
                if (speed > maxSpeed) {
                    this.velocityX = (this.velocityX / speed) * maxSpeed;
                    this.velocityY = (this.velocityY / speed) * maxSpeed;
                }
            }
            
            draw() {
                ctx.save();
                ctx.globalAlpha = this.opacity;
                
                const currentSize = this.size * this.growth;
                
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotation);
                
                ctx.beginPath();
                ctx.fillStyle = this.color;
                
                const topCurveHeight = currentSize * 0.3;
                
                ctx.moveTo(0, currentSize/4);
                ctx.bezierCurveTo(
                    -currentSize/2, -currentSize/4,
                    -currentSize, currentSize/6,
                    0, currentSize
                );
                
                ctx.bezierCurveTo(
                    currentSize, currentSize/6,
                    currentSize/2, -currentSize/4,
                    0, currentSize/4
                );
                
                ctx.fill();
                
                ctx.shadowColor = this.color;
                ctx.shadowBlur = 20;
                ctx.fill();
                
                ctx.beginPath();
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.ellipse(0, -currentSize/8, currentSize/4, currentSize/6, 0, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.restore();
            }
            
            isDead() {
                return this.life <= 0 || this.opacity <= 0 || this.y < -50;
            }
        }
        
        const heartColors = [
            '#ff4d6d', '#ff8fa3', '#ffccd5', '#ffafbd', 
            '#ffc3a0', '#ffd166', '#c77dff', '#a2d2ff'
        ];
        
        function createHeart(x, y, isFromSwipe = false) {
            const size = isFromSwipe ? 
                Math.random() * 15 + 8 : 
                Math.random() * 25 + 15;
            
            const color = heartColors[Math.floor(Math.random() * heartColors.length)];
            
            let velocityX = 0;
            let velocityY = 0;
            
            if (isFromSwipe) {
                velocityX = (Math.random() - 0.5) * 4;
                velocityY = (Math.random() - 0.5) * 4;
            } else {
                velocityX = (Math.random() - 0.5) * 3;
                velocityY = -(Math.random() * 4 + 2);
            }
            
            hearts.push(new Heart(x, y, size, color, velocityX, velocityY));
            
            if (hearts.length > 300) {
                hearts = hearts.slice(100);
            }
        }
        
        function createHeartsAlongPath(startX, startY, endX, endY) {
            const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
            const steps = Math.floor(distance / 10);
            
            for (let i = 0; i <= steps; i++) {
                const t = i / steps;
                const x = startX + (endX - startX) * t;
                const y = startY + (endY - startY) * t;
                
                const randomOffset = 8;
                const offsetX = (Math.random() - 0.5) * randomOffset;
                const offsetY = (Math.random() - 0.5) * randomOffset;
                
                setTimeout(() => {
                    createHeart(x + offsetX, y + offsetY, true);
                }, i * 10);
            }
        }
        
        function animateHearts() {
            ctx.fillStyle = 'rgba(10, 10, 42, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            for (let i = hearts.length - 1; i >= 0; i--) {
                hearts[i].update();
                hearts[i].draw();
                
                if (hearts[i].isDead()) {
                    hearts.splice(i, 1);
                }
            }
            
            requestAnimationFrame(animateHearts);
        }
        
        function setupInteractions() {
            let isTouching = false;
            let lastTouchX = 0;
            let lastTouchY = 0;
            let touchStartTime = 0;
            
            canvas.addEventListener('click', (e) => {
                if (!animationComplete) return;
                
                createHeart(e.clientX, e.clientY);
                
                for (let i = 0; i < 3; i++) {
                    setTimeout(() => {
                        const offsetX = (Math.random() - 0.5) * 30;
                        const offsetY = (Math.random() - 0.5) * 30;
                        createHeart(e.clientX + offsetX, e.clientY + offsetY);
                    }, i * 50);
                }
            });
            
            canvas.addEventListener('touchstart', (e) => {
                if (!animationComplete) return;
                
                e.preventDefault();
                isTouching = true;
                touchStartTime = Date.now();
                
                const touch = e.touches[0];
                lastTouchX = touch.clientX;
                lastTouchY = touch.clientY;
                
                for (let i = 0; i < 5; i++) {
                    const offsetX = (Math.random() - 0.5) * 40;
                    const offsetY = (Math.random() - 0.5) * 40;
                    createHeart(touch.clientX + offsetX, touch.clientY + offsetY);
                }
            }, { passive: false });
            
            canvas.addEventListener('touchmove', (e) => {
                if (!animationComplete || !isTouching) return;
                
                e.preventDefault();
                
                const touch = e.touches[0];
                const currentX = touch.clientX;
                const currentY = touch.clientY;
                
                createHeartsAlongPath(lastTouchX, lastTouchY, currentX, currentY);
                
                lastTouchX = currentX;
                lastTouchY = currentY;
            }, { passive: false });
            
            canvas.addEventListener('touchend', (e) => {
                if (!isTouching) return;
                
                isTouching = false;
                const touchDuration = Date.now() - touchStartTime;
                
                if (touchDuration < 300) {
                    for (let i = 0; i < 8; i++) {
                        setTimeout(() => {
                            const angle = (i / 8) * Math.PI * 2;
                            const radius = 50;
                            const x = lastTouchX + Math.cos(angle) * radius;
                            const y = lastTouchY + Math.sin(angle) * radius;
                            createHeart(x, y);
                        }, i * 30);
                    }
                }
            });
            
            let isMouseDown = false;
            let lastMouseX = 0;
            let lastMouseY = 0;
            
            canvas.addEventListener('mousedown', (e) => {
                if (!animationComplete) return;
                
                isMouseDown = true;
                lastMouseX = e.clientX;
                lastMouseY = e.clientY;
                
                for (let i = 0; i < 5; i++) {
                    const offsetX = (Math.random() - 0.5) * 40;
                    const offsetY = (Math.random() - 0.5) * 40;
                    createHeart(e.clientX + offsetX, e.clientY + offsetY);
                }
            });
            
            canvas.addEventListener('mousemove', (e) => {
                if (!animationComplete || !isMouseDown) return;
                
                const currentX = e.clientX;
                const currentY = e.clientY;
                
                createHeartsAlongPath(lastMouseX, lastMouseY, currentX, currentY);
                
                lastMouseX = currentX;
                lastMouseY = currentY;
            });
            
            canvas.addEventListener('mouseup', () => {
                isMouseDown = false;
            });
            
            canvas.addEventListener('mouseleave', () => {
                isMouseDown = false;
            });
        }
        
        function startHeartsAnimation() {
            canvas.classList.add('active');
            animationComplete = true;
            
            resizeCanvas();
            setupInteractions();
            animateHearts();
            
            for (let i = 0; i < 15; i++) {
                setTimeout(() => {
                    createHeart(
                        Math.random() * canvas.width,
                        Math.random() * canvas.height * 0.7 + canvas.height * 0.3
                    );
                }, i * 100);
            }
        }
        
        window.addEventListener('resize', () => {
            resizeCanvas();
        });
        
        document.addEventListener('gesturestart', (e) => e.preventDefault());
        document.addEventListener('gesturechange', (e) => e.preventDefault());
        document.addEventListener('gestureend', (e) => e.preventDefault());