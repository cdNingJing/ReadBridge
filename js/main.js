document.addEventListener("DOMContentLoaded", () => {
    const urlInput = document.getElementById("urlInput");
    const loadButton = document.getElementById("loadButton");
    const contentDiv = document.getElementById("content");
    let title = "";
    let author = "";
    let allChapters = [];
    let currentPage = 1;
    const PAGE_SIZE = 20;

    // 加载按钮点击事件
    loadButton.addEventListener("click", async () => {
        try {
            const url = urlInput.value.trim();
            if (!url) {
                alert("请输入小说网址");
                return;
            }

            // 显示加载提示
            contentDiv.innerHTML = "<div class='loading'>正在加载内容，请稍候...</div>";

            // 创建处理器实例
            const processor = new XbiquguProcessor();
            
            // 处理URL
            const result = await processor.process(url);
            
            // 保存小说信息
            title = result.title;
            author = result.author;
            allChapters = result.chapters;

            // 如果是章节页面，直接显示章节内容
            if (result.currentChapter) {
                displayChapterContent(result.currentChapter);
            } else {
                // 否则显示章节列表
                displayChapters(1);
            }
        } catch (error) {
            console.error("获取内容时出错:", error);
            contentDiv.innerHTML = `<div class="error">获取内容时出错: ${error.message}</div>`;
        }
    });

    // 显示章节内容
    function displayChapterContent(chapterData) {
        contentDiv.innerHTML = `
            <div class="chapter-content">
                <div class="chapter-header">
                    <h2 class="chapter-title">${chapterData.title}</h2>
                    <div class="chapter-info">
                        <span class="novel-title">${title}</span>
                        <span class="author-name">${author}</span>
                    </div>
                </div>
                <div class="article-content">
                    ${chapterData.content}
                </div>
                <div class="navigation">
                    <button class="nav-btn prev-chapter" ${!chapterData.prevUrl ? 'disabled' : ''} data-url="${chapterData.prevUrl}">上一章</button>
                    <button class="nav-btn back-to-list" data-url="${chapterData.catalogUrl}">返回目录</button>
                    <button class="nav-btn next-chapter" ${!chapterData.nextUrl ? 'disabled' : ''} data-url="${chapterData.nextUrl}">下一章</button>
                </div>
            </div>
        `;

        // 添加导航按钮事件
        document.querySelector(".back-to-list").addEventListener("click", () => {
            displayChapters(currentPage);
        });

        // 滚动到顶部
        window.scrollTo(0, 0);
    }

    // 显示章节列表
    function displayChapters(page = 1) {
        currentPage = page;
        const start = (page - 1) * PAGE_SIZE;
        const end = start + PAGE_SIZE;
        const pageChapters = allChapters.slice(start, end);
        const totalPages = Math.ceil(allChapters.length / PAGE_SIZE);

        const chaptersHtml = pageChapters.map(chapter => {
            const activeClass = chapter.isCurrent ? 'active' : '';
            return `
                <div class="chapter-item ${activeClass}" data-url="${chapter.url}">
                    <span class="chapter-title">${chapter.title}</span>
                </div>
            `;
        }).join("");

        // 添加分页控件
        const paginationHtml = `
            <div class="pagination">
                <button class="page-btn" ${page === 1 ? 'disabled' : ''} data-page="${page - 1}">上一页</button>
                <span class="page-info">第 ${page} 页 / 共 ${totalPages} 页</span>
                <button class="page-btn" ${page === totalPages ? 'disabled' : ''} data-page="${page + 1}">下一页</button>
            </div>
        `;

        contentDiv.innerHTML = `
            <div class="novel-info">
                <h1>${title}</h1>
                <p class="author">作者：${author}</p>
            </div>
            <div class="chapter-list">
                <h2>目录 (共${allChapters.length}章)</h2>
                <div class="chapters">
                    ${chaptersHtml}
                </div>
                ${paginationHtml}
            </div>
        `;

        // 添加章节点击事件
        document.querySelectorAll(".chapter-item").forEach(item => {
            item.addEventListener("click", async () => {
                try {
                    const url = item.dataset.url;
                    const processor = new XbiquguProcessor();
                    const chapterData = await processor.getChapterContent(url);
                    displayChapterContent(chapterData);
                } catch (error) {
                    console.error("获取章节内容时出错:", error);
                    contentDiv.innerHTML = `<div class="error">获取章节内容时出错: ${error.message}</div>`;
                }
            });
        });

        // 添加分页按钮事件
        document.querySelectorAll(".page-btn").forEach(btn => {
            if (!btn.disabled) {
                btn.addEventListener("click", () => {
                    const newPage = parseInt(btn.dataset.page);
                    displayChapters(newPage);
                });
            }
        });
    }
});

function cleanText(text) {
    return text
        .replace(/\s+/g, " ")
        .replace(/\n+/g, "\n")
        .replace(/手机阅读.*?免费阅读/g, "")
        .replace(/香书小说.*?最新章节/g, "")
        .trim();
}

function formatText(text) {
    return text
        .split("\n")
        .map(paragraph => paragraph.trim())
        .filter(paragraph => paragraph.length > 0)
        .map(paragraph => `<p>${paragraph}</p>`)
        .join("");
}

function formatReadTime(timestamp) {
    const now = new Date();
    const readTime = new Date(timestamp);
    const diff = now - readTime;
    
    // 转换为小时、天数和月数
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const months = Math.floor(days / 30);
    
    if (months > 12) {
        return "一年多前";
    } else if (months > 0) {
        return `${months}个月前`;
    } else if (days > 0) {
        return days > 1 ? `${days}天前` : "昨天";
    } else if (hours > 0) {
        return `${hours}小时前`;
    } else {
        return "刚刚";
    }
}

class NovelReader {
    constructor() {
        // 初始化属性
        this.books = [];
        this.currentBook = null;
        this.currentChapter = null;
        this.readerContainer = null;
        this.PAGE_SIZE = 200;  // 目录每页显示章节数

        // 添加代理服务配置
        this.PROXY_SERVICES = [
            {
                name: "allorigins",
                url: "https://api.allorigins.win/raw?url=",
                headers: {
                    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                    "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "cross-site"
                }
            },
            {
                name: "cors-anywhere",
                url: "https://cors-anywhere.herokuapp.com/",
                headers: {
                    "X-Requested-With": "XMLHttpRequest"
                }
            },
            {
                name: "cors-proxy",
                url: "https://api.codetabs.com/v1/proxy?quest=",
                headers: {
                    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
                }
            }
        ];
        this.currentProxyIndex = 0;

        // 初始化
        this.initialize();
    }

    /**
     * 初始化阅读器
     */
    initialize() {
        this.initializeDOMElements();
        this.initializeReaderContainer();
        this.loadBooks();
        this.bindEvents();
        this.renderBookshelf();
    }

    /**
     * 初始化DOM元素
     */
    initializeDOMElements() {
        const elements = {
            urlInput: "urlInput",
            loadButton: "loadButton",
            addBookModal: "addBookModal",
            bookInfo: "bookInfo",
            bookTitle: "bookTitle",
            bookAuthor: "bookAuthor",
            bookCover: "bookCover",
            confirmBtn: "confirmBtn",
            cancelBtn: "cancelBtn",
            addBookBtn: "addBookBtn",
            bookList: "bookList"
        };

        Object.entries(elements).forEach(([key, id]) => {
            this[key] = document.getElementById(id);
        });
    }

    /**
     * 初始化阅读器容器
     */
    initializeReaderContainer() {
        this.readerContainer = document.createElement('div');
        this.readerContainer.className = 'reader-container';
        this.readerContainer.style.display = 'none';
        document.body.appendChild(this.readerContainer);
    }

    /**
     * 创建加载动画容器
     * @param {string} message - 加载提示信息
     * @returns {HTMLElement} 加载动画容器
     */
    createLoadingContainer(message) {
        const container = document.createElement('div');
        container.id = "loadingContainer";
        container.className = 'loading-container';
        container.innerHTML = `
            <div id="loadingSpinner" class="loading-spinner"></div>
            <div id="loadingText" class="loading-text">${message}</div>
        `;
        document.body.appendChild(container);
        return container;
    }

    /**
     * 移除加载动画容器
     */
    removeLoadingContainer() {
        const container = document.getElementById("loadingContainer");
        if (container) {
            document.body.removeChild(container);
        }
    }

    /**
     * 统一错误处理
     * @param {Error} error - 错误对象
     * @param {string} [customMessage] - 自定义错误提示
     */
    handleError(error, customMessage) {
        console.error("错误详情:", {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        alert(customMessage || `操作失败: ${error.message}\n请检查网络连接或稍后重试`);
    }

    /**
     * 处理URL
     * @param {string} url - 原始URL
     * @returns {string} 处理后的URL
     */
    processUrl(url) {
        if (!url.startsWith('http')) {
            const baseUrl = new URL(this.currentBook.url).origin;
            url = new URL(url, baseUrl).href;
        }
        return url;
    }

    /**
     * 获取下一个可用的代理服务
     * @returns {Object} 代理服务配置
     */
    getNextProxy() {
        this.currentProxyIndex = (this.currentProxyIndex + 1) % this.PROXY_SERVICES.length;
        return this.PROXY_SERVICES[this.currentProxyIndex];
    }

    /**
     * 使用代理获取内容
     * @param {string} url - 原始URL
     * @param {number} retryCount - 当前重试次数
     * @returns {Promise<string>} 响应内容
     */
    async fetchWithProxy(url, retryCount = 0) {
        const MAX_RETRIES = this.PROXY_SERVICES.length;
        const currentProxy = this.PROXY_SERVICES[this.currentProxyIndex];
        
        try {
            console.log(`尝试使用代理服务: ${currentProxy.name}`);
            const proxyUrl = currentProxy.url + encodeURIComponent(url);
            
            const response = await fetch(proxyUrl, {
                headers: {
                    ...currentProxy.headers,
                    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36"
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.text();
        } catch (error) {
            console.error(`代理服务 ${currentProxy.name} 请求失败:`, error);

            if (retryCount < MAX_RETRIES - 1) {
                console.log(`切换到下一个代理服务重试...`);
                this.getNextProxy();
                return this.fetchWithProxy(url, retryCount + 1);
            }

            throw new Error(`所有代理服务都失败，请稍后重试`);
        }
    }

    /**
     * 获取章节内容
     * @param {string} url - 章节URL
     * @returns {Promise<Object>} 章节信息
     */
    async fetchChapterContent(url) {
        const processor = ProcessorFactory.createProcessor(url);
        let chapterInfo;
        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries) {
            try {
                // 使用代理获取内容
                const content = await this.fetchWithProxy(url);
                chapterInfo = await processor.parseChapterContent(content);
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

    /**
     * 处理章节URL
     * @param {Object} chapterInfo - 章节信息
     * @param {string} baseUrl - 基础URL
     * @returns {Object} 处理后的章节信息
     */
    processChapterUrls(chapterInfo, baseUrl) {
        const origin = new URL(baseUrl).origin;
        ['nextUrl', 'prevUrl'].forEach(key => {
            if (chapterInfo[key] && !chapterInfo[key].startsWith('http')) {
                chapterInfo[key] = new URL(chapterInfo[key], origin).href;
            }
        });
        return chapterInfo;
    }

    /**
     * 更新阅读器内容
     * @param {Object} chapterInfo - 章节信息
     */
    async updateReaderContent(chapterInfo) {
        this.readerContainer.innerHTML = this.generateReaderHTML(chapterInfo);
        this.bindReaderEvents(chapterInfo);
        this.updateReadingProgress(chapterInfo);
        this.scrollToTop();
    }

    /**
     * 生成阅读器HTML
     * @param {Object} chapterInfo - 章节信息
     * @returns {string} HTML内容
     */
    generateReaderHTML(chapterInfo) {
        return `
            <main class="reader-content">
                <h1 id="chapterTitle" class="chapter-title">${chapterInfo.title}</h1>
                <div id="chapterContent" class="chapter-content">${chapterInfo.content}</div>
            </main>
            <div class="reader-nav">
                <div class="nav-group">
                    <button id="backBtn" class="back-btn">返回书架</button>
                    <button id="catalogBtn" class="catalog-btn">目录</button>
                    <button id="prevChapterBtn" class="prev-chapter" ${!chapterInfo.prevUrl ? 'disabled' : ''}>上一章</button>
                    <button id="nextChapterBtn" class="next-chapter" ${!chapterInfo.nextUrl ? 'disabled' : ''}>下一章</button>
                </div>
            </div>
        `;
    }

    /**
     * 更新阅读进度
     * @param {Object} chapterInfo - 章节信息
     */
    updateReadingProgress(chapterInfo) {
        const bookIndex = this.books.findIndex(book => book.url === this.currentBook.url);
        if (bookIndex !== -1) {
            this.books[bookIndex] = {
                ...this.books[bookIndex],
                lastReadChapter: chapterInfo.title,
                lastReadUrl: chapterInfo.url,
                lastReadTime: new Date().toISOString()
            };
            this.currentBook = this.books[bookIndex];
            this.saveBooks();
        }
    }

    /**
     * 滚动到顶部
     */
    scrollToTop() {
        window.scrollTo(0, 0);
    }

    /**
     * 切换页面显示状态
     * @param {boolean} showReader - 是否显示阅读器
     */
    togglePageDisplay(showReader) {
        const container = document.querySelector(".container");
        if (container) {
            container.style.display = showReader ? "none" : "block";
        }
        if (this.readerContainer) {
            this.readerContainer.style.display = showReader ? "block" : "none";
        }
    }

    loadBooks() {
        try {
            const savedBooks = localStorage.getItem("books");
            if (savedBooks) {
                this.books = JSON.parse(savedBooks);
                console.log(`成功加载 ${this.books.length} 本书籍`);
            } else {
                this.books = [];
                console.log("本地存储中没有书籍数据");
            }
        } catch (error) {
            console.error("加载本地存储的书籍失败:", error);
            this.books = [];
        }
    }

    bindEvents() {
        // 添加书籍按钮点击事件
        this.addBookBtn.addEventListener("click", () => this.showAddBookModal());

        // 加载按钮点击事件
        this.loadButton.addEventListener("click", () => this.loadBookInfo());

        // 取消按钮点击事件
        this.cancelBtn.addEventListener("click", () => this.hideAddBookModal());

        // 确认按钮点击事件
        this.confirmBtn.addEventListener("click", () => this.addBook());

        // 点击模态框外部关闭
        this.addBookModal.addEventListener("click", (e) => {
            if (e.target === this.addBookModal) {
                this.hideAddBookModal();
            }
        });
    }

    showAddBookModal() {
        this.addBookModal.style.display = "block";
        this.urlInput.value = "";
        this.bookInfo.style.display = "none";
    }

    hideAddBookModal() {
        this.addBookModal.style.display = "none";
        this.urlInput.value = "";
        this.bookInfo.style.display = "none";
    }

    async loadBookInfo() {
        const url = this.urlInput.value.trim();
        if (!url) {
            alert("请输入小说网址");
            return;
        }

        // 创建并显示加载动画
        const loadingContainer = document.createElement('div');
        loadingContainer.className = 'loading-container';
        loadingContainer.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-text">正在加载书籍信息...</div>
        `;
        document.body.appendChild(loadingContainer);

        // 禁用加载按钮
        this.loadButton.disabled = true;

        try {
            const processor = ProcessorFactory.createProcessor(url);
            const bookInfo = await processor.process(url);
            
            // 显示书籍信息
            this.bookInfo.style.display = "flex";
            this.bookTitle.textContent = bookInfo.title;
            this.bookAuthor.textContent = `作者：${bookInfo.author}`;
            
            // 显示简介
            const descriptionElement = document.getElementById("bookDescription");
            if (bookInfo.description) {
                descriptionElement.textContent = bookInfo.description;
                descriptionElement.style.display = "block";
            } else {
                descriptionElement.style.display = "none";
            }
            
            // 显示封面
            this.bookCover.src = bookInfo.cover || "images/default-cover.jpg";
            
            // 保存当前书籍信息
            this.currentBook = {
                url,
                title: bookInfo.title,
                author: bookInfo.author,
                cover: bookInfo.cover || "",
                description: bookInfo.description || "",
                lastReadChapter: null,
                lastReadUrl: null
            };
        } catch (error) {
            console.error("加载书籍信息失败:", error);
            alert("加载书籍信息失败，请检查网址是否正确");
        } finally {
            // 移除加载动画
            document.body.removeChild(loadingContainer);
            // 恢复加载按钮
            this.loadButton.disabled = false;
        }
    }

    addBook() {
        if (!this.currentBook) {
            alert("请先加载书籍信息");
            return;
        }

        // 检查是否已存在
        const existingIndex = this.books.findIndex(book => book.url === this.currentBook.url);
        if (existingIndex !== -1) {
            alert("该书籍已存在");
            return;
        }

        // 添加新书
        this.books.push(this.currentBook);
        this.saveBooks();
        this.renderBookshelf();
        this.hideAddBookModal();
    }

    saveBooks() {
        localStorage.setItem("books", JSON.stringify(this.books));
    }

    renderBookshelf() {
        this.bookList.innerHTML = "";
        this.books.forEach(book => {
            const bookCard = this.createBookCard(book);
            this.bookList.appendChild(bookCard);
        });
    }

    createBookCard(book) {
        const card = document.createElement("div");
        card.className = "book-card";
        card.innerHTML = `
            <div class="book-cover">
                <img src="${book.cover || "images/default-cover.jpg"}" alt="${book.title}">
            </div>
            <div class="book-info">
                <h3 class="book-title">${book.title}</h3>
                <p class="book-author">${book.author}</p>
                ${book.lastReadChapter ? `
                    <p class="last-read">上次读到：${book.lastReadChapter}</p>
                    <span class="read-time">${formatReadTime(book.lastReadTime)}</span>
                ` : ""}
            </div>
        `;

        card.addEventListener("click", () => this.openBook(book));
        return card;
    }

    async openBook(book) {
        // 创建并显示加载动画
        const loadingContainer = document.createElement('div');
        loadingContainer.className = 'loading-container';
        loadingContainer.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-text">正在打开书籍...</div>
        `;
        document.body.appendChild(loadingContainer);

        try {
            const processor = ProcessorFactory.createProcessor(book.url);
            let bookInfo;

            // 如果有上次阅读的章节，直接打开该章节
            if (book.lastReadChapter && book.lastReadUrl) {
                bookInfo = await processor.getChapterContent(book.lastReadUrl);
            }

            // 如果没有上次阅读的章节或找不到，则打开目录页
            if (!bookInfo) {
                bookInfo = await processor.process(book.url);
                
                // 设置当前书籍
                this.currentBook = {
                    ...book,
                    chapters: bookInfo.chapters
                };
                
                // 显示目录页面
                this.showCatalog(bookInfo.chapters);
                return;
            }

            // 显示阅读器
            this.showReader(book, bookInfo);
        } catch (error) {
            console.error("打开书籍失败:", error);
            alert(`打开书籍失败: ${error.message}\n请检查网络连接或稍后重试`);
        } finally {
            // 移除加载动画
            document.body.removeChild(loadingContainer);
        }
    }

    showReader(book, bookInfo) {
        // 隐藏首页
        document.querySelector(".container").style.display = "none";
        
        // 显示阅读器
        this.readerContainer.style.display = "block";
        
        // 设置当前书籍信息
        this.currentBook = {
            ...book,
            chapters: book.chapters || []
        };
        this.currentChapter = bookInfo;
        
        // 更新阅读器内容
        this.readerContainer.innerHTML = `
            <main class="reader-content">
                <h1 id="chapterTitle" class="chapter-title">${bookInfo.title}</h1>
                <div id="chapterContent" class="chapter-content">${bookInfo.content}</div>
            </main>
            <div class="reader-nav">
                <div class="nav-group">
                    <button id="backBtn" class="back-btn">返回书架</button>
                    <button id="catalogBtn" class="catalog-btn">目录</button>
                    <button id="prevChapterBtn" class="prev-chapter" ${!bookInfo.prevUrl ? 'disabled' : ''}>上一章</button>
                    <button id="nextChapterBtn" class="next-chapter" ${!bookInfo.nextUrl ? 'disabled' : ''}>下一章</button>
                </div>
            </div>
        `;

        // 绑定阅读器事件
        this.bindReaderEvents(bookInfo);
    }

    // 添加新方法用于绑定阅读器事件
    bindReaderEvents(chapterInfo) {
        console.log("=== 绑定阅读器事件 ===");
        console.log("当前章节信息:", {
            title: chapterInfo.title,
            url: chapterInfo.url,
            nextUrl: chapterInfo.nextUrl,
            prevUrl: chapterInfo.prevUrl
        });

        const prevButton = document.getElementById('prevChapterBtn');
        const nextButton = document.getElementById('nextChapterBtn');
        const catalogButton = document.getElementById('catalogBtn');
        const backButton = document.getElementById('backBtn');

        // 移除之前的事件监听器
        prevButton?.removeEventListener('click', this.handlePrevChapter);
        nextButton?.removeEventListener('click', this.handleNextChapter);
        catalogButton?.removeEventListener('click', this.handleCatalog);
        backButton?.removeEventListener('click', this.handleBackToHome);

        // 创建事件处理函数
        this.handlePrevChapter = async () => {
            console.log("=== 点击上一章按钮 ===", chapterInfo);
            if (chapterInfo.prevUrl) {
                await this.loadChapter(chapterInfo.prevUrl);
            }
        };

        this.handleNextChapter = async () => {
            console.log("=== 点击下一章按钮 === 111", chapterInfo);
            console.log("当前章节信息:", {
                title: chapterInfo.title,
                url: chapterInfo.url,
                nextUrl: chapterInfo.nextUrl
            });
            if (chapterInfo.nextUrl) {
                await this.loadChapter(chapterInfo.nextUrl);
            }
        };

        this.handleCatalog = () => {
            console.log("=== 点击目录按钮 ===");
            if (!this.currentBook.chapters) {
                this.openBook(this.currentBook);
            } else {
                this.showCatalog(this.currentBook.chapters);
            }
        };

        this.handleBackToHome = () => {
            console.log("=== 点击返回书架按钮 ===");
            this.backToHome();
        };

        // 添加新的事件监听器
        prevButton?.addEventListener('click', this.handlePrevChapter);
        nextButton?.addEventListener('click', this.handleNextChapter);
        catalogButton?.addEventListener('click', this.handleCatalog);
        backButton?.addEventListener('click', this.handleBackToHome);
    }

    async loadChapter(url) {
        console.log("=== 开始加载章节 ===");
        console.log("原始URL:", url);
        
        if (!this.currentBook) {
            console.error("当前书籍信息不存在");
            return;
        }

        // 显示加载提示
        this.createLoadingContainer("正在加载章节内容...");
        
        try {
            url = this.processUrl(url);
            const chapterInfo = await this.fetchChapterContent(url);
            console.log("原始URL:", chapterInfo);
            await this.updateReaderContent(chapterInfo);
        } catch (error) {
            this.handleError(error);
        } finally {
            // 使用新方法移除加载提示
            this.removeLoadingContainer();
        }
    }

    async showCatalog(chapters) {
        try {
            if (!this.currentBook) {
                console.error("当前书籍未设置");
                return;
            }

            console.log(`加载目录页面: ${this.currentBook.url}`);
            
            // 分页设置
            const totalPages = Math.ceil(chapters.length / this.PAGE_SIZE);
            let currentPage = 1;

            // 创建分页函数
            const renderPage = (page) => {
                const start = (page - 1) * this.PAGE_SIZE;
                const end = start + this.PAGE_SIZE;
                const pageChapters = chapters.slice(start, end);

                // 显示目录页面
                const catalogHtml = `
                    <div class="reader-header">
                        <div class="reader-title">${this.currentBook.title} - 目录</div>
                        <div class="reader-nav">
                            <button onclick="reader.backToHome()">返回书架</button>
                        </div>
                    </div>
                    <div class="catalog-info">
                        <span>共 ${chapters.length} 章</span>
                        <span>第 ${page}/${totalPages} 页</span>
                    </div>
                    <div class="chapter-list">
                        ${pageChapters.map((chapter, index) => `
                            <div class="chapter-item ${chapter.url === (this.currentBook.lastReadUrl) ? 'current' : ''}">
                                <a href="javascript:void(0)" onclick="reader.loadChapter('${chapter.url}')">
                                    ${chapter.title}
                                </a>
                            </div>
                        `).join("")}
                    </div>
                    <div class="catalog-pagination">
                        <button onclick="reader.changePage(${page - 1})" ${page <= 1 ? 'disabled' : ''}>上一页</button>
                        <span class="page-info">${page} / ${totalPages}</span>
                        <button onclick="reader.changePage(${page + 1})" ${page >= totalPages ? 'disabled' : ''}>下一页</button>
                    </div>
                `;
                this.readerContainer.innerHTML = catalogHtml;
            };

            // 添加翻页方法到reader实例
            this.changePage = (newPage) => {
                if (newPage >= 1 && newPage <= totalPages) {
                    currentPage = newPage;
                    renderPage(currentPage);
                    // 滚动到顶部
                    this.readerContainer.scrollTop = 0;
                }
            };

            // 初始渲染第一页
            renderPage(currentPage);
            this.readerContainer.style.display = "block";
            document.querySelector(".container").style.display = "none";
        } catch (error) {
            console.error("加载目录失败:", error);
            alert("加载目录失败，请重试");
        }
    }

    backToHome() {
        // 确保在返回书架前保存阅读进度
        if (this.currentBook && this.currentChapter) {
            const bookIndex = this.books.findIndex(book => book.url === this.currentBook.url);
            if (bookIndex !== -1) {
                this.books[bookIndex].lastReadChapter = this.currentChapter.title;
                this.books[bookIndex].lastReadUrl = this.currentChapter.url;
                this.books[bookIndex].lastReadTime = new Date().toISOString();
                this.saveBooks();
                console.log("返回书架前保存阅读进度成功");
            }
        }

        // 隐藏阅读器，显示书架
        if (this.readerContainer) {
            this.readerContainer.style.display = "none";
        }
        const container = document.querySelector(".container");
        if (container) {
            container.style.display = "block";
        }

        // 重新渲染书架，确保显示最新的阅读进度
        this.renderBookshelf();
        console.log("返回书架成功");
    }
}

// 创建阅读器实例
const reader = new NovelReader(); 