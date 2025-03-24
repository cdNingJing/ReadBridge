# 章节导航功能说明

## 功能概述
章节导航功能允许用户在阅读时进行章节切换，包括：
- 切换到上一章
- 切换到下一章
- 显示导航按钮状态
- 自动保存阅读进度

## 实现方式

### 1. 导航按钮结构
```html
<div class="reader-nav">
    <div class="nav-group">
        <button id="prevChapterBtn" class="prev-chapter" ${!chapterInfo.prevUrl ? 'disabled' : ''}>上一章</button>
        <button id="nextChapterBtn" class="next-chapter" ${!chapterInfo.nextUrl ? 'disabled' : ''}>下一章</button>
    </div>
</div>
```

### 2. 事件绑定
```javascript
bindReaderEvents(chapterInfo) {
    // 获取导航按钮
    const prevButton = document.getElementById('prevChapterBtn');
    const nextButton = document.getElementById('nextChapterBtn');

    // 移除旧的事件监听器
    prevButton?.removeEventListener('click', this.handlePrevChapter);
    nextButton?.removeEventListener('click', this.handleNextChapter);

    // 创建事件处理函数
    this.handlePrevChapter = async () => {
        if (chapterInfo.prevUrl) {
            await this.loadChapter(chapterInfo.prevUrl);
        }
    };

    this.handleNextChapter = async () => {
        if (chapterInfo.nextUrl) {
            await this.loadChapter(chapterInfo.nextUrl);
        }
    };

    // 添加新的事件监听器
    prevButton?.addEventListener('click', this.handlePrevChapter);
    nextButton?.addEventListener('click', this.handleNextChapter);
}
```

### 3. 章节加载流程
```javascript
async loadChapter(url) {
    // 显示加载提示
    const loadingContainer = this.createLoadingContainer("正在加载章节内容...");
    
    try {
        // 处理URL（相对路径转绝对路径）
        url = this.processUrl(url);
        
        // 获取章节内容
        const chapterInfo = await this.fetchChapterContent(url);
        
        // 更新阅读器内容
        await this.updateReaderContent(chapterInfo);
        
        // 更新阅读进度
        this.updateReadingProgress(chapterInfo);
        
        // 滚动到顶部
        this.scrollToTop();
    } catch (error) {
        this.handleError(error);
    } finally {
        // 移除加载提示
        document.body.removeChild(loadingContainer);
    }
}
```

### 4. 阅读进度保存
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
        // 更新当前书籍
        this.currentBook = this.books[bookIndex];
        // 保存到本地存储
        this.saveBooks();
    }
}
```

## 错误处理
1. URL处理错误
2. 网络请求失败
3. 内容解析错误
4. 按钮状态错误

## 优化建议
1. 预加载功能
   - 提前加载下一章内容
   - 缓存已读章节
   
2. 阅读位置记忆
   - 记住滚动位置
   - 返回时恢复位置

3. 快捷键支持
   - 左右方向键切换章节
   - 快捷键提示

4. 用户体验优化
   - 添加过渡动画
   - 优化加载提示
   - 添加进度提示

5. 性能优化
   - 减少重复请求
   - 优化DOM操作
   - 添加请求缓存

## 注意事项
1. 确保URL正确性
2. 处理网络错误
3. 保存阅读进度
4. 按钮状态同步
5. 内存管理
6. 事件解绑 