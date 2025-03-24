# 章节切换功能说明

## 功能概述

章节切换功能是阅读器的核心功能之一，允许用户在阅读过程中无缝切换到上一章或下一章。

## 功能特点

1. 上一章/下一章切换
2. 按钮状态自动管理
3. 加载状态提示
4. 阅读进度保存
5. 错误处理机制

## 实现细节

### 1. HTML 结构
```html
<div class="reader-nav">
    <div class="nav-group">
        <button id="prevChapterBtn" class="prev-chapter" ${!chapterInfo.prevUrl ? 'disabled' : ''}>上一章</button>
        <button id="nextChapterBtn" class="next-chapter" ${!chapterInfo.nextUrl ? 'disabled' : ''}>下一章</button>
    </div>
</div>
```

### 2. 事件处理
```javascript
// 上一章事件处理
this.handlePrevChapter = async () => {
    console.log("=== 点击上一章按钮 ===");
    if (chapterInfo.prevUrl) {
        await this.loadChapter(chapterInfo.prevUrl);
    }
};

// 下一章事件处理
this.handleNextChapter = async () => {
    console.log("=== 点击下一章按钮 ===");
    console.log("当前章节信息:", {
        title: chapterInfo.title,
        url: chapterInfo.url,
        nextUrl: chapterInfo.nextUrl
    });
    if (chapterInfo.nextUrl) {
        await this.loadChapter(chapterInfo.nextUrl);
    }
};
```

### 3. 事件绑定
```javascript
// 获取按钮元素
const prevButton = document.getElementById('prevChapterBtn');
const nextButton = document.getElementById('nextChapterBtn');

// 移除旧的事件监听器
prevButton?.removeEventListener('click', this.handlePrevChapter);
nextButton?.removeEventListener('click', this.handleNextChapter);

// 添加新的事件监听器
prevButton?.addEventListener('click', this.handlePrevChapter);
nextButton?.addEventListener('click', this.handleNextChapter);
```

### 4. 章节加载
```javascript
async loadChapter(url) {
    console.log("=== 开始加载章节 ===");
    console.log("原始URL:", url);
    
    // 检查当前书籍信息
    if (!this.currentBook) {
        console.error("当前书籍信息不存在");
        return;
    }

    // 显示加载提示
    const loadingContainer = this.createLoadingContainer("正在加载章节内容...");
    
    try {
        // 处理URL
        url = this.processUrl(url);
        // 获取章节内容
        const chapterInfo = await this.fetchChapterContent(url);
        // 更新阅读器内容
        await this.updateReaderContent(chapterInfo);
    } catch (error) {
        this.handleError(error);
    } finally {
        // 移除加载提示
        document.body.removeChild(loadingContainer);
    }
}
```

### 5. 内容更新
```javascript
async updateReaderContent(chapterInfo) {
    // 更新阅读器HTML
    this.readerContainer.innerHTML = this.generateReaderHTML(chapterInfo);
    // 重新绑定事件
    this.bindReaderEvents(chapterInfo);
    // 更新阅读进度
    this.updateReadingProgress(chapterInfo);
    // 滚动到顶部
    this.scrollToTop();
}
```

### 6. 进度保存
```javascript
updateReadingProgress(chapterInfo) {
    const bookIndex = this.books.findIndex(book => book.url === this.currentBook.url);
    if (bookIndex !== -1) {
        // 更新书籍信息
        this.books[bookIndex] = {
            ...this.books[bookIndex],
            lastReadChapter: chapterInfo.title,
            lastReadUrl: chapterInfo.url,
            lastReadTime: new Date().toISOString()
        };
        // 更新当前书籍信息
        this.currentBook = this.books[bookIndex];
        // 保存到本地存储
        this.saveBooks();
    }
}
```

## 错误处理

### 1. URL 处理错误
```javascript
processUrl(url) {
    if (!url.startsWith('http')) {
        const baseUrl = new URL(this.currentBook.url).origin;
        url = new URL(url, baseUrl).href;
    }
    return url;
}
```

### 2. 加载失败重试
```javascript
async fetchChapterContent(url) {
    const processor = ProcessorFactory.createProcessor(url);
    let chapterInfo;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
        try {
            chapterInfo = await processor.getChapterContent(url);
            break;
        } catch (error) {
            retryCount++;
            if (retryCount === maxRetries) {
                throw new Error(`加载章节失败，已重试${maxRetries}次`);
            }
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
    }

    return this.processChapterUrls(chapterInfo, url);
}
```

## 性能优化

1. 事件解绑
   - 切换章节时移除旧事件监听器
   - 防止内存泄漏

2. URL处理
   - 相对路径转绝对路径
   - URL有效性验证

3. 加载状态
   - 显示加载提示
   - 禁用按钮防止重复点击

4. 错误重试
   - 自动重试失败的请求
   - 重试间隔递增

## 用户体验

1. 按钮状态
   - 首章禁用上一章按钮
   - 末章禁用下一章按钮
   - 加载中禁用所有按钮

2. 加载提示
   - 显示加载动画
   - 显示加载进度
   - 错误提示友好

3. 阅读位置
   - 自动滚动到顶部
   - 保存阅读进度
   - 记录最后阅读时间

## 待优化项

1. 预加载功能
   - 预加载下一章内容
   - 缓存最近阅读章节

2. 快捷键支持
   - 左右方向键切换章节
   - 快捷键提示

3. 过渡动画
   - 章节切换动画
   - 加载状态过渡

4. 离线支持
   - 缓存已读章节
   - 支持离线阅读

5. 阅读统计
   - 记录阅读时长
   - 统计阅读进度

## 注意事项

1. 内存管理
   - 及时清理不需要的事件监听器
   - 避免内存泄漏

2. 错误处理
   - 处理网络错误
   - 处理解析错误
   - 友好的错误提示

3. 状态同步
   - 保持按钮状态同步
   - 保持阅读进度同步
   - 保持本地存储同步 