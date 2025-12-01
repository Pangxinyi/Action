# 📊 Action App - 数据导入/导出功能

## 🎯 快速导航

| 需求 | 文档 |
|------|------|
| **一分钟上手** | 📖 [QUICK_START.md](./QUICK_START.md) |
| **完整用户指南** | 📘 [DATA_IMPORT_EXPORT.md](./DATA_IMPORT_EXPORT.md) |
| **技术实现细节** | 🔧 [IMPLEMENTATION_NOTES.md](./IMPLEMENTATION_NOTES.md) |
| **中文功能总结** | 📝 [FEATURE_SUMMARY_ZH.md](./FEATURE_SUMMARY_ZH.md) |
| **示例数据文件** | 📋 [example-data.json](./example-data.json) |

## ✨ 功能特点

### 核心功能
- ✅ **一键导出** - 将所有数据导出为JSON
- ✅ **快速导入** - 粘贴JSON即可导入数据
- ✅ **自动保存** - 所有改动自动保存到设备
- ✅ **数据验证** - 导入前自动检查数据格式
- ✅ **批量导入** - 支持一次导入多个项目、事件等

### 应用场景
- 📱 **跨设备迁移** - 从一台设备迁移数据到另一台
- 💾 **数据备份** - 定期备份重要数据
- 📊 **批量创建** - 通过JSON快速创建多个项目
- 🤝 **团队协作** - 分享配置给团队成员
- 🔄 **数据交换** - 与其他系统交换数据

## 🚀 快速开始

### 导出数据
```
1. 打开应用 → 点击"Data"标签
2. 点击"📥 Export as JSON"
3. 复制生成的JSON文本
4. 保存到文件或云存储
```

### 导入数据
```
1. 打开Data标签
2. 准备JSON文件内容
3. 粘贴到导入框
4. 等待"✓ Data imported successfully"提示
```

### 尝试示例
```
1. 打开 example-data.json
2. 复制全部内容
3. 在Data标签粘贴
4. 查看示例项目和事件
```

## 📁 项目结构

```
action/
├── app/
│   └── index.tsx              # 主应用（含DataView组件）
├── hooks/
│   ├── useAppData.ts          # ✨ 新增: 自动保存hook
│   └── [其他hooks]
├── utils/
│   ├── storage.ts             # ✨ 新增: 存储操作模块
│   └── [其他工具]
├── 📄 QUICK_START.md          # ✨ 新增: 快速开始指南
├── 📄 DATA_IMPORT_EXPORT.md   # ✨ 新增: 完整用户指南
├── 📄 IMPLEMENTATION_NOTES.md  # ✨ 新增: 技术文档
├── 📄 FEATURE_SUMMARY_ZH.md   # ✨ 新增: 功能总结(中文)
└── 📄 example-data.json        # ✨ 新增: 示例数据
```

## 💻 技术栈

### 使用的库
```json
{
  "@react-native-async-storage/async-storage": "^1.x.x"
}
```

### 存储方案
- **本地存储**: AsyncStorage (React Native原生)
- **数据格式**: JSON
- **存储Key**: `action_app_data`
- **自动保存**: 每次数据改变

### TypeScript支持
- 完整的类型定义
- 类型安全的导入/导出
- 验证函数的完整签名

## 📖 文档指南

### 🔰 初学者
1. 先读 [QUICK_START.md](./QUICK_START.md) - 5分钟了解基本用法
2. 试试 example-data.json - 看看实际例子
3. 看 [DATA_IMPORT_EXPORT.md](./DATA_IMPORT_EXPORT.md) - 深入了解

### 🛠 开发者
1. 查看 [IMPLEMENTATION_NOTES.md](./IMPLEMENTATION_NOTES.md) - 技术实现
2. 阅读源代码注释：
   - `utils/storage.ts` - 存储操作
   - `hooks/useAppData.ts` - 自动保存
   - `app/index.tsx` - UI集成
3. 参考 example-data.json - 数据格式

### 🇨🇳 中文用户
1. 读 [FEATURE_SUMMARY_ZH.md](./FEATURE_SUMMARY_ZH.md) - 中文功能总结
2. 看 [DATA_IMPORT_EXPORT.md](./DATA_IMPORT_EXPORT.md) - 使用说明
3. 查看 [QUICK_START.md](./QUICK_START.md) - 快速操作

## 🎓 学习路径

```
非技术用户 → QUICK_START.md → Data标签页 → 试用导出/导入
                    ↓
            DATA_IMPORT_EXPORT.md → 常见问题
                    ↓
           FEATURE_SUMMARY_ZH.md → 了解概念

开发者 → IMPLEMENTATION_NOTES.md → 查看源代码 → 扩展功能
          ↓
       QUICK_START.md (技术部分) → 集成API
          ↓
       开发自己的功能
```

## 🔑 关键特性

### 1. 自动保存
- 透明的自动保存机制
- 无需用户手动点击保存按钮
- 数据跨应用重启持久化

### 2. 智能导入
- 自动验证JSON格式
- 详细的错误提示
- 支持部分字段的导入

### 3. 完整导出
- 包含所有数据 (项目、事件、链接、分类)
- 时间戳记录
- 版本信息

### 4. 数据安全
- 导入前提示备份
- 验证数据完整性
- 错误不会丢失数据

## 🧪 测试场景

### 场景 1: 新用户
```
1. 安装应用
2. 去Data标签
3. 粘贴example-data.json
4. 看示例项目和事件加载
```

### 场景 2: 备份恢复
```
1. 创建/修改一些项目
2. 导出数据保存
3. 清空应用数据
4. 导入备份文件恢复
```

### 场景 3: 迁移
```
设备A: 导出数据保存
设备B: 粘贴JSON导入数据
```

### 场景 4: 批量创建
```
1. 编写包含10个项目的JSON
2. 粘贴导入
3. 所有项目一次创建
```

## ⚙️ 配置说明

### 默认设置
```typescript
// 存储位置
const STORAGE_KEY = 'action_app_data';

// 版本号
const APP_VERSION = '1.0.0';

// 自动保存延迟 (可选，当前无延迟)
// const SAVE_DEBOUNCE = 1000; // 1秒
```

### 环境要求
- React Native / Expo
- TypeScript 4.9+
- Node.js 18+

## 🔗 集成指南

### 在你的组件中使用
```typescript
import { useAppData } from '@hooks/useAppData';

export default function MyApp() {
  const { isLoaded } = useAppData(
    projects, setProjects,
    events, setEvents,
    links, setLinks,
    categories, setCategories
  );

  return isLoaded ? <App /> : <Loading />;
}
```

### 手动保存和加载
```typescript
import { saveAppData, loadAppData } from '@utils/storage';

// 加载数据
const data = await loadAppData();

// 保存数据
await saveAppData({
  projects: [...],
  events: [...],
  links: [...],
  categories: {...},
  version: '1.0.0'
});
```

## 🐛 常见问题

### Q: 导入失败显示"Invalid format"
**A**: 检查JSON是否包含 `projects`、`events`、`links` 数组。参考 example-data.json。

### Q: 数据没有保存
**A**: 
1. 检查设备存储空间
2. 查看app日志是否有错误
3. 重启应用试试

### Q: 如何导出单个项目?
**A**: 当前导出全部。如需选择性导出，请参考 IMPLEMENTATION_NOTES.md 的未来计划。

### Q: 可以在web版本使用吗?
**A**: 当前基于AsyncStorage (React Native)。Web版本需要使用localStorage或其他方案。

### Q: 数据加密吗?
**A**: 当前不加密。生产环境建议启用设备加密。

更多问题见 [DATA_IMPORT_EXPORT.md](./DATA_IMPORT_EXPORT.md#troubleshooting)

## 📚 相关文件

| 文件 | 描述 | 大小 |
|------|------|------|
| utils/storage.ts | 核心存储操作 | 135行 |
| hooks/useAppData.ts | 自动保存hook | 60行 |
| app/index.tsx | DataView组件 | +150行 |
| QUICK_START.md | 快速指南 | 2.5KB |
| DATA_IMPORT_EXPORT.md | 完整文档 | 5.4KB |
| IMPLEMENTATION_NOTES.md | 技术细节 | 5.4KB |
| example-data.json | 示例数据 | 1.4KB |

## 🎯 下一步

### 立即开始
1. ✅ 阅读 QUICK_START.md
2. ✅ 试用导出/导入
3. ✅ 创建第一个备份

### 深入学习
1. 📖 阅读完整文档
2. 🔧 查看技术实现
3. 💡 思考自己的用例

### 扩展功能
1. 集成后端API
2. 添加云存储同步
3. 实现数据加密
4. 支持团队协作

## 📞 支持和反馈

- 📖 文档: 见上方文档指南
- 🐛 问题: 查看DATA_IMPORT_EXPORT.md的troubleshooting
- 💬 建议: 参考IMPLEMENTATION_NOTES.md的未来增强

---

**版本**: 1.0.0  
**最后更新**: 2025-12-01  
**状态**: ✅ 完全实现

🎉 **现在就去Data标签试试吧！**
