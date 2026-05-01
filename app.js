// 应用状态
let appState = {
    directoryHandle: null, // 存储用户选择的目录句柄
    rootDirectoryHandle: null, // 存储程序根目录句柄
    goals: [],
    // 六六的打卡数据
    liuliu: {
        plans: [
            {
                id: '1',
                name: '每日运动',
                content: '蹲起、仰卧起坐、平板撑、深蹲、燕儿飞、单杠',
                dailyDiamond: 5,
                streakRewards: { 3: 10, 7: 20, 15: 50, 30: 100 }
            },
            {
                id: '2',
                name: '整理日用品',
                content: '书桌、书包',
                dailyDiamond: 5,
                streakRewards: { 3: 10, 7: 20, 15: 50, 30: 100 }
            },
            {
                id: '3',
                name: '平板使用记录',
                content: '周一到周四不玩平板',
                dailyDiamond: 10,
                streakRewards: { 3: 10, 7: 20, 15: 50, 30: 100 }
            },
            {
                id: '4',
                name: '电视使用记录',
                content: '周一到周四最多30分钟',
                dailyDiamond: 10,
                streakRewards: { 3: 10, 7: 20, 15: 50, 30: 100 }
            },
            {
                id: '5',
                name: '零花钱使用记录',
                content: '不乱买没用的东西',
                dailyDiamond: 10,
                streakRewards: { 3: 10, 7: 20, 15: 50, 30: 100 }
            }
        ],
        checkins: {},
        streaks: {}
    },
    // 爸爸妈妈的打卡数据
    parents: {
        plans: [
            {
                id: 'p1',
                name: '早起',
                content: '早上7点前起床',
                dailyDiamond: 5,
                streakRewards: { 3: 10, 7: 20, 15: 30, 30: 50 }
            },
            {
                id: 'p2',
                name: '阅读',
                content: '每日阅读30分钟',
                dailyDiamond: 5,
                streakRewards: { 3: 10, 7: 20, 15: 30, 30: 50 }
            },
            {
                id: 'p3',
                name: '运动',
                content: '每日运动30分钟',
                dailyDiamond: 5,
                streakRewards: { 3: 10, 7: 20, 15: 30, 30: 50 }
            }
        ],
        checkins: {},
        streaks: {}
    },
    // 共享数据
    diamonds: 0,
    money: 0,
    exchangeHistory: [],
    settings: {
        checkinCost: 30,
        lastSync: new Date().toISOString(),
        pendingSync: 0
    },
    offlineQueue: [],
    extraRewards: [],
    historyRecords: []
};

// 当前激活的打卡视图
let currentCheckinView = 'liuliu';

// 全局变量：跟踪同步状态
let isSyncing = false;

// 数据迁移：将旧版本数据转换为新版本
function migrateData(data) {
    console.log('migrateData 输入数据键:', Object.keys(data));

    // 如果是旧版数据结构（有 plans 但没有 liuliu），进行迁移
    if (data.plans && !data.liuliu) {
        console.log('检测到旧版数据，开始迁移...');

        const newData = {
            // 迁移六六的数据（原有数据）
            liuliu: {
                plans: data.plans || [],
                checkins: data.checkins || {},
                streaks: data.streaks || {}
            },
            // 初始化爸爸妈妈的数据
            parents: {
                plans: [
                    { id: 'p1', name: '早起', content: '早上7点前起床', dailyDiamond: 5, streakRewards: { 3: 10, 7: 20, 15: 30, 30: 50 } },
                    { id: 'p2', name: '阅读', content: '每日阅读30分钟', dailyDiamond: 5, streakRewards: { 3: 10, 7: 20, 15: 30, 30: 50 } },
                    { id: 'p3', name: '运动', content: '每日运动30分钟', dailyDiamond: 5, streakRewards: { 3: 10, 7: 20, 15: 30, 30: 50 } }
                ],
                checkins: {},
                streaks: {}
            },
            // 保留其他字段
            goals: data.goals || [],
            diamonds: data.diamonds || 0,
            money: data.money || 0,
            exchangeHistory: data.exchangeHistory || [],
            settings: data.settings || { checkinCost: 30, lastSync: new Date().toISOString(), pendingSync: 0 },
            offlineQueue: data.offlineQueue || [],
            extraRewards: data.extraRewards || [],
            historyRecords: data.historyRecords || []
        };

        console.log('数据迁移完成');
        return newData;
    }

    // 如果是新版数据但缺少 parents，初始化默认值
    if (data.liuliu && !data.parents) {
        console.log('检测到新版数据但缺少 parents，初始化默认值...');
        data.parents = {
            plans: [
                { id: 'p1', name: '早起', content: '早上7点前起床', dailyDiamond: 5, streakRewards: { 3: 10, 7: 20, 15: 30, 30: 50 } },
                { id: 'p2', name: '阅读', content: '每日阅读30分钟', dailyDiamond: 5, streakRewards: { 3: 10, 7: 20, 15: 30, 30: 50 } },
                { id: 'p3', name: '运动', content: '每日运动30分钟', dailyDiamond: 5, streakRewards: { 3: 10, 7: 20, 15: 30, 30: 50 } }
            ],
            checkins: {},
            streaks: {}
        };
    }

    console.log('migrateData 输出数据键:', Object.keys(data));
    return data;
}



// IndexedDB 数据库
let db;

// 初始化IndexedDB
function initIndexedDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('DailyCheckinDB', 1);
        
        request.onerror = () => {
            console.error('IndexedDB初始化失败');
            reject('IndexedDB初始化失败');
        };
        
        request.onsuccess = () => {
            db = request.result;
            resolve();
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // 创建存储对象
            if (!db.objectStoreNames.contains('settings')) {
                db.createObjectStore('settings', { keyPath: 'key' });
            }
            
            if (!db.objectStoreNames.contains('data')) {
                db.createObjectStore('data', { keyPath: 'id' });
            }
        };
    });
}

// 保存到IndexedDB
function saveToIndexedDB(storeName, data) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(data);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject('保存失败');
    });
}

// 从IndexedDB加载
function loadFromIndexedDB(storeName, key) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(key);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject('加载失败');
    });
}

// 自动加载最新的JSON文件
async function autoLoadLatestJsonFile() {
    try {
        console.log('=== 开始自动加载JSON文件 ===');
        
        // 检查是否支持File System Access API
        if (!window.showDirectoryPicker) {
            console.log('浏览器不支持File System Access API，跳过自动加载');
            return;
        }
        
        // 尝试获取根目录句柄
        let rootHandle;
        try {
            // 弹出授权对话框让用户选择目录
            console.log('正在请求目录访问权限...');
            rootHandle = await window.showDirectoryPicker({
                mode: 'read',
                startIn: 'documents'
            });
            console.log('获取根目录句柄成功:', rootHandle.name);
            appState.rootDirectoryHandle = rootHandle;
        } catch (error) {
            console.log('获取根目录失败或用户取消:', error.message);
            return;
        }
        
        // 扫描目录中的JSON文件
        console.log('正在扫描目录中的JSON文件...');
        const jsonFiles = [];
        for await (const entry of rootHandle.values()) {
            console.log('发现文件:', entry.name, '类型:', entry.kind);
            if (entry.kind === 'file' && entry.name.endsWith('.json')) {
                // 检查文件名是否为日期格式 YYYY-MM-DD.json
                const dateMatch = entry.name.match(/^(\d{4}-\d{2}-\d{2})\.json$/);
                if (dateMatch) {
                    const dateStr = dateMatch[1];
                    const date = new Date(dateStr);
                    if (!isNaN(date.getTime())) {
                        jsonFiles.push({
                            name: entry.name,
                            date: date,
                            handle: entry
                        });
                        console.log('添加日期格式的JSON文件:', entry.name);
                    }
                }
            }
        }
        
        console.log('共找到', jsonFiles.length, '个日期格式的JSON文件');
        
        // 按日期排序，找到最新的文件
        if (jsonFiles.length > 0) {
            jsonFiles.sort((a, b) => b.date - a.date);
            const latestFile = jsonFiles[0];
            
            console.log('找到最新的JSON文件:', latestFile.name, '日期:', latestFile.date);
            
            // 读取文件内容
            console.log('正在读取文件内容...');
            const file = await latestFile.handle.getFile();
            const content = await file.text();
            
            // 解析JSON数据
            try {
                let data = JSON.parse(content);
                // 加载数据到应用状态
                if (data) {
                    // 数据迁移
                    data = migrateData(data);

                    // 加载迁移后的数据
                    if (data.liuliu) {
                        appState.liuliu = data.liuliu;
                        appState.parents = data.parents;
                    }
                    appState.goals = data.goals || [];
                    appState.diamonds = data.diamonds || 0;
                    appState.money = data.money || 0;
                    appState.exchangeHistory = data.exchangeHistory || [];
                    appState.settings = { ...appState.settings, ...data.settings };
                    appState.extraRewards = data.extraRewards || [];
                    appState.historyRecords = data.historyRecords || [];

                    // 处理储蓄数据（使用 transactions 字段名）
                    if (data.transactions && Array.isArray(data.transactions)) {
                        console.log('自动加载: 找到 transactions 字段，记录数:', data.transactions.length);
                        localStorage.setItem('piggyBankTransactions', JSON.stringify(data.transactions));
                        localStorage.setItem('piggyBankNeedsReload', 'true');
                        console.log('自动加载: 储蓄数据已保存');
                    }
                    
                    console.log('成功加载最新JSON文件:', latestFile.name);
                    
                    // 更新UI
                    updateUI();
                    console.log('UI已更新');
                }
            } catch (parseError) {
                console.error('解析JSON文件失败:', parseError.message);
            }
        } else {
            console.log('未找到日期格式的JSON文件');
        }
        
        console.log('=== 自动加载JSON文件完成 ===');
    } catch (error) {
        console.error('自动加载JSON文件失败:', error.message);
    }
}

// 切换打卡视图
function switchCheckinView(view) {
    currentCheckinView = view;

    // 更新导航按钮状态
    document.querySelectorAll('.checkin-nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById('nav' + view.charAt(0).toUpperCase() + view.slice(1)).classList.add('active');

    // 切换视图显示
    document.querySelectorAll('.checkin-view').forEach(v => {
        v.classList.remove('active');
    });
    document.getElementById('view' + view.charAt(0).toUpperCase() + view.slice(1)).classList.add('active');
}

// 初始化应用
async function initApp() {
    // 显示加载提示
    const loadingHint = document.getElementById('loadingHint');
    const loadingText = document.getElementById('loadingText');
    if (loadingHint) loadingHint.style.display = 'flex';
    
    try {
        await initIndexedDB();
        if (loadingText) loadingText.textContent = '正在加载本地数据...';
        
        // 加载本地数据
        await loadFromLocalStorage();
        
        // 跳过自动加载，改为手动触发
        // await autoLoadLatestJsonFile();
        
        // 跳过上次导入文件的检查，避免显示不必要的对话框
        
        // 显示用户引导提示
        setTimeout(() => {
            if (localStorage.getItem('firstTime') !== 'true') {
                alert('欢迎使用日常打卡小工具！\n\n首次使用请点击"设置" -> "加载最新数据"按钮来加载您的JSON数据文件。\n\n之后每次打开应用时，您可以通过同样的方式加载最新数据。');
                localStorage.setItem('firstTime', 'true');
            }
        }, 1000);
        
        // 直接显示应用
        document.getElementById('app').classList.remove('hidden');
        updateUI();
        
        bindEvents();
    } catch (error) {
        console.error('初始化失败:', error);
        // 即使出错也要显示应用
        document.getElementById('app').classList.remove('hidden');
        updateUI();
        bindEvents();
    } finally {
        // 隐藏加载提示
        if (loadingHint) loadingHint.style.display = 'none';
    }
}

// 显示应用
function showApp() {
    document.getElementById('app').classList.remove('hidden');
    updateUI();
}

// 绑定事件
function bindEvents() {
    // 底部导航
    document.querySelectorAll('.nav-item').forEach(navItem => {
        navItem.addEventListener('click', function() {
            // 移除所有导航项的活动状态
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
            });
            // 添加当前导航项的活动状态
            this.classList.add('active');
        });
    });
    
    // 网络状态监听
    window.addEventListener('online', () => {
        processOfflineQueue();
    });
}

// 保存补卡设置
function updateMakeupCost(cost) {
    const newCost = parseInt(cost);
    if (!isNaN(newCost) && newCost >= 0) {
        appState.settings.checkinCost = newCost;
        saveData();
    }
}

// 导出数据
async function exportData() {
    // 计算所有计划的连续天数
    calculateAllStreaks();

    const data = {
        // 新的数据结构
        liuliu: appState.liuliu,
        parents: appState.parents,
        // 共享数据
        goals: appState.goals,
        diamonds: appState.diamonds,
        exchangeHistory: appState.exchangeHistory,
        settings: appState.settings,
        extraRewards: appState.extraRewards,
        historyRecords: appState.historyRecords,
        // 储蓄数据，使用 transactions 与储蓄模块内部变量名一致
        transactions: (typeof transactions !== 'undefined') ? transactions : []
    };
    
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const fileName = `${year}-${month}-${day}.json`;
    
    // 检查浏览器是否支持File System Access API
    if (window.showSaveFilePicker && window.showDirectoryPicker) {
        try {
            // 尝试获取backup文件夹的目录句柄
            let directoryHandle = appState.directoryHandle;
            
            // 如果没有已记忆的目录句柄，让用户选择
            if (!directoryHandle) {
                try {
                    // 首先尝试使用showDirectoryPicker让用户选择backup文件夹
                    directoryHandle = await window.showDirectoryPicker({
                        mode: 'readwrite',
                        startIn: 'documents' // 从文档目录开始
                    });
                    // 验证是否是backup文件夹
                    if (directoryHandle.name !== 'backup') {
                        // 如果不是backup文件夹，让用户确认
                        if (!confirm('您选择的不是backup文件夹，是否继续保存？')) {
                            return;
                        }
                    }
                    // 保存目录句柄到appState
                    appState.directoryHandle = directoryHandle;
                } catch (dirError) {
                    // 用户取消选择目录，使用普通的文件保存对话框
                    console.log('用户取消选择目录，使用普通文件保存对话框');
                    throw dirError;
                }
            }
            
            // 在backup文件夹中创建或覆盖文件
            let fileHandle;
            try {
                // 尝试获取现有文件
                fileHandle = await directoryHandle.getFileHandle(fileName);
                console.log('文件已存在，准备覆盖:', fileName);
            } catch (e) {
                // 文件不存在，创建新文件
                fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
                console.log('创建新文件:', fileName);
            }
            
            // 写入文件
            const writable = await fileHandle.createWritable({ keepExistingData: false });
            await writable.write(blob);
            await writable.close();
            
            console.log('文件保存成功到backup文件夹:', fileName);
            alert('文件导出成功！');
        } catch (error) {
            // 检查是否是用户取消
            if (error.name === 'AbortError') {
                console.log('用户取消了文件保存');
                // 用户取消，不执行任何操作
                return;
            }
            
            // 检查是否是目录句柄无效的错误
            if (error.name === 'InvalidStateError' || error.name === 'NotAllowedError') {
                console.log('目录句柄无效或权限错误，重置目录选择:', error.message);
                // 重置目录句柄
                appState.directoryHandle = null;
                // 提示用户重新选择目录
                alert('保存位置权限已失效，请重新选择保存位置');
                // 重新执行导出流程
                exportData();
                return;
            }
            
            // 其他错误，使用普通的文件保存对话框
            console.log('使用普通文件保存对话框:', error.message);
            try {
                // 配置文件保存选项
                const options = {
                    suggestedName: fileName,
                    types: [
                        {
                            description: 'JSON文件',
                            accept: {
                                'application/json': ['.json']
                            }
                        }
                    ]
                };
                
                // 弹出文件保存对话框
                const handle = await window.showSaveFilePicker(options);
                
                // 写入文件
                const writable = await handle.createWritable({ keepExistingData: false });
                await writable.write(blob);
                await writable.close();
                
                console.log('文件保存成功:', handle.name);
                alert('文件导出成功！');
            } catch (pickerError) {
                if (pickerError.name === 'AbortError') {
                    console.log('用户取消了文件保存');
                    return;
                }
                // 最终回退到原有下载方式
                console.log('文件保存失败，使用回退方案:', pickerError.message);
                useFallbackDownload(blob, fileName);
                alert('文件导出成功！');
            }
        }
    } else {
        // 浏览器不支持File System Access API，使用回退方案
        useFallbackDownload(blob, fileName);
        alert('文件导出成功！');
    }
}

// 回退下载方案
function useFallbackDownload(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// 重置文件夹选择
function resetDirectoryHandle() {
    appState.directoryHandle = null;
    console.log('文件夹选择已重置');
    alert('文件夹选择已重置，下次导出时会重新弹出文件夹选择对话框');
}



// 导入数据
function importData(input) {
    const file = input.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            let data = JSON.parse(event.target.result);

            // 排除可能的 id 字段（来自 IndexedDB 的数据结构）
            if (data.id) {
                console.log('importData: 排除 id 字段:', data.id);
                const { id, ...cleanData } = data;
                data = cleanData;
            }

            // 验证数据结构
            if (typeof data === 'object') {
                // 数据迁移：将旧版数据转换为新版结构
                data = migrateData(data);
                console.log('迁移后的数据键:', Object.keys(data));

                // 加载打卡数据（六六和爸爸妈妈）
                if (data.liuliu) {
                    appState.liuliu = JSON.parse(JSON.stringify(data.liuliu)); // 深拷贝避免引用问题
                    console.log('六六打卡数据已加载，plans数量:', appState.liuliu.plans.length);
                    console.log('六六打卡数据已加载，checkins日期数:', Object.keys(appState.liuliu.checkins).length);
                }
                if (data.parents) {
                    appState.parents = JSON.parse(JSON.stringify(data.parents)); // 深拷贝避免引用问题
                    console.log('爸爸妈妈打卡数据已加载，plans数量:', appState.parents.plans.length);
                } else {
                    // 如果缺少 parents 数据，初始化默认值
                    appState.parents = {
                        plans: [
                            { id: 'p1', name: '早起', content: '早上7点前起床', dailyDiamond: 5, streakRewards: { 3: 10, 7: 20, 15: 30, 30: 50 } },
                            { id: 'p2', name: '阅读', content: '每日阅读30分钟', dailyDiamond: 5, streakRewards: { 3: 10, 7: 20, 15: 30, 30: 50 } },
                            { id: 'p3', name: '运动', content: '每日运动30分钟', dailyDiamond: 5, streakRewards: { 3: 10, 7: 20, 15: 30, 30: 50 } }
                        ],
                        checkins: {},
                        streaks: {}
                    };
                    console.log('爸爸妈妈数据已初始化默认值');
                }

                appState.goals = data.goals || [];
                appState.diamonds = data.diamonds || 0;
                appState.money = data.money || 0;
                appState.exchangeHistory = data.exchangeHistory || [];
                appState.settings = { ...appState.settings, ...data.settings };
                appState.extraRewards = data.extraRewards || [];
                appState.historyRecords = data.historyRecords || [];

                // 导入储蓄数据（使用 transactions 字段名与储蓄模块内部一致）
                console.log('=== 开始导入储蓄数据 ===');
                console.log('data 对象键:', Object.keys(data));
                
                // 获取储蓄交易记录
                if (data.transactions && Array.isArray(data.transactions)) {
                    console.log('找到 transactions 字段，记录数:', data.transactions.length);

                    // 保存到 localStorage
                    localStorage.setItem('piggyBankTransactions', JSON.stringify(data.transactions));
                    console.log('储蓄数据已保存到 localStorage');

                    // 尝试直接写入 IndexedDB
                    console.log('window.piggyBankDb 状态:', typeof window.piggyBankDb);
                    if (typeof window.piggyBankDb !== 'undefined') {
                        try {
                            await window.piggyBankDb.transactions.clear();
                            if (data.transactions.length > 0) {
                                await window.piggyBankDb.transactions.bulkAdd(data.transactions);
                                console.log('储蓄数据已直接写入 IndexedDB');
                            }
                        } catch (e) {
                            console.error('写入储蓄数据到 IndexedDB 失败:', e);
                        }
                    } else {
                        console.warn('window.piggyBankDb 未定义，跳过 IndexedDB 写入');
                    }

                    // 设置标志位，通知储蓄模块需要重新加载
                    localStorage.setItem('piggyBankNeedsReload', 'true');
                } else {
                    console.log('未找到储蓄数据字段');
                }

                console.log('准备保存数据...');
                await saveData();
                console.log('数据已保存到 IndexedDB');

                console.log('准备更新UI...');
                updateUI();
                // 强制刷新打卡列表
                updateCheckinList('liuliu');
                updateCheckinList('parents');
                console.log('UI已更新');

                // 方法3: 尝试调用储蓄模块的加载函数
                console.log('window.loadSavingsData 状态:', typeof window.loadSavingsData);
                if (typeof window.loadSavingsData === 'function') {
                    console.log('调用 loadSavingsData...');
                    await window.loadSavingsData();
                } else {
                    console.warn('window.loadSavingsData 未定义');
                }

                alert('导入成功');
                
                // 记录导入的文件信息到localStorage
                const importInfo = {
                    fileName: file.name,
                    importTime: new Date().toISOString(),
                    fileSize: file.size
                };
                localStorage.setItem('lastImportedFile', JSON.stringify(importInfo));
            } else {
                alert('无效的JSON文件');
            }
        } catch (error) {
            alert('导入失败: ' + error.message);
        } finally {
            // 重置input元素的值，确保下次选择相同文件时能触发onchange事件
            input.value = '';
        }
    };
    reader.readAsText(file);
}

// 保存Token
async function saveToken() {
    const token = document.getElementById('githubToken').value.trim();
    if (!token) {
        alert('请输入GitHub Token');
        return;
    }
    
    try {
        // 验证Token
        const userResponse = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (!userResponse.ok) {
            throw new Error('Token无效');
        }
        
        const user = await userResponse.json();
        appState.token = token;
        appState.user = user;
        
        // 保存到IndexedDB
        await saveToIndexedDB('settings', { key: 'githubToken', value: token });
        
        // 查找或创建Gist
        await setupGist();
        
        showApp();
        await loadData();
        closeModal('settingsModal');
    } catch (error) {
        alert('连接失败: ' + error.message);
    }
}

// 关闭模态框
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

// 显示设置
function showSettings() {
    const settingsModal = document.getElementById('settingsModal');
    const githubTokenInput = document.getElementById('githubToken');
    const makeupCostInput = document.getElementById('makeupCost');
    
    if (appState.token) {
        githubTokenInput.value = appState.token;
    }
    
    makeupCostInput.value = appState.settings.checkinCost;
    settingsModal.classList.add('active');
}

// 显示计划管理（默认管理六六的计划）
function showPlans(user = 'liuliu') {
    const plansModal = document.getElementById('plansModal');
    const plansEditor = document.getElementById('plansEditor');

    plansEditor.innerHTML = '';

    const userData = appState[user];
    userData.plans.forEach(plan => {
        const planDiv = document.createElement('div');
        planDiv.className = 'plan-editor';
        planDiv.innerHTML = `
            <div class="form-group">
                <label class="form-label">计划名称</label>
                <input type="text" class="form-input" value="${plan.name}" onchange="updatePlanName('${plan.id}', this.value)">
            </div>
            <div class="form-group">
                <label class="form-label">计划内容</label>
                <input type="text" class="form-input" value="${plan.content || ''}" onchange="updatePlanContent('${plan.id}', this.value)">
            </div>
            <div class="form-group">
                <label class="form-label">每日钻石奖励</label>
                <input type="number" class="form-input" value="${plan.dailyDiamond}" onchange="updatePlanDiamond('${plan.id}', this.value)">
            </div>
            <div class="form-group">
                <label class="form-label">连续打卡奖励</label>
                <div class="streak-rewards">
                    <div class="streak-reward-item">
                        <label>3天: </label>
                        <input type="number" class="form-input small" value="${plan.streakRewards[3] || 10}" onchange="updatePlanStreakReward('${plan.id}', 3, this.value)">
                    </div>
                    <div class="streak-reward-item">
                        <label>7天: </label>
                        <input type="number" class="form-input small" value="${plan.streakRewards[7] || 20}" onchange="updatePlanStreakReward('${plan.id}', 7, this.value)">
                    </div>
                    <div class="streak-reward-item">
                        <label>15天: </label>
                        <input type="number" class="form-input small" value="${plan.streakRewards[15] || 50}" onchange="updatePlanStreakReward('${plan.id}', 15, this.value)">
                    </div>
                    <div class="streak-reward-item">
                        <label>30天: </label>
                        <input type="number" class="form-input small" value="${plan.streakRewards[30] || 100}" onchange="updatePlanStreakReward('${plan.id}', 30, this.value)">
                    </div>
                </div>
            </div>
            <div class="plan-header" style="justify-content: flex-end; margin-top: 10px;">
                <button class="btn btn-secondary" onclick="removePlan('${plan.id}')">删除</button>
            </div>
        `;
        plansEditor.appendChild(planDiv);
    });
    
    plansModal.classList.add('active');
}

// 添加新计划（默认添加到六六的计划）
function addNewPlan(user = 'liuliu') {
    const planName = prompt('请输入计划名称:');
    if (planName && planName.trim()) {
        const userData = appState[user];
        userData.plans.push({
            id: Date.now().toString(),
            name: planName.trim(),
            content: '',
            dailyDiamond: 5,
            streakRewards: { 3: 10, 7: 20, 15: 50, 30: 100 }
        });
        saveData();
        showPlans(user);
    }
}

// 删除计划
function removePlan(planId, user = 'liuliu') {
    if (confirm('确定要删除这个计划吗？')) {
        const userData = appState[user];
        userData.plans = userData.plans.filter(plan => plan.id !== planId);
        saveData();
        showPlans(user);
    }
}

// 更新计划名称
function updatePlanName(planId, value, user = 'liuliu') {
    if (value && value.trim()) {
        const userData = appState[user];
        const plan = userData.plans.find(p => p.id === planId);
        if (plan) {
            plan.name = value.trim();
        }
    }
}

// 更新计划内容
function updatePlanContent(planId, value, user = 'liuliu') {
    const userData = appState[user];
    const plan = userData.plans.find(p => p.id === planId);
    if (plan) {
        plan.content = value.trim();
    }
}

// 更新计划钻石奖励
function updatePlanDiamond(planId, value, user = 'liuliu') {
    const diamond = parseInt(value);
    if (!isNaN(diamond) && diamond > 0) {
        const userData = appState[user];
        const plan = userData.plans.find(p => p.id === planId);
        if (plan) {
            plan.dailyDiamond = diamond;
        }
    }
}

// 更新计划连续打卡奖励
function updatePlanStreakReward(planId, days, value, user = 'liuliu') {
    const reward = parseInt(value);
    if (!isNaN(reward) && reward >= 0) {
        const userData = appState[user];
        const plan = userData.plans.find(p => p.id === planId);
        if (plan) {
            if (!plan.streakRewards) {
                plan.streakRewards = {};
            }
            plan.streakRewards[days] = reward;
        }
    }
}

// 确认计划修改
function confirmPlans() {
    saveData();
    updateUI();
    closeModal('plansModal');
    alert('计划修改已确认，首页已更新！');
}

// 显示历史记录
function showHistory() {
    const historyModal = document.getElementById('historyModal');
    const historyContent = document.getElementById('historyContent');
    
    historyContent.innerHTML = '';
    
    // 生成日历
    const calendar = document.createElement('div');
    calendar.className = 'history-calendar';
    
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    
    // 添加星期标题
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    weekdays.forEach(day => {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;
        calendar.appendChild(dayElement);
    });
    
    // 计算当月第一天是星期几
    const firstDay = new Date(year, month, 1);
    const firstDayOfWeek = firstDay.getDay();
    
    // 添加上个月的日期占位
    for (let i = 0; i < firstDayOfWeek; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        calendar.appendChild(emptyDay);
    }
    
    // 计算当月有多少天
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // 添加当月的日期
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        // 直接构建日期字符串，避免时区影响
        const yearStr = date.getFullYear();
        const monthStr = String(date.getMonth() + 1).padStart(2, '0');
        const dayStr = String(day).padStart(2, '0');
        const dateStr = `${yearStr}-${monthStr}-${dayStr}`;
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;
        
        // 检查是否是未来日期
        const today = new Date().toISOString().split('T')[0];
        const isFutureDate = dateStr > today;
        
        if (!isFutureDate) {
            // 合并两个用户的打卡记录
            let totalCompleted = 0;
            let totalPlans = 0;
            let hasMakeupAny = false;

            ['liuliu', 'parents'].forEach(user => {
                const userData = appState[user];
                totalPlans += userData.plans.length;
                if (userData.checkins[dateStr]) {
                    const checkins = userData.checkins[dateStr];
                    totalCompleted += Object.values(checkins).filter(Boolean).length;
                    if (Object.values(checkins).some(value => value === 'makeup')) {
                        hasMakeupAny = true;
                    }
                }
            });

            if (totalCompleted > 0) {
                if (totalCompleted === totalPlans) {
                    dayElement.className = 'calendar-day completed';
                } else {
                    dayElement.className = 'calendar-day partial';
                }

                // 检查是否有补卡记录
                if (hasMakeupAny) {
                    const makeupBadge = document.createElement('div');
                    makeupBadge.className = 'makeup-badge';
                    makeupBadge.textContent = '补卡';
                    dayElement.appendChild(makeupBadge);
                }
            } else {
                // 检查是否是当天
                const today = new Date().toISOString().split('T')[0];
                if (dateStr === today) {
                    // 当天不显示任何底色
                    dayElement.className = 'calendar-day';
                } else {
                    // 其他没有打卡记录的日期显示红色
                    dayElement.className = 'calendar-day partial';
                }
            }
        }
        
        // 添加点击事件，显示补卡选项
        dayElement.addEventListener('click', () => {
            showDateCheckins(dateStr);
        });
        
        calendar.appendChild(dayElement);
    }
    
    historyContent.appendChild(calendar);
    historyModal.classList.add('active');
}

// 显示指定日期的打卡情况和补卡选项
function showDateCheckins(dateStr) {
    const historyModal = document.getElementById('historyModal');
    const historyContent = document.getElementById('historyContent');
    
    // 格式化日期显示
    const date = new Date(dateStr + 'T00:00:00');
    const formattedDate = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
    
    // 检查是否是今天或未来的日期
    const today = new Date().toISOString().split('T')[0];
    const isPastDate = dateStr < today;
    
    // 检查该日期的额外奖励
    const dateRewards = appState.extraRewards.filter(reward => reward.date === dateStr);
    
    historyContent.innerHTML = `
        <div style="margin-bottom: 20px;">
            <h3>${formattedDate} 打卡情况</h3>
        </div>
        ${dateRewards.length > 0 ? `
            <div class="extra-rewards-section" style="margin-bottom: 20px;">
                <h4>🎉 额外奖励</h4>
                <ul>
                    ${dateRewards.map(reward => `<li>${reward.name}: ${reward.diamonds}💎</li>`).join('')}
                </ul>
            </div>
        ` : ''}
        <div class="checkin-list" id="dateCheckinList"></div>
        <button class="btn btn-secondary" onclick="showHistory()" style="width: 100%; margin-top: 20px;">返回日历</button>
    `;
    
    const dateCheckinList = document.getElementById('dateCheckinList');

    // 显示两个用户的打卡情况
    ['liuliu', 'parents'].forEach(user => {
        const userData = appState[user];
        const userLabel = user === 'liuliu' ? '👧 六六' : '👨‍👩 爸爸妈妈';

        // 添加用户分隔标题
        const userHeader = document.createElement('div');
        userHeader.style.cssText = 'font-weight: bold; margin: 15px 0 10px 0; padding: 8px; background: #f0f0f0; border-radius: 8px;';
        userHeader.textContent = userLabel;
        dateCheckinList.appendChild(userHeader);

        userData.plans.forEach(plan => {
            const isChecked = userData.checkins[dateStr]?.[plan.id] || false;

            const checkinItem = document.createElement('div');
            checkinItem.className = 'checkin-item';
            checkinItem.innerHTML = `
                <div class="checkin-info">
                    <div class="checkin-name">${plan.name}</div>
                    <div class="checkin-reward">+${plan.dailyDiamond}💎</div>
                </div>
                <div>
                    ${isChecked ? `
                        <button class="checkin-btn completed" disabled>
                            ✓ 已打卡
                        </button>
                    ` : isPastDate ? `
                        <button class="checkin-btn active" onclick="handleMakeupCheckinForDate('${dateStr}', '${plan.id}', '${user}')">
                            补卡
                        </button>
                    ` : `
                        <button class="checkin-btn disabled" disabled>
                            未来日期
                        </button>
                    `}
                </div>
            `;
            dateCheckinList.appendChild(checkinItem);
        });
    });
}

// 显示兑换
function showExchange() {
    const exchangeModal = document.getElementById('exchangeModal');
    exchangeModal.classList.add('active');
}

// 计算兑换
function calculateExchange() {
    const diamondInput = document.getElementById('exchangeDiamond');
    const moneyInput = document.getElementById('exchangeMoney');
    
    const diamonds = parseInt(diamondInput.value);
    if (isNaN(diamonds) || diamonds < 10) {
        moneyInput.value = '0';
        return;
    }
    
    if (diamonds % 10 !== 0) {
        moneyInput.value = '0';
        return;
    }
    
    const money = diamonds / 10;
    moneyInput.value = money.toFixed(1);
}

// 执行兑换
function doExchange() {
    const diamondInput = document.getElementById('exchangeDiamond');
    const amount = parseInt(diamondInput.value);
    
    if (isNaN(amount) || amount < 10) {
        alert('请输入至少10钻石');
        return;
    }
    
    if (amount % 10 !== 0) {
        alert('请输入10的倍数');
        return;
    }
    
    if (amount > appState.diamonds) {
        alert('钻石不足');
        return;
    }
    
    const money = amount / 10;
    
    // 更新钻石和钱
    appState.diamonds -= amount;
    appState.money += money;
    
    // 添加兑换记录
    appState.exchangeHistory.push({
        id: Date.now().toString(),
        diamonds: amount,
        money: money,
        timestamp: new Date().toISOString()
    });
    
    // 保存数据
    saveData();
    
    // 更新UI
    updateUI();
    
    alert(`兑换成功！获得${money}元`);
    closeModal('exchangeModal');
    diamondInput.value = '';
    document.getElementById('exchangeMoney').value = '0';
}

// 隐藏所有内容
function hideAllContent() {
    const contents = document.querySelectorAll('.content');
    contents.forEach(content => {
        content.classList.add('hidden');
    });
}

// 显示打卡
function showCheckin() {
    hideAllContent();
    const homeContent = document.querySelector('.content:not(#savingsContent)');
    if (homeContent) {
        homeContent.classList.remove('hidden');
    }
}

// 显示储蓄
function showSavings() {
    hideAllContent();
    const savingsContent = document.getElementById('savingsContent');
    if (savingsContent) {
        savingsContent.classList.remove('hidden');
    }
}

// 显示首页（保持兼容性）
function showHome() {
    showCheckin();
}

// 更新目标
function updateGoal(index, value) {
    if (value && value.trim()) {
        if (!appState.goals[index]) {
            appState.goals[index] = {
                id: Date.now().toString(),
                name: value.trim(),
                createdAt: new Date().toISOString()
            };
        } else {
            appState.goals[index].name = value.trim();
        }
        saveData();
    }
}

// 连接GitHub
async function connectGitHub() {
    const token = document.getElementById('github-token').value.trim();
    if (!token) {
        alert('请输入GitHub Token');
        return;
    }
    
    try {
        // 验证Token
        const userResponse = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (!userResponse.ok) {
            throw new Error('Token无效');
        }
        
        const user = await userResponse.json();
        appState.token = token;
        appState.user = user;
        
        // 保存到IndexedDB
        await saveToIndexedDB('settings', { key: 'githubToken', value: token });
        
        // 查找或创建Gist
        await setupGist();
        
        showApp();
        await loadData();
    } catch (error) {
        alert('连接失败: ' + error.message);
    }
}

// 设置Gist
async function setupGist() {
    try {
        // 查找现有Gist
        const gistsResponse = await fetch('https://api.github.com/gists', {
            headers: {
                'Authorization': `token ${appState.token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        const gists = await gistsResponse.json();
        let targetGist = gists.find(gist => 
            gist.files['daily-checkin-data.json']
        );
        
        if (!targetGist) {
            // 创建新Gist
            const createResponse = await fetch('https://api.github.com/gists', {
                method: 'POST',
                headers: {
                    'Authorization': `token ${appState.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    description: '日常打卡数据',
                    public: false,
                    files: {
                        'daily-checkin-data.json': {
                            content: JSON.stringify({
                                goals: [],
                                checkins: {},
                                diamonds: 0,
                                money: 0,
                                settings: appState.settings
                            })
                        }
                    }
                })
            });
            
            targetGist = await createResponse.json();
        }
        
        appState.gistId = targetGist.id;
        await saveToIndexedDB('settings', { key: 'gistId', value: targetGist.id });
    } catch (error) {
        console.error('设置Gist失败:', error);
        throw error;
    }
}

// 加载数据
async function loadData() {
    try {
        // 从本地存储加载
        await loadFromLocalStorage();
        updateUI();
    } catch (error) {
        console.error('加载数据失败:', error);
        // 尝试从本地存储加载
        await loadFromLocalStorage();
        throw error; // 重新抛出错误，让调用者知道
    }
}

// 从本地存储加载
async function loadFromLocalStorage() {
    let data = null;
    
    // 优先从IndexedDB加载
    try {
        data = await loadFromIndexedDB('data', 'checkinData');
        if (data) {
            console.log('从IndexedDB加载数据');
        }
    } catch (error) {
        console.error('从IndexedDB加载失败:', error);
    }
    
    // 如果IndexedDB没有数据，尝试从LocalStorage备份加载
    if (!data) {
        try {
            const backupData = localStorage.getItem('checkinDataBackup');
            if (backupData) {
                data = JSON.parse(backupData);
                console.log('从LocalStorage备份加载数据');
            }
        } catch (error) {
            console.error('从LocalStorage加载失败:', error);
        }
    }
    
    if (data) {
        // 排除 IndexedDB 的 id 字段
        if (data.id) {
            console.log('loadFromLocalStorage: 排除 id 字段:', data.id);
            const { id, ...cleanData } = data;
            data = cleanData;
        }

        // 数据迁移：将旧版数据转换为新版结构
        data = migrateData(data);

        // 加载迁移后的数据
        if (data.liuliu) {
            appState.liuliu = data.liuliu;
            appState.parents = data.parents;
            console.log('loadFromLocalStorage: 打卡数据已加载');
        }
        appState.goals = data.goals || [];
        appState.diamonds = data.diamonds || 0;
        appState.money = data.money || 0;
        appState.exchangeHistory = data.exchangeHistory || [];
        appState.settings = { ...appState.settings, ...data.settings };
        appState.extraRewards = data.extraRewards || [];
        appState.historyRecords = data.historyRecords || [];

        // 导入储蓄数据（支持中文键名"储蓄"）
        if (data['储蓄']) {
            const savingsData = data['储蓄'];
            // 同步到 index.html 的 transactions 变量
            if (typeof window.transactions !== 'undefined') {
                window.transactions = savingsData.transactions || [];
                // 触发储蓄模块的UI更新
                if (typeof window.updateSavingsUI === 'function') {
                    window.updateSavingsUI();
                }
            }
            // 同时保存到 localStorage 供储蓄模块读取
            localStorage.setItem('piggyBankTransactions', JSON.stringify(savingsData.transactions || []));
        }
    }

    // 重新计算钻石总量，确保数据一致性
    recalculateTotalDiamonds();

    updateUI();
}

// 验证数据完整性
function validateData(data) {
    if (!data || typeof data !== 'object') {
        console.warn('validateData: 数据为空或不是对象');
        return false;
    }

    // 排除可能的 id 字段（来自 IndexedDB）
    if (data.id) {
        const { id, ...cleanData } = data;
        data = cleanData;
    }

    console.log('validateData 检查数据键:', Object.keys(data));

    // 检查新数据结构：必须有 liuliu
    if (!data.liuliu) {
        console.warn('validateData: 数据缺少必要字段: liuliu');
        return false;
    }

    // 检查 liuliu 内部结构
    const liuliuFields = ['plans', 'checkins', 'streaks'];
    for (const field of liuliuFields) {
        if (!(field in data.liuliu)) {
            console.warn(`validateData: 数据 liuliu 缺少必要字段: ${field}`);
            return false;
        }
    }

    // parents 是可选的，但如果存在则检查结构
    if (data.parents) {
        for (const field of liuliuFields) {
            if (!(field in data.parents)) {
                console.warn(`validateData: 数据 parents 缺少必要字段: ${field}`);
                return false;
            }
        }
    }

    // 检查共享字段
    if (!('goals' in data)) {
        console.warn('validateData: 数据缺少必要字段: goals');
        return false;
    }

    if (typeof data.diamonds !== 'number') {
        console.warn('validateData: 数据 diamonds 字段格式不正确');
        return false;
    }

    console.log('validateData: 数据验证通过');
    return true;
}

// 保存数据
async function saveData() {
    // 计算所有计划的连续天数
    calculateAllStreaks();
    
    const data = {
        // 新的数据结构
        liuliu: appState.liuliu,
        parents: appState.parents,
        // 共享数据
        goals: appState.goals,
        diamonds: appState.diamonds,
        money: appState.money,
        exchangeHistory: appState.exchangeHistory,
        settings: appState.settings,
        extraRewards: appState.extraRewards,
        historyRecords: appState.historyRecords
    };
    
    // 验证数据完整性
    if (!validateData(data)) {
        console.error('数据验证失败');
        alert('数据保存失败：数据格式不正确');
        return;
    }
    
    // 保存到IndexedDB
    try {
        await saveToIndexedDB('data', {
            id: 'checkinData',
            ...data
        });
    } catch (error) {
        console.error('保存到IndexedDB失败:', error);
    }
    
    // 同时保存到LocalStorage作为备份
    try {
        localStorage.setItem('checkinDataBackup', JSON.stringify(data));
        localStorage.setItem('checkinDataBackupTime', new Date().toISOString());
    } catch (error) {
        console.error('保存到LocalStorage备份失败:', error);
    }
    

}

// 计算储蓄余额（收入 - 支出）
function calculateSavingsBalance() {
    // 访问储蓄功能的transactions数组（在index.html中定义）
    if (typeof transactions !== 'undefined' && Array.isArray(transactions)) {
        const income = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + (t.amount || 0), 0);
        const expense = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + (t.amount || 0), 0);
        return income - expense;
    }
    return 0;
}

// 重新计算钻石总量（基于所有打卡记录和额外奖励）
function recalculateTotalDiamonds() {
    let total = 0;

    // 遍历两个用户的打卡记录
    ['liuliu', 'parents'].forEach(user => {
        const userData = appState[user];

        // 按日期排序，用于计算连续打卡
        const sortedDates = Object.keys(userData.checkins).sort();

        // 1. 计算所有打卡获得的钻石（基础奖励 + 连续打卡奖励）
        sortedDates.forEach(date => {
            const planCheckins = userData.checkins[date];
            Object.entries(planCheckins).forEach(([planId, status]) => {
                if (status === true || status === 'makeup') {
                    const plan = userData.plans.find(p => p.id === planId);
                    if (plan) {
                        // 基础奖励
                        total += plan.dailyDiamond;

                        // 连续打卡奖励：检查这一天是否是连续打卡的第3/7/15/30天
                        const streak = calculateStreakUpToDate(planId, date, user);
                        if (plan.streakRewards && plan.streakRewards[streak]) {
                            total += plan.streakRewards[streak];
                        }
                    }
                }
            });
        });

        // 3. 减去补卡消耗的钻石
        Object.entries(userData.checkins).forEach(([date, planCheckins]) => {
            Object.entries(planCheckins).forEach(([planId, status]) => {
                if (status === 'makeup') {
                    total -= appState.settings.checkinCost || 30;
                }
            });
        });
    });

    // 2. 计算所有额外奖励的钻石
    appState.extraRewards.forEach(reward => {
        total += reward.diamonds || 0;
    });

    appState.diamonds = total;
    return total;
}

// 计算到指定日期为止的连续打卡天数
function calculateStreakUpToDate(planId, targetDate, user = 'liuliu') {
    let streak = 0;
    const userData = appState[user];
    const sortedDates = Object.keys(userData.checkins).sort();

    for (const date of sortedDates) {
        if (date > targetDate) break;
        if (userData.checkins[date]?.[planId]) {
            streak++;
        } else {
            streak = 0;
        }
    }

    return streak;
}

// 更新UI
function updateUI() {
    // 更新钻石
    document.getElementById('diamondCount').textContent = appState.diamonds;
    
    // 更新储蓄（使用储蓄余额，而非appState.money）
    const savingsBalance = calculateSavingsBalance();
    document.getElementById('moneyCount').textContent = savingsBalance.toFixed(1);
    
    // 更新连续打卡天数（计算两个用户的最大连续天数）
    const streakCountElement = document.getElementById('streakCount');
    if (streakCountElement) {
        let maxStreak = 0;
        ['liuliu', 'parents'].forEach(user => {
            const userData = appState[user];
            Object.values(userData.streaks).forEach(streak => {
                if (streak > maxStreak) {
                    maxStreak = streak;
                }
            });
        });
        streakCountElement.textContent = maxStreak;
    }

    // 更新打卡列表（两个用户）
    updateCheckinList('liuliu');
    updateCheckinList('parents');
    
    // 更新目标容器
    updateGoalsContainer();
    
    // 更新资产栏中的目标显示
    updateGoalAssetDisplay();
    
    // 更新额外奖励
    updateExtraRewards();
    
    // 更新历史记录
    updateHistoryRecords();
}

// 更新额外奖励
function updateExtraRewards() {
    const extraRewardsContainer = document.getElementById('extraRewardsContainer');
    if (extraRewardsContainer) {
        const extraRewardsTable = extraRewardsContainer.querySelector('.extra-rewards-table');
        const tableBody = extraRewardsTable.querySelector('tbody');
        
        tableBody.innerHTML = '';
        
        // 按日期降序排序（最新日期在前）
        const sortedRewards = [...appState.extraRewards].sort((a, b) => {
            return new Date(b.date) - new Date(a.date);
        });
        
        if (sortedRewards.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; color: #666;">暂无额外奖励</td>
                </tr>
            `;
        } else {
            sortedRewards.forEach((reward, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${reward.name}</td>
                    <td>${reward.diamonds}💎</td>
                    <td>${reward.date}</td>
                    <td><button class="btn btn-sm btn-secondary" onclick="editExtraReward('${reward.id}')">修改</button></td>
                `;
                tableBody.appendChild(row);
            });
        }
    }
}

// 更新历史记录
function updateHistoryRecords() {
    const historyContainer = document.getElementById('historyContainer');
    if (historyContainer) {
        const historyTable = historyContainer.querySelector('.extra-rewards-table');
        const tableBody = historyTable.querySelector('tbody');
        
        tableBody.innerHTML = '';
        
        // 按日期降序排序（最新日期在前）
        const sortedRecords = [...appState.historyRecords].sort((a, b) => {
            return new Date(b.date) - new Date(a.date);
        });
        
        if (sortedRecords.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; color: #666;">暂无历史记录</td>
                </tr>
            `;
        } else {
            sortedRecords.forEach((record, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${record.name}</td>
                    <td>${record.content}</td>
                    <td>${record.date}</td>
                    <td><button class="btn btn-sm btn-secondary" onclick="editHistoryRecord('${record.id}')">修改</button></td>
                `;
                tableBody.appendChild(row);
            });
        }
    }
}

// 添加额外奖励
function addExtraReward() {
    // 检查并移除已存在的对话框
    const existingModal = document.getElementById('addRewardModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // 创建对话框
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'addRewardModal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-title">🏆 添加额外奖励</div>
            <div class="form-group">
                <label class="form-label">奖励名称</label>
                <input type="text" class="form-input" id="rewardName" placeholder="请输入奖励名称" value="">
            </div>
            <div class="form-group">
                <label class="form-label">钻石奖励数量</label>
                <input type="number" class="form-input" id="rewardDiamonds" placeholder="请输入钻石数量" min="1" value="">
            </div>
            <div class="form-group">
                <label class="form-label">奖励日期</label>
                <input type="date" class="form-input" id="rewardDate" value="">
            </div>
            <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button class="btn btn-primary" onclick="saveExtraReward()">保存</button>
                <button class="btn btn-secondary" onclick="closeModal('addRewardModal')">取消</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// 保存额外奖励
function saveExtraReward() {
    const name = document.getElementById('rewardName').value;
    if (!name || !name.trim()) {
        alert('请输入奖励名称');
        return;
    }
    
    const diamonds = parseInt(document.getElementById('rewardDiamonds').value);
    if (isNaN(diamonds) || diamonds <= 0) {
        alert('请输入有效的钻石数量');
        return;
    }
    
    const date = document.getElementById('rewardDate').value;
    if (!date) {
        alert('请选择奖励日期');
        return;
    }
    
    appState.extraRewards.push({
        id: Date.now().toString(),
        name: name.trim(),
        diamonds: diamonds,
        date: date
    });
    
    // 检查奖励日期是否已到达
    const today = new Date().toISOString().split('T')[0];
    if (date <= today) {
        appState.diamonds += diamonds;
        alert(`额外奖励已领取！获得${diamonds}钻石`);
    }
    
    saveData();
    updateExtraRewards();
    updateUI();
    closeModal('addRewardModal');
}

// 修改额外奖励
function editExtraReward(rewardId) {
    // 查找要修改的奖励
    const reward = appState.extraRewards.find(r => r.id === rewardId);
    if (!reward) return;
    
    // 检查并移除已存在的对话框
    const existingModal = document.getElementById('editRewardModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // 创建修改对话框
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'editRewardModal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-title">🏆 修改额外奖励</div>
            <div class="form-group">
                <label class="form-label">奖励名称</label>
                <input type="text" class="form-input" id="editRewardName" placeholder="请输入奖励名称" value="${reward.name}">
            </div>
            <div class="form-group">
                <label class="form-label">钻石奖励数量</label>
                <input type="number" class="form-input" id="editRewardDiamonds" placeholder="请输入钻石数量" min="1" value="${reward.diamonds}">
            </div>
            <div class="form-group">
                <label class="form-label">奖励日期</label>
                <input type="date" class="form-input" id="editRewardDate" value="${reward.date}">
            </div>
            <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button class="btn btn-primary" onclick="saveEditedReward('${reward.id}')">保存</button>
                <button class="btn btn-secondary" onclick="closeModal('editRewardModal')">取消</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// 保存修改的奖励
function saveEditedReward(rewardId) {
    const name = document.getElementById('editRewardName').value;
    if (!name || !name.trim()) {
        alert('请输入奖励名称');
        return;
    }
    
    const diamonds = parseInt(document.getElementById('editRewardDiamonds').value);
    if (isNaN(diamonds) || diamonds <= 0) {
        alert('请输入有效的钻石数量');
        return;
    }
    
    const date = document.getElementById('editRewardDate').value;
    if (!date) {
        alert('请选择奖励日期');
        return;
    }
    
    // 找到并更新奖励
    const rewardIndex = appState.extraRewards.findIndex(r => r.id === rewardId);
    if (rewardIndex !== -1) {
        const oldReward = appState.extraRewards[rewardIndex];
        const oldDiamonds = oldReward.diamonds;
        
        appState.extraRewards[rewardIndex] = {
            ...oldReward,
            name: name.trim(),
            diamonds: diamonds,
            date: date
        };
        
        // 检查奖励日期是否已到达
        const today = new Date().toISOString().split('T')[0];
        if (date <= today) {
            // 计算钻石数量的变化
            const diamondDiff = diamonds - oldDiamonds;
            if (diamondDiff !== 0) {
                appState.diamonds += diamondDiff;
                alert(`钻石数量已更新！${diamondDiff > 0 ? '增加' : '减少'}了${Math.abs(diamondDiff)}钻石`);
            }
        }
        
        saveData();
        updateExtraRewards();
        updateUI();
        closeModal('editRewardModal');
        alert('奖励修改成功！');
    }
}

// 添加历史记录
function addHistoryRecord() {
    // 检查并移除已存在的对话框
    const existingModal = document.getElementById('addHistoryModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // 创建对话框
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'addHistoryModal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-title">📋 新增历史记录</div>
            <div class="form-group">
                <label class="form-label">记录名称</label>
                <input type="text" class="form-input" id="historyName" placeholder="请输入记录名称" value="">
            </div>
            <div class="form-group">
                <label class="form-label">记录内容</label>
                <input type="text" class="form-input" id="historyRecordContent" placeholder="请输入记录内容" value="">
            </div>
            <div class="form-group">
                <label class="form-label">记录日期</label>
                <input type="date" class="form-input" id="historyDate" value="">
            </div>
            <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button class="btn btn-primary" onclick="saveHistoryRecord()">保存</button>
                <button class="btn btn-secondary" onclick="closeModal('addHistoryModal')">取消</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// 保存历史记录
function saveHistoryRecord() {
    const nameElement = document.getElementById('historyName');
    const contentElement = document.getElementById('historyRecordContent');
    const dateElement = document.getElementById('historyDate');
    
    if (!nameElement || !contentElement || !dateElement) {
        alert('表单元素加载失败，请重试');
        return;
    }
    
    const name = nameElement.value;
    if (!name || !name.trim()) {
        alert('请输入记录名称');
        return;
    }
    
    const content = contentElement.value;
    if (!content || !content.trim()) {
        alert('请输入记录内容');
        return;
    }
    
    const date = dateElement.value;
    if (!date) {
        alert('请选择记录日期');
        return;
    }
    
    appState.historyRecords.push({
        id: Date.now().toString(),
        name: name.trim(),
        content: content.trim(),
        date: date
    });
    
    saveData();
    updateHistoryRecords();
    updateUI();
    closeModal('addHistoryModal');
}

// 修改历史记录
function editHistoryRecord(recordId) {
    // 查找要修改的记录
    const record = appState.historyRecords.find(r => r.id === recordId);
    if (!record) return;
    
    // 检查并移除已存在的对话框
    const existingModal = document.getElementById('editRecordModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // 创建修改对话框
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'editRecordModal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-title">📋 修改历史记录</div>
            <div class="form-group">
                <label class="form-label">记录名称</label>
                <input type="text" class="form-input" id="editRecordName" placeholder="请输入记录名称" value="${record.name}">
            </div>
            <div class="form-group">
                <label class="form-label">记录内容</label>
                <input type="text" class="form-input" id="editRecordContent" placeholder="请输入记录内容" value="${record.content}">
            </div>
            <div class="form-group">
                <label class="form-label">记录日期</label>
                <input type="date" class="form-input" id="editRecordDate" value="${record.date}">
            </div>
            <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button class="btn btn-primary" onclick="saveEditedRecord('${record.id}')">保存</button>
                <button class="btn btn-secondary" onclick="closeModal('editRecordModal')">取消</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// 保存修改的记录
function saveEditedRecord(recordId) {
    const name = document.getElementById('editRecordName').value;
    if (!name || !name.trim()) {
        alert('请输入记录名称');
        return;
    }
    
    const content = document.getElementById('editRecordContent').value;
    if (!content || !content.trim()) {
        alert('请输入记录内容');
        return;
    }
    
    const date = document.getElementById('editRecordDate').value;
    if (!date) {
        alert('请选择记录日期');
        return;
    }
    
    // 找到并更新记录
    const recordIndex = appState.historyRecords.findIndex(r => r.id === recordId);
    if (recordIndex !== -1) {
        appState.historyRecords[recordIndex] = {
            ...appState.historyRecords[recordIndex],
            name: name.trim(),
            content: content.trim(),
            date: date
        };
        
        saveData();
        updateHistoryRecords();
        updateUI();
        closeModal('editRecordModal');
        alert('记录修改成功！');
    }
}

// 更新目标容器
function updateGoalsContainer() {
    const goalsContainer = document.getElementById('goalsContainer');
    if (goalsContainer) {
        goalsContainer.innerHTML = '';
        
        if (appState.goals.length === 0) {
            // 添加默认目标
            goalsContainer.innerHTML = `
                <div class="goal-tag">
                    <input type="text" value="养成好习惯" onchange="updateGoal(0, this.value)">
                </div>
            `;
        } else {
            appState.goals.forEach((goal, index) => {
                const goalTag = document.createElement('div');
                goalTag.className = 'goal-tag';
                goalTag.innerHTML = `
                    <input type="text" value="${goal.name}" onchange="updateGoal(${index}, this.value)">
                    <button class="goal-delete" onclick="deleteGoal(${index})">×</button>
                `;
                goalsContainer.appendChild(goalTag);
            });
        }
    }
}

// 删除目标
function deleteGoal(index) {
    if (confirm('确定要删除这个目标吗？')) {
        appState.goals.splice(index, 1);
        saveData();
        updateGoalsContainer();
        updateGoalAssetDisplay();
    }
}

// 更新资产栏中的目标显示
function updateGoalAssetDisplay() {
    const goalAssetDisplay = document.getElementById('goalAssetDisplay');
    
    if (goalAssetDisplay) {
        // 获取第一个目标或使用默认值
        const firstGoal = appState.goals.length > 0 ? appState.goals[0] : { name: '平衡车' };
        const name = firstGoal.name || '平衡车';
        goalAssetDisplay.textContent = name;
    }
}

// 打开目标编辑模态框
function openGoalEditModal(event) {
    // 阻止事件冒泡，避免触发父元素的点击事件
    if (event) {
        event.stopPropagation();
    }
    
    // 获取当前目标
    const firstGoal = appState.goals.length > 0 ? appState.goals[0] : { name: '平衡车' };
    
    // 创建编辑对话框（仅编辑目标名称）
    const newName = prompt('请输入目标名称:', firstGoal.name || '平衡车');
    if (newName === null) return; // 用户取消
    
    // 验证输入
    if (!newName.trim()) {
        alert('请输入有效的目标名称！');
        return;
    }
    
    // 更新目标
    if (appState.goals.length > 0) {
        appState.goals[0].name = newName.trim();
    } else {
        appState.goals.push({
            id: Date.now().toString(),
            name: newName.trim(),
            createdAt: new Date().toISOString()
        });
    }
    
    // 保存并更新显示
    saveData();
    updateGoalAssetDisplay();
    updateGoalsContainer();
    alert('目标修改成功！');
}

// 显示目标管理模态框
function showGoalsModal() {
    openModal('plansModal');
}

// 更新打卡列表
function updateCheckinList(user) {
    const checkinList = document.getElementById(user + 'CheckinList');
    if (!checkinList) return;

    checkinList.innerHTML = '';

    const today = new Date().toISOString().split('T')[0];
    let completed = 0;

    const userData = appState[user];

    userData.plans.forEach(plan => {
        const isChecked = userData.checkins[today]?.[plan.id] || false;
        if (isChecked) completed++;

        const checkinItem = document.createElement('div');
        checkinItem.className = 'checkin-item';

        const now = new Date();
        const hours = now.getHours();
        const canCheckin = hours >= 6 && hours < 22;

        checkinItem.innerHTML = `
            <div class="checkin-info">
                <div class="checkin-name">${plan.name}</div>
                ${plan.content ? `<div class="checkin-content">${plan.content}</div>` : ''}
                <div class="checkin-reward">+${plan.dailyDiamond}💎</div>
            </div>
            <div>
                <button class="checkin-btn ${isChecked ? 'completed' : 'active'} ${!canCheckin && !isChecked ? 'disabled' : ''}" data-plan-id="${plan.id}" data-user="${user}" ${!canCheckin && !isChecked ? 'disabled' : ''}>
                    ${isChecked ? '✓ 已打卡' : '打卡'}
                </button>
            </div>
        `;
        checkinList.appendChild(checkinItem);
    });

    // 更新计数（使用对应用户的进度元素）
    const progressElement = document.getElementById(user + 'Progress');
    if (progressElement) {
        progressElement.textContent = `${completed}/${userData.plans.length}`;
    }

    // 绑定打卡按钮事件
    checkinList.querySelectorAll('.checkin-btn').forEach(btn => {
        if (!btn.disabled) {
            btn.addEventListener('click', handleCheckin);
        }
    });
}

// 处理打卡
function handleCheckin(e) {
    const planId = e.target.dataset.planId;
    const user = e.target.dataset.user || 'liuliu';
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const hours = now.getHours();

    // 检查时间
    if (hours < 6 || hours >= 22) {
        alert('当前时间不在打卡时间范围内（06:00-22:00）');
        return;
    }

    const userData = appState[user];

    // 初始化今日打卡记录
    if (!userData.checkins[today]) {
        userData.checkins[today] = {};
    }

    // 检查是否已打卡，已打卡则无法取消
    const isChecked = userData.checkins[today][planId] || false;
    if (isChecked) {
        alert('今日已完成打卡，无法取消');
        return;
    }

    // 执行打卡
    userData.checkins[today][planId] = true;

    // 查找计划
    const plan = userData.plans.find(p => p.id === planId);
    if (plan) {
        // 发放基础奖励
        appState.diamonds += plan.dailyDiamond;

        // 计算连续打卡奖励
        const streak = calculateStreak(planId, user);
        if (plan.streakRewards[streak]) {
            appState.diamonds += plan.streakRewards[streak];
            alert(`恭喜！连续打卡${streak}天，获得额外${plan.streakRewards[streak]}钻石奖励！`);
        }
    }

    saveData();
    updateUI();

    // 立即更新打卡列表显示，确保状态实时刷新
    updateCheckinList(user);

    // 强制更新钻石显示，确保实时刷新
    const diamondCountElement = document.getElementById('diamondCount');
    if (diamondCountElement) {
        diamondCountElement.textContent = appState.diamonds;
        // 强制触发DOM重绘
        diamondCountElement.style.display = 'none';
        diamondCountElement.offsetHeight; // 触发重排
        diamondCountElement.style.display = '';
    }
}

// 处理补卡
function handleMakeupCheckin(e) {
    const planId = e.target.dataset.planId;
    const today = new Date().toISOString().split('T')[0];
    handleMakeupCheckinForDate(today, planId);
}

// 处理指定日期的补卡
function handleMakeupCheckinForDate(dateStr, planId, user = 'liuliu') {
    const userData = appState[user];

    // 检查是否已经打卡
    if (userData.checkins[dateStr]?.[planId]) {
        alert('该日期已经打卡，无需补卡');
        return;
    }

    // 检查钻石是否足够
    if (appState.diamonds < appState.settings.checkinCost) {
        alert(`钻石不足，补卡需要${appState.settings.checkinCost}钻石`);
        return;
    }

    if (confirm(`确定要花费${appState.settings.checkinCost}钻石进行补卡吗？`)) {
        // 扣除钻石
        appState.diamonds -= appState.settings.checkinCost;

        // 初始化打卡记录
        if (!userData.checkins[dateStr]) {
            userData.checkins[dateStr] = {};
        }

        // 标记为补卡
        userData.checkins[dateStr][planId] = 'makeup';

        // 查找计划
        const plan = userData.plans.find(p => p.id === planId);
        if (plan) {
            // 发放基础奖励（补卡只获得基础奖励，没有连续打卡奖励）
            appState.diamonds += plan.dailyDiamond;
            alert(`补卡成功！获得${plan.dailyDiamond}钻石基础奖励`);
        }

        saveData();
        updateUI();

        // 如果在历史记录页面，刷新当前日期的打卡情况
        showDateCheckins(dateStr);
    }
}

// 计算连续打卡天数
function calculateStreak(planId, user = 'liuliu') {
    let streak = 0;
    const today = new Date();
    const userData = appState[user];

    // 从昨天开始往前计算，不包括今天
    for (let i = 1; i <= 365; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        if (userData.checkins[dateStr]?.[planId]) {
            streak++;
        } else {
            break;
        }
    }

    return streak;
}

// 计算所有计划的连续天数
function calculateAllStreaks() {
    ['liuliu', 'parents'].forEach(user => {
        const userData = appState[user];
        userData.plans.forEach(plan => {
            userData.streaks[plan.id] = calculateStreak(plan.id, user);
        });
    });
}

// 添加目标
function addGoal() {
    const goalName = prompt('请输入目标名称:');
    if (goalName && goalName.trim()) {
        appState.goals.push({
            id: Date.now().toString(),
            name: goalName.trim(),
            createdAt: new Date().toISOString()
        });
        saveData();
        updateUI();
    }
}

// 更新同步状态




// 清空数据：重置到默认初始值
async function resetData() {
    if (!confirm('确定要清空所有数据并重置到默认状态吗？此操作不可恢复！')) {
        return;
    }
    
    try {
        // 重置appState到默认值
        appState.goals = [];
        // 重置六六的数据
        appState.liuliu = {
            plans: [
                {
                    id: '1',
                    name: '每日运动',
                    content: '蹲起、仰卧起坐、平板撑、深蹲、燕儿飞、单杠',
                    dailyDiamond: 5,
                    streakRewards: { 3: 10, 7: 20, 15: 50, 30: 100 }
                },
                {
                    id: '2',
                    name: '整理日用品',
                    content: '书桌、书包',
                    dailyDiamond: 5,
                    streakRewards: { 3: 10, 7: 20, 15: 50, 30: 100 }
                },
                {
                    id: '3',
                    name: '平板使用记录',
                    content: '周一到周四不玩平板',
                    dailyDiamond: 10,
                    streakRewards: { 3: 10, 7: 20, 15: 50, 30: 100 }
                },
                {
                    id: '4',
                    name: '电视使用记录',
                    content: '周一到周四最多30分钟',
                    dailyDiamond: 10,
                    streakRewards: { 3: 10, 7: 20, 15: 50, 30: 100 }
                },
                {
                    id: '5',
                    name: '零花钱使用记录',
                    content: '不乱买没用的东西',
                    dailyDiamond: 10,
                    streakRewards: { 3: 10, 7: 20, 15: 50, 30: 100 }
                }
            ],
            checkins: {},
            streaks: {}
        };
        // 重置爸爸妈妈的数据
        appState.parents = {
            plans: [
                { id: 'p1', name: '早起', content: '早上7点前起床', dailyDiamond: 5, streakRewards: { 3: 10, 7: 20, 15: 30, 30: 50 } },
                { id: 'p2', name: '阅读', content: '每日阅读30分钟', dailyDiamond: 5, streakRewards: { 3: 10, 7: 20, 15: 30, 30: 50 } },
                { id: 'p3', name: '运动', content: '每日运动30分钟', dailyDiamond: 5, streakRewards: { 3: 10, 7: 20, 15: 30, 30: 50 } }
            ],
            checkins: {},
            streaks: {}
        };
        appState.diamonds = 0;
        appState.money = 0;
        appState.exchangeHistory = [];
        appState.settings = {
            checkinCost: 30,
            lastSync: new Date().toISOString(),
            pendingSync: 0
        };
        appState.offlineQueue = [];
        appState.extraRewards = [];
        appState.historyRecords = [];
        
        // 保存到IndexedDB
        await saveData();
        
        // 更新UI
        updateUI();
        
        // 更新设置页面的补卡消耗显示
        const makeupCostInput = document.getElementById('makeupCost');
        if (makeupCostInput) {
            makeupCostInput.value = 30;
        }
        
        // 更新目标容器
        const goalsContainer = document.getElementById('goalsContainer');
        if (goalsContainer) {
            goalsContainer.innerHTML = `
                <div class="goal-tag">
                    <input type="text" value="养成好习惯" onchange="updateGoal(0, this.value)">
                </div>
            `;
        }
        
        alert('数据已清空并重置到默认状态！');
    } catch (error) {
        alert('清空数据失败: ' + error.message);
    }
}

// 初始化应用
initApp();