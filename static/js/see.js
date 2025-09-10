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
    const videoPreview = document.getElementById('videoPreview');
    
    videoPreview.src = videoUrl;
    videoPreview.style.display = 'block';
    
    const imgPreview = document.getElementById('imagePreview');
    if (imgPreview) {
        imgPreview.style.display = 'none';
    }
    
    transitionToConfirmation();
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

        // 获取上传圆形容器
        const uploadCircle = document.getElementById('uploadOption');

        if (typeof gsap !== 'undefined' && uploadCircle) {
            // 圆形容器移动到中间的动画
            gsap.to(uploadCircle, {
                duration: 1.0, // 稍微缩短移动时间
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
                ease: 'power2.inOut',
                onComplete: () => {
                    // 短暂停顿后开始过渡到确认页面
                    setTimeout(() => {
                        transitionToConfirmationWithPreview(url, fileType);
                        resolve();
                    }, 300); // 进一步减少延迟时间，让过渡更流畅
                }
            });

            // 同时淡出录制圆形容器
            const recordCircle = document.getElementById('recordOption');
            if (recordCircle) {
                gsap.to(recordCircle, {
                    duration: 0.8,
                    opacity: 0,
                    scale: 0.8,
                    ease: 'power2.inOut'
                });
            }
        } else {
            // Fallback for no GSAP
            setTimeout(() => {
                transitionToConfirmationWithPreview(url, fileType);
                resolve();
            }, 1500);
        }
    });
}

// 从预览状态直接过渡到确认页面
function transitionToConfirmationWithPreview(url, fileType) {
    // 隐藏主内容
    const mainContainer = document.querySelector('[data-component="main-content"]');
    if (mainContainer) {
        if (typeof gsap !== 'undefined') {
            gsap.to(mainContainer, { opacity: 0, duration: 0.3, ease: 'power2.out', onComplete: () => {
                mainContainer.style.display = 'none';
            }});
        } else {
            mainContainer.style.display = 'none';
        }
    }

    // 设置确认页面的预览
    const videoPreview = document.getElementById('videoPreview');
    const imgPreview = document.getElementById('imagePreview');

    if (fileType === 'image') {
        videoPreview.style.display = 'none';
        if (!imgPreview) {
            const newImgPreview = document.createElement('img');
            newImgPreview.id = 'imagePreview';
            newImgPreview.className = 'w-full h-full absolute inset-0 rounded-full object-cover';
            videoPreview.parentNode.insertBefore(newImgPreview, videoPreview);
        }
        document.getElementById('imagePreview').src = url;
        document.getElementById('imagePreview').style.display = 'block';
    } else {
        videoPreview.src = url;
        videoPreview.style.display = 'block';
        if (imgPreview) {
            imgPreview.style.display = 'none';
        }
    }

    // 显示确认页面
    confirmationPage.classList.remove('hidden');
    confirmationPage.style.display = 'flex';

    if (typeof gsap !== 'undefined') {
        const circle = document.querySelector('[data-component="preview-circle"]');
        gsap.fromTo(confirmationPage, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'power2.inOut' });
        if (circle) {
            // 从默认的scale-110状态开始动画，确保与上传容器大小一致
            gsap.fromTo(circle, { scale: 0.8, opacity: 0.8 }, { scale: 1.1, opacity: 1, duration: 0.8, ease: 'power3.out' });
        }
    }

    // 延迟隐藏上传成功预览，确保确认页面完全显示
    setTimeout(() => {
        hideEl(uploadSuccess);
        // 同时确保确认页面的容器保持正确的缩放状态
        const circle = document.querySelector('[data-component="preview-circle"]');
        if (circle && typeof gsap !== 'undefined') {
            gsap.set(circle, { scale: 1.1 }); // 确保最终缩放状态
        }
    }, 800); // 调整延迟时间与整体节奏匹配
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
    // Enhanced page fade out before navigation
    if (typeof gsap !== 'undefined') {
        const currentPage = document.querySelector('#confirmationPage:not(.hidden), #mainPageContainer:not([style*="display: none"])');
        const tl = gsap.timeline({
            onComplete: () => { window.location.href = redirectUrl; }
        });
        
        // 先让当前可见内容fade out
        if (currentPage) {
            tl.to(currentPage, { 
                opacity: 0, 
                scale: 0.95, 
                y: -20, 
                duration: 0.4, 
                ease: 'power2.in' 
            });
        }
        
        // 然后整个body fade out
        tl.to(document.body, { 
            opacity: 0.3, 
            duration: 0.3, 
            ease: 'power2.out' 
        }, "-=0.2");
        
    } else {
        window.location.href = redirectUrl;
    }
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
