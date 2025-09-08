document.addEventListener('DOMContentLoaded', function() {
    // 保存图片功能 - 修改为截取正确的虚线框容器
    document.getElementById('save-image-btn').addEventListener('click', function() {
        // First capture the main container as image
        const element = document.querySelector('.max-w-\\[1200px\\].w-full.mx-auto.border-\\[2px\\].border-dashed.border-\\[\\#FFFDE9\\].rounded-\\[20px\\]');
        
        html2canvas(element, {
            scale: 2,
            logging: false,
            useCORS: true,
            allowTaint: true,
            backgroundColor: null
        }).then(canvas => {
            window.print();
        });
    });
    
    // Add print-specific styles
    const style = document.createElement('style');
    style.innerHTML = `
        @media print {
            body * {
                visibility: hidden;
            }
            .max-w-\\[1200px\\].w-full.mx-auto.border-\\[2px\\].border-dashed.border-\\[\\#FFFDE9\\].rounded-\\[20px\\],
            .max-w-\\[1200px\\].w-full.mx-auto.border-\\[2px\\].border-dashed.border-\\[\\#FFFDE9\\].rounded-\\[20px\\] * {
                visibility: visible;
            }
            .max-w-\\[1200px\\].w-full.mx-auto.border-\\[2px\\].border-dashed.border-\\[\\#FFFDE9\\].rounded-\\[20px\\] {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                border: none !important;
            }
        }
    `;
    document.head.appendChild(style);

    // 跳转到字典页面
    document.getElementById('go-to-dictionary-btn').addEventListener('click', function() {
        const button = this;
        const dictionaryUrl = button.dataset.dictionaryUrl;
        if (dictionaryUrl) {
            window.location.href = dictionaryUrl;
        } else {
            console.error('Dictionary URL not found on the button.');
        }
    });

    // 分享到微信 - 使用微信JS-SDK的简化实现
    window.shareToWeChat = function() {
        const containerToCapture = document.querySelector('.max-w-\\[1200px\\].w-full.mx-auto.border-\\[2px\\].border-dashed.border-\\[\\#FFFDE9\\].rounded-\\[20px\\]');
        
        html2canvas(containerToCapture, {
            scale: 1,
            backgroundColor: null,
            logging: false,
            useCORS: true
        }).then(canvas => {
            // Create a new window
            const shareWindow = window.open('', '_blank');
            
            // Create DOM elements
            const doc = shareWindow.document;
            doc.open();
            
            const html = doc.createElement('html');
            const head = doc.createElement('head');
            const body = doc.createElement('body');
            
            // Create title
            const title = doc.createElement('title');
            title.textContent = 'Share to WeChat';
            head.appendChild(title);
            
            // Create style
            const style = doc.createElement('style');
            style.textContent = `
                body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
                .container { max-width: 500px; margin: 0 auto; }
                img { max-width: 100%; margin: 20px 0; }
                .instructions { margin: 20px 0; }
            `;
            head.appendChild(style);
            
            // Create content
            const container = doc.createElement('div');
            container.className = 'container';
            
            const heading = doc.createElement('h2');
            heading.textContent = 'Share to WeChat';
            container.appendChild(heading);
            
            const instructions = doc.createElement('div');
            instructions.className = 'instructions';
            instructions.innerHTML = `
                <p>In a real implementation, this would share directly to WeChat.</p>
                <p>For now, you can save the image below and share it manually:</p>
            `;
            container.appendChild(instructions);
            
            const imgContainer = doc.createElement('div');
            imgContainer.id = 'image-container';
            container.appendChild(imgContainer);
            
            const button = doc.createElement('button');
            button.textContent = 'Print or Save';
            button.onclick = function() { shareWindow.print(); };
            container.appendChild(button);
            
            // Append everything
            body.appendChild(container);
            html.appendChild(head);
            html.appendChild(body);
            doc.appendChild(html);
            
            // Add the image
            const img = doc.createElement('img');
            img.src = canvas.toDataURL('image/png');
            imgContainer.appendChild(img);
            
            doc.close();
        }).catch(err => {
            console.error('Error creating share image:', err);
            alert('Error creating share image. Please try again.');
        });
    };

    // 分享到Instagram - 使用Instagram的分享功能
    window.shareToInstagram = function() {
        const containerToCapture = document.querySelector('.max-w-\\[1200px\\].w-full.mx-auto.border-\\[2px\\].border-dashed.border-\\[\\#FFFDE9\\].rounded-\\[20px\\]');
        
        html2canvas(containerToCapture, {
            scale: 1,
            backgroundColor: null,
            logging: false,
            useCORS: true
        }).then(canvas => {
            // Create a new window
            const shareWindow = window.open('', '_blank');
            
            // Create DOM elements
            const doc = shareWindow.document;
            doc.open();
            
            const html = doc.createElement('html');
            const head = doc.createElement('head');
            const body = doc.createElement('body');
            
            // Create title
            const title = doc.createElement('title');
            title.textContent = 'Share to Instagram';
            head.appendChild(title);
            
            // Create style
            const style = doc.createElement('style');
            style.textContent = `
                body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
                .container { max-width: 500px; margin: 0 auto; }
                img { max-width: 100%; margin: 20px 0; }
                .instructions { margin: 20px 0; }
            `;
            head.appendChild(style);
            
            // Create content
            const container = doc.createElement('div');
            container.className = 'container';
            
            const heading = doc.createElement('h2');
            heading.textContent = 'Share to Instagram';
            container.appendChild(heading);
            
            const instructions = doc.createElement('div');
            instructions.className = 'instructions';
            instructions.innerHTML = `
                <p>1. Save this image to your device</p>
                <p>2. Open Instagram and create a new post</p>
                <p>3. Select this image from your gallery</p>
            `;
            container.appendChild(instructions);
            
            const imgContainer = doc.createElement('div');
            imgContainer.id = 'image-container';
            container.appendChild(imgContainer);
            
            const button = doc.createElement('button');
            button.textContent = 'Print or Save';
            button.onclick = function() { shareWindow.print(); };
            container.appendChild(button);
            
            // Append everything
            body.appendChild(container);
            html.appendChild(head);
            html.appendChild(body);
            doc.appendChild(html);
            
            // Add the image
            const img = doc.createElement('img');
            img.src = canvas.toDataURL('image/png');
            imgContainer.appendChild(img);
            
            doc.close();
        }).catch(err => {
            console.error('Error creating share image:', err);
            alert('Error creating share image. Please try again.');
        });
    };

    // 复制分享链接
    window.copyShareLink = function() {
        const shareLink = window.location.href;
        navigator.clipboard.writeText(shareLink).then(() => {
            // 创建一个漂亮的提示而不是简单的alert
            const notification = document.createElement('div');
            notification.style.position = 'fixed';
            notification.style.bottom = '20px';
            notification.style.right = '20px';
            notification.style.backgroundColor = '#FFFDE9';
            notification.style.color = 'black';
            notification.style.padding = '10px 20px';
            notification.style.borderRadius = '5px';
            notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
            notification.style.zIndex = '1000';
            notification.textContent = 'Link copied to clipboard!';
            
            document.body.appendChild(notification);
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 3000);
        }).catch(err => {
            console.error('Failed to copy: ', err);
            alert('Failed to copy link. Please try again.');
        });
    };

    // 保存用户选择到session
    document.querySelectorAll('input[name="storage"]').forEach(radio => {
        radio.addEventListener('change', async function() {
            try {
                // 保存用户选择
                const response = await fetch('/save_storage_preference', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ storage_preference: this.value })
                });

                // 如果用户选择 Yes，调用 add_to_dictionary
                if (this.value === 'yes') {
                    await fetch('/add_to_dictionary', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    });
                }
            } catch (error) {
                console.error('Error:', error);
            }
        });
    });
});
