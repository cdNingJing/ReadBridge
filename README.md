# ReadBridge 小说阅读器

一个基于 Web 的小说阅读器应用，支持多源小说阅读、书架管理和阅读进度保存。

## 功能特点

### 1. 书架管理
- 添加新书：支持通过 URL 添加小说
- 书籍展示：卡片式展示已添加的书籍
- 阅读进度：记录每本书的阅读进度和最后阅读时间
- 本地存储：使用 localStorage 保存书架数据

### 2. 阅读器核心功能
- 章节加载：支持加载和显示章节内容
- 章节导航：
  - 上一章/下一章切换
  - 目录浏览
  - 返回书架
- 阅读进度保存：自动保存阅读位置
- 分页显示：目录支持分页显示

### 3. 界面交互
- 模态框：用于添加新书
- 加载动画：显示加载状态
- 错误提示：统一的错误处理机制
- 响应式布局：适配不同屏幕大小

### 4. 数据处理
- URL 处理：支持相对路径和绝对路径
- 文本格式化：清理和格式化章节内容
- 时间格式化：显示阅读时间（如"3小时前"）
- 重试机制：加载失败时自动重试

### 5. 多源支持
- 处理器工厂：支持多个小说网站
- 基础处理器：提供统一的处理接口
- 特定网站处理器：针对不同网站的具体实现

## 项目结构

```
ReadBridge/
├── css/
│   ├── reader.css      # 阅读器样式
│   ├── base.css        # 基础样式
│   ├── catalog.css     # 目录样式
│   ├── modal.css       # 模态框样式
│   ├── bookshelf.css   # 书架样式
│   └── utilities.css   # 工具类样式
├── js/
│   ├── main.js         # 主要逻辑
│   ├── reader.js       # 阅读器核心
│   └── processors/     # 网站处理器
│       ├── BaseProcessor.js
│       ├── XbiquguProcessor.js
│       ├── BaiduDushuProcessor.js
│       ├── QidianProcessor.js
│       └── ProcessorFactory.js
└── index.html          # 主页面
```

## 核心类

### NovelReader 类
主要负责：
- 初始化阅读器
- 管理书架
- 处理阅读逻辑
- 管理用户界面
- 处理事件绑定

### ProcessorFactory 类
负责：
- 创建适当的处理器实例
- 处理不同网站的内容获取

## 数据结构

### 书籍信息
```javascript
{
    url: string,            // 书籍链接
    title: string,          // 书名
    author: string,         // 作者
    cover: string,          // 封面图片链接
    description: string,    // 简介
    lastReadChapter: string,// 最后阅读章节
    lastReadUrl: string,    // 最后阅读章节链接
    lastReadTime: string    // 最后阅读时间
}
```

### 章节信息
```javascript
{
    title: string,     // 章节标题
    content: string,   // 章节内容
    url: string,       // 当前章节链接
    prevUrl: string,   // 上一章链接
    nextUrl: string,   // 下一章链接
    catalogUrl: string // 目录链接
}
```

## 待优化功能
1. 阅读设置（字体大小、背景颜色等）
2. 离线阅读功能
3. 书签功能
4. 支持更多小说源
5. 搜索功能
6. 阅读统计
7. 导出功能

## 技术栈
- 原生 JavaScript
- HTML5
- CSS3
- localStorage 本地存储

## 开发规范

### 命名规范
- 文件夹名：小写，下划线分隔
- 文件名：驼峰命名
- 类名：大驼峰命名
- 变量名：小驼峰命名
- 函数名：小驼峰命名
- 常量名：大写，下划线分隔
- 枚举名：大驼峰命名
- 枚举值：大写，下划线分隔

### 代码规范
- 使用双引号作为默认字符串定界符
- Store 对象名以 Store 结尾
- 页面名以 Page 结尾
- 组件名以 View 结尾
- 服务逻辑名以 Bloc 结尾 