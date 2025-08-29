// Get the poem from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const poem = urlParams.get('poem');

// Global variables
let charData = null;
let replaceData = null;
let guessInterval = null;

// 新增函数：处理自定义格式的字符串
function parseCustomFormat(str) {
    // 这里需要根据你的实际字符串格式来编写解析逻辑
    // 示例：假设格式是 "江永[14,0,16]书奇"
    const result = [];
    let currentPart = '';
    let inArray = false;
    let arrayContent = '';
    
    for (const char of str) {
        if (char === '[') {
            if (currentPart) {
                result.push(currentPart);
                currentPart = '';
            }
            inArray = true;
            arrayContent = '';
        } else if (char === ']') {
            inArray = false;
            try {
                const arrayData = JSON.parse(`[${arrayContent}]`);
                result.push(arrayData);
            } catch (e) {
                console.error('解析数组内容失败:', arrayContent);
            }
        } else if (inArray) {
            arrayContent += char;
        } else {
            currentPart += char;
        }
    }
    
    if (currentPart) {
        result.push(currentPart);
    }
    
    return result;
}


function renderMixedContent(data) {
    // 如果数据是字符串，先尝试解析
    if (typeof data === 'string') {
        try {
            data = JSON.parse(data);
        } catch (e) {
            data = parseCustomFormat(data);
        }
    }
    
    // 确保是数组
    if (!Array.isArray(data)) {
        console.error('最终数据不是数组:', data);
        return '';
    }
    
    return data.map(item => {
        try {
            if (Array.isArray(item)) {
                const imgName = `combined_${item.join('-')}_vertical_black_trim.png`;
                return `<img src="/static/nvshu_images/${imgName}" alt="" class="inline-flex h-[1em] align-middle justify-center items-center my-[0.15em] mx-[0.1em]" style="margin-left: -15px;">`;
            }
            // 处理字符串可能包含多个字符的情况
            if (typeof item === 'string' && item.length > 1) {
                return item.split('').join('');
            }
            return `${item}`;
        } catch (e) {
            console.error('处理项目失败:', item);
            return '';
        }
    }).join('');
}


function formatChinesePoem(text) {
    return text.trim()
      .replace(/\n+/g, '')       // 删除原始多余换行
      .replace(/，/g, '\n')   // 逗号后换行
      .replace(/，/g, '')
      .replace(/。/g, '')
}


// 1. 获取原始诗句
document.addEventListener('DOMContentLoaded', async () => {
    if (!poem) {
        alert('No poem provided');
        return;
    }
    
    try {
        // Get the simple_el version of the poem
        const replaceResponse = await fetch('/replace_with_created_char', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ poem: poem })
        });
        
        replaceData = await replaceResponse.json();
        
        if (replaceData.poem_in_simple_el) {
            // 调试输出
            console.log('原始 poem_in_simple_el:', replaceData.poem_in_simple_el);
            const poem_in_simple_el_formatted = formatChinesePoem(replaceData.poem_in_simple_el);
            console.log('格式化后 poem_in_simple_el:', poem_in_simple_el_formatted);
            // console.log('类型:', typeof replaceData.poem_in_simple_el); // string
            // 解析字符串为数组
            let parsedData;
            try {
                parsedData = JSON.parse(poem_in_simple_el_formatted);
                // 如果是字符串但不符合JSON格式（如 "江永[14,0,16]书奇"），按字符处理
                if (typeof parsedData === 'string') {
                    parsedData = parseCustomFormat(poem_in_simple_el_formatted);
                }
            } catch (e) {
                // 如果JSON解析失败，尝试自定义解析
                parsedData = parseCustomFormat(poem_in_simple_el_formatted);
            }
            
            console.log('解析后数据:', parsedData);
            const revealingContent = renderMixedContent(parsedData).replace(/\n/g, '<br>');
            document.getElementById('revealing-text').innerHTML = revealingContent;
            const origContent = renderMixedContent(parsedData).replace(/\n/g, '<br>');
            document.getElementById('original-text').innerHTML = origContent;

            
            // Get character data
            const charResponse = await fetch('/generate_char', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ poem: poem })
            });
            
            charData = await charResponse.json();
            console.info('charData.char_pos:', charData.char_pos);
            console.info('charData.guess_char.length:', charData.guess_char.length);
            
            // 更新背景字符为目标字符
            if (charData.char_cn) {
                const speakerBgChar = document.getElementById('speaker-bg-char');
                const listenerBgChar = document.getElementById('listener-bg-char');
                if (speakerBgChar) speakerBgChar.textContent = charData.char_cn;
                if (listenerBgChar) listenerBgChar.textContent = charData.char_cn;
            }
            
            // 更新英文翻译
            if (charData.char_translate) {
                const speakerTranslate = document.getElementById('speaker-translate');
                if (speakerTranslate) speakerTranslate.textContent = charData.char_translate.toLowerCase();
            }
            
            startAutomaticRevelation();
            
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('loading').textContent = 'Failed to process the poem';
    }
});
// 更新 char-image-container 中的字符信息显示
function updateEncodingTextDisplay() {
    // 更新中文字符显示
    const charCnDisplay = document.getElementById('char-cn-display');
    if (charCnDisplay && charData.char_cn) {
        charCnDisplay.textContent = charData.char_cn;
    }
    
    // 更新英文翻译显示
    const charTranslateDisplay = document.getElementById('char-translate-display');
    if (charTranslateDisplay && charData.char_translate) {
        charTranslateDisplay.textContent = charData.char_translate;
    }
    
    // 更新女书字符显示
    const simpleElDisplay = document.getElementById('simple-el-display');
    if (simpleElDisplay && charData.simple_el) {
        simpleElDisplay.textContent = charData.simple_el;
    }
}

function startAutomaticRevelation() {
    const pos = charData.char_pos;
    const guessChars = charData.guess_char;
    const guessCharsEng = charData.guess_char_eng
    const poem_list = replaceData.poem_in_list;
    const revealingText = document.getElementById('revealing-text'); // 这个时候的 revealing-text 是已经格式化后的，没有标点符号
    
    // 获取媒体文件路径
    const mediaUrl = document.getElementById('media-url').value;
    const listenerCircle = document.querySelector('[data-component="listener-circle"]');
    
    // 创建临时背景图片元素
    let tempBackgroundImg = null;
    if (mediaUrl) {
        tempBackgroundImg = document.createElement('div');
        tempBackgroundImg.style.cssText = `
            position: absolute;
            inset: 0;
            background-image: url('${mediaUrl}');
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            border-radius: 50%;
            opacity: 0;
            transition: opacity 0.3s ease;
            z-index: 1;
        `;
        listenerCircle.appendChild(tempBackgroundImg);
    }
    
    // 初始显示
    const initialContent = formatChinesePoem(replaceData.poem_in_simple_el);
    let parsedData = parseContent(initialContent);
    revealingText.innerHTML = renderMixedContent(parsedData).replace(/\n/g, '<br>');
    

    // 初始高亮
    highlightCharacter(pos);
    highlightRevealingCharacter(pos);

    
    // 创建时间线以便更好地控制动画序列
    const tl = gsap.timeline({
        defaults: { duration: 0.8, ease: "power2.inOut" }
    });
    
    // 添加猜字动画序列
    guessChars.forEach((char, index) => {
        tl.to(revealingText, {
            opacity: 0,
            duration: 0.3,
            onComplete: () => {
                // 更新内容
                poem_list[pos] = char;
                
                const newContent = poem_list.map(item => 
                    Array.isArray(item) ? `[${item.join(',')}]` : item
                ).join('');
                const cleanedContent = newContent.replace(/[，。]/g, '\n');
                parsedData = parseContent(cleanedContent);
                revealingText.innerHTML = renderMixedContent(parsedData).replace(/\n/g, '<br>');
                
                // 更新翻译内容
                const listenerTranslate = document.getElementById('listener-translate');
                if (listenerTranslate && guessCharsEng[index]) {
                    listenerTranslate.textContent = guessCharsEng[index].toLowerCase();
                }
                
                // 在内容更新后重新高亮
                highlightRevealingCharacter(pos);
            }
        })
        .to(revealingText, { 
            opacity: 1,
            duration: 0.7,
            ease: "elastic.out(1, 0.5)",
            onComplete: () => {
                // 使用GSAP的set方法设置最终位置
                gsap.set(revealingText, {
                    clearProps: 'translate,rotate,scale,transform'
                });
            }
        }, "<0.2"); // 重叠动画
        
        // 添加背景图片闪现效果
        if (tempBackgroundImg) {
            tl.to(tempBackgroundImg, {
                opacity: 0.3,
                duration: 0.2,
                ease: "power2.inOut"
            }, "<0.1")
            .to(tempBackgroundImg, {
                opacity: 0,
                duration: 0.3,
                ease: "power2.out"
            }, "<0.3");
        }
        
        // 最后一个字符停留时间稍长
        if (index === guessChars.length - 1) {
            tl.to({}, { duration: 1 });
        }
    });
    
         // 最终显示正确字符
     tl.to(revealingText, {
         opacity: 0,
         duration: 0.3,
         onComplete: () => {
             poem_list[pos] = charData.simple_el;
             const finalContent = poem_list.map(item => 
                 Array.isArray(item) ? `[${item.join(',')}]` : item
             ).join('');
             
             // 去掉中文逗号和句号
             const cleanedContent = finalContent.replace(/[，。]/g, '\n');
             
             parsedData = parseContent(cleanedContent);
             revealingText.innerHTML = renderMixedContent(parsedData).replace(/\n/g, '<br>');
             
             // 更新为最终翻译
             const listenerTranslate = document.getElementById('listener-translate');
             if (listenerTranslate && charData.char_translate) {
                 listenerTranslate.textContent = charData.char_translate ? charData.char_translate.toLowerCase() : '';
             }
             
             // 在内容更新后重新高亮
             highlightRevealingCharacter(pos);
         }
     })
     .to(revealingText, { 
         opacity: 1,
         duration: 0.7,
         ease: "back.out(2)",
         onComplete: () => {
             // 使用GSAP的set方法设置最终位置
             gsap.set(revealingText, {
                 clearProps: 'translate,rotate,scale,transform'
             });
             
             displayCharacterImage();
             document.getElementById('loading').style.display = 'none';
             
             gsap.from(revealingText, {
                 scale: 1.2,
                 duration: 0.8,
                 ease: "elastic.out(1, 0.5)",
                 onComplete: () => {
                     // 使用GSAP的set方法设置最终位置
                     gsap.set(revealingText, {
                         clearProps: 'translate,rotate,scale,transform'
                     });
                     
                     // 清理临时背景图片
                     if (tempBackgroundImg) {
                         tempBackgroundImg.remove();
                     }
                 }
             });
         }
     });
     
     // 最终字符的背景图片闪现效果
     if (tempBackgroundImg) {
         tl.to(tempBackgroundImg, {
             opacity: 0.4,
             duration: 0.3,
             ease: "power2.inOut"
         }, "<0.1")
         .to(tempBackgroundImg, {
             opacity: 0,
             duration: 0.5,
             ease: "power2.out"
         }, "<0.4");
     }
}

// 辅助函数：解析内容
function parseContent(content) {
    try {
        let parsed = JSON.parse(content);
        if (typeof parsed === 'string') {
            return parseCustomFormat(content);
        }
        return parsed;
    } catch (e) {
        return parseCustomFormat(content);
    }
}

// Highlight the character in the original poem (支持混合内容)
function highlightCharacter(pos) {
    const originalText = document.getElementById('original-text');
    
    // 获取所有子节点（包括文本节点和元素节点）
    const nodes = [];
    const walker = document.createTreeWalker(
        originalText,
        NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
        null,
        false
    );
    
    let node;
    while (node = walker.nextNode()) {
        nodes.push(node);
    }
    
    // 计算可见字符的位置
    let charCount = 0;
    nodes.forEach((node, nodeIndex) => {
        if (node.nodeType === Node.TEXT_NODE) {
            // 文本节点：逐个字符处理
            const text = node.textContent;
            const parent = node.parentNode;
            
            // 将文本节点拆分为单个字符的span
            const spans = [];
            for (let i = 0; i < text.length; i++) {
                const span = document.createElement('span');
                span.className = 'char-span';
                span.textContent = text[i];
                spans.push(span);
                
                // 高亮目标字符
                if (charCount === pos) {
                    span.classList.add('highlight');
                }
                charCount++;
            }
            
            // 替换原始文本节点
            const fragment = document.createDocumentFragment();
            spans.forEach(span => fragment.appendChild(span));
            parent.replaceChild(fragment, node);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            // 元素节点（如女书图片）：视为一个字符单位
            if (charCount === pos) {
                node.classList.add('highlight-img');
            }
            charCount++;
        }
    });
}

// 高亮右侧 revealing-text 中的目标字符
function highlightRevealingCharacter(pos) {
    const revealingText = document.getElementById('revealing-text');
    
    // 先清理之前的高亮
    const existingHighlights = revealingText.querySelectorAll('.highlight, .highlight-img');
    existingHighlights.forEach(el => {
        if (el.classList.contains('highlight-img')) {
            // 如果是图片高亮容器，将图片移回原位置并移除容器
            const img = el.querySelector('img');
            if (img) {
                el.parentNode.insertBefore(img, el);
                el.remove();
            }
        } else {
            // 如果是文本高亮，移除高亮类
            el.classList.remove('highlight');
        }
    });
    
    // 如果内容是纯文本
    // 如果 pos > 5，则减一
    if (pos > 5) {
        pos = pos - 1;
    }
    if (revealingText.childNodes.length === 1 && revealingText.firstChild.nodeType === Node.TEXT_NODE) {
        const text = revealingText.textContent;
        revealingText.innerHTML = text.split('').map((char, index) => {
            return index === pos ? 
                `<span class="highlight">${char}</span>` : 
                char;
        }).join('');
    } 
    // 如果内容是混合元素（文本+图片）
    else {
        let charCount = 0;
        const walker = document.createTreeWalker(
            revealingText,
            NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
            null,
            false
        );

        while (walker.nextNode()) {
            const node = walker.currentNode;
            if (node.nodeType === Node.TEXT_NODE) {
                const text = node.textContent;
                if (charCount + text.length > pos) {
                    // 找到目标位置
                    const before = text.slice(0, pos - charCount);
                    const targetChar = text[pos - charCount];
                    const after = text.slice(pos - charCount + 1);
                    
                    const fragment = document.createDocumentFragment();
                    fragment.appendChild(document.createTextNode(before));
                    
                    const highlightSpan = document.createElement('span');
                    highlightSpan.className = 'highlight';
                    highlightSpan.textContent = targetChar;
                    fragment.appendChild(highlightSpan);
                    
                    fragment.appendChild(document.createTextNode(after));
                    node.parentNode.replaceChild(fragment, node);
                    break;
                }
                charCount += text.length;
            } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'IMG') {
                if (charCount === pos) {
                    // 移除图片的内联样式
                    node.style.removeProperty('margin-left');
                    // 为图片创建高亮容器
                    const container = document.createElement('span');
                    container.className = 'highlight-img';
                    // 保持图片原有的类名
                    container.classList.add('inline-flex', 'h-[1em]', 'align-middle', 'justify-center', 'items-center', 'my-[0.15em]', 'mx-[0.1em]');
                    // // 直接设置内联样式确保移动生效
                    container.style.marginLeft = '-15px';
                    node.parentNode.insertBefore(container, node);
                    container.appendChild(node);
                    break;
                }
                charCount++;
            }
        }
    }
}

// Display the character image
function displayCharacterImage() {
    const container = document.getElementById('char-image-container');
    
    // 保存字符信息显示元素
    const charCnDisplay = document.getElementById('char-cn-display');
    const charTranslateDisplay = document.getElementById('char-translate-display');
    const simpleElDisplay = document.getElementById('simple-el-display');
    
    container.innerHTML = '';
    
    if (charData.char_img_path) {
        // Hide the encoding and guessing text
        document.getElementById('encoding-text').style.display = 'none';
        document.getElementById('guessing-text').style.display = 'none';
        
        // Show the consensus title and change circle style
        document.getElementById('consensus-title').classList.remove('hidden');
        
        // Change the listener circle from animated to static style
        const listenerCircle = document.querySelector('.radial-fade-listener');
        if (listenerCircle) {
            listenerCircle.classList.remove('radial-fade-listener');
            listenerCircle.classList.add('radial-fade-small');
        }

        const img = document.createElement('img');
        img.src = charData.char_img_path;
        img.alt = 'Generated Nüshu character';
        img.className = 'char-image';
        container.appendChild(img);
        
        // 重新添加字符信息显示元素
        if (charCnDisplay) container.appendChild(charCnDisplay);
        if (charTranslateDisplay) container.appendChild(charTranslateDisplay);
        if (simpleElDisplay) container.appendChild(simpleElDisplay);
        
        // 更新字符信息显示
        updateEncodingTextDisplay();

        // 添加生成结果按钮
        const button = document.createElement('button');
        button.id = 'generate-result-btn';
        button.className = 'w-full max-w-[20vw] px-10 py-2 rounded-[30px] border-[2px] border-dashed border-[rgb(255,251,233)] bg-[rgba(255,251,233,0.4)] text-[rgb(255,251,233)] font-inknut mt-auto';
        button.style.padding = '0.1rem 1rem';
        button.textContent = 'Generate Result';
        button.addEventListener('click', () => {
            // 跳转到结果页面
            window.location.href = '/get_result';
        });
        
        // 将按钮添加到专门的按钮容器中
        const buttonContainer = document.getElementById('button-container');
        buttonContainer.appendChild(button);

    } else {
        console.error('No character image path available');
    }
}

function showConsensusReached() {
    const revealingText = document.getElementById('revealing-text');
    const circleContainer = revealingText.closest('.radial-fade-listener');
    
    // Change the animation class to static class
    if (circleContainer) {
        circleContainer.classList.remove('radial-fade-listener');
        circleContainer.classList.add('radial-fade-small');
    }
    
    revealingText.textContent = "Consensus Reached!";
    revealingText.style.display = 'block';
    
    // Add the button after a short delay
    setTimeout(() => {
        addGenerateResultButton();
    }, 1000);
}

