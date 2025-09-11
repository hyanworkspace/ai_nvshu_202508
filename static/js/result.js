// 页面加载时的淡入效果
document.addEventListener('DOMContentLoaded', () => {
    // 初始设置所有元素为透明
    const mainContainer = document.querySelector('[data-component="main-container"]');
    const background = document.querySelector('[data-component="background"]');
    
    if (mainContainer) {
        mainContainer.style.opacity = '0';
        mainContainer.style.transform = 'translateY(20px)';
    }
    
    // 创建进入动画
    const tl = gsap.timeline({ delay: 0.2 });
    
    // 背景淡入
    tl.fromTo(background, 
        { opacity: 0 },
        { opacity: 0.7, duration: 0.8, ease: "power2.out" }
    )
    // 主内容淡入和上移
    .fromTo(mainContainer,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1, ease: "power2.out" },
        "-=0.6"
    )
    // 左右面板交错动画
    .fromTo('[data-component="left-panel"]',
        { opacity: 0, x: -30 },
        { opacity: 1, x: 0, duration: 0.8, ease: "back.out(1.7)" },
        "-=0.8"
    )
    .fromTo('[data-component="right-panel"]',
        { opacity: 0, x: 30 },
        { opacity: 1, x: 0, duration: 0.8, ease: "back.out(1.7)" },
        "-=0.6"
    )
    // 视频和字符容器的特殊动画
    .fromTo('[data-component="media-container"]',
        { scale: 0.8, opacity: 0 },
        { scale: 1, opacity: 1, duration: 1, ease: "elastic.out(1, 0.5)" },
        "-=0.4"
    )
    // 文字内容逐渐显示
    .fromTo('[data-component="congratulations-title"]',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
        "-=0.3"
    )
    .fromTo('[data-component="success-message"]',
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
        "-=0.4"
    )
    .fromTo('[data-component="name-input-section"]',
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
        "-=0.4"
    );
});

document.getElementById('save-btn').addEventListener('click', async () => {
    const userName = document.getElementById('user-name').value.trim();

    if (!userName) {
        alert('Please enter your name');
        return;
    }

    // 添加保存时的过渡效果
    const saveBtn = document.getElementById('save-btn');
    const mainContainer = document.querySelector('[data-component="main-container"]');
    
    // 禁用按钮防止重复点击
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';
    
    try {
        // 保存用户名到session
        const response = await fetch('/save_user_name', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user_name: userName })
        });

        if (response.ok) {
            // 创建成功提示和过渡效果
            const successOverlay = document.createElement('div');
            successOverlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                opacity: 0;
            `;
            
            const successText = document.createElement('div');
            successText.style.cssText = `
                color: #FFFDE9;
                font-size: 2rem;
                text-align: center;
                font-family: var(--font-inknut), serif;
            `;
            successText.innerHTML = 'Saved Successfully!<br><span style="font-size: 1.2rem; opacity: 0.8;">Taking you to the final page...</span>';
            
            successOverlay.appendChild(successText);
            document.body.appendChild(successOverlay);
            
            // 淡出当前内容，显示成功消息，然后跳转
            gsap.timeline()
                .to(mainContainer, {
                    opacity: 0,
                    scale: 0.95,
                    duration: 0.6,
                    ease: "power2.inOut"
                })
                .to(successOverlay, {
                    opacity: 1,
                    duration: 0.4,
                    ease: "power2.inOut"
                }, "-=0.3")
                .to(successText, {
                    scale: 1.1,
                    duration: 0.3,
                    ease: "back.out(1.7)",
                    yoyo: true,
                    repeat: 1
                }, "-=0.2")
                .call(() => {
                    setTimeout(() => {
                        window.location.href = '/frame_11';
                    }, 800);
                });
        } else {
            // 恢复按钮状态
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save';
            alert('Failed to save your name');
        }
    } catch (error) {
        console.error('Error:', error);
        // 恢复按钮状态
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save';
        alert('An error occurred');
    }
});
