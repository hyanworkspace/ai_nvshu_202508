// DOM元素
const recordOption = document.getElementById('recordOption');
const uploadOption = document.getElementById('uploadOption');
const fileInput = document.getElementById('fileInput');
const videoRecorder = document.getElementById('videoRecorder');
const confirmationPage = document.getElementById('confirmationPage');
const reUploadBtn = document.getElementById('reUploadBtn');
const confirmBtn = document.getElementById('confirmBtn');
const privacyPolicy = document.getElementById('privacyPolicy');
const agreeBtn = document.getElementById('agreeBtn');
const previewContainer = document.getElementById('previewContainer');
const recordPreview = document.getElementById('recordPreview');
const startRecordBtn = document.getElementById('startRecordBtn');
const stopRecordBtn = document.getElementById('stopRecordBtn');
const recordControls = document.querySelector('.record-controls');
const mainContent = document.querySelector('[data-component="main-content"]');
const uploadLoader = document.getElementById('uploadLoader');
const recordLoader = document.getElementById('recordLoader');
const globalLoader = document.getElementById('globalLoader');
const uploadSuccess = document.getElementById('uploadSuccess');
const uploadPreview = document.getElementById('uploadPreview');
const uploadVideoPreview = document.getElementById('uploadVideoPreview');

function showEl(el) { if (el) el.classList.remove('hidden'); }
function hideEl(el) { if (el) el.classList.add('hidden'); }

// 改进的显示/隐藏函数，带过渡效果
function showElWithTransition(el, duration = 0.3, onComplete = null) {
    if (!el) return;
    
    el.classList.remove('hidden');
    el.style.display = 'flex';
    
    if (typeof gsap !== 'undefined') {
        gsap.fromTo(el, 
            { opacity: 0, scale: 0.95, y: 10 }, 
            { 
                opacity: 1, 
                scale: 1, 
                y: 0, 
                duration: duration, 
                ease: 'power2.out',
                onComplete: onComplete 
            }
        );
    } else {
        el.style.opacity = '1';
        if (onComplete) onComplete();
    }
}

function hideElWithTransition(el, duration = 0.3, onComplete = null) {
    if (!el) return;
    
    if (typeof gsap !== 'undefined') {
        gsap.to(el, {
            opacity: 0,
            scale: 0.95,
            y: -10,
            duration: duration,
            ease: 'power2.in',
            onComplete: () => {
                el.classList.add('hidden');
                el.style.display = 'none';
                if (onComplete) onComplete();
            }
        });
    } else {
        el.style.opacity = '0';
        setTimeout(() => {
            el.classList.add('hidden');
            el.style.display = 'none';
            if (onComplete) onComplete();
        }, duration * 1000);
    }
}

// 录制相关变量
let videoStream = null;
let mediaRecorder = null;
let originalMediaRecorder = null;
let recordedChunks = [];
let originalRecordedChunks = [];
let uploadedFile = null;
let currentMode = null;
let recordedVideo = null;
let originalRecordedVideo = null;
let animationFrameId;
let video_url;
let original_video_url;
let uploadedFileType = null;

const constraints = {
    audio: true,
    video: {
        width: { ideal: 640 },
        height: { ideal: 640 },
        aspectRatio: 1.0
    }
};

// 文件类型检测函数
function detectFileType(file) {
    // 首先检查 MIME 类型
    if (file.type) {
        if (file.type.startsWith('video/')) {
            return 'video';
        } else if (file.type.startsWith('image/')) {
            return 'image';
        }
    }
    
    // 如果 MIME 类型不可用，检查文件扩展名
    const fileName = file.name.toLowerCase();
    const videoExtensions = ['.mp4', '.webm', '.mov', '.avi'];
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp'];
    
    for (const ext of videoExtensions) {
        if (fileName.endsWith(ext)) {
            return 'video';
        }
    }
    
    for (const ext of imageExtensions) {
        if (fileName.endsWith(ext)) {
            return 'image';
        }
    }
    
    return null; // 未知类型
}

// 验证文件类型
function validateFile(file) {
    const fileType = detectFileType(file);
    
    if (!fileType) {
        throw new Error("Unsupported file type. Please upload MP4, PNG, or JPG files.");
    }
    
    // 检查文件大小
    if (file.size > 5 * 1024 * 1024) {
        throw new Error("File size exceeds 5MB limit. Please choose a smaller file.");
    }
    
    // 具体的文件类型验证
    if (fileType === 'image') {
        const allowedImageTypes = ['image/png', 'image/jpeg', 'image/jpg'];
        if (file.type && !allowedImageTypes.includes(file.type)) {
            throw new Error("Please upload PNG or JPG images only.");
        }
    } else if (fileType === 'video') {
        const allowedVideoTypes = ['video/mp4', 'video/webm'];
        if (file.type && !allowedVideoTypes.includes(file.type)) {
            throw new Error("Please upload MP4 videos only.");
        }
    }
    
    return fileType;
}

// 录制选项点击事件
recordOption.addEventListener('click', async () => {
    if (!videoStream) {
        try {
            videoStream = await navigator.mediaDevices.getUserMedia(constraints);
            if (videoStream) {
                recordPreview.srcObject = videoStream;
                recordPreview.classList.remove('hidden');
                recordControls.classList.remove('hidden');
                setupRecordingControls();
            }
        } catch (err) {
            console.error('无法访问摄像头:', err);
            alert('无法访问摄像头，请确保已授予摄像头权限，并且摄像头未被其他应用程序占用。');
        }
    }
});

// 设置录制控制
function setupRecordingControls() {
    currentMode = 'record';
    
    startRecordBtn.addEventListener('click', () => {
        recordedChunks = [];
        originalRecordedChunks = [];
        
        const recordingCanvas = document.createElement('canvas');
        recordingCanvas.width = 370;
        recordingCanvas.height = 370;
        const recordingCtx = recordingCanvas.getContext('2d');
        const recordedStream = recordingCanvas.captureStream(30);
        
        // 检测浏览器支持的视频格式
        let mimeType = 'video/webm';
        if (MediaRecorder.isTypeSupported('video/mp4')) {
            mimeType = 'video/mp4';
        } else if (MediaRecorder.isTypeSupported('video/webm')) {
            mimeType = 'video/webm';
        } else {
            console.warn('No supported video MIME type found');
        }
        
        const options = { mimeType: mimeType };
        
        try {
            // 检查浏览器是否支持 MediaRecorder
            if (typeof MediaRecorder === 'undefined') {
                throw new Error('MediaRecorder not supported');
            }
            
            mediaRecorder = new MediaRecorder(recordedStream, options);
            originalMediaRecorder = new MediaRecorder(videoStream, options);
        } catch (e) {
            console.error('创建 MediaRecorder 失败:', e);
            // 检查是否是 Safari
            const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
            if (isSafari) {
                alert('Safari 浏览器暂不支持视频录制功能，请使用上传功能或切换到 Chrome/Firefox 浏览器。');
            } else {
                alert('您的浏览器可能不支持视频录制功能，请尝试使用最新版本的 Chrome 或 Firefox。');
            }
            return;
        }
            
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };
        
        originalMediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                originalRecordedChunks.push(event.data);
            }
        };
        
        mediaRecorder.onstop = () => {
            const recordedBlob = new Blob(recordedChunks, { type: mimeType });
            recordedVideo = recordedBlob;
            const url = URL.createObjectURL(recordedBlob);
            console.log('生成的特效视频 URL:', url);
            
            if (originalMediaRecorder && originalMediaRecorder.state !== 'inactive') {
                originalMediaRecorder.stop();
            }
        };
        
        originalMediaRecorder.onstop = () => {
            const originalBlob = new Blob(originalRecordedChunks, { type: mimeType });
            originalRecordedVideo = originalBlob;
            const originalUrl = URL.createObjectURL(originalBlob);
            console.log('生成的原始视频 URL:', originalUrl);
            
            showConfirmationPageFromRecord(recordedVideo, originalRecordedVideo);
        };
        
        mediaRecorder.start();
        originalMediaRecorder.start();
        
        function processRecordingFrame() {
            if (!videoStream || mediaRecorder.state !== 'recording') return;

            recordingCtx.drawImage(recordPreview, 0, 0, recordingCanvas.width, recordingCanvas.height);
            
            const imageData = recordingCtx.getImageData(0, 0, recordingCanvas.width, recordingCanvas.height);
            const data = imageData.data;
            
            const pixelSize = 5;
            for (let y = 0; y < recordingCanvas.height; y += pixelSize) {
                for (let x = 0; x < recordingCanvas.width; x += pixelSize) {
                    let r = 0, g = 0, b = 0, count = 0;
                    
                    for (let dy = 0; dy < pixelSize && y + dy < recordingCanvas.height; dy++) {
                        for (let dx = 0; dx < pixelSize && x + dx < recordingCanvas.width; dx++) {
                            const idx = ((y + dy) * recordingCanvas.width + (x + dx)) * 4;
                            r += data[idx];
                            g += data[idx + 1];
                            b += data[idx + 2];
                            count++;
                        }
                    }
                    
                    r = Math.round(r / count);
                    g = Math.round(g / count);
                    b = Math.round(b / count);
                    
                    for (let dy = 0; dy < pixelSize && y + dy < recordingCanvas.height; dy++) {
                        for (let dx = 0; dx < pixelSize && x + dx < recordingCanvas.width; dx++) {
                            const idx = ((y + dy) * recordingCanvas.width + (x + dx)) * 4;
                            data[idx] = r;
                            data[idx + 1] = g;
                            data[idx + 2] = b;
                        }
                    }
                }
            }

            const threshold = 128;
            for (let i = 0; i < data.length; i += 4) {
                const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
                const value = gray > threshold ? 255 : 0;
                data[i] = value;
                data[i + 1] = value;
                data[i + 2] = value;
            }
            
            recordingCtx.putImageData(imageData, 0, 0);
            
            animationFrameId = requestAnimationFrame(processRecordingFrame);
        }
        
        processRecordingFrame();
        startRecordBtn.classList.add('hidden');
        stopRecordBtn.classList.remove('hidden');
    });
    
    stopRecordBtn.addEventListener('click', () => {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }
        
        if (originalMediaRecorder && originalMediaRecorder.state !== 'inactive') {
            originalMediaRecorder.stop();
        }
        
        stopRecordBtn.classList.add('hidden');
        startRecordBtn.classList.remove('hidden');
        
        if (videoStream) {
            videoStream.getTracks().forEach(track => track.stop());
            videoStream = null;
        }
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        recordPreview.classList.add('hidden');
        recordControls.classList.add('hidden');
    });
}

function showConfirmationPageFromRecord(blob, originalBlob) {
    recordedVideo = blob;
    originalRecordedVideo = originalBlob;
    uploadedFileType = 'video';
    
    const videoUrl = URL.createObjectURL(blob);
    
    // 预加载确认页面的视频内容
    preloadConfirmationMedia(videoUrl, 'video');
    
    // 使用平滑的转场到确认页面
    smoothTransitionToConfirmation(videoUrl, 'video');
}

// 平滑转场到确认页面（用于录制视频）
function smoothTransitionToConfirmation(url, fileType) {
    const mainContainer = document.querySelector('[data-component="main-content"]');
    const videoRecorder = document.getElementById('videoRecorder');
    
    if (typeof gsap !== 'undefined') {
        const tl = gsap.timeline();
        
        // 1. 淡出录制界面和主容器
        tl.to([mainContainer, videoRecorder], {
            opacity: 0,
            scale: 0.95,
            duration: 0.5,
            ease: 'power2.inOut',
            onComplete: () => {
                mainContainer.style.display = 'none';
                hideEl(videoRecorder);
            }
        })
        
        // 2. 显示确认页面并设置媒体
        .call(() => {
            confirmationPage.classList.remove('hidden');
            confirmationPage.style.display = 'flex';
            confirmationPage.style.opacity = '0';
            
            // 显示预加载的视频
            const videoPreview = document.getElementById('videoPreview');
            const imgPreview = document.getElementById('imagePreview');
            
            videoPreview.style.display = 'block';
            if (imgPreview) imgPreview.style.display = 'none';
        })
        
        // 3. 确认页面淡入
        .to(confirmationPage, {
            opacity: 1,
            duration: 0.6,
            ease: 'power2.out'
        })
        
        // 4. 预览圆形动画
        .fromTo('[data-component="preview-circle"]', 
            { scale: 0.9, opacity: 0.8 },
            { 
                scale: 1.1, 
                opacity: 1, 
                duration: 0.7, 
                ease: 'back.out(1.7)'
            }, "-=0.4"
        );
        
    } else {
        // Fallback without GSAP
        mainContainer.style.display = 'none';
        hideEl(videoRecorder);
        
        confirmationPage.classList.remove('hidden');
        confirmationPage.style.display = 'flex';
        confirmationPage.style.opacity = '1';
        
        const videoPreview = document.getElementById('videoPreview');
        const imgPreview = document.getElementById('imagePreview');
        videoPreview.style.display = 'block';
        if (imgPreview) imgPreview.style.display = 'none';
    }
}

// 上传选项点击事件
uploadOption.addEventListener('click', () => {
    currentMode = 'upload';
    fileInput.click();
});

// 改进的文件选择事件处理
fileInput.addEventListener('change', async (e) => {
    if (e.target.files.length > 0) {
        const file = e.target.files[0];
        
        try {
            // 验证文件
            const fileType = validateFile(file);
            uploadedFile = file;
            uploadedFileType = fileType;
            
            console.log(`File selected: ${file.name}, Type: ${fileType}, MIME: ${file.type}, Size: ${file.size}`);
            
            // 创建FormData
            const formData = new FormData();
            formData.append('file', uploadedFile);
            formData.append('session_id', document.cookie.match(/session_id=([^;]+)/)?.[1] || '');
            
            // 添加文件类型信息到FormData
            formData.append('file_type', fileType);

            // 上传文件 - 显示旋转动画和border进度
            showElWithTransition(uploadLoader, 0.3);
            // 重置border动画
            const progressBorder = uploadLoader.querySelector('.progress-border');
            if (progressBorder) {
                progressBorder.style.animation = 'none';
                setTimeout(() => {
                    progressBorder.style.animation = 'progressBorder 1s ease-in-out forwards';
                }, 10);
            }
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1秒旋转动画
            const result = await uploadFile(formData);
            hideEl(uploadLoader);
            await showUploadSuccessAndTransition(result.file_url, fileType);
            
        } catch (error) {
            console.error('File validation error:', error);
            alert(error.message);
            fileInput.value = ''; // 清空文件选择
        }
    }
});

function showConfirmationPageFromUpload(url, fileType = 'video') {
    video_url = url;
    uploadedFileType = fileType;
    
    const videoPreview = document.getElementById('videoPreview');
    const previewContainer = document.getElementById('previewContainer');
    
    if (fileType === 'image') {
        videoPreview.style.display = 'none';
        
        let imgPreview = document.getElementById('imagePreview');
        if (!imgPreview) {
            imgPreview = document.createElement('img');
            imgPreview.id = 'imagePreview';
            imgPreview.className = 'w-full h-full absolute inset-0 rounded-full object-cover';
            videoPreview.parentNode.insertBefore(imgPreview, videoPreview);
        }
        
        imgPreview.src = url;
        imgPreview.style.display = 'block';
    } else {
        videoPreview.src = url;
        videoPreview.style.display = 'block';
        
        const imgPreview = document.getElementById('imagePreview');
        if (imgPreview) {
            imgPreview.style.display = 'none';
        }
    }
    
    transitionToConfirmation();
}

// 显示上传成功并直接过渡到确认页面
async function showUploadSuccessAndTransition(url, fileType) {
    return new Promise((resolve) => {
        // 显示上传成功的预览
        showEl(uploadSuccess);

        if (fileType === 'image') {
            uploadPreview.src = url;
            uploadPreview.style.display = 'block';
            uploadVideoPreview.style.display = 'none';
        } else {
            uploadVideoPreview.src = url;
            uploadVideoPreview.style.display = 'block';
            uploadPreview.style.display = 'none';
        }

        // 预设确认页面的媒体内容，避免后续重新加载
        preloadConfirmationMedia(url, fileType);

        // 获取上传圆形容器
        const uploadCircle = document.getElementById('uploadOption');
        const recordCircle = document.getElementById('recordOption');

        if (typeof gsap !== 'undefined' && uploadCircle) {
            const tl = gsap.timeline();
            
            // 1. 同时淡出录制圆形容器
            if (recordCircle) {
                tl.to(recordCircle, {
                    duration: 0.6,
                    opacity: 0,
                    scale: 0.8,
                    ease: 'power2.inOut'
                }, 0);
            }
            
            // 2. 圆形容器移动到中间并稍微放大
            tl.to(uploadCircle, {
                duration: 0.8,
                x: () => {
                    const container = document.querySelector('[data-component="main-content"]');
                    const containerRect = container.getBoundingClientRect();
                    const circleRect = uploadCircle.getBoundingClientRect();
                    return (containerRect.width / 2) - (circleRect.left + circleRect.width / 2);
                },
                y: () => {
                    const container = document.querySelector('[data-component="main-content"]');
                    const containerRect = container.getBoundingClientRect();
                    const circleRect = uploadCircle.getBoundingClientRect();
                    return (containerRect.height / 2) - (circleRect.top + circleRect.height / 2);
                },
                scale: 1.1,
                ease: 'power2.inOut'
            }, 0.2)
            
            // 3. 直接无缝过渡到确认页面，不重新加载媒体
            .call(() => {
                seamlessTransitionToConfirmation(url, fileType);
                resolve();
            });
            
        } else {
            // Fallback for no GSAP
            setTimeout(() => {
                preloadConfirmationMedia(url, fileType);
                seamlessTransitionToConfirmation(url, fileType);
                resolve();
            }, 1000);
        }
    });
}

// 预加载确认页面的媒体内容
function preloadConfirmationMedia(url, fileType) {
    const videoPreview = document.getElementById('videoPreview');
    let imgPreview = document.getElementById('imagePreview');

    if (fileType === 'image') {
        // 为图片创建预览元素（如果不存在）
        if (!imgPreview) {
            imgPreview = document.createElement('img');
            imgPreview.id = 'imagePreview';
            imgPreview.className = 'w-full h-full absolute inset-0 rounded-full object-cover';
            videoPreview.parentNode.insertBefore(imgPreview, videoPreview);
        }
        imgPreview.src = url; // 预加载图片
        imgPreview.style.display = 'none'; // 先隐藏，等转场时显示
        videoPreview.style.display = 'none';
    } else {
        videoPreview.src = url; // 预加载视频
        videoPreview.style.display = 'none'; // 先隐藏，等转场时显示
        if (imgPreview) {
            imgPreview.style.display = 'none';
        }
    }
}

// 无缝过渡到确认页面，避免媒体重新加载
function seamlessTransitionToConfirmation(url, fileType) {
    const mainContainer = document.querySelector('[data-component="main-content"]');
    const videoPreview = document.getElementById('videoPreview');
    const imgPreview = document.getElementById('imagePreview');
    
    if (typeof gsap !== 'undefined') {
        const tl = gsap.timeline();
        
        // 1. 淡出主内容和上传成功预览
        tl.to([mainContainer, uploadSuccess], {
            opacity: 0,
            duration: 0.4,
            ease: 'power2.inOut',
            onComplete: () => {
                mainContainer.style.display = 'none';
                hideEl(uploadSuccess);
            }
        })
        
        // 2. 同时显示确认页面（初始透明）
        .call(() => {
            confirmationPage.classList.remove('hidden');
            confirmationPage.style.display = 'flex';
            confirmationPage.style.opacity = '0';
            
            // 显示正确的媒体预览（媒体已预加载）
            if (fileType === 'image') {
                imgPreview.style.display = 'block';
                videoPreview.style.display = 'none';
            } else {
                videoPreview.style.display = 'block';
                if (imgPreview) imgPreview.style.display = 'none';
            }
        })
        
        // 3. 确认页面淡入
        .to(confirmationPage, {
            opacity: 1,
            duration: 0.6,
            ease: 'power2.out'
        })
        
        // 4. 预览圆形的精细动画
        .fromTo('[data-component="preview-circle"]', 
            { scale: 1.1, opacity: 0.9 },
            { 
                scale: 1.1, 
                opacity: 1, 
                duration: 0.5, 
                ease: 'power2.out'
            }, "-=0.4"
        );
        
    } else {
        // Fallback without GSAP
        mainContainer.style.display = 'none';
        hideEl(uploadSuccess);
        
        confirmationPage.classList.remove('hidden');
        confirmationPage.style.display = 'flex';
        confirmationPage.style.opacity = '1';
        
        if (fileType === 'image') {
            imgPreview.style.display = 'block';
            videoPreview.style.display = 'none';
        } else {
            videoPreview.style.display = 'block';
            if (imgPreview) imgPreview.style.display = 'none';
        }
    }
}

// 从预览状态直接过渡到确认页面（保留兼容性，但使用新的无缝转场）
function transitionToConfirmationWithPreview(url, fileType) {
    // 预加载媒体内容以确保一致性
    preloadConfirmationMedia(url, fileType);
    // 使用新的无缝转场函数
    seamlessTransitionToConfirmation(url, fileType);
}

confirmBtn.addEventListener('click', () => {
    showPrivacyPolicy();
});

function showPrivacyPolicy() {
    privacyPolicy.classList.remove('hidden');
    privacyPolicy.style.display = 'flex';
    privacyPolicy.style.opacity = '0';
    setTimeout(() => {
        privacyPolicy.style.opacity = '1';
        privacyPolicy.style.transition = 'opacity 0.3s ease-in-out';
    }, 10);
}

agreeBtn.addEventListener('click', () => {
    privacyPolicy.style.opacity = '0';
    privacyPolicy.style.transition = 'opacity 0.3s ease-in-out';
    
    setTimeout(() => {
        privacyPolicy.classList.add('hidden');
        privacyPolicy.style.display = 'none';

        sessionStorage.setItem('agreedToPrivacy', 'true');
        
        if (currentMode === 'record') {
            showElWithTransition(globalLoader, 0.3);
            uploadRecordedVideos(recordedVideo, originalRecordedVideo).finally(() => hideEl(globalLoader));
        } else if (currentMode === 'upload' && video_url) {
            confirm_video(video_url);
        } else {
            console.error('No video URL available');
            alert('Error: No video URL available');
        }
    }, 300);
});

async function uploadRecordedVideos(effectBlob, originalBlob) {
    if (!effectBlob || !originalBlob) {
        alert('没有可上传的视频');
        return;
    }

    const effectFormData = new FormData();
    effectFormData.append('file', effectBlob, 'effect-video.webm');
    effectFormData.append('session_id', document.cookie.match(/session_id=([^;]+)/)?.[1] || '');
    effectFormData.append('file_type', 'video');

    try {
        const effectResponse = await fetch('/upload', {
            method: 'POST',
            body: effectFormData
        });

        const responseText = await effectResponse.text();
        console.log("Raw server response:", responseText);

        let effectResult;
        try {
            effectResult = JSON.parse(responseText);
        } catch (jsonError) {
            console.error("Failed to parse JSON:", jsonError);
            throw new Error(`Server returned non-JSON response: ${responseText.slice(0, 200)}...`);
        }

        if (effectResponse.ok) {
            video_url = effectResult.file_url;
            
            const originalFormData = new FormData();
            originalFormData.append('file', originalBlob, 'original-video.webm');
            originalFormData.append('session_id', document.cookie.match(/session_id=([^;]+)/)?.[1] || '');
            originalFormData.append('file_type', 'video');
            
            const originalResponse = await fetch('/upload', {
                method: 'POST',
                body: originalFormData
            });
            
            const originalResponseText = await originalResponse.text();
            const originalResult = JSON.parse(originalResponseText);
            
            if (originalResponse.ok) {
                original_video_url = originalResult.file_url;
                console.log(original_video_url + ' ' + video_url);
                confirm_video(video_url, original_video_url);
            } else {
                alert('原始视频上传失败: ' + originalResult.error);
            }
        } else {
            alert('带特效视频上传失败: ' + effectResult.error);
        }
    } catch (err) {
        console.error('上传错误详情:', err);
        alert(`上传失败: ${err.message}`);
    }
}

// 改进的上传函数，包含更好的错误处理
async function uploadFile(formData) {
    try {
        console.log('Starting file upload...');
        
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });

        console.log(`Response status: ${response.status}, Content-Type: ${response.headers.get('content-type')}`);

        const responseText = await response.text();
        console.log("Raw server response:", responseText.slice(0, 500));
        
        // 检查响应是否为JSON
        if (!response.headers.get('content-type')?.includes('application/json')) {
            throw new Error(`Server returned HTML error page instead of JSON. Status: ${response.status}`);
        }

        let result;
        try {
            result = JSON.parse(responseText);
        } catch (jsonError) {
            console.error("JSON parse error:", jsonError);
            throw new Error(`Server returned invalid JSON. Response: ${responseText.slice(0, 200)}...`);
        }

        if (response.ok && result.success !== false) {
            video_url = result.file_url;
            console.log(`Upload successful: ${video_url}`);
            fileInput.value = ''; // 清空文件选择
            return result; // 返回结果供后续处理
        } else {
            const errorMsg = result.error || result.message || 'Unknown error occurred';
            throw new Error(`Upload failed: ${errorMsg}`);
        }
    } catch (err) {
        console.error('Upload error details:', err);
        throw err; // 重新抛出错误，让调用方处理
    }
}

reUploadBtn.addEventListener('click', () => {
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
    }
    
    confirmationPage.classList.add('hidden');
    confirmationPage.style.display = 'none';
    
    privacyPolicy.classList.add('hidden');
    privacyPolicy.style.display = 'none';
    
    const mainContainer = document.querySelector('.flex.flex-row.items-center.justify-center');
    if (mainContainer) {
        mainContainer.style.display = 'flex';
        if (typeof gsap !== 'undefined') {
            gsap.fromTo(mainContainer, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
        }
    }

    const videoPreview = document.getElementById('videoPreview');
    const imgPreview = document.getElementById('imagePreview');
    
    videoPreview.src = '';
    videoPreview.style.display = 'none';
    if (imgPreview) {
        imgPreview.src = '';
        imgPreview.style.display = 'none';
    }

    recordPreview.srcObject = null;
    recordPreview.classList.add('hidden');
    recordControls.classList.add('hidden');
    
    fileInput.value = '';
    
    recordedChunks = [];
    originalRecordedChunks = [];
    uploadedFile = null;
    currentMode = null;
    recordedVideo = null;
    originalRecordedVideo = null;
    video_url = null;
    original_video_url = null;
    uploadedFileType = null;
    
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
});

// 改进的拖放处理
document.addEventListener('DOMContentLoaded', () => {
    const uploadCircle = document.getElementById('uploadOption');
    if (!uploadCircle) {
        console.error('Upload circle element not found');
        return;
    }
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadCircle.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });
    
    
    uploadCircle.addEventListener('drop', handleDrop, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// 改进的拖放处理函数
async function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files.length > 0) {
        const file = files[0];
        
        try {
            // 验证文件
            const fileType = validateFile(file);
            uploadedFile = file;
            uploadedFileType = fileType;
            currentMode = 'upload';
            
            console.log(`File dropped: ${file.name}, Type: ${fileType}, MIME: ${file.type}`);
            
            // 创建FormData并上传
            const formData = new FormData();
            formData.append('file', uploadedFile);
            formData.append('session_id', document.cookie.match(/session_id=([^;]+)/)?.[1] || '');
            formData.append('file_type', fileType);

            // 上传文件 - 显示旋转动画和border进度
            showElWithTransition(uploadLoader, 0.3);
            // 重置border动画
            const progressBorder = uploadLoader.querySelector('.progress-border');
            if (progressBorder) {
                progressBorder.style.animation = 'none';
                setTimeout(() => {
                    progressBorder.style.animation = 'progressBorder 1s ease-in-out forwards';
                }, 10);
            }
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1秒旋转动画
            const result = await uploadFile(formData);
            hideEl(uploadLoader);
            await showUploadSuccessAndTransition(result.file_url, fileType);
            
        } catch (error) {
            console.error('Drop validation error:', error);
            alert(error.message);
        }
    }
}

function confirm_video(url_, original_url = null) {
    if (!url_) {
        console.error('No URL provided to confirm_video');
        alert('Error: No media URL available');
        return;
    }
    
    let redirectUrl = `/think?media_url=${encodeURIComponent(url_)}`;
    
    if (original_url) {
        redirectUrl += `&original_media_url=${encodeURIComponent(original_url)}`;
    }
    
    console.log('Redirecting to:', redirectUrl);
    // Enhanced transition to think page
    transitionToThinkPage(redirectUrl);
}

function hideMainContent() {
    const mainContainer = document.querySelector('.flex.flex-row.items-center.justify-center');
    if (!mainContainer) return;
    if (typeof gsap !== 'undefined') {
        gsap.to(mainContainer, { opacity: 0, y: 10, duration: 0.5, ease: 'power2.out', onComplete: () => {
            mainContainer.style.display = 'none';
        }});
    } else {
        mainContainer.style.display = 'none';
    }
}

function transitionToConfirmation() {
    hideMainContentWithTransition(() => {
        showConfirmationPageWithTransition();
    });
}

function hideMainContentWithTransition(onComplete = null) {
    const mainContainer = document.getElementById('mainPageContainer');
    if (!mainContainer) {
        if (onComplete) onComplete();
        return;
    }
    
    if (typeof gsap !== 'undefined') {
        gsap.to(mainContainer, { 
            opacity: 0, 
            scale: 0.98, 
            y: -20, 
            duration: 0.4, 
            ease: 'power2.in',
            onComplete: () => {
                mainContainer.style.display = 'none';
                if (onComplete) onComplete();
            }
        });
    } else {
        mainContainer.style.display = 'none';
        if (onComplete) onComplete();
    }
}

function showConfirmationPageWithTransition() {
    confirmationPage.classList.remove('hidden');
    confirmationPage.style.display = 'flex';
    
    if (typeof gsap !== 'undefined') {
        const circle = document.querySelector('[data-component="preview-circle"]');
        const buttons = document.querySelector('[data-component="action-buttons"]');
        const statement = document.querySelector('[data-component="privacy-statement"]');
        
        // 整个页面fade in
        gsap.fromTo(confirmationPage, 
            { opacity: 0 }, 
            { opacity: 1, duration: 0.5, ease: 'power2.out' }
        );
        
        // 预览圆形的动画
        if (circle) {
            gsap.fromTo(circle, 
                { scale: 0.8, opacity: 0, y: 30 }, 
                { scale: 1, opacity: 1, y: 0, duration: 0.8, ease: 'back.out(1.7)', delay: 0.2 }
            );
        }
        
        // 隐私声明动画
        if (statement) {
            gsap.fromTo(statement, 
                { opacity: 0, y: 20 }, 
                { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', delay: 0.4 }
            );
        }
        
        // 按钮动画
        if (buttons) {
            gsap.fromTo(buttons, 
                { opacity: 0, y: 30 }, 
                { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', delay: 0.6 }
            );
        }
        
        // 预览内容动画
        const videoPreview = document.getElementById('videoPreview');
        const imgPreview = document.getElementById('imagePreview');
        const target = imgPreview && imgPreview.style.display === 'block' ? imgPreview : videoPreview;
        if (target) {
            gsap.fromTo(target, 
                { scale: 1.03, opacity: 0 }, 
                { scale: 1, opacity: 1, duration: 1.0, ease: 'power3.out', delay: 0.3 }
            );
        }
    } else {
        confirmationPage.style.opacity = '1';
    }
}

// 过渡到think页面的函数
function transitionToThinkPage(redirectUrl) {
    const currentPage = document.querySelector('#confirmationPage:not(.hidden), #mainPageContainer:not([style*="display: none"])');
    const backgroundVideo = document.querySelector('.bg-video-container');
    const nvshuRain = document.querySelector('.nvshu-rain');
    
    // 创建过渡覆盖层
    const transitionOverlay = document.createElement('div');
    transitionOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.95);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        opacity: 0;
    `;
    
    const transitionContent = document.createElement('div');
    transitionContent.style.cssText = `
        text-align: center;
        color: #FFFDE9;
        font-family: var(--font-inknut), serif;
    `;
    
    transitionContent.innerHTML = `
        <div style="font-size: 2rem; margin-bottom: 1rem;">Processing Your Media...</div>
        <div style="font-size: 1.2rem; opacity: 0.8; margin-bottom: 2rem;">AI is analyzing and thinking</div>
        <div class="loading-spinner" style="
            width: 40px;
            height: 40px;
            border: 3px solid rgba(255, 253, 233, 0.3);
            border-top: 3px solid #FFFDE9;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto;
        "></div>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;
    
    transitionOverlay.appendChild(transitionContent);
    document.body.appendChild(transitionOverlay);
    
    if (typeof gsap !== 'undefined') {
        const tl = gsap.timeline();
        
        // 1. 淡出当前页面内容
        if (currentPage) {
            tl.to(currentPage, {
                opacity: 0,
                scale: 0.95,
                y: -30,
                duration: 0.6,
                ease: "power2.inOut"
            });
        }
        
        // 2. 淡出背景视频和女书雨效果
        if (backgroundVideo) {
            tl.to(backgroundVideo, {
                opacity: 0,
                duration: 0.8,
                ease: "power2.inOut"
            }, "-=0.4");
        }
        
        if (nvshuRain) {
            tl.to(nvshuRain, {
                opacity: 0,
                duration: 0.6,
                ease: "power2.inOut"
            }, "-=0.6");
        }
        
        // 3. 显示过渡覆盖层
        tl.to(transitionOverlay, {
            opacity: 1,
            duration: 0.5,
            ease: "power2.inOut"
        }, "-=0.3")
        
        // 4. 过渡内容的入场动画
        .fromTo(transitionContent, 
            { opacity: 0, y: 20, scale: 0.9 },
            { 
                opacity: 1, 
                y: 0, 
                scale: 1,
                duration: 0.6, 
                ease: "back.out(1.7)" 
            }, "-=0.3"
        )
        
        // 5. 延迟后跳转
        .call(() => {
            setTimeout(() => {
                window.location.href = redirectUrl;
            }, 800);
        });
        
    } else {
        // 降级处理：没有GSAP时的简单过渡
        if (currentPage) currentPage.style.opacity = '0';
        if (backgroundVideo) backgroundVideo.style.opacity = '0';
        if (nvshuRain) nvshuRain.style.opacity = '0';
        transitionOverlay.style.opacity = '1';
        
        setTimeout(() => {
            window.location.href = redirectUrl;
        }, 1200);
    }
}
