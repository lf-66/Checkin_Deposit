# 修复导入数据后打卡模块不显示计划

## 问题分析

从控制台截图分析：

1. **migrateData 输入数据键**: `["id", "liuliu", "parents", "goals", "diamonds", "money", "exchangeHistory", "settings", "extraRewards", "historyRecords"]`
2. **migrateData 输出数据键**: 同上

**关键发现**: 数据中有 `id` 字段！这说明 IndexedDB 返回的数据包含 `id: 'checkinData'` 这个键。

**问题根因**: 
- `saveToIndexedDB` 保存时使用了 `{ id: 'checkinData', ...data }` 结构
- `loadFromIndexedDB` 加载时返回了整个对象，包含 `id` 字段
- 但 `migrateData` 和 `validateData` 没有处理这个 `id` 字段
- 更重要的是：`appState.liuliu` 的数据结构可能有问题

## 诊断步骤

### Step 1: 检查 IndexedDB 数据结构

需要确认 IndexedDB 中存储的数据结构是否正确：
- 应该是 `{ liuliu: {...}, parents: {...}, goals: [...], ... }`
- 而不是 `{ id: 'checkinData', liuliu: {...}, ... }`

### Step 2: 检查 loadFromIndexedDB 返回值

`loadFromIndexedDB` 返回的数据可能包含 `id` 字段，需要排除。

### Step 3: 检查 appState.liuliu 的实际值

添加日志打印 `appState.liuliu.plans` 的实际内容。

## 修复方案

### 方案 1: 修复 loadFromLocalStorage

在 `loadFromLocalStorage` 中，排除 `id` 字段：

```javascript
if (data) {
    // 排除 IndexedDB 的 id 字段
    const { id, ...cleanData } = data;
    data = cleanData;
    
    // 数据迁移
    data = migrateData(data);
    // ...
}
```

### 方案 2: 修复 saveData

确保保存时不包含 `id` 字段在数据验证中：

```javascript
const data = {
    liuliu: appState.liuliu,
    parents: appState.parents,
    // ...
};

// 验证时排除 id 字段
const { id, ...validatePayload } = data;
if (!validateData(validatePayload)) {
    // ...
}
```

### 方案 3: 修复 validateData

让 `validateData` 忽略 `id` 字段：

```javascript
function validateData(data) {
    // 排除可能的 id 字段
    const { id, ...cleanData } = data;
    data = cleanData;
    // ... 继续验证
}
```

## 实施步骤

1. 在 `loadFromLocalStorage` 中添加排除 `id` 字段的逻辑
2. 在 `importData` 中添加排除 `id` 字段的逻辑
3. 添加更多调试日志确认数据结构
4. 测试导入功能

## 文件变更

| 文件 | 修改内容 |
|------|---------|
| `app.js` | 修复 `loadFromLocalStorage` 排除 `id` 字段 |
| `app.js` | 修复 `importData` 排除 `id` 字段 |
| `app.js` | 修复 `validateData` 忽略 `id` 字段 |

---

*计划创建时间: 2026-04-27*
