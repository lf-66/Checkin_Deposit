# 修复导入JSON数据时打卡模块数据未加载 Spec

## Why

用户通过设置模块导入JSON数据文件后，储蓄模块数据导入成功，但打卡模块（六六和爸爸妈妈的打卡计划、打卡记录、连续天数）未成功加载到界面。之前尝试的修复未解决问题，需要系统性地诊断和修复。

## What Changes

- **修复** `importData()` 函数中打卡数据的加载逻辑
- **修复** `migrateData()` 函数以正确处理新版数据结构
- **修复** `validateData()` 函数避免误拦截有效数据
- **添加** 详细的调试日志以便追踪数据流
- **确保** 导入后UI正确刷新

## Impact

- 受影响功能：设置模块的"导入JSON数据"功能
- 受影响文件：`app.js`
- 用户体验：导入数据后打卡模块能正确显示历史记录和计划

## ADDED Requirements

### Requirement: 导入时正确加载打卡数据

The system SHALL 在用户导入JSON文件时，正确加载六六和爸爸妈妈的打卡数据到 appState 并刷新UI。

#### Scenario: 导入包含完整打卡数据的JSON
- **GIVEN** 用户选择一个包含 `liuliu` 和 `parents` 数据的JSON文件
- **WHEN** 用户点击导入按钮
- **THEN** 六六的打卡计划、打卡记录、连续天数正确加载
- **AND** 爸爸妈妈的打卡计划、打卡记录、连续天数正确加载
- **AND** 打卡界面正确显示导入的数据

#### Scenario: 导入旧版格式的JSON
- **GIVEN** 用户选择一个旧版格式（根级有 `plans`, `checkins`, `streaks`）的JSON文件
- **WHEN** 用户点击导入按钮
- **THEN** `migrateData()` 函数正确将旧数据迁移到新结构
- **AND** 六六的数据继承原有数据
- **AND** 爸爸妈妈的数据初始化为默认值

## MODIFIED Requirements

### Requirement: 数据验证
The system SHALL 验证导入的数据结构，但不应误拦截包含 `liuliu` 和 `parents` 字段的新版数据。

### Requirement: 数据保存
The system SHALL 在导入后将完整的 appState（包括 liuliu 和 parents）保存到 IndexedDB。

## REMOVED Requirements

无
