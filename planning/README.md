# 📁 Planning with Files - 项目规划系统

> 基于 [planning-with-files](https://skills.sh/othmanadi/planning-with-files/planning-with-files) 方法论的项目规划系统

---

## 🎯 核心理念

```
Context Window = RAM（易失性、有限）
Filesystem = Disk（持久化、无限）

→ 任何重要的内容都写入磁盘文件
```

---

## 📚 文件说明

| 文件 | 用途 | 更新时机 |
|------|------|----------|
| `task_plan.md` | 任务阶段、进度、决策 | 每个阶段完成后 |
| `findings.md` | 研究发现、学习内容 | 任何发现之后 |
| `progress.md` | 会话日志、测试结果 | 整个会话过程中 |

---

## 🔄 使用流程

### 1. 开始新任务前
```markdown
1. 更新 task_plan.md 中的目标和阶段
2. 标记第一个阶段为 🔄 in_progress
3. 开始执行
```

### 2. 执行过程中
```markdown
1. 每完成2个操作，记录发现到 findings.md
2. 遇到错误，记录到 task_plan.md 的错误表
3. 完成阶段后，更新状态为 ✅ complete
```

### 3. 会话结束前
```markdown
1. 更新 progress.md 的会话日志
2. 记录下次需要继续的内容
3. 提交 Git
```

### 4. 恢复会话时
```markdown
1. 阅读 task_plan.md 了解当前阶段
2. 阅读 findings.md 查看已有发现
3. 检查 git status 和 git diff
4. 继续未完成的任务
```

---

## 📏 关键规则

### 2-Action Rule
> 每执行2个查看/搜索操作，立即保存关键发现

### 3-Strike Error Protocol
```
尝试1: 诊断并修复
尝试2: 尝试不同方法
尝试3: 重新思考假设
3次失败后: 向用户求助
```

### Read Before Decide
> 做重大决策前，先重新阅读计划文件

### Never Repeat Failures
> 失败后不要重复相同的操作，要变换方法

---

## ✅ 5问题自检

| 问题 | 答案来源 |
|------|----------|
| 我在哪里？ | task_plan.md 当前阶段 |
| 我要去哪？ | task_plan.md 剩余阶段 |
| 目标是什么？ | task_plan.md 目标声明 |
| 我学到了什么？ | findings.md |
| 我做了什么？ | progress.md |

---

## 🔗 参考资源

- [Planning with Files 官方文档](https://skills.sh/othmanadi/planning-with-files/planning-with-files)
- [GitHub 仓库](https://github.com/othmanadi/planning-with-files)

---

## 📝 与 MetaForge-Pro 的整合

本规划系统可与项目现有的 MetaForge-Pro 方法论配合使用：

| 本系统 | MetaForge-Pro 对应 |
|--------|-------------------|
| task_plan.md | 功能清单/开发计划 |
| findings.md | 研究发现/最佳实践 |
| progress.md | 任务跟踪/开发日志 |
| 错误记录 | wenti.md |
