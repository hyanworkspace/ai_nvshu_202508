// Minimum display time for each step (in milliseconds)
// const MIN_DISPLAY_TIME = 10000; // 10 seconds
const MIN_DISPLAY_TIME = 5000;
let lastStepTime = 0;

document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const mediaUrl = urlParams.get('media_url');
    const origmediaUrl = urlParams.get('original_media_url');
    
    if (!mediaUrl) {
        alert('No media URL provided');
        return;
    }
    
    // 页面入场动画
    initPageAnimation();

    // Initialize left panel with media
    const leftContent = document.getElementById('left-content');
    let mediaElement;

    // 1. 先展示媒体元素
    // leftContent.appendChild(mediaElement);
    if (mediaUrl.toLowerCase().endsWith('.mp4') || mediaUrl.toLowerCase().endsWith('.webm')) {
        mediaElement = document.createElement('video');
        mediaElement.src = mediaUrl;
        mediaElement.autoplay = true;
        mediaElement.loop = true;
        mediaElement.muted = true;
        mediaElement.playsInline = true;
        // 样式：全覆盖 + 圆形 + feather mask
        mediaElement.className = "absolute inset-0 w-full h-full object-cover rounded-full " +
                                 "[mask-image:radial-gradient(circle,rgba(0,0,0,1),rgba(0,0,0,0))] " +
                                 "[mask-repeat:no-repeat] [mask-position:center] [mask-size:cover]";
    } else if (/\.(png|jpe?g)$/i.test(mediaUrl)) {
        mediaElement = document.createElement('img');
        mediaElement.src = mediaUrl;
        mediaElement.alt = 'Uploaded image';
        mediaElement.className = "absolute inset-0 w-full h-full object-cover rounded-full " +
                                 "[mask-image:radial-gradient(circle,rgba(0,0,0,1),rgba(0,0,0,0))] " +
                                 "[mask-repeat:no-repeat] [mask-position:center] [mask-size:cover]";
    } else {
        alert('Unsupported media type');
        return;
    }
    
    leftContent.appendChild(mediaElement);
    
    // 启动媒体呼吸效果
    startMediaBreathingEffect();

    // Start the process
    describeVideo(origmediaUrl);
});

async function typeWriter(element, texts) {
    element.innerHTML = ''; // 清空现有内容
    
    // 确保 texts 是数组（如果是字符串，转为单元素数组）
    const lines = Array.isArray(texts) ? texts : [String(texts || '')];
    
    // 逐行处理
    for (const line of lines) {
        const lineElement = document.createElement('div'); // 每行用 div 包裹
        element.appendChild(lineElement);
        
        // 当前行的打字机效果
        await new Promise((resolve) => {
            let currentIndex = 0;
            function type() {
                if (currentIndex < line.length) {
                    lineElement.innerHTML += line.charAt(currentIndex);
                    currentIndex++;
                    setTimeout(type, 50); // 每个字符间隔 50ms
                } else {
                    resolve(); // 当前行完成
                }
            }
            type();
        });
    }
}

async function typeWriterSimultaneously(chineseElement, englishElement, chineseText, englishText) {
    // 清空现有内容
    chineseElement.innerHTML = '';
    englishElement.innerHTML = '';
    
    // 创建行元素
    const chineseLineElement = document.createElement('div');
    const englishLineElement = document.createElement('div');
    chineseElement.appendChild(chineseLineElement);
    englishElement.appendChild(englishLineElement);
    
    return new Promise((resolve) => {
        let chineseIndex = 0;
        let englishIndex = 0;
        let completed = 0;
        
        // 中文打字机效果（较慢）
        function typeChinese() {
            if (chineseIndex < chineseText.length) {
                chineseLineElement.innerHTML += chineseText.charAt(chineseIndex);
                chineseIndex++;
                setTimeout(typeChinese, 80); // 中文 80ms 间隔
            } else {
                completed++;
                if (completed === 2) resolve();
            }
        }
        
        // 英文打字机效果（较快）
        function typeEnglish() {
            if (englishIndex < englishText.length) {
                englishLineElement.innerHTML += englishText.charAt(englishIndex);
                englishIndex++;
                setTimeout(typeEnglish, 40); // 英文 40ms 间隔
            } else {
                completed++;
                if (completed === 2) resolve();
            }
        }
        
        // 同时开始两个打字机效果
        typeChinese();
        typeEnglish();
    });
}

function addStatusItem(text, isActive = false, isCompleted = false, toggleContent = null) {
    const rightContent = document.getElementById('right-content');
    const statusItem = document.createElement('div');
    statusItem.className = `status-item ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : 'pending'}`;
    
    statusItem.innerHTML = `
        <div class="status-icon">${isCompleted ? '✓' : '•'}</div>
        <div class="status-text">${text}</div>
    `;
    
    if (toggleContent) {
        const toggleId = 'toggle-' + Date.now();
        statusItem.innerHTML += `
            <button class="toggle-button" onclick="toggleDetails('${toggleId}', this)">
                Show details
            </button>
            <div id="${toggleId}" class="toggle-content" style="display: none;">
                ${toggleContent}
            </div>
        `;
    }
    
    rightContent.appendChild(statusItem);
    return statusItem;
}

function toggleDetails(contentId, button) {
    const content = document.getElementById(contentId);
    const isHidden = content.style.display === 'none' || !content.style.display;
    
    if (typeof gsap !== 'undefined') {
        if (isHidden) {
            // 显示详情
            content.style.display = 'block';
            gsap.fromTo(content, 
                { opacity: 0, height: 0, y: -10 },
                { 
                    opacity: 1, 
                    height: 'auto', 
                    y: 0,
                    duration: 0.4,
                    ease: 'power2.out',
                    onComplete: () => {
                        button.textContent = 'Hide details';
                    }
                }
            );
        } else {
            // 隐藏详情
            gsap.to(content, {
                opacity: 0,
                height: 0,
                y: -10,
                duration: 0.3,
                ease: 'power2.in',
                onComplete: () => {
                    content.style.display = 'none';
                    button.textContent = 'Show details';
                }
            });
        }
    } else {
        // 降级到简单的显示/隐藏
        if (isHidden) {
            content.style.display = 'block';
            button.textContent = 'Hide details';
        } else {
            content.style.display = 'none';
            button.textContent = 'Show details';
        }
    }
}

function updateStatusItem(item, text, isCompleted = true, toggleContent = null) {
    item.className = `status-item ${isCompleted ? 'completed' : 'active'}`;
    item.innerHTML = `
        <div class="status-icon">${isCompleted ? '✓' : '•'}</div>
        <div class="status-text">${text}</div>
    `;
    
    if (toggleContent) {
        const toggleId = 'toggle-' + Date.now();
        item.innerHTML += `
            <button class="toggle-button" onclick="toggleDetails('${toggleId}', this)">
                Show details
            </button>
            <div id="${toggleId}" class="toggle-content" style="display: none;">
                ${toggleContent}
            </div>
        `;
    }
}

async function describeVideo(mediaUrl) {
    const analyzingItem = addStatusItem("The agent is seeing...", true);
    lastStepTime = Date.now();

    try {
        const response = await fetch('/describe_video', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ media_url: mediaUrl })
        });

        if (!response.ok) {
            throw new Error(`Server responded with status ${response.status}`);
        }

        const data = await response.json();
        if (data.error) {
            throw new Error(data.error);
        }

        // Update the status item with toggleable content
        const toggleContent = `
            <div class="language-section">
                <div class="language-label" style="color: #777">${data.video_desc}</div>
            </div>
            <div class="language-section">
                <div class="language-label" style="color: #777">${data.video_desc_eng}</div>
            </div>
        `;
        updateStatusItem(analyzingItem, "Media analysis completed", true, toggleContent);
        
        // 2. 展示对媒体内容的描述
        // Display both Chinese and English descriptions with typewriter effect
        const leftContent = document.getElementById('left-content');
        leftContent.innerHTML = `
            <div class="language-section w-[300px] h-[300px] rounded-full radial-fade-small flex-col flex items-center justify-center p-4 text-center relative">
                <div class="text-black text-xl break-words">
                    <div id="chinese-desc" class="description"></div>
                </div>
                <div class="text-black opacity-50 text-sm break-words pt-8">
                    <div id="english-desc" class="description"></div>
                </div>
            </div>
        `;

        // Split both descriptions into lines
        const chineseLines = data.video_desc.split('。');
        const englishLines = data.video_desc_eng.split('.');
        const maxLines = Math.max(chineseLines.length, englishLines.length);

        const chineseDesc = document.getElementById('chinese-desc');
        const englishDesc = document.getElementById('english-desc');

        // Display lines simultaneously (Chinese and English at the same time)
        for (let i = 0; i < maxLines; i++) {
            const chineseLine = i < chineseLines.length ? chineseLines[i].trim() : '';
            const englishLine = i < englishLines.length ? englishLines[i].trim() : '';
            
            if (chineseLine || englishLine) {
                await typeWriterSimultaneously(chineseDesc, englishDesc, chineseLine, englishLine);
            }
        }

        // Calculate remaining time to reach MIN_DISPLAY_TIME
        const elapsed = Date.now() - lastStepTime;
        const remainingTime = Math.max(0, MIN_DISPLAY_TIME - elapsed);
        
        // After minimum display time, move to next step
        setTimeout(() => {
            findSimilarPoems(data.video_description || data.video_desc);
        }, remainingTime);
    } catch (error) {
        updateStatusItem(analyzingItem, `Error: ${error.message}`);
        console.error('Error:', error);

        // Show error message to user
        const leftContent = document.getElementById('left-content');
        leftContent.innerHTML = `
            <div class="error-message">
                Failed to analyze video: ${error.message}
            </div>
        `;
    }
}

function formatChinesePoem(text) {
    return text.trim()
      .replace(/\n+/g, '')       // 删除原始多余换行
      .replace(/，/g, '\n')   // 逗号后换行
      .replace(/，/g, '')
      .replace(/。/g, '')
}

async function findSimilarPoems(description) {
    const thinkingItem = addStatusItem("The agent is thinking...", true);
    lastStepTime = Date.now();

    try {
        const response = await fetch('/find_similar_poems', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ video_description: description })
        });
        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        // Update the status item with toggleable content这部分没问题
        const toggleContent = `
            <div class="language-section">
                <div class="poem" style="color: #777">${data.similar_poems.join('<br>')}</div>
            </div>
            <div class="language-section">
                <div class="poem" style="color: #777">${data.similar_poems_eng.join('<br>')}</div>
            </div>
        `;
        updateStatusItem(thinkingItem, "Found similar poems", true, toggleContent);
        
        // 3. 展示相似诗句
        // Display all poems and translations together
        const leftContent = document.getElementById('left-content');
        leftContent.innerHTML = `
            <div class="text-black text-lg break-words leading-relaxed">
                <div id="poems-container" class="poem"></div>
            </div>
        `;

        const poemsContainer = document.getElementById('poems-container');
        
        // Create formatted display with all poems and translations
        let formattedContent = '';
        
        // 方式1：使用原始API数据（当前方式）
        for (let i = 0; i < data.similar_poems.length; i++) {
            const chinesePoem = formatChinesePoem(data.similar_poems[i]);
            const englishPoem = data.similar_poems_eng[i] //formatEnglishPoem();
            
            if (chinesePoem || englishPoem) {
                formattedContent += `<div class="text-black text-xl break-words">${chinesePoem}</div><div class="text-black opacity-50 text-sm break-words pt-8 -mt-10">${englishPoem}</div>`;
            }
        }
        
        
        // Display all content at once with typewriter effect
        // 将换行符转换为HTML的<br>标签，并直接设置innerHTML
        const htmlContent = formattedContent.replace(/\n/g, '<br>');
        poemsContainer.innerHTML = htmlContent;

        
        // 注释掉自动跳转到下一步的代码
        // Calculate remaining time to reach MIN_DISPLAY_TIME
        const elapsed = Date.now() - lastStepTime;
        const remainingTime = Math.max(0, MIN_DISPLAY_TIME - elapsed);
        
        // After minimum display time, move to next step
        setTimeout(() => {
            generatePoem(description, data.similar_poems);
        }, remainingTime);
    } catch (error) {
        updateStatusItem(thinkingItem, `Error: ${error.message}`);
        console.error('Error:', error);
    }
}

// 4. 展示新诗句
async function generatePoem(description, poems) {
    const reflectingItem = addStatusItem("The agent is reflecting...", true);
    lastStepTime = Date.now();

    try {
        const response = await fetch('/generate_poem', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ video_description: description, similar_poems: poems})
        });
        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        // Update the status item with toggleable content
        const toggleContent = `
            <div class="language-section">
                <div class="poem" style="color: #777">${data.poem}</div>
            </div>
            <div class="language-section opacity-50 text-sm">
                <div class="poem" style="color: #777">${data.poem_eng}</div>
            </div>
        `;
        updateStatusItem(reflectingItem, "Generated new poem", true, toggleContent);
        
        // Display both Chinese and English poems with typewriter effect
        const leftContent = document.getElementById('left-content');
        leftContent.innerHTML = `
            <div class="language-section w-[300px] h-[300px] rounded-full radial-fade-small flex items-center justify-center p-4 text-center relative">
                <div class="text-black text-4xl vertical-text break-words">
                    <div id="chinese-poem" class="poem"></div>
                </div>
                <div class="absolute text-black opacity-50 text-sm break-words">
                    <div id="english-poem" class="poem"></div>
                </div>
            </div>
        `;

        // Apply typewriter effect to both poems simultaneously
        const chinesePoem = document.getElementById('chinese-poem');
        const englishPoem = document.getElementById('english-poem');
        
        // 检查formatChinesePoem的结果
        const formattedPoem = formatChinesePoem(data.poem);
        
        await typeWriterSimultaneously(chinesePoem, englishPoem, formattedPoem, data.poem_eng);
        // Calculate remaining time to reach MIN_DISPLAY_TIME
        const elapsed = Date.now() - lastStepTime;
        const remainingTime = Math.max(0, MIN_DISPLAY_TIME - elapsed);
        
        // After minimum display time, mark as completed
        setTimeout(() => {
            // replaceWithSimpleEl(data.poem)
            window.location.href = `/guess?poem=${data.poem}`;
        }, remainingTime);
    } catch (error) {
        updateStatusItem(reflectingItem, `Error: ${error.message}`);
        console.error('Error:', error);
    }
}
// async function replaceWithSimpleEl(poem) {
//     const reflectingItem = addStatusItem("The agent is creating...", true);
//     lastStepTime = Date.now();
//     try {
        
//         const response = await fetch('/replace_with_created_char', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({ poem: poem })
//         });
//         const data = await response.json();

//         if (data.error) {
//             throw new Error(data.error);
//         }
        
//         // Display both Chinese and English poems with typewriter effect
//         const leftContent = document.getElementById('left-content');
//         leftContent.innerHTML = `
//             <div class="language-section">
//                 <div class="language-label">Chinese Poem:</div>
//                 <div id="chinese-poem" class="poem"></div>
//             </div>
//             <div class="language-section">
//                 <div class="language-label">Poem with Nvshu:</div>
//                 <div id="poem-el" class="poem"></div>
//             </div>
//         `;

//         // Apply typewriter effect to both poems sequentially
//         const chinesePoem = document.getElementById('chinese-poem');
//         const elPoem = document.getElementById('poem-el');
        
//         await typeWriter(chinesePoem, data.poem_orig);
//         await typeWriter(elPoem, data.poem_in_simple_el);

//         // Calculate remaining time to reach MIN_DISPLAY_TIME
//         const elapsed = Date.now() - lastStepTime;
//         const remainingTime = Math.max(0, MIN_DISPLAY_TIME - elapsed);
        
//         // After minimum display time, mark as completed
//         setTimeout(() => {
//             // 跳转到 guess.html 页面
//             window.location.href = `/guess?poem=${data.poem_orig}`;
//         }, remainingTime);
//     } catch (error) {
//         updateStatusItem(reflectingItem, `Error: ${error.message}`);
//         console.error('Error:', error);
//     }
// }

// ====================== 页面动画效果 ======================

// 页面入场动画
function initPageAnimation() {
    const mainContainer = document.getElementById('mainContainer');
    const leftPanel = document.querySelector('[data-component="left-panel"]');
    const rightPanel = document.querySelector('[data-component="right-panel"]');
    
    if (typeof gsap !== 'undefined') {
        // 主容器fade in
        gsap.to(mainContainer, { 
            opacity: 1, 
            duration: 0.6, 
            ease: 'power2.out' 
        });
        
        // 左右面板依次出现
        gsap.fromTo(leftPanel, 
            { opacity: 0, x: -50, scale: 0.95 },
            { 
                opacity: 1, 
                x: 0, 
                scale: 1,
                duration: 0.8,
                ease: 'power2.out',
                delay: 0.3
            }
        );
        
        gsap.fromTo(rightPanel, 
            { opacity: 0, x: 50, scale: 0.95 },
            { 
                opacity: 1, 
                x: 0, 
                scale: 1,
                duration: 0.8,
                ease: 'power2.out',
                delay: 0.5
            }
        );
    } else {
        mainContainer.style.opacity = '1';
    }
}

// 媒体呼吸效果 
function startMediaBreathingEffect() {
    const mediaCircle = document.getElementById('mediaCircle');
    
    if (typeof gsap !== 'undefined' && mediaCircle) {
        // 呼吸效果动画
        gsap.to(mediaCircle, {
            scale: 1.05,
            duration: 2,
            ease: 'power2.inOut',
            yoyo: true,
            repeat: -1
        });
        
        // 轻微的发光效果
        gsap.to(mediaCircle, {
            boxShadow: '0 0 30px rgba(255, 253, 233, 0.4)',
            duration: 3,
            ease: 'power2.inOut',
            yoyo: true,
            repeat: -1
        });
    }
}

// 停止媒体呼吸效果
function stopMediaBreathingEffect() {
    const mediaCircle = document.getElementById('mediaCircle');
    
    if (typeof gsap !== 'undefined' && mediaCircle) {
        gsap.killTweensOf(mediaCircle);
        gsap.to(mediaCircle, {
            scale: 1,
            boxShadow: 'none',
            duration: 0.5,
            ease: 'power2.out'
        });
    }
}

// 文字区域等待动画
function startTextLoadingAnimation(element) {
    if (typeof gsap !== 'undefined' && element) {
        // 添加加载点动画
        element.innerHTML = '<div class="loading-dots">Processing<span class="dot-1">.</span><span class="dot-2">.</span><span class="dot-3">.</span></div>';
        
        // 点的动画
        gsap.to('.dot-1', { opacity: 0.3, duration: 0.5, ease: 'power2.inOut', repeat: -1, yoyo: true });
        gsap.to('.dot-2', { opacity: 0.3, duration: 0.5, ease: 'power2.inOut', repeat: -1, yoyo: true, delay: 0.2 });
        gsap.to('.dot-3', { opacity: 0.3, duration: 0.5, ease: 'power2.inOut', repeat: -1, yoyo: true, delay: 0.4 });
    }
}

// 停止文字加载动画
function stopTextLoadingAnimation() {
    if (typeof gsap !== 'undefined') {
        gsap.killTweensOf('.dot-1, .dot-2, .dot-3');
    }
}
