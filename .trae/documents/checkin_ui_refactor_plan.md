# 打卡工具 UI 重构计划

## 任务概述

将"日常打卡小工具"修改为支持多人打卡的版本，使用导航栏切换"六六"和"爸爸妈妈"的打卡内容，右侧额外奖励和历史记录模块保持不变。

---

## 布局修改示意图

### 修改前布局

```
┌─────────────────────────────────────────────────────────────────────┐
│                    🌟 日常打卡小工具                                 │
├─────────────────────────────────────────────────────────────────────┤
│  💎钻石   💰储蓄   📅连续打卡   🎯我的目标                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────┐    ┌───────────────────────────────┐      │
│  │   📝 今日打卡       │    │         🏆 额外奖励           │      │
│  │   (打卡列表)        │    │                               │      │
│  │                     │    │      (奖励表格)               │      │
│  │   - 每日运动        │    │                               │      │
│  │   - 整理日用品      │    │      📋 历史记录              │      │
│  │   - ...             │    │      (历史表格)               │      │
│  └─────────────────────┘    └───────────────────────────────┘      │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│   📝打卡   🎯目标   💰兑换   📊历史   💵储蓄   ⚙️设置              │
└─────────────────────────────────────────────────────────────────────┘
```

### 修改后布局

```
┌─────────────────────────────────────────────────────────────────────┐
│                🌟 每日打卡与储钱罐工具                               │
├─────────────────────────────────────────────────────────────────────┤
│  💎钻石   💰储蓄   📅连续打卡   🎯我的目标                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────┐    ┌───────────────────────────────┐      │
│  │ ┌─────────────────┐ │    │                               │      │
│  │ │ 👧 六六  │ 👨‍👩  │ │    │      🏆 额外奖励             │      │
│  │ │   今日   │ 爸妈 │ │    │      (保持不变)              │      │
│  │ │   打卡   │ 今日 │ │    │                               │      │
│  │ │          │ 打卡 │ │    │      📋 历史记录             │      │
│  │ └─────────────────┘ │    │      (保持不变)              │      │
│  │                     │    │                               │      │
│  │  打卡内容显示区域   │    │                               │      │
│  │  (根据导航切换)     │    │                               │      │
│  │                     │    │                               │      │
│  │  - 每日运动         │    │                               │      │
│  │  - 整理日用品       │    │                               │      │
│  │  - ...              │    │                               │      │
│  │                     │    │                               │      │
│  └─────────────────────┘    └───────────────────────────────┘      │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│   📝打卡   🎯目标   💰兑换   📊历史   💵储蓄   ⚙️设置              │
└─────────────────────────────────────────────────────────────────────┘
```

### 交互说明

- **默认状态**: 显示"六六今日打卡"内容
- **点击"爸爸妈妈今日打卡"导航**: 左侧区域切换显示爸爸妈妈的打卡列表
- **点击"六六今日打卡"导航**: 左侧区域切换回六六的打卡列表
- **右侧区域**: 额外奖励和历史记录模块始终保持不变

---

## 修改清单

### 任务 1: 修改应用名称
**目标**: 将"日常打卡小工具"改为"每日打卡与储钱罐工具"

**修改位置**:
- `index.html` 第 6 行: `<title>` 标签
- `index.html` 第 1021 行: Header 中的 `<h1>` 标签

**代码变更**:
```html
<!-- 修改前 -->
<title>🌟 日常打卡小工具</title>
<h1>🌟 日常打卡小工具</h1>

<!-- 修改后 -->
<title>🌟 每日打卡与储钱罐工具</title>
<h1>🌟 每日打卡与储钱罐工具</h1>
```

---

### 任务 2: 重构打卡区域布局
**目标**: 添加导航栏，通过切换显示不同用户的打卡内容

**修改位置**: `index.html` 约 1050-1115 行

#### 2.1 添加导航栏样式（在 `<style>` 中添加）

```css
/* 打卡模块导航栏样式 - 参考储蓄模块 */
.checkin-nav-container {
    background: #f8f9fa;
    border-radius: 16px;
    padding: 12px;
    margin-bottom: 20px;
}

.checkin-nav {
    display: flex;
    justify-content: center;
    gap: 10px;
}

.checkin-nav-btn {
    padding: 10px 20px;
    border: none;
    border-radius: 20px;
    background: #e9ecef;
    color: #666;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s;
}

.checkin-nav-btn.active {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.checkin-nav-btn:hover:not(.active) {
    background: #dee2e6;
}

/* 打卡视图容器 */
.checkin-view {
    display: none;
}

.checkin-view.active {
    display: block;
}

/* 打卡视图标题 */
.checkin-view-title {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 15px;
    display: flex;
    align-items: center;
    gap: 8px;
}
```

#### 2.2 修改打卡区域 HTML 结构

```html
<!-- 修改前 -->
<div class="main-content">
    <!-- 打卡区 -->
    <div class="section checkin-section">
        <div class="section-title">
            📝 今日打卡
            <span class="today-progress" id="todayProgress">5/7</span>
        </div>
        <div class="time-hint" id="timeHint">
            打卡时段：18:00 - 22:00
        </div>
        <div class="checkin-list" id="checkinList"></div>
    </div>
    
    <!-- 额外奖励模块 -->
    <div class="section extra-rewards-section">
        ...
    </div>
</div>

<!-- 修改后 -->
<div class="main-content">
    <!-- 左侧：打卡区 -->
    <div class="section checkin-section">
        
        <!-- 打卡模块导航栏 -->
        <div class="checkin-nav-container">
            <div class="checkin-nav">
                <button class="checkin-nav-btn active" onclick="switchCheckinView('liuliu')" id="navLiuliu">
                    👧 六六今日打卡
                </button>
                <button class="checkin-nav-btn" onclick="switchCheckinView('parents')" id="navParents">
                    👨‍👩 爸爸妈妈今日打卡
                </button>
            </div>
        </div>
        
        <!-- 六六打卡视图 -->
        <div class="checkin-view active" id="viewLiuliu">
            <div class="time-hint" id="liuliuTimeHint">
                打卡时段：06:00 - 22:00
            </div>
            <div class="checkin-list" id="liuliuCheckinList"></div>
        </div>
        
        <!-- 爸爸妈妈打卡视图 -->
        <div class="checkin-view" id="viewParents">
            <div class="time-hint" id="parentsTimeHint">
                打卡时段：06:00 - 22:00
            </div>
            <div class="checkin-list" id="parentsCheckinList"></div>
        </div>
    </div>
    
    <!-- 右侧：额外奖励和历史记录模块 (保持不变) -->
    <div class="section extra-rewards-section">
        ...
    </div>
</div>
```

---

### 任务 3: 更新 JavaScript 逻辑
**目标**: 支持通过导航栏切换两个打卡模块

**修改位置**: `app.js`

#### 3.1 修改 appState 数据结构

```javascript
// 修改前
let appState = {
    plans: [...],
    checkins: {},
    streaks: {},
    ...
};

// 修改后 - 分离两个用户的打卡数据
let appState = {
    // 六六的打卡数据
    liuliu: {
        plans: [...],  // 原plans移到这里
        checkins: {},
        streaks: {}
    },
    // 爸爸妈妈的打卡数据
    parents: {
        plans: [],
        checkins: {},
        streaks: {}
    },
    // 共享数据
    diamonds: 0,
    money: 0,
    goals: [],
    extraRewards: [],
    historyRecords: [],
    ...
};
```

#### 3.2 添加视图切换函数

```javascript
// 当前激活的打卡视图
let currentCheckinView = 'liuliu';

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
```

#### 3.3 更新渲染函数

```javascript
function updateUI() {
    // 渲染六六的打卡列表
    renderCheckinList('liuliu');
    
    // 渲染爸爸妈妈的打卡列表
    renderCheckinList('parents');
    
    // 更新额外奖励模块 (保持不变)
    updateExtraRewards();
    
    // 更新历史记录模块 (保持不变)
    updateHistoryRecords();
    
    // 更新其他UI...
}

function renderCheckinList(user) {
    const container = document.getElementById(user + 'CheckinList');
    const userData = appState[user];
    const today = new Date().toISOString().split('T')[0];
    
    // 清空容器
    container.innerHTML = '';
    
    // 渲染打卡计划列表
    userData.plans.forEach(plan => {
        const isCompleted = userData.checkins[today] && userData.checkins[today][plan.id];
        // 创建打卡项DOM...
    });
}
```

#### 3.4 更新打卡函数

```javascript
function toggleCheckin(planId) {
    // 使用当前激活的视图用户
    const user = currentCheckinView;
    const userData = appState[user];
    const today = new Date().toISOString().split('T')[0];
    
    // 打卡逻辑...
    if (!userData.checkins[today]) {
        userData.checkins[today] = {};
    }
    
    userData.checkins[today][planId] = !userData.checkins[today][planId];
    
    // 保存并更新UI
    saveData();
    updateUI();
}
```

---

### 任务 4: 数据导入导出兼容
**目标**: 确保现有数据可以正确迁移到新结构

#### 4.1 数据迁移逻辑

```javascript
function migrateData(data) {
    // 如果是旧版数据结构，进行迁移
    if (data.plans && !data.liuliu) {
        console.log('检测到旧版数据，开始迁移...');
        
        const newData = {
            // 迁移六六的数据
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
            diamonds: data.diamonds || 0,
            money: data.money || 0,
            goals: data.goals || [],
            exchangeHistory: data.exchangeHistory || [],
            settings: data.settings || { checkinCost: 30, lastSync: new Date().toISOString() },
            extraRewards: data.extraRewards || [],
            historyRecords: data.historyRecords || []
        };
        
        console.log('数据迁移完成');
        return newData;
    }
    return data;
}
```

#### 4.2 在导入数据时调用迁移

```javascript
function importData(input) {
    const file = input.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            let data = JSON.parse(event.target.result);
            
            // 数据迁移
            data = migrateData(data);
            
            // 加载数据到应用状态
            if (data.liuliu) {
                appState.liuliu = data.liuliu;
                appState.parents = data.parents;
            }
            
            // 加载其他数据...
            
            await saveData();
            updateUI();
            alert('数据导入成功！');
        } catch (error) {
            console.error('导入失败:', error);
            alert('导入失败: ' + error.message);
        }
    };
    reader.readAsText(file);
}
```

---

## 文件变更清单

| 文件 | 变更类型 | 变更内容 |
|------|---------|---------|
| `index.html` | 修改 | 标题、打卡区域HTML结构、添加CSS样式 |
| `app.js` | 修改 | 数据模型、渲染逻辑、打卡函数、数据迁移 |

---

## 实施顺序

1. **Step 1**: 修改标题和页面名称
2. **Step 2**: 添加新的CSS样式
3. **Step 3**: 修改打卡区域HTML结构（添加导航栏和双视图）
4. **Step 4**: 修改JavaScript数据模型
5. **Step 5**: 添加视图切换函数
6. **Step 6**: 更新渲染和打卡逻辑
7. **Step 7**: 添加数据迁移逻辑
8. **Step 8**: 测试验证

---

## 关键特性说明

### 导航栏交互
- 点击导航按钮切换左侧打卡内容
- 当前激活的按钮有渐变背景色
- 默认显示"六六今日打卡"

### 右侧模块
- **额外奖励模块**: 完全保持原有位置和功能不变
- **历史记录模块**: 完全保持原有位置和功能不变
- 两个模块不受左侧导航切换影响

### 数据存储
- 六六和爸爸妈妈的打卡数据分别存储
- 额外奖励和历史记录作为共享数据
- 支持旧版本数据自动迁移

---

## 注意事项

1. **数据兼容性**: 旧版本数据会自动迁移，六六的数据继承原有plans/checkins/streaks
2. **响应式设计**: 左右布局在小屏幕上保持堆叠
3. **默认计划**: 爸爸妈妈的打卡计划预设3个示例计划（早起、阅读、运动）
4. **导出数据**: 新数据结构会包含liuliu和parents两个字段

---

*计划更新时间: 2026-04-27*  
*预计实施时间: 30-45 分钟*
