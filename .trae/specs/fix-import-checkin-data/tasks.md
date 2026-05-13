# Tasks

- [ ] Task 1: 修复 importData 函数的数据加载逻辑
  - [ ] SubTask 1.1: 分析当前 importData 函数中打卡数据加载的问题
  - [ ] SubTask 1.2: 修改 importData 函数，确保 liuliu 和 parents 数据正确赋值到 appState
  - [ ] SubTask 1.3: 添加调试日志追踪数据流
  - [ ] SubTask 1.4: 确保导入后调用 updateUI() 和 updateCheckinList() 刷新界面

- [ ] Task 2: 修复 migrateData 函数
  - [ ] SubTask 2.1: 确保 migrateData 正确处理新版数据结构（有 liuliu 字段）
  - [ ] SubTask 2.2: 确保 migrateData 正确处理旧版数据结构（根级 plans 字段）
  - [ ] SubTask 2.3: 添加调试日志显示迁移前后的数据结构

- [ ] Task 3: 修复 validateData 函数
  - [ ] SubTask 3.1: 确保 validateData 正确验证新版数据结构
  - [ ] SubTask 3.2: 移除了对根级 plans/checkins/streaks 的强制检查
  - [ ] SubTask 3.3: 添加详细的验证失败日志

- [ ] Task 4: 验证修复结果
  - [ ] SubTask 4.1: 测试导入包含完整打卡数据的JSON文件
  - [ ] SubTask 4.2: 确认六六的打卡计划和记录正确显示
  - [ ] SubTask 4.3: 确认爸爸妈妈的打卡计划和记录正确显示
  - [ ] SubTask 4.4: 测试导入旧版格式的JSON文件
  - [ ] SubTask 4.5: 提交代码到GitHub

# Task Dependencies

- Task 2 和 Task 3 可以并行执行
- Task 1 依赖于 Task 2 和 Task 3 完成
- Task 4 依赖于 Task 1 完成
