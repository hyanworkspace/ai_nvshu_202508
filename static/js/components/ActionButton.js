// 可复用的动作按钮组件
class ActionButton {
    constructor(options) {
        this.text = options.text || '';
        this.href = options.href || '#';
        this.className = options.className || '';
        this.onClick = options.onClick || null;
    }

    render() {
        const button = document.createElement('a');
        button.href = this.href;
        button.className = `action-button relative block px-8 py-6 bg-black/20 border-2 border-[#FFFDE9]/30 rounded-2xl text-[#FFFDE9] text-center min-w-[250px] group ${this.className}`;
        
        button.innerHTML = `
            <div class="glow-effect"></div>
            <div class="relative z-10">
                <div class="text-sm opacity-80 font-light">${this.text}</div>
            </div>
        `;

        // 添加点击效果
        button.addEventListener('click', (e) => {
            if (this.onClick) {
                e.preventDefault();
                this.onClick(e);
                return;
            }
            
            e.preventDefault();
            
            gsap.to(button, {
                scale: 0.95,
                duration: 0.1,
                ease: "power2.out",
                yoyo: true,
                repeat: 1,
                onComplete: () => {
                    // 页面转场动画
                    gsap.to(document.body, {
                        opacity: 0,
                        duration: 0.5,
                        ease: "power2.inOut",
                        onComplete: () => {
                            window.location.href = button.href;
                        }
                    });
                }
            });
        });

        return button;
    }

    // 静态方法：创建多个按钮
    static createButtons(buttonsConfig, container) {
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'flex flex-col md:flex-row gap-8 mb-16 opacity-0';
        buttonsContainer.id = 'buttons';

        buttonsConfig.forEach(config => {
            const button = new ActionButton(config);
            buttonsContainer.appendChild(button.render());
        });

        if (container) {
            container.appendChild(buttonsContainer);
        }

        return buttonsContainer;
    }
}

// 导出组件
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ActionButton;
} else {
    window.ActionButton = ActionButton;
}
