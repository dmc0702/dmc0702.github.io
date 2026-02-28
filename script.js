/**
 * TextImage加密工具
 * 实现文本加密为彩色图片及从图片中解密文本的功能
 */

// DOM元素引用
const elements = {
    // 导航相关
    navBtns: document.querySelectorAll('.nav-btn'),
    sections: document.querySelectorAll('.section'),
    
    // 加密相关
    visibleText: document.getElementById('visible-text'),
    hiddenText: document.getElementById('hidden-text'),
    imageWidth: document.getElementById('image-width'),
    imageHeight: document.getElementById('image-height'),
    generateBtn: document.getElementById('generate-btn'),
    previewCanvas: document.getElementById('preview-canvas'),
    previewPlaceholder: document.getElementById('preview-placeholder'),
    downloadBtn: document.getElementById('download-btn'),
    resetPreviewBtn: document.getElementById('reset-preview-btn'),
    
    // 解密相关
    imageUpload: document.getElementById('image-upload'),
    decryptBtn: document.getElementById('decrypt-btn'),
    decryptedText: document.getElementById('decrypted-text'),
    decryptPlaceholder: document.getElementById('decrypt-placeholder'),
    copyDecryptedBtn: document.getElementById('copy-decrypted'),
    clearDecryptedBtn: document.getElementById('clear-decrypted'),
    
    // 操作按钮
    clearVisibleBtn: document.getElementById('clear-visible'),
    copyVisibleBtn: document.getElementById('copy-visible'),
    clearHiddenBtn: document.getElementById('clear-hidden'),
    copyHiddenBtn: document.getElementById('copy-hidden'),
    
    // 状态和加载
    statusMessage: document.getElementById('status-message'),
    loadingOverlay: document.getElementById('loading-overlay'),
    loadingText: document.getElementById('loading-text')
};

// 应用状态
const appState = {
    currentTab: 'encrypt',
    generatedImage: null,
    uploadedImage: null,
    encryptionKey: 'TextImageEncryptionKey2023' // 加密密钥，实际应用中可让用户自定义
};

/**
 * 初始化应用
 */
function initApp() {
    // 设置事件监听器
    setupEventListeners();
    
    // 初始化导航
    switchTab('encrypt');
}

/**
 * 设置所有事件监听器
 */
function setupEventListeners() {
    // 导航切换
    elements.navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            switchTab(tab);
        });
    });
    
    // 加密功能
    elements.generateBtn.addEventListener('click', generateEncryptedImage);
    elements.downloadBtn.addEventListener('click', downloadImage);
    elements.resetPreviewBtn.addEventListener('click', resetPreview);
    
    // 解密功能
    elements.imageUpload.addEventListener('change', handleImageUpload);
    elements.decryptBtn.addEventListener('click', decryptImage);
    elements.copyDecryptedBtn.addEventListener('click', () => copyToClipboard(elements.decryptedText.value));
    elements.clearDecryptedBtn.addEventListener('click', clearDecryptedText);
    
    // 文本操作
    elements.clearVisibleBtn.addEventListener('click', () => {
        elements.visibleText.value = '';
    });
    
    elements.copyVisibleBtn.addEventListener('click', () => {
        copyToClipboard(elements.visibleText.value);
    });
    
    elements.clearHiddenBtn.addEventListener('click', () => {
        elements.hiddenText.value = '';
    });
    
    elements.copyHiddenBtn.addEventListener('click', () => {
        copyToClipboard(elements.hiddenText.value);
    });
    
    // 输入验证
    elements.imageWidth.addEventListener('input', validateImageDimensions);
    elements.imageHeight.addEventListener('input', validateImageDimensions);
    
    // 拖放上传
    const uploadContainer = document.querySelector('.upload-container');
    uploadContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadContainer.classList.add('drag-over');
    });
    
    uploadContainer.addEventListener('dragleave', () => {
        uploadContainer.classList.remove('drag-over');
    });
    
    uploadContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadContainer.classList.remove('drag-over');
        
        if (e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            if (file.type === 'image/png') {
                elements.imageUpload.files = e.dataTransfer.files;
                handleImageUpload({ target: { files: e.dataTransfer.files } });
            } else {
                showStatus('请上传PNG格式的图片', 'error');
            }
        }
    });
}

/**
 * 切换标签页
 * @param {string} tab - 要切换的标签页ID
 */
function switchTab(tab) {
    // 更新导航按钮状态
    elements.navBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    
    // 更新内容区域
    elements.sections.forEach(section => {
        section.classList.toggle('active', section.id === `${tab}-section`);
    });
    
    // 更新当前标签页状态
    appState.currentTab = tab;
}

/**
 * 验证图片尺寸输入
 */
function validateImageDimensions() {
    let width = parseInt(elements.imageWidth.value);
    let height = parseInt(elements.imageHeight.value);
    
    // 确保最小值
    width = Math.max(300, width);
    height = Math.max(300, height);
    
    // 确保最大值
    width = Math.min(2000, width);
    height = Math.min(2000, height);
    
    // 更新输入值
    elements.imageWidth.value = width;
    elements.imageHeight.value = height;
}

/**
 * 生成加密图片
 */
async function generateEncryptedImage() {
    // 显示加载状态
    showLoading('正在生成加密图片...');
    
    try {
        // 获取输入值
        const visibleText = elements.visibleText.value.trim();
        const hiddenText = elements.hiddenText.value.trim();
        const width = parseInt(elements.imageWidth.value);
        const height = parseInt(elements.imageHeight.value);
        
        // 验证输入
        if (!visibleText && !hiddenText) {
            throw new Error('请至少输入明面文本或隐藏文本');
        }
        
        // 创建画布
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // 绘制背景
        drawBackground(ctx, width, height);
        
        // 绘制明面文本
        if (visibleText) {
            drawVisibleText(ctx, visibleText, width, height);
        }
        
        // 嵌入隐藏文本
        if (hiddenText) {
            await embedHiddenText(ctx, hiddenText, width, height);
        }
        
        // 更新预览
        updatePreview(canvas);
        
        // 保存生成的图片
        appState.generatedImage = canvas.toDataURL('image/png');
        
        // 启用下载按钮
        elements.downloadBtn.disabled = false;
        elements.resetPreviewBtn.disabled = false;
        
        showStatus('图片生成成功！', 'success');
    } catch (error) {
        console.error('生成图片失败:', error);
        showStatus(`生成图片失败: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

/**
 * 绘制图片背景
 * @param {CanvasRenderingContext2D} ctx - Canvas上下文
 * @param {number} width - 画布宽度
 * @param {number} height - 画布高度
 */
function drawBackground(ctx, width, height) {
    // 创建渐变背景
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#f0f4ff');
    gradient.addColorStop(1, '#e0e7ff');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // 添加一些装饰性元素
    ctx.fillStyle = 'rgba(124, 138, 255, 0.05)';
    
    // 绘制一些随机的圆形装饰
    for (let i = 0; i < 20; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const radius = Math.random() * 50 + 10;
        
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

/**
 * 绘制明面文本
 * @param {CanvasRenderingContext2D} ctx - Canvas上下文
 * @param {string} text - 要绘制的文本
 * @param {number} width - 画布宽度
 * @param {number} height - 画布高度
 */
function drawVisibleText(ctx, text, width, height) {
    // 设置文本样式
    ctx.fillStyle = '#333344';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    // 计算合适的字体大小
    let fontSize = Math.min(width, height) / 20;
    ctx.font = `${fontSize}px Inter, sans-serif`;
    
    // 分割文本为多行
    const lines = text.split('\n');
    const lineHeight = fontSize * 1.5;
    const totalTextHeight = lines.length * lineHeight;
    
    // 计算文本起始位置（居中）
    const startY = (height - totalTextHeight) / 2;
    
    // 绘制每行文本
    lines.forEach((line, index) => {
        const y = startY + index * lineHeight;
        ctx.fillText(line, width / 2, y);
    });
}

/**
 * 嵌入隐藏文本到图片中
 * @param {CanvasRenderingContext2D} ctx - Canvas上下文
 * @param {string} text - 要隐藏的文本（支持中文）
 * @param {number} width - 画布宽度
 * @param {number} height - 画布高度
 */
async function embedHiddenText(ctx, text, width, height) {
    // 加密文本
    const encryptedText = encryptText(text, appState.encryptionKey);
    
    console.log(`加密信息: 原始文本长度: ${text.length}, 加密后文本长度: ${encryptedText.length}`);
    
    // 将加密文本转换为二进制数据
    const binaryData = stringToBinary(encryptedText);
    
    console.log(`二进制数据长度: ${binaryData.length} 位`);
    
    // 添加数据长度信息（使用32位表示数据长度）
    const dataLength = binaryData.length;
    const lengthBinary = dataLength.toString(2).padStart(32, '0');
    const fullBinaryData = lengthBinary + binaryData;
    
    console.log(`添加长度信息后的数据长度: ${fullBinaryData.length} 位`);
    
    // 计算需要的像素数量
    const requiredPixels = Math.ceil(fullBinaryData.length / 3); // 每个像素可以存储3位数据（RGB各1位）
    
    // 计算可用像素数量
    const imageData = ctx.getImageData(0, 0, width, height);
    const pixels = imageData.data;
    const totalPixels = pixels.length / 4; // RGBA
    
    console.log(`图片尺寸: ${width}x${height}, 总像素数: ${totalPixels}, 需要像素数: ${requiredPixels}`);
    
    // 对于中文等非ASCII字符，需要更多的像素，因此降低阈值
    const maxAllowedPixels = Math.floor(totalPixels * 0.6); // 进一步降低到60%以确保有足够空间
    
    // 确保有足够的像素来存储数据
    if (requiredPixels > maxAllowedPixels) {
        throw new Error('隐藏文本过长，请增加图片尺寸或减少文本长度。中文字符需要更多空间。');
    }
    
    // 生成随机位置来嵌入数据
    const positions = generateRandomPositions(totalPixels, requiredPixels);
    
    console.log(`生成的随机位置数: ${positions.length}`);
    
    // 嵌入数据到像素中
    let dataIndex = 0;
    for (let i = 0; i < positions.length && dataIndex < fullBinaryData.length; i++) {
        const pixelIndex = positions[i] * 4;
        
        // 嵌入数据到RGB通道的最低有效位
        for (let channel = 0; channel < 3 && dataIndex < fullBinaryData.length; channel++) {
            // 清除最低位
            pixels[pixelIndex + channel] = pixels[pixelIndex + channel] & 0xFE;
            // 设置新的最低位
            pixels[pixelIndex + channel] = pixels[pixelIndex + channel] | parseInt(fullBinaryData[dataIndex]);
            dataIndex++;
        }
    }
    
    console.log(`实际嵌入的数据位数: ${dataIndex}`);
    
    // 验证是否所有数据都已嵌入
    if (dataIndex < fullBinaryData.length) {
        console.warn(`未能嵌入所有数据，期望嵌入 ${fullBinaryData.length} 位，实际嵌入 ${dataIndex} 位`);
    }
    
    // 将修改后的图像数据绘制回画布
    ctx.putImageData(imageData, 0, 0);
}

/**
 * 生成随机位置数组
 * @param {number} total - 总像素数
 * @param {number} count - 需要的位置数量
 * @returns {Array} 随机位置数组
 */
function generateRandomPositions(total, count) {
    const positions = new Set();
    
    // 使用加密密钥的哈希作为种子，确保加密和解密使用相同的位置
    const seed = hashString(appState.encryptionKey);
    let pseudoRandom = seed;
    
    // 限制最大尝试次数，避免在总像素数较小但请求位置数较大时陷入死循环
    const maxAttempts = Math.min(count * 2, total * 2);
    let attempts = 0;
    
    while (positions.size < count && attempts < maxAttempts) {
        // 生成伪随机数
        pseudoRandom = (pseudoRandom * 9301 + 49297) % 233280;
        const position = Math.floor(pseudoRandom / 233280 * total);
        
        positions.add(position);
        attempts++;
    }
    
    // 如果无法生成足够的位置，使用已有的位置
    if (positions.size < count) {
        console.warn(`无法生成足够的随机位置，请求 ${count} 个，实际生成 ${positions.size} 个`);
    }
    
    return Array.from(positions);
}

/**
 * 更新预览区域
 * @param {HTMLCanvasElement} canvas - 生成的画布
 */
function updatePreview(canvas) {
    // 隐藏占位符，显示画布
    elements.previewPlaceholder.style.display = 'none';
    elements.previewCanvas.style.display = 'block';
    
    // 设置预览画布尺寸
    elements.previewCanvas.width = canvas.width;
    elements.previewCanvas.height = canvas.height;
    
    // 绘制图像到预览画布
    const previewCtx = elements.previewCanvas.getContext('2d');
    previewCtx.drawImage(canvas, 0, 0);
}

/**
 * 下载生成的图片
 */
function downloadImage() {
    if (!appState.generatedImage) {
        showStatus('没有可下载的图片', 'warning');
        return;
    }
    
    // 创建下载链接
    const link = document.createElement('a');
    link.href = appState.generatedImage;
    link.download = `textimage_${new Date().getTime()}.png`;
    
    // 触发下载
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showStatus('图片下载成功！', 'success');
}

/**
 * 重置预览区域
 */
function resetPreview() {
    // 重置画布
    elements.previewCanvas.width = 0;
    elements.previewCanvas.height = 0;
    elements.previewCanvas.style.display = 'none';
    
    // 显示占位符
    elements.previewPlaceholder.style.display = 'flex';
    
    // 禁用按钮
    elements.downloadBtn.disabled = true;
    elements.resetPreviewBtn.disabled = true;
    
    // 清除状态
    appState.generatedImage = null;
}

/**
 * 处理图片上传
 * @param {Event} e - 文件上传事件
 */
function handleImageUpload(e) {
    const file = e.target.files[0];
    
    if (!file) return;
    
    if (file.type !== 'image/png') {
        showStatus('请上传PNG格式的图片', 'error');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (event) => {
        const img = new Image();
        
        img.onload = () => {
            // 保存上传的图片
            appState.uploadedImage = event.target.result;
            
            // 启用解密按钮
            elements.decryptBtn.disabled = false;
            
            showStatus('图片上传成功', 'success');
        };
        
        img.onerror = () => {
            showStatus('图片加载失败，请重试', 'error');
            appState.uploadedImage = null;
            elements.decryptBtn.disabled = true;
        };
        
        img.src = event.target.result;
    };
    
    reader.onerror = () => {
        showStatus('文件读取失败，请重试', 'error');
    };
    
    reader.readAsDataURL(file);
}

/**
 * 从图片中解密文本
 */
async function decryptImage() {
    if (!appState.uploadedImage) {
        showStatus('请先上传图片', 'warning');
        return;
    }
    
    // 显示加载状态
    showLoading('正在解密文本...');
    
    try {
        const img = new Image();
        
        // 设置超时处理，避免图片加载时间过长
        const loadTimeout = setTimeout(() => {
            hideLoading();
            showStatus('图片加载超时，请重试', 'error');
            img.onload = null;
            img.onerror = null;
        }, 10000); // 10秒超时
        
        img.onload = async () => {
            clearTimeout(loadTimeout);
            
            try {
                // 创建画布
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                
                // 绘制图片
                ctx.drawImage(img, 0, 0);
                
                // 增加解密超时时间到8秒
                const decryptPromise = new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        reject(new Error('解密过程超时，请尝试使用较小的图片'));
                    }, 8000);
                    
                    // 执行解密
                    extractHiddenText(ctx, img.width, img.height)
                        .then(result => {
                            clearTimeout(timeout);
                            resolve(result);
                        })
                        .catch(err => {
                            clearTimeout(timeout);
                            reject(err);
                        });
                });
                
                // 提取隐藏文本
                const hiddenText = await decryptPromise;
                
                if (!hiddenText || hiddenText.length === 0) {
                    showStatus('未检测到隐藏文本', 'warning');
                    return;
                }
                
                // 解密文本
                const decryptedText = decryptText(hiddenText, appState.encryptionKey);
                
                // 显示解密结果
                displayDecryptedText(decryptedText);
                
                showStatus('文本解密成功！', 'success');
            } catch (error) {
                console.error('解密失败:', error);
                showStatus(`解密失败: ${error.message}`, 'error');
            } finally {
                hideLoading();
            }
        };
        
        img.onerror = () => {
            clearTimeout(loadTimeout);
            hideLoading();
            showStatus('图片加载失败，请重试', 'error');
        };
        
        img.src = appState.uploadedImage;
    } catch (error) {
        hideLoading();
        console.error('解密失败:', error);
        showStatus(`解密失败: ${error.message}`, 'error');
    }
}

/**
 * 从图片中提取隐藏文本
 * @param {CanvasRenderingContext2D} ctx - Canvas上下文
 * @param {number} width - 画布宽度
 * @param {number} height - 画布高度
 * @returns {string} 提取的隐藏文本
 */
async function extractHiddenText(ctx, width, height) {
    // 获取图像数据
    const imageData = ctx.getImageData(0, 0, width, height);
    const pixels = imageData.data;
    const totalPixels = pixels.length / 4;
    
    // 计算可能需要的像素数量 - 增加到40%或最多40000个像素
    let maxPixelsToCheck = Math.min(Math.ceil(totalPixels * 0.4), 40000);
    
    console.log(`解密信息: 图片尺寸 ${width}x${height}, 总像素数: ${totalPixels}, 计划检查像素数: ${maxPixelsToCheck}`);
    
    // 生成与加密时相同的随机位置
    const positions = generateRandomPositions(totalPixels, maxPixelsToCheck);
    
    console.log(`实际生成的随机位置数: ${positions.length}`);
    
    // 从像素中提取数据
    let binaryData = '';
    
    // 首先提取足够的数据来获取长度信息（至少32位）
    let collectedBits = 0;
    const lengthBitsNeeded = 32; // 用于存储数据长度的位数
    
    for (let i = 0; i < positions.length && collectedBits < lengthBitsNeeded; i++) {
        const pixelIndex = positions[i] * 4;
        
        // 提取RGB通道的最低有效位
        for (let channel = 0; channel < 3 && collectedBits < lengthBitsNeeded; channel++) {
            const bit = (pixels[pixelIndex + channel] & 1).toString();
            binaryData += bit;
            collectedBits++;
        }
    }
    
    // 解析数据长度
    let dataLength = 0;
    if (binaryData.length >= lengthBitsNeeded) {
        const lengthBinary = binaryData.substring(0, lengthBitsNeeded);
        dataLength = parseInt(lengthBinary, 2);
        console.log(`解析到的数据长度: ${dataLength} 位`);
        
        // 清除已解析的长度信息
        binaryData = binaryData.substring(lengthBitsNeeded);
        
        // 继续收集剩余的数据
        const totalBitsNeeded = dataLength;
        while (binaryData.length < totalBitsNeeded && collectedBits < positions.length * 3) {
            const i = Math.floor(collectedBits / 3);
            const channel = collectedBits % 3;
            
            if (i < positions.length) {
                const pixelIndex = positions[i] * 4;
                const bit = (pixels[pixelIndex + channel] & 1).toString();
                binaryData += bit;
                collectedBits++;
            } else {
                break;
            }
        }
        
        console.log(`总共收集到的数据位数: ${binaryData.length}, 需要的数据位数: ${dataLength}`);
        
        // 如果收集到的数据不足，尝试使用所有收集到的数据
        if (binaryData.length < dataLength) {
            console.warn(`收集到的数据不足，期望 ${dataLength} 位，实际 ${binaryData.length} 位`);
        } else if (binaryData.length > dataLength) {
            // 如果收集到的数据超过需要，截断到实际长度
            binaryData = binaryData.substring(0, dataLength);
            console.log(`截断数据到指定长度: ${binaryData.length} 位`);
        }
    } else {
        console.warn('无法获取完整的长度信息，尝试使用所有收集到的数据');
    }
    
    // 将二进制数据转换回字符串
    const encryptedText = binaryToString(binaryData);
    
    console.log(`转换后的加密文本长度: ${encryptedText.length}`);
    
    // 验证解密结果是否有效
    if (encryptedText.length === 0) {
        throw new Error('无法从图片中提取有效数据');
    }
    
    return encryptedText;
}

/**
 * 显示解密后的文本
 * @param {string} text - 解密后的文本
 */
function displayDecryptedText(text) {
    // 隐藏占位符，显示文本区域
    elements.decryptPlaceholder.style.display = 'none';
    elements.decryptedText.style.display = 'block';
    
    // 设置文本内容
    elements.decryptedText.value = text;
    
    // 启用操作按钮
    elements.copyDecryptedBtn.disabled = false;
    elements.clearDecryptedBtn.disabled = false;
}

/**
 * 清空解密结果
 */
function clearDecryptedText() {
    // 清空文本
    elements.decryptedText.value = '';
    
    // 隐藏文本区域，显示占位符
    elements.decryptedText.style.display = 'none';
    elements.decryptPlaceholder.style.display = 'flex';
    
    // 禁用按钮
    elements.copyDecryptedBtn.disabled = true;
    elements.clearDecryptedBtn.disabled = true;
}

/**
 * 加密文本
 * @param {string} text - 要加密的文本（支持中文）
 * @param {string} key - 加密密钥
 * @returns {string} 加密后的文本
 */
function encryptText(text, key) {
    console.log(`开始加密文本，长度: ${text.length}`);
    
    // 简化加密算法，确保中文支持
    let result = '';
    for (let i = 0; i < text.length; i++) {
        const codePoint = text.codePointAt(i);
        const keyCode = key.charCodeAt(i % key.length);
        
        // 使用简单的XOR加密，确保中文支持
        const encryptedCode = codePoint ^ keyCode;
        
        result += String.fromCodePoint(encryptedCode);
        
        // 如果是代理对（surrogate pair），跳过下一个字符
        if (codePoint > 0xFFFF) {
            i++;
        }
    }
    
    console.log(`加密后文本长度: ${result.length}`);
    
    try {
        // 使用encodeURIComponent确保中文字符能正确进行Base64编码
        const encoded = btoa(unescape(encodeURIComponent(result)));
        console.log(`Base64编码后长度: ${encoded.length}`);
        return encoded;
    } catch (error) {
        console.error('Base64编码失败:', error);
        throw new Error('文本加密失败');
    }
}

/**
 * 解密文本
 * @param {string} encryptedText - 加密的文本
 * @param {string} key - 解密密钥
 * @returns {string} 解密后的文本（支持中文）
 */
function decryptText(encryptedText, key) {
    try {
        // 检查输入是否为空
        if (!encryptedText || encryptedText.length === 0) {
            throw new Error('没有可解密的数据');
        }
        
        console.log(`解密前文本长度: ${encryptedText.length}`);
        
        // 尝试Base64解码
        let text;
        try {
            // 使用unescape和encodeURIComponent的组合来正确处理中文字符
            text = decodeURIComponent(escape(atob(encryptedText)));
            console.log(`Base64解码后长度: ${text.length}`);
        } catch (e) {
            // 如果解码失败，尝试直接Base64解码（兼容旧版本）
            try {
                text = atob(encryptedText);
                console.log('使用兼容模式解码成功');
            } catch (e2) {
                // 如果仍然失败，抛出错误
                console.error('Base64解码失败:', e, e2);
                throw new Error('加密数据格式错误，无法解码');
            }
        }
        
        // 解密
        let result = '';
        for (let i = 0; i < text.length; i++) {
            const codePoint = text.codePointAt(i);
            const keyCode = key.charCodeAt(i % key.length);
            
            // 直接进行XOR解密，与加密算法对应
            const decryptedCode = codePoint ^ keyCode;
            
            result += String.fromCodePoint(decryptedCode);
            
            // 如果是代理对（surrogate pair），跳过下一个字符
            if (codePoint > 0xFFFF) {
                i++;
            }
        }
        
        console.log(`解密后文本长度: ${result.length}`);
        
        // 验证解密结果是否包含有效字符（增加对中文字符的检测）
        const hasLatinChars = /[a-zA-Z0-9]/.test(result);
        const hasChineseChars = /[\u4e00-\u9fff]/.test(result);
        
        console.log(`解密结果包含拉丁字符: ${hasLatinChars}, 包含中文字符: ${hasChineseChars}`);
        
        if (!hasLatinChars && !hasChineseChars && result.length > 0) {
            console.warn('解密结果可能无效，未包含常见字符');
            // 不要直接抛出错误，尝试返回结果让用户判断
        }
        
        return result;
    } catch (error) {
        console.error('解密过程出错:', error);
        throw new Error(`解密失败: ${error.message}`);
    }
}

/**
 * 将字符串转换为二进制
 * @param {string} text - 要转换的文本（支持中文）
 * @returns {string} 二进制字符串
 */
function stringToBinary(text) {
    console.log(`开始将字符串转换为二进制，文本长度: ${text.length}`);
    
    let result = '';
    for (let i = 0; i < text.length; i++) {
        // 获取字符的Unicode码点（支持中文等非ASCII字符）
        const codePoint = text.codePointAt(i);
        
        // 使用24位表示每个字符，确保能容纳更多的Unicode字符
        const binary = codePoint.toString(2).padStart(24, '0');
        result += binary;
        
        // 如果是代理对（surrogate pair），跳过下一个字符
        if (codePoint > 0xFFFF) {
            i++;
        }
    }
    
    console.log(`二进制数据长度: ${result.length} 位`);
    return result;
}

/**
 * 将二进制转换为字符串
 * @param {string} binary - 二进制字符串
 * @returns {string} 转换后的文本（支持中文）
 */
function binaryToString(binary) {
    console.log(`开始将二进制转换为字符串，二进制长度: ${binary.length} 位`);
    
    // 确保二进制长度是24的倍数（因为我们使用24位表示一个字符）
    const length = Math.floor(binary.length / 24) * 24;
    binary = binary.substring(0, length);
    
    console.log(`调整后的二进制长度: ${binary.length} 位`);
    
    let result = '';
    for (let i = 0; i < binary.length; i += 24) {
        const byte = binary.substring(i, i + 24);
        const codePoint = parseInt(byte, 2);
        result += String.fromCodePoint(codePoint);
    }
    
    console.log(`转换后的字符串长度: ${result.length}`);
    return result;
}

/**
 * 计算字符串的哈希值
 * @param {string} str - 输入字符串
 * @returns {number} 哈希值
 */
function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
}

/**
 * 复制文本到剪贴板
 * @param {string} text - 要复制的文本
 */
function copyToClipboard(text) {
    if (!text) {
        showStatus('没有可复制的内容', 'warning');
        return;
    }
    
    navigator.clipboard.writeText(text)
        .then(() => {
            showStatus('复制成功！', 'success');
        })
        .catch(() => {
            showStatus('复制失败，请手动复制', 'error');
        });
}

/**
 * 显示状态消息
 * @param {string} message - 消息内容
 * @param {string} type - 消息类型 (success, error, warning)
 */
function showStatus(message, type = 'success') {
    // 设置消息内容和类型
    elements.statusMessage.textContent = message;
    elements.statusMessage.className = `status-message ${type} show`;
    
    // 3秒后自动隐藏
    setTimeout(() => {
        elements.statusMessage.classList.remove('show');
    }, 3000);
}

/**
 * 显示加载动画
 * @param {string} text - 加载文本
 */
function showLoading(text = '处理中...') {
    elements.loadingText.textContent = text;
    elements.loadingOverlay.classList.remove('hidden');
}

/**
 * 隐藏加载动画
 */
function hideLoading() {
    elements.loadingOverlay.classList.add('hidden');
}

// 初始化应用
document.addEventListener('DOMContentLoaded', initApp);