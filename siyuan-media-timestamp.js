// ==UserScript==
// @name         思源在线视频时间戳和截图
// @namespace    https://github.com/KuiyueRO/siyuan-media-timestamp
// @version      1.2
// @description  捕获视频时间戳和当前帧截图和点击跳转
// @author       A_Cai
// @match        *://*/*
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
        .settings-panel {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #ffffff;
            padding: 24px;
            border-radius: 12px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.15);
            z-index: 100000;
            display: none;
            width: 460px;
            max-height: 85vh;
            overflow-y: auto;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            box-sizing: border-box; // 添加这行确保padding不会影响总宽度
        }
        .settings-panel h3 {
            margin: 0 0 24px 0;
            color: #1a1a1a;
            font-size: 20px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .settings-panel h3::before {
            content: '';
            display: inline-block;
            width: 4px;
            height: 20px;
            background: #4CAF50;
            border-radius: 2px;
        }
        .settings-section {
            padding: 16px;
            background: #f8f9fa;
            border-radius: 8px;
            margin-bottom: 16px;
            box-sizing: border-box;
        }
        .settings-section-title {
            font-size: 16px;
            font-weight: 500;
            color: #2c3e50;
            margin-bottom: 16px;
        }
        .settings-field {
            margin-bottom: 20px;
            padding: 0 12px;
            box-sizing: border-box;
        }
        .settings-field label {
            display: block;
            color: #2c3e50;
            font-size: 14px;
            font-weight: 500;
            margin-bottom: 8px;
            opacity: 0.85;
        }
        .settings-field label:hover {
            opacity: 1;
        }
        .settings-field input[type="text"],
        .settings-field select {
            width: calc(100% - 24px);
            padding: 10px 12px;
            border: 1px solid #e0e0e0;
            border-radius: 6px;
            font-size: 14px;
            transition: all 0.2s ease;
            background: #ffffff;
            box-sizing: border-box;
        }
        .settings-field input[type="text"]:hover,
        .settings-field select:hover {
            border-color: #d0d0d0;
        }
        .settings-field input[type="text"]:focus,
        .settings-field select:focus {
            border-color: #4CAF50;
            box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.1);
            outline: none;
        }
        .select-wrapper {
            position: relative;
            width: 100%;
            box-sizing: border-box;
        }
        .select-wrapper::after {
            content: '';
            position: absolute;
            right: 16px; // 调整箭头位置
            top: 50%;
            transform: translateY(-50%);
            width: 0;
            height: 0;
            border-left: 5px solid transparent;
            border-right: 5px solid transparent;
            border-top: 5px solid #666;
            pointer-events: none;
            transition: all 0.2s ease;
        }
        .select-wrapper:hover::after {
            border-top-color: #333;
        }
        .custom-select {
            appearance: none;
            width: calc(100% - 24px) !important;
            padding-right: 36px !important; // 为下拉箭头留出更多空间
            cursor: pointer;
            box-sizing: border-box;
            background: #ffffff;
        }
        .match-list {
            background: #ffffff;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 16px;
            max-height: 180px;
            overflow-y: auto;
        }
        .match-item {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 12px;
            padding: 4px;
            background: transparent;
            border-radius: 6px;
            transition: all 0.2s ease;
        }
        .match-input {
            flex: 1;
            padding: 10px 12px;
            border: 1px solid #e0e0e0;
            border-radius: 6px;
            font-size: 14px;
            transition: all 0.3s ease;
            background: #ffffff;
        }
        .match-input:hover {
            border-color: #d0d0d0;
        }
        .match-input:focus {
            border-color: #4CAF50;
            box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.1);
            outline: none;
        }
        .delete-match-btn {
            width: 24px;
            height: 24px;
            padding: 0;
            border: none;
            background: transparent;
            color: #999;
            font-size: 18px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            border-radius: 4px;
        }
        .delete-match-btn:hover {
            color: #ff4444;
            background: transparent;
            transform: scale(1.1);
        }
        .add-match-btn {
            margin-top: 12px;
            padding: 10px;
            height: 40px;
            background: #f8f9fa;
            color: #666;
            border: 1px dashed #ddd;
            border-radius: 6px;
            cursor: pointer;
            width: 100%;
            font-size: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            transition: all 0.2s ease;
        }
        .add-match-btn:hover {
            background: #f0f0f0;
            border-color: #999;
            color: #333;
            transform: translateY(-1px);
        }
        .add-match-btn svg {
            width: 14px;
            height: 14px;
            stroke: currentColor;
            transition: transform 0.2s ease;
        }
        .add-match-btn:hover svg {
            transform: scale(1.1);
        }
        .settings-buttons {
            margin-top: 24px;
            display: flex;
            justify-content: flex-end;
            gap: 12px;
        }
        .settings-btn {
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
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
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
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
                opacity: 0.2;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }
        .timestamp-list-panel {
            background: #ffffff;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 2px 12px rgba(0,0,0,0.15);
            width: 200px;
            max-height: 400px;
            overflow-y: auto;
            backdrop-filter: blur(10px);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            opacity: 0.2;
            transition: opacity 0.3s ease;
            color: #000000;
        }

        /* Dark Reader 支持 */
        @media (prefers-color-scheme: dark) {
            .timestamp-list-panel {
                background: #202124;
                color: #ffffff;
            }
        }

        [data-darkreader-scheme="dark"] .timestamp-list-panel {
            background: #202124;
            color: #ffffff;
        }

        .timestamp-list-panel:hover,
        .timestamp-list-header:hover ~ * {
            opacity: 1 !important;
        }

        /* B站播放器内的特殊样式 */
        .bpx-player-container .timestamp-list-panel {
            background: rgba(0, 0, 0, 0.7);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .timestamp-list-header {
            cursor: grab;
            user-select: none;
            opacity: 0.8;
            transition: opacity 0.3s ease;
            border-bottom: 1px solid rgba(128, 128, 128, 0.1);
            padding-bottom: 8px;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .timestamp-list-header:hover {
            opacity: 1;
        }

        .timestamp-list-header:hover .timestamp-list-title {
            opacity: 1;
        }

        .timestamp-header-buttons {
            display: flex;
            gap: 4px;
            opacity: 0.8;
            transition: opacity 0.3s ease;
        }

        .timestamp-header-btn {
            opacity: 0.8;
            transition: opacity 0.3s ease;
            padding: 4px;
            background: transparent;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .timestamp-header-btn:hover {
            opacity: 1;
        }

        .timestamp-list-header:hover .timestamp-header-buttons {
            opacity: 1;
        }

        .timestamp-item {
            opacity: 0.6;
            transition: opacity 0.3s ease;
            border-bottom: 1px solid rgba(128, 128, 128, 0.05);
            padding: 8px 0;
        }

        .timestamp-item:hover {
            opacity: 1;
        }

        .timestamp-header-buttons {
            opacity: 0.8;
            transition: opacity 0.3s ease;
        }

        .timestamp-list-header:hover .timestamp-header-buttons {
            opacity: 1;
        }

        .timestamp-header-btn {
            opacity: 0.8;
            transition: opacity 0.3s ease;
        }

        .timestamp-header-btn:hover {
            opacity: 1;
        }

        .timestamp-note-input {
            opacity: 0.6;
            transition: opacity 0.3s ease;
            background: transparent;
            color: inherit;
            border: 1px solid rgba(128, 128, 128, 0.2);
            border-radius: 4px;
            padding: 4px 8px;
        }

        .timestamp-item:hover .timestamp-note-input {
            opacity: 1;
        }

        .timestamp-note-input:focus {
            opacity: 1;
            outline: none;
            border-color: rgba(128, 128, 128, 0.4);
        }

        .bpx-player-container .timestamp-list-panel .timestamp-item {
            color: rgba(255, 255, 255, 0.9);
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .bpx-player-container .timestamp-list-panel .timestamp-item:hover {
            background: rgba(255, 255, 255, 0.1);
        }

        .bpx-player-container .timestamp-list-panel .timestamp-header-btn {
            filter: invert(1);
        }

        .bpx-player-container .timestamp-list-panel .timestamp-note-input {
            background: rgba(0, 0, 0, 0.3);
            color: white;
            border-color: rgba(255, 255, 255, 0.2);
        }

        .bpx-player-container .timestamp-list-panel .timestamp-note-input:focus {
            background: rgba(0, 0, 0, 0.5);
            border-color: rgba(255, 255, 255, 0.3);
        }

        .timestamp-list-title {
            font-weight: 600;
            color: inherit;
            opacity: 0.9;
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
            color:rgb(0, 0, 0);
        }

        .no-timestamps {
            color: #999;
            text-align:;
            text-align: center center;
            text-align: center;
        }
        .timestamp-list-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 10px;
            padding-bottom: 8px;
            border-bottom: 0.5px solid #848484;
            align-items: center;
            cursor: grab;
            user-select: none;
        }

        .timestamp-header-buttons {
            display: flex;
            gap: 4px;
        }

        .timestamp-header-btn {
            padding: 4px;
            background: transparent;
            color: #666;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
        }

        .timestamp-header-btn:hover {
            background: rgba(0, 0, 0, 0.1);
            color:rgb(0, 0, 0);
        }

        .timestamp-header-btn img {
            width: 16px;
            height: 16px;
            filter: invert(0.5);
        }

        .timestamp-header-btn:hover img {
            color:rgb(0, 0, 0);
        }
        .match-list-field {
            flex-direction: column !important;
            align-items: stretch !important;
        }

        .match-list {
            margin-top: 10px;
            max-height: 200px;
            overflow-y: auto;
            border: 1px solid #ddd;
            border-radius: 6px;
            padding: 8px;
        }

        .match-item {
            display: flex;
            align-items: center;
            margin-bottom: 8px;
            gap: 8px;
        }

        .match-input {
            flex: 1;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
        }

        .delete-match-btn {
            padding: 4px 8px;
            background: #ff4444;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }

        .delete-match-btn:hover {
            background: #ff6666;
        }

        .add-match-btn {
            margin-top: 8px;
            padding: 8px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            width: 100%;
        }

        .add-match-btn:hover {
            background: #45a049;
        }

        .timestamp-item {
            display: flex;
            padding: 8px;
            margin: 4px 0;
            border-radius: 4px;
            transition: all 0.2s;
        }

        .timestamp-left {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .timestamp-text {
            font-weight: 500;
            cursor: pointer;
        }

        .timestamp-text:hover {
            color: #4CAF50;
        }

        .timestamp-note-container {
            display: flex;
            align-items: center;
        }

        .timestamp-note-input {
            width: 100%;
            padding: 4px 8px;
            border: 1px solid transparent;
            border-radius: 4px;
            font-size: 0.9em;
            color: #666;
            background: transparent;
            transition: all 0.2s;
        }

        .timestamp-note-input:hover {
            border-color: #ddd;
        }

        .timestamp-note-input:focus {
            border-color: #4CAF50;
            background: white;
            outline: none;
        }

        .timestamp-item.active {
            background: #e8f5e9;
        }

        .timestamp-item.active .timestamp-text {
            color: #2e7d32;
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
            SCREENSHOT_HOTKEY: '',
            MATCH_LIST: [
                'https://www.youtube.com/watch?v=',
                'https://www.bilibili.com/video/',
                'https://pan.baidu.com/play/'  // 添加百度网盘匹配
            ]
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

    // 添加缓存机制
    const cache = {
        notebooks: null,
        notebookExpiry: 0,
        CACHE_DURATION: 5 * 60 * 1000, // 5分钟缓存
        
        async getNotebooks() {
            const now = Date.now();
            if (this.notebooks && now < this.notebookExpiry) {
                return this.notebooks;
            }
            
            const notebooks = await getNotebooks();
            this.notebooks = notebooks;
            this.notebookExpiry = now + this.CACHE_DURATION;
            return notebooks;
        },
        
        clearCache() {
            this.notebooks = null;
            this.notebookExpiry = 0;
        }
    };

    // 添加重试机制的 API 调用包装器
    async function retryApiCall(apiCall, maxRetries = 3, delay = 1000) {
        let lastError;
        
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await apiCall();
            } catch (error) {
                lastError = error;
                if (i < maxRetries - 1) {
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        
        throw lastError;
    }

    // 使用示例
    async function getNotebooks() {
        return retryApiCall(async () => {
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
        });
    }

    // 创建设置面板
    function createSettingsPanel() {
        const panel = document.createElement('div');
        panel.className = 'settings-panel';
        const currentConfig = configManager.get();

        panel.innerHTML = `
            <h3>思源笔记设置</h3>
            
            <div class="settings-section">
                <div class="settings-section-title">基本设置</div>
                <div class="settings-field">
                    <label>API 地址</label>
                    <input type="text" id="api-endpoint" value="${currentConfig.API_ENDPOINT}" placeholder="http://127.0.0.1:6806">
                </div>
                <div class="settings-field">
                    <label>API Token</label>
                    <input type="text" id="api-token" value="${currentConfig.API_TOKEN}" placeholder="输入你的 API Token">
                </div>
                <div class="settings-field">
                    <label>选择笔记本</label>
                    <div class="select-wrapper">
                        <select id="notebook-select" class="custom-select">
                            <option value="">加载中...</option>
                        </select>
                    </div>
                </div>
            </div>
    
            <div class="settings-section">
                <div class="settings-section-title">快捷键设置</div>
                <div class="settings-field">
                    <label>创建笔记快捷键</label>
                    <input type="text" id="create-note-hotkey" value="${currentConfig.CREATE_NOTE_HOTKEY}" placeholder="点击设置快捷键" readonly>
                </div>
                <div class="settings-field">
                    <label>时间戳快捷键</label>
                    <input type="text" id="timestamp-hotkey" value="${currentConfig.TIMESTAMP_HOTKEY}" placeholder="点击设置快捷键" readonly>
                </div>
                <div class="settings-field">
                    <label>截图+时间戳快捷键</label>
                    <input type="text" id="screenshot-hotkey" value="${currentConfig.SCREENSHOT_HOTKEY}" placeholder="点击设置快捷键" readonly>
                </div>
            </div>
    
            <div class="settings-section">
                <div class="settings-section-title">网站匹配规则</div>
                <div id="match-list" class="match-list"></div>
                <button class="add-match-btn">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    添加匹配规则
                </button>
            </div>
    
            <div class="settings-buttons">
                <button id="cancel-settings" class="settings-btn secondary">取消</button>
                <button id="save-settings" class="settings-btn primary">保存</button>
            </div>
        `;
    
        // 添加网站匹配规则
        const matchList = panel.querySelector('#match-list');
        currentConfig.MATCH_LIST.forEach(match => {
            const matchItem = createMatchItem(match);
            matchList.appendChild(matchItem);
        });
    
        // 绑定添加规则按钮
        panel.querySelector('.add-match-btn').onclick = () => {
            const matchItem = createMatchItem('');
            matchList.appendChild(matchItem);
        };
    
        // 添加到文档并设置事件监听
        document.body.appendChild(panel);
    
        // 加载笔记本列表
        loadNotebookList(panel);
    
        // 设置事件监听
        setupEventListeners(panel);
    
        return panel;
    }
    
    // 修改 loadNotebookList 使用缓存
    async function loadNotebookList(panel) {
        const select = panel.querySelector('#notebook-select');
        const currentConfig = configManager.get();
    
        try {
            const notebooks = await cache.getNotebooks();
            select.innerHTML = notebooks.map(notebook => `
                <option value="${notebook.id}" 
                        ${notebook.id === currentConfig.NOTEBOOK_ID ? 'selected' : ''}>
                    ${notebook.name}
                </option>
            `).join('');
        } catch (error) {
            select.innerHTML = `<option value="">加载失败: ${error.message}</option>`;
        }
    }

    // 添加创建匹配项的辅助函数
    function createMatchItem(value) {
        const item = document.createElement('div');
        item.className = 'match-item';

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'match-input';
        input.value = value;
        input.placeholder = '输入匹配规则，例如: https://www.youtube.com/watch?v=';

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-match-btn';
        deleteBtn.innerHTML = '×'; // 使用 × 符号
        deleteBtn.title = '移除规则';
        deleteBtn.onclick = () => {
            item.style.opacity = '0';
            setTimeout(() => item.remove(), 200);
        };

        item.appendChild(input);
        item.appendChild(deleteBtn);

        return item;
    }

    // 显示设置面板
    async function showSettings() {
        const panel = createSettingsPanel();
        panel.style.display = 'block';

        // 加载笔记本列表
        try {
            const notebooks = await getNotebooks();
            const notebookList = panel.querySelector('#notebook-list');
            const currentConfig = configManager.get();

            // 清空现有列表
            notebookList.innerHTML = '';

            // 添加笔记本选项
            notebooks.forEach(notebook => {
                const item = document.createElement('div');
                item.className = 'notebook-item';
                if (notebook.id === currentConfig.NOTEBOOK_ID) {
                    item.classList.add('selected');
                }
                item.dataset.id = notebook.id;
                item.dataset.name = notebook.name;
                item.textContent = notebook.name;
                notebookList.appendChild(item);
            });

            // 绑定点击事件
            notebookList.addEventListener('click', (e) => {
                const item = e.target.closest('.notebook-item');
                if (item) {
                    notebookList.querySelectorAll('.notebook-item').forEach(i => {
                        i.classList.remove('selected');
                    });
                    item.classList.add('selected');
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

    // 配置项
    function getConfig() {
        return configManager.get();
    }

    // 添加发送到思源的函数
    async function sendToSiYuan(content) {
        const config = getConfig();
        const data = {
            dataType: "markdown",
            data: content,
            parentID: config.TARGET_DOC_ID
        };

        try {
            const result = await new Promise((resolve, reject) => {
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
                                resolve(result);
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

            // 获取新创建的块ID
            const newBlockId = result.data[0].doOperations[0].id;
            
            // 设置自定义属性
            await setBlockAttrs({
                id: newBlockId,
                attrs: {
                    "custom-media": "timestamp"
                }
            });

            return result;
        } catch (error) {
            throw error;
        }
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
            // 获取现有时间戳
            const existingTimestamps = await getExistingTimestamps(matchingNoteId);
            const existingTimestamp = existingTimestamps.find(ts => Math.abs(ts.time - currentTime) < 1);

            if (existingTimestamp) {
                showNotification('该时间戳已存在');
                return;
            }

            // 发送到思源
            const result = await new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'POST',
                    url: `${config.API_ENDPOINT}/api/block/appendBlock`,
                    headers: {
                        'Authorization': `Token ${config.API_TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    data: JSON.stringify({
                        dataType: "markdown",
                        data: markdownLink,
                        parentID: matchingNoteId
                    }),
                    onload: function(response) {
                        if (response.status === 200) {
                            const result = JSON.parse(response.responseText);
                            if (result.code === 0) {
                                resolve(result);
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

            // 获取新创建的块ID
            const newBlockId = result.data[0].doOperations[0].id;
            
            // 设置自定义属性
            await setBlockAttrs({
                id: newBlockId,
                attrs: {
                    "custom-media": "timestamp"
                }
            });

            showNotification('已添加时间戳');
            await updateTimestampList();
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

    // 添加一个检查截图块是否存在的辅助函数
    async function findScreenshotBlock(timestampBlockId) {
        const config = getConfig();
        const sql = `SELECT id FROM blocks 
                     WHERE parent_id = '${timestampBlockId}'
                     AND id IN (
                         SELECT block_id FROM attributes 
                         WHERE name = 'custom-media' 
                         AND value = 'tsscreenshot'
                     )`;
        
        try {
            const result = await query(sql);
            return result.length > 0 ? result[0].id : null;
        } catch (error) {
            console.error('查询截图块失败:', error);
            return null;
        }
    }

    // 修改 isInSuperBlock 函数
    async function isInSuperBlock(blockId) {
        const config = getConfig();
        try {
            // 使用更简单的查询语句
            const sql = `
                WITH RECURSIVE parents AS (
                    SELECT id, parent_id, type
                    FROM blocks 
                    WHERE id = '${blockId}'
                    
                    UNION ALL
                    
                    SELECT b.id, b.parent_id, b.type
                    FROM blocks b
                    JOIN parents p ON b.id = p.parent_id
                )
                SELECT p.id 
                FROM parents p
                JOIN attributes a ON p.id = a.block_id
                WHERE p.type = 's' 
                AND a.name = 'custom-media'
                AND a.value = 'mediacard'
                LIMIT 1
            `;
            
            const result = await query(sql);
            return result.length > 0;
        } catch (error) {
            console.error('检查超级块失败:', error);
            return false;
        }
    }

    // 添加一个获取父超级块ID的函数
    async function getParentSuperBlockId(blockId) {
        const config = getConfig();
        try {
            const sql = `
                SELECT b2.id
                FROM blocks b1 
                JOIN blocks b2 ON b1.parent_id = b2.id
                JOIN attributes attrs ON b2.id = attrs.block_id
                WHERE b1.id = '${blockId}'
                AND attrs.name = 'custom-media'
                AND attrs.value = 'mediacard'
            `;
            
            const result = await query(sql);
            return result.length > 0 ? result[0].id : null;
        } catch (error) {
            console.error('获取父超级块ID失败:', error);
            return null;
        }
    }

    // 修改 getParentMediaCard 函数以解决循环引用问题
    async function getParentMediaCard(blockId) {
        const config = getConfig();
        try {
            const sql = `
                WITH RECURSIVE parents(id, parent_id, level, path) AS (
                    -- 基础查询：获取起始块
                    SELECT 
                        b.id,
                        b.parent_id,
                        0 as level,
                        b.id as path
                    FROM blocks b
                    WHERE b.id = '${blockId}'
                    
                    UNION ALL
                    
                    -- 递归查询：获取父块
                    SELECT 
                        b.id,
                        b.parent_id,
                        p.level + 1,
                        p.path || ',' || b.id
                    FROM blocks b
                    JOIN parents p ON b.id = p.parent_id
                    WHERE p.level < 10  -- 限制递归深度
                    AND p.path NOT LIKE '%' || b.id || '%'  -- 防止循环
                )
                SELECT DISTINCT p.id
                FROM parents p
                JOIN attributes a ON p.id = a.block_id
                WHERE a.name = 'custom-media'
                AND a.value = 'mediacard'
                ORDER BY p.level ASC
                LIMIT 1
            `;
            
            const result = await query(sql);
            return result.length > 0 ? result[0].id : null;
        } catch (error) {
            console.error('检查父块mediacard属性失败:', error);
            return null;
        }
    }

    // 修改 createMemoBlock 函数
    async function createMemoBlock(timestampBlockId, content) {
        const config = getConfig();
        
        try {
            // 1. 获取或创建超级块
            const superBlockId = await createOrGetSuperBlock(timestampBlockId);

            // 2. 创建备注块
            const memoResult = await new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'POST',
                    url: `${config.API_ENDPOINT}/api/block/appendBlock`,
                    headers: {
                        'Authorization': `Token ${config.API_TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    data: JSON.stringify({
                        dataType: "markdown",
                        data: content,
                        parentID: superBlockId
                    }),
                    onload: async function(response) {
                        if (response.status === 200) {
                            const result = JSON.parse(response.responseText);
                            if (result.code === 0) {
                                const newBlockId = result.data[0].doOperations[0].id;
                                try {
                                    await setBlockAttrs({
                                        id: newBlockId,
                                        attrs: {
                                            "custom-media": "memos"
                                        }
                                    });
                                    resolve(newBlockId);
                                } catch (error) {
                                    reject(error);
                                }
                            } else {
                                reject(new Error(result.msg));
                            }
                        } else {
                            reject(new Error('创建备注块失败'));
                        }
                    },
                    onerror: reject
                });
            });

            // 3. 清理临时块
            await removeTemporaryBlocks();

            return memoResult;
        } catch (error) {
            console.error('创建备注块失败:', error);
            throw error;
        }
    }

    // 修改 getVideoScreenshot 函数
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
            // 获取现有时间戳
            const existingTimestamps = await getExistingTimestamps(matchingNoteId);
            const existingTimestamp = existingTimestamps.find(ts => Math.abs(ts.time - currentTime) < 1);

            // 创建截图相关数据
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const blob = await new Promise(resolve => {
                canvas.toBlob(resolve, 'image/png');
            });
            const fileName = `screenshot-${Date.now()}.png`;
            const filePath = await uploadFile(blob, fileName);

            if (existingTimestamp) {
                try {
                    // 查找时间戳块对应的截图块
                    const timestampBlockId = await findTimestampBlockId(timeUrl, matchingNoteId);
                    if (!timestampBlockId) {
                        showNotification('时间戳块查找失败');
                        return;
                    }

                    // 检查时间戳块是否已在超级块内
                    const isInSuper = await isInSuperBlock(timestampBlockId);
                    let superBlockId;

                    if (isInSuper) {
                        // 如果已在超级块内,获取超级块ID
                        superBlockId = await getParentSuperBlockId(timestampBlockId);
                    } else {
                        // 如果不在超级块内,创建新的超级块
                        superBlockId = await new Promise((resolve, reject) => {
                            GM_xmlhttpRequest({
                                method: 'POST',
                                url: `${config.API_ENDPOINT}/api/block/insertBlock`,
                                headers: {
                                    'Authorization': `Token ${config.API_TOKEN}`,
                                    'Content-Type': 'application/json'
                                },
                                data: JSON.stringify({
                                    dataType: "markdown",
                                    data: `{{{row
                                        内容\n{: custom-media="temp" }\n
                                        }}}\n{: custom-media="mediacard" }\n`,
                                    previousID: timestampBlockId
                                }),
                                onload: function(response) {
                                    if (response.status === 200) {
                                        const result = JSON.parse(response.responseText);
                                        if (result.code === 0) {
                                            resolve(result.data[0].doOperations[0].id);
                                        } else {
                                            reject(new Error(result.msg));
                                        }
                                    } else {
                                        reject(new Error('创建超级块失败'));
                                    }
                                },
                                onerror: reject
                            });
                        });

                        // 移动时间戳块到超级块内
                        await new Promise((resolve, reject) => {
                            GM_xmlhttpRequest({
                                method: 'POST',
                                url: `${config.API_ENDPOINT}/api/block/moveBlock`,
                                headers: {
                                    'Authorization': `Token ${config.API_TOKEN}`,
                                    'Content-Type': 'application/json'
                                },
                                data: JSON.stringify({
                                    id: timestampBlockId,
                                    parentID: superBlockId
                                }),
                                onload: function(response) {
                                    if (response.status === 200) {
                                        const result = JSON.parse(response.responseText);
                                        if (result.code === 0) {
                                            resolve();
                                        } else {
                                            reject(new Error(result.msg));
                                        }
                                    } else {
                                        reject(new Error('移动时间戳块失败'));
                                    }
                                },
                                onerror: reject
                            });
                        });
                    }

                    // 添加截图块到超级块
                    const screenshotResult = await new Promise((resolve, reject) => {
                        GM_xmlhttpRequest({
                            method: 'POST',
                            url: `${config.API_ENDPOINT}/api/block/appendBlock`,
                            headers: {
                                'Authorization': `Token ${config.API_TOKEN}`,
                                'Content-Type': 'application/json'
                            },
                            data: JSON.stringify({
                                dataType: "markdown",
                                data: `![${timestamp}](${filePath})`,
                                parentID: superBlockId
                            }),
                            onload: function(response) {
                                if (response.status === 200) {
                                    const result = JSON.parse(response.responseText);
                                    if (result.code === 0) {
                                        resolve(result.data[0].doOperations[0].id);
                                    } else {
                                        reject(new Error(result.msg));
                                    }
                                } else {
                                    reject(new Error('添加截图块失败'));
                                }
                            },
                            onerror: reject
                        });
                    });

                    // 为截图块设置属性
                    await setBlockAttrs({
                        id: screenshotResult,
                        attrs: {
                            "custom-media": "tsscreenshot"
                        }
                    });

                    // 设置超级块属性
                    await setBlockAttrs({
                        id: superBlockId,
                        attrs: {
                            "layout": "row"
                        }
                    });

                    showNotification('已为现有时间戳添加截图');
                } catch (error) {
                    console.error('处理已有时间戳失败:', error);
                    showNotification('处理已有时间戳失败: ' + error.message);
                    return;
                }
            } else {
                // 创建新的超级块
                const superBlockResult = await new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method: 'POST',
                        url: `${config.API_ENDPOINT}/api/block/appendBlock`,
                        headers: {
                            'Authorization': `Token ${config.API_TOKEN}`,
                            'Content-Type': 'application/json'
                        },
                        data: JSON.stringify({
                            dataType: "markdown",
                            data: `{{{row
                                内容\n{: custom-media="temp" }\n
                                }}}\n{: custom-media="mediacard" }\n`,
                            parentID: matchingNoteId
                        }),
                        onload: function(response) {
                            if (response.status === 200) {
                                const result = JSON.parse(response.responseText);
                                if (result.code === 0) {
                                    resolve(result.data[0].doOperations[0].id);
                                } else {
                                    reject(new Error(result.msg));
                                }
                            } else {
                                reject(new Error('创建超级块失败'));
                            }
                        },
                        onerror: reject
                    });
                });

                // 添加时间戳块
                const timestampResult = await new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method: 'POST',
                        url: `${config.API_ENDPOINT}/api/block/appendBlock`,
                        headers: {
                            'Authorization': `Token ${config.API_TOKEN}`,
                            'Content-Type': 'application/json'
                        },
                        data: JSON.stringify({
                            dataType: "markdown",
                            data: markdownLink,
                            parentID: superBlockResult
                        }),
                        onload: async function(response) {
                            if (response.status === 200) {
                                const result = JSON.parse(response.responseText);
                                if (result.code === 0) {
                                    const newBlockId = result.data[0].doOperations[0].id;
                                    try {
                                        // 为时间戳块设置属性
                                        await setBlockAttrs({
                                            id: newBlockId,
                                            attrs: {
                                                "custom-media": "timestamp"
                                            }
                                        });
                                        resolve(newBlockId);
                                    } catch (error) {
                                        reject(error);
                                    }
                                } else {
                                    reject(new Error(result.msg));
                                }
                            } else {
                                reject(new Error('添加时间戳块失败'));
                            }
                        },
                        onerror: reject
                    });
                });

                // 添加截图块
                const screenshotResult = await new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method: 'POST',
                        url: `${config.API_ENDPOINT}/api/block/appendBlock`,
                        headers: {
                            'Authorization': `Token ${config.API_TOKEN}`,
                            'Content-Type': 'application/json'
                        },
                        data: JSON.stringify({
                            dataType: "markdown",
                            data: `![${timestamp}](${filePath})`,
                            parentID: superBlockResult
                        }),
                        onload: function(response) {
                            if (response.status === 200) {
                                const result = JSON.parse(response.responseText);
                                if (result.code === 0) {
                                    resolve(result.data[0].doOperations[0].id);
                                } else {
                                    reject(new Error(result.msg));
                                }
                            } else {
                                reject(new Error('添加截图块失败'));
                            }
                        },
                        onerror: reject
                    });
                });

                // 为截图块设置属性
                await setBlockAttrs({
                    id: screenshotResult,
                    attrs: {
                        "custom-media": "tsscreenshot"
                    }
                });

                // 设置超级块属性
                await setBlockAttrs({
                    id: superBlockResult,
                    attrs: {
                        "layout": "row"
                    }
                });

                showNotification('已添加时间戳和截图');
            }

            // 清理临时块
            await removeTemporaryBlocks();
            
            await updateTimestampList();
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
        } else if (currentUrl.includes('pan.baidu.com')) {
            // 百度网盘的时间戳处理
            const baseUrl = currentUrl.split('#')[0];
            return `${baseUrl}#t=${timeParam}`;
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

    // 添加为现有块添加属性的函数
    async function addAttributesToExistingBlocks(docId) {
        const config = getConfig();
        try {
            // 获取文档下的所有块
            const sql = `SELECT * FROM blocks WHERE root_id = '${docId}' AND type = 'p' ORDER BY created`;
            const blocks = await new Promise((resolve, reject) => {
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
                            if (result.code === 0) {
                                resolve(result.data);
                            } else {
                                reject(new Error(result.msg));
                            }
                        } else {
                            reject(new Error('查询失败'));
                        }
                    },
                    onerror: reject
                });
            });

            // 遍历所有块
            for (let i = 0; i < blocks.length; i++) {
                const block = blocks[i];
                const content = block.content;

                // 检查是否是时间戳块
                if (content.match(/\[\d{2}:\d{2}:\d{2}\.\d{3}\]/)) {
                    await setBlockAttrs({
                        id: block.id,
                        attrs: {
                            "custom-media": "timestamp"
                        }
                    });

                    // 检查下一个块是否是对应的截图
                    if (i + 1 < blocks.length && blocks[i + 1].content.startsWith('![')) {
                        await setBlockAttrs({
                            id: blocks[i + 1].id,
                            attrs: {
                                "custom-media": "tsScreenShot"
                            }
                        });
                    }
                }
            }
        } catch (error) {
            console.error('添加属性失败:', error);
            throw error;
        }
    }

    // 修改创建视频笔记函数
    async function createVideoNote() {
        try {
            const config = getConfig();
            const cleanedUrl = cleanUrl(window.location.href);
            
            // 检查当前网址是否在匹配列表中
            const isUrlMatched = config.MATCH_LIST.some(pattern => cleanedUrl.includes(pattern));
            if (!isUrlMatched) {
                showNotification('当前网址不在匹配列表中');
                return;
            }

            // 检查是否已存在对应笔记
            const matchingNoteId = await findMatchingVideoNote(cleanedUrl);
            if (matchingNoteId) {
                // 如果笔记已存在,为现有块添加属性
                try {
                    await addAttributesToExistingBlocks(matchingNoteId);
                    showNotification('已为现有时间戳添加属性');
                } catch (error) {
                    handleError(error, '添加属性');
                }
                return;
            }

            const title = document.title;
            // 创建一个安全的文件路径（只保留基本字符）
            const safePath = title.replace(/[^\w\s\u4e00-\u9fa5]/g, '_');
            
            // 创建笔记内容（保留原始标题）
            const content = `# ${title}\n\n> 视频链接：[${title}](${cleanedUrl})`;

            // 使用 retryApiCall 包装 API 调用
            const response = await retryApiCall(async () => {
                // 创建文档
                const docData = {
                    notebook: config.NOTEBOOK_ID,
                    path: `/视频笔记/${safePath}`,
                    markdown: content
                };

                return new Promise((resolve, reject) => {
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
            });

            // 设置文档属性
            await retryApiCall(async () => {
                const attrs = {
                    id: response,
                    attrs: {
                        "custom-type": "MediaNote",
                        "custom-mediaurl": cleanedUrl
                    }
                };

                return new Promise((resolve, reject) => {
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
            });

            // 更新配置中的目标文档ID
            configManager.save({
                ...config,
                TARGET_DOC_ID: response
            });

            showNotification('视频笔记创建成功');
            
            // 更新时间戳列表
            await debouncedUpdateTimestampList();
            
            // 更新创建按钮状态
            await updateCreateNoteButtonState();

        } catch (error) {
            handleError(error, '创建视频笔记');
        }
    }

    // 修改更新按钮状态的函数
    async function updateCreateNoteButtonState() {
        const createNoteBtn = document.querySelector('.timestamp-header-btn[title="创建视频笔记"]');
        if (!createNoteBtn) return;

        if (!document.querySelector('video')) {
            createNoteBtn.disabled = true;
            createNoteBtn.style.opacity = '0.5';
            createNoteBtn.title = '未找到视频';
            return;
        }

        try {
            const cleanedUrl = cleanUrl(window.location.href);
            const matchingNoteId = await findMatchingVideoNote(cleanedUrl);

            if (matchingNoteId) {
                createNoteBtn.disabled = true;
                createNoteBtn.style.opacity = '0.5';
                createNoteBtn.title = '已存在对应笔记';
            } else {
                createNoteBtn.disabled = false;
                createNoteBtn.style.opacity = '1';
                createNoteBtn.title = '创建视频笔记';
            }
        } catch (error) {
            console.error('检查现有笔记失败:', error);
            createNoteBtn.disabled = true;
            createNoteBtn.style.opacity = '0.5';
            createNoteBtn.title = '检查失败';
        }
    }

    // 初始检查按钮状态
    setTimeout(updateCreateNoteButtonState, 1000);

    // 定期检查更新按钮状态（每30秒）
    setInterval(updateCreateNoteButtonState, 30000);

    // 当URL变化时更新按钮状态
    let lastUrl = window.location.href;
    new MutationObserver(() => {
        if (lastUrl !== window.location.href) {
            lastUrl = window.location.href;
            setTimeout(updateCreateNoteButtonState, 1000);
        }
    }).observe(document, {subtree: true, childList: true});

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
                    
                    // 获取备注内容 - 在时间戳链接后的下一行
                    const lines = cleanBlock.split('\n');
                    const linkIndex = lines.findIndex(line => line.includes(fullMatch));
                    const note = linkIndex >= 0 && linkIndex < lines.length - 1 ? 
                                lines[linkIndex + 1].trim() : '';

                    timestamps.push({
                        text: cleanText,
                        url: normalizeUrl(href),
                        time: timeValue,
                        originalText: text,
                        note: note
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
            'bilibili.com', 'b23.tv',
            'pan.baidu.com'  // 添加百度网盘域名
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

            // 百度网盘处理
            if (urlObj.hostname.includes('pan.baidu.com')) {
                const timestamp = extractTime(url);
                // 保留原始URL，只修改时间戳部分
                const baseUrl = url.split('#')[0];
                return `${baseUrl}#t=${timestamp}`;
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
                
                // 创建左侧容器用于时间戳和备注
                const leftContainer = document.createElement('div');
                leftContainer.className = 'timestamp-left';
                
                // 创建时间戳文本元素
                const timestampText = document.createElement('div');
                timestampText.className = 'timestamp-text';
                timestampText.textContent = ts.text;
                leftContainer.appendChild(timestampText);
                
                // 创建备注容器
                const noteContainer = document.createElement('div');
                noteContainer.className = 'timestamp-note-container';
                
                // 创建备注文本/输入框
                const noteInput = document.createElement('input');
                noteInput.type = 'text';
                noteInput.className = 'timestamp-note-input';
                noteInput.value = ts.note || '';
                noteInput.placeholder = '添加备注...';
                
                // 添加输入框事件处理
                noteInput.addEventListener('change', async () => {
                    const newNote = noteInput.value.trim();
                    try {
                        if (newNote) {
                            // 获取时间戳块的ID
                            const timestampBlockId = await findTimestampBlockId(ts.url, matchingNoteId);
                            if (!timestampBlockId) {
                                throw new Error('未找到对应的时间戳块');
                            }

                            // 检查是否已存在备注块
                            const existingMemoBlockId = await findMemoBlock(timestampBlockId);
                            
                            if (existingMemoBlockId) {
                                // 更新现有备注块
                                await updateBlock({
                                    id: existingMemoBlockId,
                                    dataType: "markdown",
                                    data: newNote
                                });
                            } else {
                                // 创建新的超级块和备注块
                                await createMemoBlock(timestampBlockId, newNote);
                            }
                            
                            showNotification('备注已更新');
                            ts.note = newNote;
                        }
                    } catch (error) {
                        showNotification('更新备注失败：' + error.message);
                        noteInput.value = ts.note || '';
                    }
                });
                
                // 添加按键事件,按Enter保存
                noteInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        noteInput.blur(); // 触发change事件
                    }
                });
                
                noteContainer.appendChild(noteInput);
                leftContainer.appendChild(noteContainer);
                
                item.appendChild(leftContainer);

                // 添加点击事件跳转视频
                timestampText.addEventListener('click', () => {
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
    const timestampPanel = createTimestampListPanel(); // 保存对面板的引用

    // 初始化
    setTimeout(async () => {
        await updateTimestampList();
        addVideoTimeUpdateHandler();
    }, 1000);

    // 使用防抖优化频繁操作
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // 优化更新时间戳列表
    const debouncedUpdateTimestampList = debounce(updateTimestampList, 1000);

    // 优化视频时间更新处理
    function addVideoTimeUpdateHandler() {
        const video = document.querySelector('video');
        if (!video) return;

        const debouncedTimeUpdate = debounce(() => {
            const currentTime = Math.floor(video.currentTime);
            const items = document.querySelectorAll('.timestamp-item');
            items.forEach(item => {
                const itemTime = parseInt(item.dataset.time);
                if (Math.abs(itemTime - currentTime) <= 1) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
        }, 200);

        video.addEventListener('timeupdate', debouncedTimeUpdate);
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
        const config = getConfig();
        const cleanedUrl = cleanUrl(window.location.href);
        const isUrlMatched = config.MATCH_LIST.some(pattern => cleanedUrl.includes(pattern));
        
        const panel = document.createElement('div');
        panel.className = 'timestamp-list-panel';
        
        // 根据不同网站设置不同的挂载点和样式
        if (window.location.hostname.includes('bilibili.com')) {
            const playerContainer = document.querySelector('.bpx-player-container');
            if (playerContainer) {
                playerContainer.appendChild(panel);
                // 调整在播放器内的样式
                panel.style.position = 'absolute';
                panel.style.top = '50px';
                panel.style.right = '20px';
                panel.style.zIndex = '100';
            } else {
                document.body.appendChild(panel);
                panel.style.position = 'fixed';
                panel.style.top = '50%';
                panel.style.right = '20px';
            }
        } else {
            document.body.appendChild(panel);
            panel.style.position = 'fixed';
            panel.style.top = '50%';
            panel.style.right = '20px';
        }
        
        panel.style.display = isUrlMatched ? 'block' : 'none';

        const header = document.createElement('div');
        header.className = 'timestamp-list-header';

        const title = document.createElement('div');
        title.className = 'timestamp-list-title';
        title.textContent = '时间戳列表';

        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'timestamp-header-buttons';

        // 创建四个按钮
        const buttonConfigs = [
            {
                icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLXNldHRpbmdzIj48cGF0aCBkPSJNMTIuMjIgMmgtLjQ0YTIgMiAwIDAgMC0yIDJ2LjE4YTIgMiAwIDAgMS0xIDEuNzNsLS40My4yNWEyIDIgMCAwIDEtMiAwbC0uMTUtLjA4YTIgMiAwIDAgMC0yLjczLjczbC0uMjIuMzhhMiAyIDAgMCAwIC43MyAyLjczbC4xNS4xYTIgMiAwIDAgMSAxIDEuNzJ2LjUxYTIgMiAwIDAgMS0xIDEuNzRsLS4xNS4wOWEyIDIgMCAwIDAtLjczIDIuNzNsLjIyLjM4YTIgMiAwIDAgMCAyLjczLjczbC4xNS0uMDhhMiAyIDAgMCAxIDIgMGwuNDMuMjVhMiAyIDAgMCAxIDEgMS43M1YyMGEyIDIgMCAwIDAgMiAyaC40NGEyIDIgMCAwIDAgMi0ydi0uMThhMiAyIDAgMCAxIDEtMS43M2wuNDMtLjI1YTIgMiAwIDAgMSAyIDBsLjE1LjA4YTIgMiAwIDAgMCAyLjczLS43M2wuMjItLjM5YTIgMiAwIDAgMC0uNzMtMi43M2wtLjE1LS4wOGEyIDIgMCAwIDEtMS0xLjc0di0uNWEyIDIgMCAwIDEgMS0xLjc0bC4xNS0uMDlhMiAyIDAgMCAwIC43My0yLjczbC0uMjItLjM4YTIgMiAwIDAgMC0yLjczLS43M2wtLjE1LjA4YTIgMiAwIDAgMS0yIDBsLS40My0uMjVhMiAyIDAgMCAxLTEtMS43M1Y0YTIgMiAwIDAgMC0yLTJ6Ii8+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMyIvPjwvc3ZnPg==',
                title: '设置',
                onClick: showSettings
            },
            {
                icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWZpbGUtcGx1cyI+PHBhdGggZD0iTTE1IDJINmEyIDIgMCAwIDAtMiAydjE2YTIgMiAwIDAgMCAyIDJoMTJhMiAyIDAgMCAwIDItMlY3WiIvPjxwYXRoIGQ9Ik0xNCAydjRhMiAyIDAgMCAwIDIgMmg0Ii8+PHBhdGggZD0iTTkgMTVoNiIvPjxwYXRoIGQ9Ik0xMiAxOHYtNiIvPjwvc3ZnPg==',
                title: '创建视频笔记',
                onClick: createVideoNote
            },
            {
                icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWdvYWwiPjxwYXRoIGQ9Ik0xMiAxM1YybDggNC04IDQiLz48cGF0aCBkPSJNMjAuNTYxIDEwLjIyMmE5IDkgMCAxIDEtMTIuNTUtNS4yOSIvPjxwYXRoIGQ9Ik04LjAwMiA5Ljk5N2E1IDUgMCAxIDAgOC45IDIuMDIiLz48L3N2Zz4=',
                title: '获取时间戳',
                onClick: getVideoTimestamp
            },
            {
                icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWNhbWVyYSI+PHBhdGggZD0iTTE0LjUgNGgtNUw3IDdINGEyIDIgMCAwIDAtMiAydjlhMiAyIDAgMCAwIDIgMmgxNmEyIDIgMCAwIDAgMi0yVjlhMiAyIDAgMCAwLTItMmgtM2wtMi41LTN6Ii8+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMyIgcj0iMyIvPjwvc3ZnPg==',
                title: '获取时间戳+截图',
                onClick: getVideoScreenshot
            }
        ];

        buttonConfigs.forEach(config => {
            const button = document.createElement('button');
            button.className = 'timestamp-header-btn';
            button.title = config.title;
            button.onclick = config.onClick;

            const img = document.createElement('img');
            img.src = config.icon;
            img.alt = config.title;

            button.appendChild(img);
            buttonsContainer.appendChild(button);
        });

        header.appendChild(title);
        header.appendChild(buttonsContainer);

        const list = document.createElement('div');
        list.id = 'timestamp-list';

        panel.appendChild(header);
        panel.appendChild(list);

        document.body.appendChild(panel);
        makeDraggable(panel);

        // 添加监听器以处理播放器容器的变化（针对B站）
        if (window.location.hostname.includes('bilibili.com')) {
            const observer = new MutationObserver(() => {
                const playerContainer = document.querySelector('.bpx-player-container');
                if (playerContainer && !playerContainer.contains(panel)) {
                    playerContainer.appendChild(panel);
                    panel.style.position = 'absolute';
                    panel.style.top = '50px';
                    panel.style.right = '20px';
                    panel.style.zIndex = '100';
                }
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }

        return panel;
    }

    // 将 hotkeyHandler 定义在全局作用域
    let hotkeyHandler;

    // 修改 setupHotkeys 函数
    function setupHotkeys() {
        const config = configManager.get();

        // 定义 hotkeyHandler
        hotkeyHandler = function(e) {
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
                e.stopPropagation();
                
                // 防止重复触发
                if (e.repeat) return;
                
                // 添加防抖机制
                if (window.__lastHotkeyPress && Date.now() - window.__lastHotkeyPress < 500) {
                    return;
                }
                window.__lastHotkeyPress = Date.now();

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
        };

        // 确保只添加一次事件监听器
        if (!window.__hotkeyHandlerAdded) {
            document.removeEventListener('keydown', hotkeyHandler);
            document.addEventListener('keydown', hotkeyHandler);
            window.__hotkeyHandlerAdded = true;
        }
    }

    // 添加事件监听设置函数
    function setupEventListeners(panel) {
        // 设置快捷键事件监听
        const hotkeyInputs = ['create-note-hotkey', 'timestamp-hotkey', 'screenshot-hotkey'];
        hotkeyInputs.forEach(id => {
            const input = panel.querySelector(`#${id}`);
            if (!input) return;

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
                input.value = keys.join('+');
            });
        });

        // 绑定保存按钮事件
        const saveBtn = panel.querySelector('#save-settings');
        if (saveBtn) {
            saveBtn.onclick = function() {
                const selectedNotebook = panel.querySelector('#notebook-select');
                const matchInputs = panel.querySelectorAll('.match-input');
                
                if (!selectedNotebook.value) {
                    showNotification('请选择一个笔记本');
                    return;
                }

                const notebookOption = selectedNotebook.selectedOptions[0];
                const newConfig = {
                    API_ENDPOINT: panel.querySelector('#api-endpoint').value,
                    API_TOKEN: panel.querySelector('#api-token').value,
                    NOTEBOOK_ID: selectedNotebook.value,
                    NOTEBOOK_NAME: notebookOption.textContent,
                    CREATE_NOTE_HOTKEY: panel.querySelector('#create-note-hotkey').value,
                    TIMESTAMP_HOTKEY: panel.querySelector('#timestamp-hotkey').value,
                    SCREENSHOT_HOTKEY: panel.querySelector('#screenshot-hotkey').value,
                    MATCH_LIST: Array.from(matchInputs)
                        .map(input => input.value.trim())
                        .filter(value => value !== '')
                };

                if (!newConfig.API_TOKEN) {
                    showNotification('请输入 API Token');
                    return;
                }

                configManager.save(newConfig);
                setupHotkeys();
                showNotification('设置已保存');
                panel.remove();
            };
        }

        // 绑定取消按钮事件
        const cancelBtn = panel.querySelector('#cancel-settings');
        if (cancelBtn) {
            cancelBtn.onclick = function() {
                panel.remove();
            };
        }

        // 为匹配规则添加按钮绑定事件
        const addMatchBtn = panel.querySelector('.add-match-btn');
        if (addMatchBtn) {
            addMatchBtn.onclick = () => {
                const matchList = panel.querySelector('#match-list');
                const matchItem = createMatchItem('');
                matchList.appendChild(matchItem);
            };
        }
    }

    // 初始化时设置快捷键
    setupHotkeys();

    // 添加辅助函数
    async function findTimestampBlockId(url, docId) {
        const sql = `SELECT id FROM blocks 
                     WHERE root_id = '${docId}' 
                     AND content LIKE '%${url}%'
                     AND type = 'p'
                     AND id IN (
                         SELECT block_id FROM attributes 
                         WHERE name = 'custom-media' 
                         AND value = 'timestamp'
                     )`;
        
        const result = await query(sql);
        return result.length > 0 ? result[0].id : null;
    }

    async function findMemoBlock(parentId) {
        const sql = `SELECT id FROM blocks 
                     WHERE parent_id = '${parentId}'
                     AND type = 'p'
                     AND id IN (
                         SELECT block_id FROM attributes 
                         WHERE name = 'custom-media' 
                         AND value = 'memos'
                     )`;
        
        const result = await query(sql);
        return result.length > 0 ? result[0].id : null;
    }

    // 添加 SQL 查询函数
    async function query(sql) {
        const config = getConfig();
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
                        if (result.code === 0) {
                            resolve(result.data);
                        } else {
                            reject(new Error(result.msg));
                        }
                    } else {
                        reject(new Error('查询失败'));
                    }
                },
                onerror: reject
            });
        });
    }

    // 添加设置块属性的函数
    async function setBlockAttrs(params) {
        const config = getConfig();
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'POST',
                url: `${config.API_ENDPOINT}/api/attr/setBlockAttrs`,
                headers: {
                    'Authorization': `Token ${config.API_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                data: JSON.stringify(params),
                onload: function(response) {
                    if (response.status === 200) {
                        const result = JSON.parse(response.responseText);
                        if (result.code === 0) {
                            resolve(result.data);
                        } else {
                            reject(new Error(result.msg));
                        }
                    } else {
                        reject(new Error('设置属性失败'));
                    }
                },
                onerror: reject
            });
        });
    }

    // 添加查找和删除临时块的函数
    async function removeTemporaryBlocks() {
        const config = getConfig();
        try {
            // 1. 先用SQL查询找到所有带有临时标记的块
            const result = await new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'POST',
                    url: `${config.API_ENDPOINT}/api/query/sql`,
                    headers: {
                        'Authorization': `Token ${config.API_TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    data: JSON.stringify({
                        stmt: "SELECT id FROM blocks WHERE id IN (SELECT block_id FROM attributes WHERE name = 'custom-media' AND value = 'temp')"
                    }),
                    onload: function(response) {
                        if (response.status === 200) {
                            const result = JSON.parse(response.responseText);
                            if (result.code === 0) {
                                resolve(result.data);
                            } else {
                                reject(new Error(result.msg));
                            }
                        } else {
                            reject(new Error('查询临时块失败'));
                        }
                    },
                    onerror: reject
                });
            });

            // 2. 删除找到的所有临时块
            for (const block of result) {
                await new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method: 'POST',
                        url: `${config.API_ENDPOINT}/api/block/deleteBlock`,
                        headers: {
                            'Authorization': `Token ${config.API_TOKEN}`,
                            'Content-Type': 'application/json'
                        },
                        data: JSON.stringify({
                            id: block.id
                        }),
                        onload: function(response) {
                            if (response.status === 200) {
                                const result = JSON.parse(response.responseText);
                                if (result.code === 0) {
                                    resolve();
                                } else {
                                    reject(new Error(result.msg));
                                }
                            } else {
                                reject(new Error('删除临时块失败'));
                            }
                        },
                        onerror: reject
                    });
                });
            }

            console.log('临时块清理完成');
        } catch (error) {
            console.error('清理临时块失败:', error);
            throw error;
        }
    }

    // 添加更新块内容的函数
    async function updateBlock(params) {
        const config = getConfig();
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'POST',
                url: `${config.API_ENDPOINT}/api/block/updateBlock`,
                headers: {
                    'Authorization': `Token ${config.API_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                data: JSON.stringify(params),
                onload: function(response) {
                    if (response.status === 200) {
                        const result = JSON.parse(response.responseText);
                        if (result.code === 0) {
                            resolve(result.data);
                        } else {
                            reject(new Error(result.msg));
                        }
                    } else {
                        reject(new Error('更新块失败'));
                    }
                },
                onerror: reject
            });
        });
    }

    // 添加统一的错误处理函数
    function handleError(error, operation) {
        console.error(`${operation} 失败:`, error);
        showNotification(`${operation}失败: ${error.message}`);
        throw error;
    }

    // 添加资源清理函数
    function cleanup() {
        // 清除所有事件监听器
        document.removeEventListener('keydown', hotkeyHandler);
        
        // 清除定时器
        clearInterval(window.__timestampUpdateInterval);
        
        // 清除缓存
        cache.clearCache();
        
        // 移除面板
        const panel = document.querySelector('.timestamp-list-panel');
        if (panel) {
            panel.remove();
        }
    }

    // 在页面卸载时清理资源
    window.addEventListener('unload', cleanup);

    // 修改 createOrGetSuperBlock 函数，将 config 作为参数传入
    async function createOrGetSuperBlock(blockId) {
        const config = getConfig(); // 在函数开始时获取配置
        try {
            // 1. 检查是否已存在 mediacard 父块
            const existingMediaCardId = await getParentMediaCard(blockId);
            if (existingMediaCardId) {
                return existingMediaCardId;
            }

            // 2. 如果不存在，创建新的超级块
            const superBlockId = await new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'POST',
                    url: `${config.API_ENDPOINT}/api/block/insertBlock`,
                    headers: {
                        'Authorization': `Token ${config.API_TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    data: JSON.stringify({
                        dataType: "markdown",
                        data: `{{{row
                            内容\n{: custom-media="temp" }\n
                            }}}\n{: custom-media="mediacard" }\n`,
                        previousID: blockId
                    }),
                    onload: function(response) {
                        if (response.status === 200) {
                            const result = JSON.parse(response.responseText);
                            if (result.code === 0) {
                                resolve(result.data[0].doOperations[0].id);
                            } else {
                                reject(new Error(result.msg));
                            }
                        } else {
                            reject(new Error('创建超级块失败'));
                        }
                    },
                    onerror: reject
                });
            });

            // 3. 移动原始块到超级块内
            await new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'POST',
                    url: `${config.API_ENDPOINT}/api/block/moveBlock`,
                    headers: {
                        'Authorization': `Token ${config.API_TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    data: JSON.stringify({
                        id: blockId,
                        parentID: superBlockId
                    }),
                    onload: function(response) {
                        if (response.status === 200) {
                            const result = JSON.parse(response.responseText);
                            if (result.code === 0) {
                                resolve();
                            } else {
                                reject(new Error(result.msg));
                            }
                        } else {
                            reject(new Error('移动块失败'));
                        }
                    },
                    onerror: reject
                });
            });

            // 4. 设置超级块属性
            await setBlockAttrs({
                id: superBlockId,
                attrs: {
                    "layout": "row"
                }
            });

            return superBlockId;
        } catch (error) {
            console.error('创建或获取超级块失败:', error);
            throw error;
        }
    }
})();
