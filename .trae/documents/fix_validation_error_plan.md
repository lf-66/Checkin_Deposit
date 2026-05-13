# 修复数据验证错误计划

## 问题分析

### 错误现象
- 点击打卡时弹出错误："数据保存失败：数据格式不正确"
- 控制台显示："数据缺少必要字段：plans"
- 但打卡实际成功，钻石也能累加

### 根本原因
`validateData()` 函数仍在检查旧的数据结构，要求必须有 `plans` 字段，但我们已经移除了这个字段，改用 `liuliu` 和 `parents` 结构。

### 调用链
```
handleCheckin -> saveData -> validateData (失败)
```

## 解决方案

### Step 1: 更新 validateData 函数
**位置**: `app.js` 中的 `validateData()` 函数

**当前逻辑** (检查旧字段):
```javascript
function validateData(data) {
    // 检查必要字段
    const requiredFields = ['plans', 'checkins', 'streaks', 'diamonds'];
    for (const field of requiredFields) {
        if (!(field in data)) {
            console.warn(`数据缺少必要字段：${field}`);
            return false;
        }
    }
    return true;
}
```

**修改后逻辑** (检查新字段):
```javascript
function validateData(data) {
    // 检查新数据结构：必须有 liuliu 和 parents
    if (!data.liuliu || !data.parents) {
        console.warn('数据缺少必要字段：liuliu 或 parents');
        return false;
    }
    
    // 检查 liuliu 和 parents 内部结构
    for (const user of ['liuliu', 'parents']) {
        const userData = data[user];
        const userFields = ['plans', 'checkins', 'streaks'];
        for (const field of userFields) {
            if (!(field in userData)) {
                console.warn(`数据 ${user} 缺少必要字段：${field}`);
                return false;
            }
        }
    }
    
    // 检查共享字段
    if (typeof data.diamonds !== 'number') {
        console.warn('数据 diamonds 字段格式不正确');
        return false;
    }
    
    return true;
}
```

## 实施步骤

### Step 1: 定位并修改 validateData 函数
1. 找到 `validateData` 函数
2. 修改验证逻辑，支持新的数据结构
3. 添加对 `liuliu` 和 `parents` 的检查
4. 移除了对根级 `plans`, `checkins`, `streaks` 的检查

### Step 2: 测试验证
1. 刷新页面
2. 点击打卡
3. 确认不再弹出错误提示
4. 确认数据能正常保存

## 文件变更

| 文件 | 修改内容 |
|------|---------|
| `app.js` | 修改 `validateData()` 函数，适配新数据结构 |

## 预期结果

- 点击打卡时不再显示"数据格式不正确"错误
- 数据正常保存到 IndexedDB
- 控制台不再显示验证失败的警告

---

*计划创建时间: 2026-04-27*  
*预计实施时间: 5分钟*
