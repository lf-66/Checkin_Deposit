# 转盘抽奖功能实现计划

## 功能概述

在"兑换"模块中增加转盘抽奖功能，用户可以使用钻石兑换抽奖次数，参与转盘抽奖。

## 需求分析

### 1. 转盘抽奖界面
- 模拟真实转盘抽奖过程
- 点击"开始抽奖"按钮，转盘指针转动
- 点击"停止"按钮，转盘指针慢慢停止
- 显示抽奖结果

### 2. 奖项管理
- 添加奖项
- 修改奖项
- 删除奖项
- 每个奖项包含：名称、概率、奖励内容

### 3. 抽奖次数兑换
- 显示当前抽奖次数（初始为0）
- 兑换一次消耗50个钻石（可配置）
- 在"设置"模块中可修改消耗钻石数量

## 实现步骤

### Step 1: 数据结构设计

在 appState 中新增：
```javascript
lottery: {
    drawCount: 0,           // 当前抽奖次数
    drawCost: 50,           // 每次抽奖消耗的钻石数
    prizes: [               // 奖项列表
        { id: '1', name: '谢谢参与', probability: 50, reward: null },
        { id: '2', name: '5钻石', probability: 20, reward: { type: 'diamond', amount: 5 } },
        { id: '3', name: '10钻石', probability: 15, reward: { type: 'diamond', amount: 10 } },
        { id: '4', name: '20钻石', probability: 10, reward: { type: 'diamond', amount: 20 } },
        { id: '5', name: '50钻石', probability: 4, reward: { type: 'diamond', amount: 50 } },
        { id: '6', name: '100钻石', probability: 1, reward: { type: 'diamond', amount: 100 } }
    ]
}
```

### Step 2: 转盘UI设计

- 圆形转盘，分成多个扇形区域
- 每个区域显示奖项名称
- 中心有指针
- 底部有"开始抽奖"和"停止"按钮
- 显示当前抽奖次数

### Step 3: 转盘动画实现

- CSS动画实现转盘旋转
- JavaScript控制旋转角度
- 根据概率计算停止位置
- 平滑减速停止效果

### Step 4: 奖项管理功能

- 模态框管理奖项
- 添加奖项表单
- 修改奖项功能
- 删除奖项功能
- 概率校验（总和必须为100%）

### Step 5: 抽奖次数兑换

- 显示当前抽奖次数
- "兑换抽奖"按钮
- 扣除钻石增加抽奖次数
- 钻石不足提示

### Step 6: 设置模块配置

- 在设置中添加"抽奖消耗钻石数"配置项
- 默认50，可修改
- 保存到 settings

## 文件变更

| 文件 | 修改内容 |
|------|---------|
| `index.html` | 添加转盘抽奖UI、奖项管理模态框 |
| `app.js` | 添加转盘逻辑、奖项管理、抽奖次数兑换 |
| `app.js` | 更新数据结构和保存逻辑 |
| `app.js` | 更新设置模块，添加抽奖消耗配置 |

## 技术细节

### 转盘算法
1. 根据概率计算每个奖项的角度范围
2. 随机生成停止角度
3. 根据角度确定中奖奖项
4. 添加多圈旋转动画

### 概率计算
```javascript
function calculatePrize() {
    const random = Math.random() * 100;
    let cumulative = 0;
    for (const prize of prizes) {
        cumulative += prize.probability;
        if (random <= cumulative) {
            return prize;
        }
    }
    return prizes[prizes.length - 1];
}
```

### CSS动画
```css
.wheel {
    transition: transform 4s cubic-bezier(0.25, 0.1, 0.25, 1);
}
```

## 风险处理

1. **概率总和不为100%**: 添加校验，保存时自动调整或提示错误
2. **没有奖项**: 默认初始化一组奖项
3. **钻石不足**: 提示用户先赚取钻石
4. **动画兼容性**: 使用CSS transform，兼容主流浏览器
