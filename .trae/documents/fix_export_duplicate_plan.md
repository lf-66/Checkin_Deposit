# 修复导出JSON数据重复问题计划

## 问题分析

当前导出的JSON数据存在重复字段：

| 重复字段 | 新结构位置 | 旧兼容位置 |
|---------|-----------|-----------|
| plans | liuliu.plans | plans |
| checkins | liuliu.checkins | checkins |
| streaks | liuliu.streaks | streaks |

## 重复数据示例

```json
{
  "liuliu": {
    "plans": [...],     // ← 新结构
    "checkins": {...},
    "streaks": {...}
  },
  "parents": {...},
  "plans": [...],       // ← 重复（与 liuliu.plans 相同）
  "checkins": {...},    // ← 重复
  "streaks": {...}      // ← 重复
}
```

## 解决方案

### 方案1：完全移除旧兼容字段（推荐）
既然数据已经使用新结构存储，可以安全地移除旧的兼容字段，减小文件大小。

### 方案2：保留兼容性
如果仍需兼容旧版本应用，可以保持现状，但这不是最优解。

## 实施步骤

### Step 1: 修改 saveData 函数
**位置**: `app.js` 中的 `saveData()` 函数
**操作**: 移除 `plans`, `checkins`, `streaks` 三个兼容字段

**修改前**:
```javascript
const data = {
    // 新的数据结构
    liuliu: appState.liuliu,
    parents: appState.parents,
    // 兼容旧版本的数据字段
    plans: appState.liuliu.plans,
    checkins: appState.liuliu.checkins,
    streaks: appState.liuliu.streaks,
    // 共享数据
    goals: appState.goals,
    ...
};
```

**修改后**:
```javascript
const data = {
    // 新的数据结构
    liuliu: appState.liuliu,
    parents: appState.parents,
    // 共享数据
    goals: appState.goals,
    diamonds: appState.diamonds,
    ...
};
```

### Step 2: 修改 exportData 函数
**位置**: `app.js` 中的 `exportData()` 函数
**操作**: 同样移除三个兼容字段

### Step 3: 更新数据迁移逻辑
**位置**: `app.js` 中的 `migrateData()` 函数
**操作**: 确保旧数据导入时仍能正确迁移

当前迁移逻辑已经正确处理了这种情况：
- 如果检测到旧版数据（有 plans 但没有 liuliu），会进行迁移
- 如果已经是新版数据，直接返回

### Step 4: 验证导入兼容性
需要确保移除兼容字段后，旧版本应用仍能打开文件（如果需要的话）。

但考虑到：
1. 这是一个本地应用
2. 数据导出主要用于备份
3. 旧版本可以通过 migrateData 函数处理

所以可以安全移除兼容字段。

## 文件变更

| 文件 | 修改内容 |
|------|---------|
| `app.js` | 修改 `saveData()` 函数，移除冗余字段 |
| `app.js` | 修改 `exportData()` 函数，移除冗余字段 |

## 预期结果

导出后的JSON将变为：

```json
{
  "liuliu": {
    "plans": [...],
    "checkins": {...},
    "streaks": {...}
  },
  "parents": {
    "plans": [...],
    "checkins": {...},
    "streaks": {...}
  },
  "goals": [...],
  "diamonds": 540,
  "money": 0,
  "exchangeHistory": [],
  "settings": {...},
  "extraRewards": [...],
  "historyRecords": [...],
  "transactions": [...]
}
```

文件大小将减少约 30-40%。

---

*计划创建时间: 2026-04-27*  
*预计实施时间: 10分钟*
