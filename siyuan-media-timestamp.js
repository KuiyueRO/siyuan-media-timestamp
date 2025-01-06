// ==UserScript==
// @name         思源在线视频时间戳和截图
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  捕获视频时间戳和当前帧截图、点击跳转
// @author       A_Cai
// @match        https://github.com/KuiyueRO/siyuan-media-timestamp
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @connect      127.0.0.1
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==


(function() {
    'use strict';

    // 添加样式
    GM_addStyle(`
        .timestamp-tools {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .timestamp-btn {
            padding: 8px 16px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        .timestamp-btn:hover {
            background: #45a049;
        }
        .settings-panel {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.15);
            z-index: 100000;  // 提高z-index
            display: none;
            min-width: 400px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #333;
            background: #ffffff;
        }
        .settings-panel h3 {
            margin: 0 0 20px 0;
            color: #1a1a1a;
            font-size: 18px;
            font-weight: 600;
        }
        .settings-field {
            margin-bottom: 15px;
        }
        .settings-field label {
            display: block;
            margin-bottom: 5px;
            color: #333;
            font-size: 14px;
            font-weight: 500;
        }
        .settings-field input, .settings-field select {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 14px;
            transition: border-color 0.3s;
        }
        .settings-field input:focus, .settings-field select:focus {
            border-color: #4CAF50;
            outline: none;
        }
        .settings-buttons {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 20px;
        }
        .settings-btn {
            padding: 8px 16px;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.3s;
        }
        .settings-btn.primary {
            background: #4CAF50;
            color: white;
        }
        .settings-btn.secondary {
            background: #f5f5f5;
            color: #333;
        }
        .settings-btn:hover {
            opacity: 0.9;
            transform: translateY(-1px);
        }
        .notebook-list {
            max-height: 200px;
            overflow-y: auto;
            border: 1px solid #ddd;
            border-radius: 6px;
            margin-top: 5px;
        }
        .notebook-item {
            padding: 8px 12px;
            cursor: pointer;
            transition: background 0.3s;
        }
        .notebook-item:hover {
            background: #f5f5f5;
        }
        .notebook-item.selected {
            background: #e8f5e9;
            color: #4CAF50;
        }
        .toast-notification {
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 12px 24px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            border-radius: 6px;
            font-size: 14px;
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
        }
        @keyframes slideIn {
            from {
                transform: translateY(100%);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }
        .timestamp-list-panel {
            position: fixed;
            top: 50%;
            right: 20px;
            transform: translateY(-50%);
            background: white;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 2px 12px rgba(0,0,0,0.15);
            width: 200px;
            max-height: 400px;
            overflow-y: auto;
            z-index: 99999;  // 提高z-index
            cursor: move;  // 添加移动光标
            user-select: none;  // 防止拖动时选中文本
        }
        
        .timestamp-list-title {
            font-weight: 600;
            margin-bottom: 10px;
            color: #333;
        }
        
        .timestamp-item {
            padding: 8px;
            margin: 4px 0;
            cursor: pointer;
            border-radius: 4px;
            transition: all 0.2s;
        }
        
        .timestamp-item:hover {
            background: #f0f0f0;
        }
        
        .timestamp-item.active {
            background: #e8f5e9;
            color: #4CAF50;
        }
        
        .no-timestamps {
            color: #999;
            text-align: center;
            padding: 10px;
        }
    `);

    // 配置管理
    const configManager = {
        defaults: {
            API_ENDPOINT: 'http://127.0.0.1:6806',
            API_TOKEN: '',
            TARGET_DOC_ID: '',
            NOTEBOOK_ID: '',
            NOTEBOOK_NAME: '',
            CREATE_NOTE_HOTKEY: '',
            TIMESTAMP_HOTKEY: '',
            SCREENSHOT_HOTKEY: ''
        },
        
        // 获取配置
        get: function() {
            const config = {};
            for (const [key, defaultValue] of Object.entries(this.defaults)) {
                config[key] = GM_getValue(key, defaultValue);
            }
            return config;
        },
        
        // 保存配置
        save: function(newConfig) {
            for (const [key, value] of Object.entries(newConfig)) {
                GM_setValue(key, value);
            }
        }
    };

    // 获取笔记本列表
    async function getNotebooks() {
        const config = getConfig();
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'POST',
                url: `${config.API_ENDPOINT}/api/notebook/lsNotebooks`,
                headers: {
                    'Authorization': `Token ${config.API_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                onload: function(response) {
                    if (response.status === 200) {
                        const result = JSON.parse(response.responseText);
                        if (result.code === 0) {
                            resolve(result.data.notebooks);
                        } else {
                            reject(new Error(result.msg));
                        }
                    } else {
                        reject(new Error('请求失败'));
                    }
                },
                onerror: reject
            });
        });
    }

    // 创建设置面板
    function createSettingsPanel() {
        const panel = document.createElement('div');
        panel.className = 'settings-panel';
        const currentConfig = configManager.get();
        
        const trustedHTML = trustedTypes.createPolicy('settings-panel', {
            createHTML: (html) => html
        });
        
        const settingsHTML = trustedHTML.createHTML(`
            <h3>思源笔记设置</h3>
            <div class="settings-field">
                <label>API地址:</label>
                <input type="text" id="api-endpoint" value="${currentConfig.API_ENDPOINT}" placeholder="http://127.0.0.1:6806">
            </div>
            <div class="settings-field">
                <label>API Token:</label>
                <input type="text" id="api-token" value="${currentConfig.API_TOKEN}" placeholder="输入你的 API Token">
            </div>
            <div class="settings-field">
                <label>创建笔记快捷键:</label>
                <input type="text" id="create-note-hotkey" value="${currentConfig.CREATE_NOTE_HOTKEY}" placeholder="点击输入快捷键" readonly>
            </div>
            <div class="settings-field">
                <label>时间戳快捷键:</label>
                <input type="text" id="timestamp-hotkey" value="${currentConfig.TIMESTAMP_HOTKEY}" placeholder="点击输入快捷键" readonly>
            </div>
            <div class="settings-field">
                <label>截图+时间戳快捷键:</label>
                <input type="text" id="screenshot-hotkey" value="${currentConfig.SCREENSHOT_HOTKEY}" placeholder="点击输入快捷键" readonly>
            </div>
            <div class="settings-field">
                <label>选择笔记本:</label>
                <div class="notebook-list" id="notebook-list">
                    <div class="notebook-item">加载中...</div>
                </div>
            </div>
            <div class="settings-buttons">
                <button class="settings-btn secondary" id="cancel-settings">取消</button>
                <button class="settings-btn primary" id="save-settings">保存</button>
            </div>
        `);
        
        panel.innerHTML = settingsHTML;

        // 添加快捷键设置逻辑
        const hotkeyInputs = ['create-note-hotkey', 'timestamp-hotkey', 'screenshot-hotkey'];
        hotkeyInputs.forEach(id => {
            const input = panel.querySelector(`#${id}`);
            input.addEventListener('focus', () => {
                input.value = '请按下快捷键组合...';
            });

            input.addEventListener('keydown', (e) => {
                e.preventDefault();
                const keys = [];
                if (e.ctrlKey) keys.push('Ctrl');
                if (e.altKey) keys.push('Alt');
                if (e.shiftKey) keys.push('Shift');
                if (e.key !== 'Control' && e.key !== 'Alt' && e.key !== 'Shift') {
                    keys.push(e.key.toUpperCase());
                }
                if (keys.length > 0) {
                    input.value = keys.join('+');
                }
            });
        });

        // 绑定保存按钮事件
        panel.querySelector('#save-settings').onclick = function() {
            const selectedNotebook = panel.querySelector('.notebook-item.selected');
            const newConfig = {
                API_ENDPOINT: panel.querySelector('#api-endpoint').value,
                API_TOKEN: panel.querySelector('#api-token').value,
                NOTEBOOK_ID: selectedNotebook ? selectedNotebook.dataset.id : '',
                NOTEBOOK_NAME: selectedNotebook ? selectedNotebook.dataset.name : '',
                CREATE_NOTE_HOTKEY: panel.querySelector('#create-note-hotkey').value,
                TIMESTAMP_HOTKEY: panel.querySelector('#timestamp-hotkey').value,
                SCREENSHOT_HOTKEY: panel.querySelector('#screenshot-hotkey').value
            };
            configManager.save(newConfig);
            setupHotkeys(); // 重新设置快捷键
            panel.remove();
        };

        // 绑定取消按钮事件
        panel.querySelector('#cancel-settings').onclick = function() {
            panel.remove();
        };

        document.body.appendChild(panel);
        return panel;
    }

    // 创建设置按钮
    const settingsBtn = document.createElement('button');
    settingsBtn.className = 'timestamp-btn';
    settingsBtn.textContent = '设置';
    settingsBtn.onclick = showSettings;

    // 显示设置面板
    async function showSettings() {
        const panel = createSettingsPanel();
        panel.style.display = 'block';

        // 加载笔记本列表
        try {
            const notebooks = await getNotebooks();
            const notebookList = panel.querySelector('#notebook-list');
            const currentConfig = configManager.get();
            
            notebookList.innerHTML = notebooks.map(notebook => `
                <div class="notebook-item ${notebook.id === currentConfig.NOTEBOOK_ID ? 'selected' : ''}" 
                     data-id="${notebook.id}" 
                     data-name="${notebook.name}">
                    ${notebook.name}
                </div>
            `).join('');

            // 添加笔记本选择事件
            notebookList.addEventListener('click', (e) => {
                if (e.target.classList.contains('notebook-item')) {
                    notebookList.querySelectorAll('.notebook-item').forEach(item => {
                        item.classList.remove('selected');
                    });
                    e.target.classList.add('selected');
                }
            });
        } catch (error) {
            panel.querySelector('#notebook-list').innerHTML = `
                <div class="notebook-item" style="color: red">
                    加载失败: ${error.message}
                </div>
            `;
        }
    }

    // 创建工具栏
    const toolsDiv = document.createElement('div');
    toolsDiv.className = 'timestamp-tools';

    // 创建获取时间戳按钮
    const timestampBtn = document.createElement('button');
    timestampBtn.className = 'timestamp-btn';
    timestampBtn.textContent = '获取时间戳';
    timestampBtn.onclick = getVideoTimestamp;

    // 创建获取时间戳和截图按钮
    const screenshotBtn = document.createElement('button');
    screenshotBtn.className = 'timestamp-btn';
    screenshotBtn.textContent = '获取时间戳+截图';
    screenshotBtn.onclick = getVideoScreenshot;

    // 添加按钮到工具栏 (包含设置按钮)
    toolsDiv.appendChild(settingsBtn);
    toolsDiv.appendChild(timestampBtn);
    toolsDiv.appendChild(screenshotBtn);
    document.body.appendChild(toolsDiv);

    // 配置项
    function getConfig() {
        return configManager.get();
    }

    // 添加发送到思源的函数
    async function sendToSiYuan(content) {
        const config = getConfig(); // 动态获取最新配置
        const data = {
            dataType: "markdown",
            data: content,
            parentID: config.TARGET_DOC_ID
        };

        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'POST',
                url: `${config.API_ENDPOINT}/api/block/appendBlock`,
                headers: {
                    'Authorization': `Token ${config.API_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                data: JSON.stringify(data),
                onload: function(response) {
                    if (response.status === 200) {
                        const result = JSON.parse(response.responseText);
                        if (result.code === 0) {
                            console.log('成功发送到思源笔记');
                            resolve(result);
                        } else {
                            reject(new Error(result.msg));
                        }
                    } else {
                        reject(new Error('请求失败'));
                    }
                },
                onerror: function(error) {
                    reject(error);
                }
            });
        });
    }

    // 查找匹配的视频笔记
    async function findMatchingVideoNote(mediaUrl) {
        const config = getConfig();
        const sql = `SELECT block_id FROM attributes WHERE name = 'custom-type' AND value = 'MediaNote' 
                     AND block_id IN (
                         SELECT block_id FROM attributes WHERE name = 'custom-mediaurl' AND value = '${mediaUrl}'
                     )`;
                     
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'POST',
                url: `${config.API_ENDPOINT}/api/query/sql`,
                headers: {
                    'Authorization': `Token ${config.API_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                data: JSON.stringify({ stmt: sql }),
                onload: function(response) {
                    if (response.status === 200) {
                        const result = JSON.parse(response.responseText);
                        if (result.code === 0 && result.data.length > 0) {
                            resolve(result.data[0].block_id);
                        } else {
                            resolve(null);
                        }
                    } else {
                        reject(new Error('查询失败'));
                    }
                },
                onerror: reject
            });
        });
    }

    // 修改获取时间戳功能
    async function getVideoTimestamp() {
        const video = document.querySelector('video');
        if (!video) {
            showNotification('未找到视频元素！');
            return;
        }

        const cleanedUrl = cleanUrl(window.location.href);
        const matchingNoteId = await findMatchingVideoNote(cleanedUrl);
        
        if (!matchingNoteId) {
            showNotification('请先创建视频笔记！');
            return;
        }

        // 更新配置中的目标文档ID
        const config = getConfig();
        configManager.save({
            ...config,
            TARGET_DOC_ID: matchingNoteId
        });

        const currentTime = video.currentTime;
        const timestamp = formatTime(currentTime);
        const timeUrl = generateTimeUrl(currentTime);
        const markdownLink = `[${timestamp}](${timeUrl})`;
        
        try {
            await sendToSiYuan(markdownLink);
            showNotification('已发送时间戳到思源笔记');
        } catch (error) {
            showNotification('发送失败：' + error.message);
        }
    }

    // 添加文件上传函数
    async function uploadFile(blob, fileName) {
        const config = getConfig(); // 动态获取最新配置
        const formData = new FormData();
        formData.append('assetsDirPath', '/assets/');
        formData.append('file[]', blob, fileName);

        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'POST',
                url: `${config.API_ENDPOINT}/api/asset/upload`,
                headers: {
                    'Authorization': `Token ${config.API_TOKEN}`
                },
                data: formData,
                onload: function(response) {
                    if (response.status === 200) {
                        const result = JSON.parse(response.responseText);
                        if (result.code === 0) {
                            resolve(result.data.succMap[fileName]);
                        } else {
                            reject(new Error(result.msg));
                        }
                    } else {
                        reject(new Error('Upload failed'));
                    }
                },
                onerror: function(error) {
                    reject(error);
                }
            });
        });
    }

    // 修改获取时间戳和截图功能
    async function getVideoScreenshot() {
        const video = document.querySelector('video');
        if (!video) {
            showNotification('未找到视频元素！');
            return;
        }

        const cleanedUrl = cleanUrl(window.location.href);
        const matchingNoteId = await findMatchingVideoNote(cleanedUrl);
        
        if (!matchingNoteId) {
            showNotification('请先创建视频笔记！');
            return;
        }

        // 更新配置中的目标文档ID
        const config = getConfig();
        configManager.save({
            ...config,
            TARGET_DOC_ID: matchingNoteId
        });

        const currentTime = video.currentTime;
        const timestamp = formatTime(currentTime);
        const timeUrl = generateTimeUrl(currentTime);
        const markdownLink = `[${timestamp}](${timeUrl})`;
        
        try {
            // 创建canvas并截图
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // 将canvas转换为blob
            const blob = await new Promise(resolve => {
                canvas.toBlob(resolve, 'image/png');
            });

            // 生成文件名
            const fileName = `screenshot-${Date.now()}.png`;
            
            // 上传文件
            const filePath = await uploadFile(blob, fileName);
            
            // 构建markdown内容并发送
            const content = `${markdownLink}\n\n![${timestamp}](${filePath})`;
            await sendToSiYuan(content);
            
            showNotification('已发送时间戳和截图到思源笔记');
        } catch (error) {
            showNotification('发送失败：' + error.message);
            console.error(error);
        }
    }

    // 生成带时间戳的URL
    function generateTimeUrl(seconds) {
        const currentUrl = window.location.href;
        const timeParam = Math.floor(seconds);
        
        if (currentUrl.includes('youtube.com')) {
            const urlObj = new URL(currentUrl);
            const videoId = urlObj.searchParams.get('v');
            return `https://youtu.be/${videoId}?t=${timeParam}`;
        } else if (currentUrl.includes('bilibili.com')) {
            const urlObj = new URL(currentUrl);
            const bvidMatch = urlObj.pathname.match(/\/video\/(BV[a-zA-Z0-9]+)/);
            if (bvidMatch) {
                const bvid = bvidMatch[1];
                return `https://www.bilibili.com/video/${bvid}?t=${timeParam}`;
            }
        }
        // 默认格式
        const baseUrl = currentUrl.split('#')[0];
        return `${baseUrl}#t=${timeParam}`;
    }

    // 格式化时间
    function formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 1000);
        
        return `${padZero(hours)}:${padZero(minutes)}:${padZero(secs)}.${padZero(ms, 3)}`;
    }

    // 补零函数
    function padZero(num, length = 2) {
        return String(num).padStart(length, '0');
    }

    // 复制到剪贴板
    function copyToClipboard(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    }

    // 添加通知函数
    function showNotification(message, duration = 3000) {
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    // 清理URL参数
    function cleanUrl(url) {
        const urlObj = new URL(url);
        if (urlObj.hostname.includes('bilibili.com')) {
            const bvidMatch = urlObj.pathname.match(/\/video\/(BV[a-zA-Z0-9]+)/);
            if (bvidMatch) {
                return `https://www.bilibili.com/video/${bvidMatch[1]}`;
            }
        } else if (urlObj.hostname.includes('youtube.com')) {
            const videoId = urlObj.searchParams.get('v');
            if (videoId) {
                return `https://www.youtube.com/watch?v=${videoId}`;
            }
        }
        return url.split('?')[0];  // 移除所有查询参数
    }

    // 创建视频笔记
    async function createVideoNote() {
        const config = getConfig();
        const cleanedUrl = cleanUrl(window.location.href);
        const title = document.title;
        
        // 创建笔记内容
        const content = `# ${title}\n\n> 视频链接：[${title}](${cleanedUrl})`;

        try {
            // 创建文档
            const docData = {
                notebook: config.NOTEBOOK_ID,
                path: `/视频笔记/${title}`,
                markdown: content
            };

            const response = await new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'POST',
                    url: `${config.API_ENDPOINT}/api/filetree/createDocWithMd`,
                    headers: {
                        'Authorization': `Token ${config.API_TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    data: JSON.stringify(docData),
                    onload: function(response) {
                        if (response.status === 200) {
                            const result = JSON.parse(response.responseText);
                            if (result.code === 0) {
                                resolve(result.data);
                            } else {
                                reject(new Error(result.msg));
                            }
                        } else {
                            reject(new Error('请求失败'));
                        }
                    },
                    onerror: reject
                });
            });

            // 设置文档属性
            const attrs = {
                id: response,
                attrs: {
                    "custom-type": "MediaNote",
                    "custom-mediaurl": cleanedUrl
                }
            };

            await new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'POST',
                    url: `${config.API_ENDPOINT}/api/attr/setBlockAttrs`,
                    headers: {
                        'Authorization': `Token ${config.API_TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    data: JSON.stringify(attrs),
                    onload: function(response) {
                        if (response.status === 200) {
                            const result = JSON.parse(response.responseText);
                            if (result.code === 0) {
                                resolve();
                            } else {
                                reject(new Error(result.msg));
                            }
                        } else {
                            reject(new Error('请求失败'));
                        }
                    },
                    onerror: reject
                });
            });

            // 更新配置中的目标文档ID
            configManager.save({
                ...config,
                TARGET_DOC_ID: response
            });

            showNotification('已创建视频笔记');
        } catch (error) {
            showNotification('创建视频笔记失败：' + error.message);
            console.error(error);
        }
    }

    // 创建新按钮
    const createNoteBtn = document.createElement('button');
    createNoteBtn.className = 'timestamp-btn';
    createNoteBtn.textContent = '创建视频笔记';
    createNoteBtn.onclick = createVideoNote;
    
    // 添加更新按钮状态的函数
    async function updateCreateNoteButtonState() {
        if (!document.querySelector('video')) {
            createNoteBtn.disabled = true;
            createNoteBtn.textContent = '未找到视频';
            return;
        }
        
        try {
            const cleanedUrl = cleanUrl(window.location.href);
            const matchingNoteId = await findMatchingVideoNote(cleanedUrl);
            
            if (matchingNoteId) {
                createNoteBtn.disabled = true;
                createNoteBtn.textContent = '已存在对应笔记';
                createNoteBtn.style.backgroundColor = '#cccccc';
            } else {
                createNoteBtn.disabled = false;
                createNoteBtn.textContent = '创建视频笔记';
                createNoteBtn.style.backgroundColor = '#4CAF50';
            }
        } catch (error) {
            console.error('检查现有笔记失败:', error);
            createNoteBtn.disabled = true;
            createNoteBtn.textContent = '检查失败';
            createNoteBtn.style.backgroundColor = '#ff4444';
        }
    }

    // 初始检查按钮状态
    updateCreateNoteButtonState();

    // 定期检查更新按钮状态（每30秒）
    setInterval(updateCreateNoteButtonState, 30000);

    // 当URL变化时更新按钮状态
    let lastUrl = window.location.href;
    new MutationObserver(() => {
        if (lastUrl !== window.location.href) {
            lastUrl = window.location.href;
            updateCreateNoteButtonState();
        }
    }).observe(document, {subtree: true, childList: true});

    // 更新工具栏
    toolsDiv.insertBefore(createNoteBtn, timestampBtn);

    // 获取视频笔记中的时间戳
    async function getExistingTimestamps(docId) {
        const config = getConfig();
        
        try {
            // 获取文档块的kramdown源码
            const kramdownData = await new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'POST',
                    url: `${config.API_ENDPOINT}/api/block/getBlockKramdown`,
                    headers: {
                        'Authorization': `Token ${config.API_TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    data: JSON.stringify({ id: docId }),
                    onload: function(response) {
                        if (response.status === 200) {
                            const result = JSON.parse(response.responseText);
                            if (result.code === 0) {
                                resolve(result.data);
                            } else {
                                reject(new Error(result.msg));
                            }
                        } else {
                            reject(new Error('请求失败'));
                        }
                    },
                    onerror: reject
                });
            });

            // 使用parseTimestampLinks解析时间戳
            const timestamps = parseTimestampLinks(kramdownData.kramdown);
            
            // 转换格式以保持兼容性
            return timestamps.map(ts => ({
                text: ts.text,
                url: ts.url,
                time: ts.time,
                blockId: docId // 使用文档ID作为blockId
            }));

        } catch (error) {
            console.error('获取时间戳失败:', error);
            throw error;
        }
    }

    // 从test.js中提取的辅助函数
    function parseTimestampLinks(kramdown) {
        const timestamps = [];
        // 按块分割内容
        const blocks = kramdown.split(/\n\s*\n/);
        
        blocks.forEach(block => {
            // 清理块属性标记
            const cleanBlock = block.replace(/\{:[^\}]+\}/g, '').trim();
            if (!cleanBlock) return;

            // 使用更严格的正则表达式匹配链接
            const regex = /(?<!\\)\[([^\]]+?)\]\(([^)]+?)\)/g;
            let match;

            while ((match = regex.exec(cleanBlock)) !== null) {
                const [fullMatch, text, href] = match;
                
                // 验证链接格式
                if (!isValidTimestampLink(href)) continue;

                try {
                    const timeValue = extractTime(href);
                    if (timeValue === null) continue;

                    // 清理和格式化文本
                    const cleanText = cleanTimestampText(text);
                    
                    timestamps.push({
                        text: cleanText,
                        url: normalizeUrl(href),
                        time: timeValue,
                        originalText: text
                    });
                } catch (e) {
                    console.warn('解析时间戳失败:', e, {text, href});
                }
            }
        });

        // 按时间排序
        return timestamps.sort((a, b) => a.time - b.time);
    }

    function isValidTimestampLink(href) {
        // 检查是否是视频网站链接
        const validDomains = [
            'youtube.com', 'youtu.be',
            'bilibili.com', 'b23.tv'
        ];
        
        try {
            const url = new URL(href);
            const isDomainValid = validDomains.some(domain => url.hostname.includes(domain));
            const hasTimestamp = href.includes('?t=') || href.includes('&t=') || href.includes('#t=');
            
            return isDomainValid && hasTimestamp;
        } catch (e) {
            return false;
        }
    }

    function cleanTimestampText(text) {
        // 移除多余空格和特殊字符
        return text.trim()
                  .replace(/\s+/g, ' ')
                  .replace(/[\u200B-\u200D\uFEFF]/g, ''); // 移除零宽字符
    }

    function normalizeUrl(url) {
        try {
            const urlObj = new URL(url);
            
            // 处理YouTube链接
            if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
                const videoId = urlObj.searchParams.get('v') || urlObj.pathname.split('/').pop();
                const timestamp = extractTime(url);
                return `https://youtu.be/${videoId}?t=${timestamp}`;
            }
            
            // 处理Bilibili链接
            if (urlObj.hostname.includes('bilibili.com')) {
                const bvid = url.match(/BV[\w]+/)?.[0];
                const timestamp = extractTime(url);
                if (bvid) {
                    return `https://www.bilibili.com/video/${bvid}?t=${timestamp}`;
                }
            }
            
            return url;
        } catch (e) {
            return url;
        }
    }

    function extractTime(url) {
        try {
            const urlObj = new URL(url);
            
            // 尝试从不同位置获取时间参数
            let timeStr = null;
            
            // 检查查询参数
            timeStr = urlObj.searchParams.get('t');
            
            // 检查哈希参数
            if (!timeStr && urlObj.hash) {
                const hashMatch = urlObj.hash.match(/[?&]t=(\d+)/);
                if (hashMatch) {
                    timeStr = hashMatch[1];
                }
            }
            
            // 处理时间格式
            if (timeStr) {
                // 处理 HH:MM:SS 格式
                if (timeStr.includes(':')) {
                    const parts = timeStr.split(':').map(Number);
                    let seconds = 0;
                    if (parts.length === 3) { // HH:MM:SS
                        seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
                    } else if (parts.length === 2) { // MM:SS
                        seconds = parts[0] * 60 + parts[1];
                    }
                    return seconds;
                }
                
                // 处理纯数字格式
                return parseInt(timeStr, 10);
            }
            
            return null;
        } catch (e) {
            console.warn('解析时间戳失败:', e, url);
            return null;
        }
    }

    // 修改更新时间戳列表的函数
    async function updateTimestampList() {
        const video = document.querySelector('video');
        if (!video) return;

        const cleanedUrl = cleanUrl(window.location.href);
        const matchingNoteId = await findMatchingVideoNote(cleanedUrl);
        const list = document.getElementById('timestamp-list');
        
        if (!list) return;
        
        if (!matchingNoteId) {
            const noTimestamps = document.createElement('div');
            noTimestamps.className = 'no-timestamps';
            noTimestamps.textContent = '请先创建视频笔记';
            list.replaceChildren(noTimestamps);
            return;
        }

        try {
            const timestamps = await getExistingTimestamps(matchingNoteId);
            
            if (timestamps.length === 0) {
                const noTimestamps = document.createElement('div');
                noTimestamps.className = 'no-timestamps';
                noTimestamps.textContent = '暂无时间戳记录';
                list.replaceChildren(noTimestamps);
                return;
            }

            // 清空现有列表
            list.replaceChildren();
            
            // 添加新的时间戳项
            timestamps.forEach(ts => {
                const item = document.createElement('div');
                item.className = 'timestamp-item';
                item.dataset.time = ts.time;
                item.textContent = ts.text;
                
                item.addEventListener('click', () => {
                    if (video) {
                        video.currentTime = ts.time;
                        list.querySelectorAll('.timestamp-item').forEach(i => i.classList.remove('active'));
                        item.classList.add('active');
                    }
                });
                
                list.appendChild(item);
            });

        } catch (error) {
            console.error('获取时间戳失败:', error);
            showNotification('获取时间戳失败: ' + error.message);
        }
    }

    // 在创建工具栏之后添加时间戳列表面板
    document.body.appendChild(toolsDiv);
    const timestampPanel = createTimestampListPanel(); // 保存对面板的引用

    // 初始化
    setTimeout(async () => {
        await updateTimestampList();
        addVideoTimeUpdateHandler();
    }, 1000);

    // 添加视频时间更新事件，以高亮当前时间戳
    function addVideoTimeUpdateHandler() {
        const video = document.querySelector('video');
        if (!video) return;

        video.addEventListener('timeupdate', () => {
            const currentTime = Math.floor(video.currentTime);
            const items = document.querySelectorAll('.timestamp-item');
            items.forEach(item => {
                const itemTime = parseInt(item.dataset.time);
                if (itemTime === currentTime) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
        });
    }

    // 定期刷新时间戳列表
    setInterval(updateTimestampList, 5000);

    // 在发送新时间戳后立即更新列表
    const originalSendToSiYuan = sendToSiYuan;
    sendToSiYuan = async function(content) {
        await originalSendToSiYuan(content);
        await updateTimestampList();
    };

    // 初始化
    setTimeout(async () => {
        await updateTimestampList();
        addVideoTimeUpdateHandler();
    }, 1000);

    // 添加时间戳列表拖动功能
    function makeDraggable(panel) {
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        panel.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);

        function dragStart(e) {
            if (e.target.classList.contains('timestamp-item')) {
                return; // 如果点击的是时间戳项，不启动拖动
            }
            
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;

            isDragging = true;
        }

        function drag(e) {
            if (isDragging) {
                e.preventDefault();

                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;

                xOffset = currentX;
                yOffset = currentY;

                setTranslate(currentX, currentY, panel);
            }
        }

        function dragEnd() {
            initialX = currentX;
            initialY = currentY;

            isDragging = false;
        }

        function setTranslate(xPos, yPos, el) {
            el.style.transform = `translate(${xPos}px, ${yPos}px)`;
        }
    }

    // 创建时间戳列表面板
    function createTimestampListPanel() {
        const panel = document.createElement('div');
        panel.className = 'timestamp-list-panel';

        const title = document.createElement('div');
        title.className = 'timestamp-list-title';
        title.textContent = '时间戳列表';
        
        const list = document.createElement('div');
        list.id = 'timestamp-list';
        
        panel.appendChild(title);
        panel.appendChild(list);
        
        document.body.appendChild(panel);
        makeDraggable(panel);
        
        return panel;
    }

    // 添加快捷键设置函数
    function setupHotkeys() {
        const config = configManager.get();
        
        // 移除现有的事件监听器
        document.removeEventListener('keydown', hotkeyHandler);
        
        // 添加新的事件监听器
        document.addEventListener('keydown', hotkeyHandler);

        function hotkeyHandler(e) {
            const pressedKeys = [];
            if (e.ctrlKey) pressedKeys.push('Ctrl');
            if (e.altKey) pressedKeys.push('Alt');
            if (e.shiftKey) pressedKeys.push('Shift');
            if (e.key !== 'Control' && e.key !== 'Alt' && e.key !== 'Shift') {
                pressedKeys.push(e.key.toUpperCase());
            }
            const pressedHotkey = pressedKeys.join('+');

            // 检查是否在输入框中
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            if (pressedHotkey === config.CREATE_NOTE_HOTKEY || pressedHotkey === config.TIMESTAMP_HOTKEY || pressedHotkey === config.SCREENSHOT_HOTKEY) {
                e.preventDefault();
                const video = document.querySelector('video');
                if (!video) {
                    showNotification('未找到视频元素！');
                    return;
                }

                const cleanedUrl = cleanUrl(window.location.href);
                findMatchingVideoNote(cleanedUrl).then(matchingNoteId => {
                    if (!matchingNoteId) {
                        if (pressedHotkey === config.CREATE_NOTE_HOTKEY) {
                            createVideoNote();
                        } else {
                            showNotification('请先创建视频笔记！');
                        }
                    } else {
                        if (pressedHotkey === config.TIMESTAMP_HOTKEY) {
                            getVideoTimestamp();
                        } else if (pressedHotkey === config.SCREENSHOT_HOTKEY) {
                            getVideoScreenshot();
                        } else if (pressedHotkey === config.CREATE_NOTE_HOTKEY) {
                            createVideoNote();
                        }
                    }
                });
            }
        }
    }

    // 初始化时设置快捷键
    setupHotkeys();
})();
