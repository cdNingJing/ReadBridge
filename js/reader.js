document.addEventListener('DOMContentLoaded', async () => {
    // 获取URL参数
    const urlParams = new URLSearchParams(window.location.search);
    const url = urlParams.get('url');
    
    if (!url) {
        window.location.href = '/';
        return;
    }

    // 获取DOM元素
    const chapterTitle = document.getElementById('chapterTitle');
    const chapterContent = document.getElementById('chapterContent');
    const prevButton = document.getElementById('prevChapterBtn');
    const nextButton = document.getElementById('nextChapterBtn');
    const backButton = document.getElementById('backBtn');
    const catalogButton = document.getElementById('catalogBtn');

    // 创建处理器
    const processor = ProcessorFactory.createProcessor(url);

    try {
        // 获取章节内容
        const chapter = await processor.getChapterContent(url);
        
        // 更新页面标题
        document.title = `${chapter.title} - ReadBridge`;
        
        // 更新章节标题和内容
        chapterTitle.textContent = chapter.title;
        chapterContent.innerHTML = chapter.content;

        // 更新按钮状态和链接
        prevButton.disabled = !chapter.prevUrl;
        nextButton.disabled = !chapter.nextUrl;

        // 添加按钮点击事件
        if (chapter.prevUrl) {
            prevButton.onclick = () => {
                window.location.href = `reader.html?url=${encodeURIComponent(chapter.prevUrl)}`;
            };
        }

        if (chapter.nextUrl) {
            nextButton.onclick = () => {
                window.location.href = `reader.html?url=${encodeURIComponent(chapter.nextUrl)}`;
            };
        }

        // 添加键盘导航
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft' && !prevButton.disabled) {
                prevButton.click();
            } else if (e.key === 'ArrowRight' && !nextButton.disabled) {
                nextButton.click();
            }
        });

    } catch (error) {
        console.error('加载章节内容失败:', error);
        chapterContent.innerHTML = `<p class="error">加载失败: ${error.message}</p>`;
    }
}); 