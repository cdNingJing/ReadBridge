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

        // 添加上一章按钮事件
        const prevBtn = document.querySelector(".prev-chapter");
        if (prevBtn && !prevBtn.disabled) {
            prevBtn.addEventListener("click", async () => {
                try {
                    const url = prevBtn.dataset.url;
                    const processor = new XbiquguProcessor();
                    const chapterData = await processor.getChapterContent(url);
                    displayChapterContent(chapterData);
                } catch (error) {
                    console.error("获取上一章内容时出错:", error);
                    contentDiv.innerHTML = `<div class="error">获取上一章内容时出错: ${error.message}</div>`;
                }
            });
        }

        // 添加下一章按钮事件
        const nextBtn = document.querySelector(".next-chapter");
        if (nextBtn && !nextBtn.disabled) {
            nextBtn.addEventListener("click", async () => {
                try {
                    const url = nextBtn.dataset.url;
                    const processor = new XbiquguProcessor();
                    const chapterData = await processor.getChapterContent(url);
                    displayChapterContent(chapterData);
                } catch (error) {
                    console.error("获取下一章内容时出错:", error);
                    contentDiv.innerHTML = `<div class="error">获取下一章内容时出错: ${error.message}</div>`;
                }
            });
        }

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

        // 获取DOM元素
        this.urlInput = document.getElementById("urlInput");
        this.loadButton = document.getElementById("loadButton");
        this.addBookModal = document.getElementById("addBookModal");
        this.bookInfo = document.getElementById("bookInfo");
        this.bookTitle = document.getElementById("bookTitle");
        this.bookAuthor = document.getElementById("bookAuthor");
        this.bookCover = document.getElementById("bookCover");
        this.confirmBtn = document.getElementById("confirmBtn");
        this.cancelBtn = document.getElementById("cancelBtn");
        this.addBookBtn = document.getElementById("addBookBtn");
        this.bookList = document.getElementById("bookList");

        // 创建阅读器容器
        this.readerContainer = document.createElement('div');
        this.readerContainer.className = 'reader-container';
        this.readerContainer.style.display = 'none';
        document.body.appendChild(this.readerContainer);

        // 加载本地存储的书籍
        this.loadBooks();

        // 绑定事件
        this.bindEvents();
        
        // 渲染书架
        this.renderBookshelf();
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
        try {
            console.log(`开始打开书籍: ${book.title}`);
            console.log(`书籍URL: ${book.url}`);
            
            const processor = ProcessorFactory.createProcessor(book.url);
            console.log(`创建处理器成功: ${processor.constructor.name}`);
            
            let bookInfo;

            // 如果有上次阅读的章节，直接打开该章节
            if (book.lastReadChapter && book.lastReadUrl) {
                console.log(`尝试打开上次阅读的章节: ${book.lastReadChapter}`);
                bookInfo = await processor.getChapterContent(book.lastReadUrl);
            }

            // 如果没有上次阅读的章节或找不到，则打开目录页
            if (!bookInfo) {
                console.log(`打开目录页面: ${book.url}`);
                bookInfo = await processor.process(book.url);
                console.log(`获取到目录信息: ${bookInfo.chapters.length} 个章节`);
                
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
            console.error("打开书籍失败，详细错误信息:", {
                message: error.message,
                stack: error.stack,
                book: {
                    title: book.title,
                    url: book.url,
                    lastReadChapter: book.lastReadChapter,
                    lastReadUrl: book.lastReadUrl
                }
            });
            alert(`打开书籍失败: ${error.message}\n请检查网络连接或稍后重试`);
        }
    }

    showReader(book, bookInfo) {
        // 隐藏首页
        document.querySelector(".container").style.display = "none";
        
        // 显示阅读器
        this.readerContainer.style.display = "block";
        
        // 更新阅读器内容
        this.readerContainer.innerHTML = `
            <main class="reader-content">
                <h1 class="chapter-title">${bookInfo.title}</h1>
                <div class="chapter-content">${bookInfo.content}</div>
            </main>
            <div class="reader-nav">
                <div class="nav-group">
                    <a href="/" class="back-btn">书架</a>
                    <button class="catalog-btn">目录</button>
                    <button class="prev-chapter" ${!bookInfo.prevUrl ? 'disabled' : ''}>上一章</button>
                    <button class="next-chapter" ${!bookInfo.nextUrl ? 'disabled' : ''}>下一章</button>
                </div>
            </div>
        `;

        // 绑定导航按钮事件
        const prevButton = this.readerContainer.querySelector('.prev-chapter');
        const nextButton = this.readerContainer.querySelector('.next-chapter');
        const catalogButton = this.readerContainer.querySelector('.catalog-btn');

        if (bookInfo.prevUrl) {
            prevButton.addEventListener('click', () => {
                this.loadChapter(bookInfo.prevUrl);
                // 滚动到顶部
                window.scrollTo(0, 0);
            });
        }

        if (bookInfo.nextUrl) {
            nextButton.addEventListener('click', () => {
                this.loadChapter(bookInfo.nextUrl);
                // 滚动到顶部
                window.scrollTo(0, 0);
            });
        }

        // 添加目录按钮事件
        catalogButton.addEventListener('click', () => {
            if (!this.currentBook.chapters) {
                // 如果没有章节列表，重新加载
                this.openBook(book);
            } else {
                this.showCatalog(this.currentBook.chapters);
            }
            // 滚动到顶部
            window.scrollTo(0, 0);
        });

        // 保存当前阅读状态
        this.currentBook = {
            ...book,
            chapters: book.chapters || []
        };
        this.currentChapter = bookInfo;
        book.lastReadChapter = bookInfo.title;
        book.lastReadUrl = bookInfo.url;
        book.lastReadTime = new Date().toISOString();
        this.saveBooks();

        // 滚动到顶部
        window.scrollTo(0, 0);
    }

    async loadChapter(url) {
        try {
            console.log(`开始加载章节，原始URL: ${url}`);
            
            // 检查 URL 是否需要拼接
            if (!url.startsWith('http')) {
                const baseUrl = new URL(this.currentBook.url).origin;
                url = new URL(url, baseUrl).href;
                console.log(`URL 已拼接完整: ${url}`);
            } else {
                console.log(`URL 已经是完整路径`);
            }

            const processor = ProcessorFactory.createProcessor(url);
            console.log(`创建处理器成功: ${processor.constructor.name}`);
            
            const chapterInfo = await processor.getChapterContent(url);
            console.log(`获取章节信息:`, {
                title: chapterInfo.title,
                prevUrl: chapterInfo.prevUrl,
                nextUrl: chapterInfo.nextUrl,
                content: chapterInfo.content?.substring(0, 100) + '...' // 只打印内容的前100个字符
            });
            
            if (!this.readerContainer) {
                this.readerContainer = document.createElement('div');
                this.readerContainer.className = 'reader-container';
                document.body.appendChild(this.readerContainer);
            }

            // 如果没有章节列表，重新获取
            if (!this.currentBook.chapters) {
                console.log("重新获取章节列表");
                const bookInfo = await processor.process(this.currentBook.url);
                this.currentBook.chapters = bookInfo.chapters;
                console.log(`获取到章节列表，共 ${bookInfo.chapters.length} 章`);
            }

            // 处理上一章/下一章的 URL
            if (chapterInfo.prevUrl && !chapterInfo.prevUrl.startsWith('http')) {
                chapterInfo.prevUrl = new URL(chapterInfo.prevUrl, new URL(url).origin).href;
                console.log(`处理后的上一章URL: ${chapterInfo.prevUrl}`);
            }
            if (chapterInfo.nextUrl && !chapterInfo.nextUrl.startsWith('http')) {
                chapterInfo.nextUrl = new URL(chapterInfo.nextUrl, new URL(url).origin).href;
                console.log(`处理后的下一章URL: ${chapterInfo.nextUrl}`);
            }
            
            // 更新阅读器内容
            this.readerContainer.innerHTML = `
                <main class="reader-content">
                    <h1 class="chapter-title">${chapterInfo.title}</h1>
                    <div class="chapter-content">${chapterInfo.content}</div>
                </main>
                <div class="reader-nav">
                    <div class="nav-group">
                        <button class="back-btn">返回书架</button>
                        <button class="catalog-btn">目录</button>
                        <button class="prev-chapter" ${!chapterInfo.prevUrl ? 'disabled' : ''}>上一章</button>
                        <button class="next-chapter" ${!chapterInfo.nextUrl ? 'disabled' : ''}>下一章</button>
                    </div>
                </div>
            `;

            // 绑定导航按钮事件
            const prevButton = this.readerContainer.querySelector('.prev-chapter');
            const nextButton = this.readerContainer.querySelector('.next-chapter');
            const catalogButton = this.readerContainer.querySelector('.catalog-btn');
            const backButton = this.readerContainer.querySelector('.back-btn');

            if (chapterInfo.prevUrl) {
                prevButton.addEventListener('click', () => {
                    console.log(`点击上一章按钮，URL: ${chapterInfo.prevUrl}`);
                    this.loadChapter(chapterInfo.prevUrl);
                });
            }

            if (chapterInfo.nextUrl) {
                nextButton.addEventListener('click', () => {
                    console.log(`点击下一章按钮，URL: ${chapterInfo.nextUrl}`);
                    this.loadChapter(chapterInfo.nextUrl);
                });
            }

            // 添加目录按钮事件
            catalogButton.addEventListener('click', () => {
                if (!this.currentBook.chapters) {
                    this.openBook(this.currentBook);
                } else {
                    this.showCatalog(this.currentBook.chapters);
                }
            });

            // 添加返回书架按钮事件
            backButton.addEventListener('click', () => {
                this.backToHome();
            });

            // 更新当前章节信息
            this.currentChapter = chapterInfo;
            
            // 更新当前书籍的阅读进度
            const bookIndex = this.books.findIndex(book => book.url === this.currentBook.url);
            if (bookIndex !== -1) {
                this.books[bookIndex].lastReadChapter = chapterInfo.title;
                this.books[bookIndex].lastReadUrl = url;
                this.books[bookIndex].lastReadTime = new Date().toISOString();
                this.currentBook = this.books[bookIndex];
                
                // 保存到本地存储
                this.saveBooks();
                console.log(`保存阅读进度成功:`, {
                    bookTitle: this.currentBook.title,
                    chapter: chapterInfo.title,
                    url: url,
                    time: this.books[bookIndex].lastReadTime
                });
            } else {
                console.warn("未找到当前书籍在书架中的记录");
            }

            // 隐藏其他内容
            document.querySelector(".container").style.display = "none";
            this.readerContainer.style.display = "block";

            // 执行滚动
            console.log("开始执行滚动操作");
            
            // 方法1：使用 window.scrollTo
            console.log("尝试方法1：window.scrollTo");
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
            
            // 方法2：使用 document.documentElement.scrollTop
            console.log("尝试方法2：document.documentElement.scrollTop");
            document.documentElement.scrollTop = 0;
            
            // 方法3：使用 readerContainer 的 scrollTop
            console.log("尝试方法3：readerContainer.scrollTop");
            this.readerContainer.scrollTop = 0;
            
            // 方法4：使用 setTimeout 延迟执行
            console.log("尝试方法4：setTimeout延迟执行");
            setTimeout(() => {
                console.log("执行延迟滚动");
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
                document.documentElement.scrollTop = 0;
                this.readerContainer.scrollTop = 0;
            }, 100);

            // 打印当前滚动位置
            console.log("当前滚动位置:", {
                windowScrollY: window.scrollY,
                documentElementScrollTop: document.documentElement.scrollTop,
                readerContainerScrollTop: this.readerContainer.scrollTop
            });

        } catch (error) {
            console.error("加载章节失败，详细错误信息:", {
                message: error.message,
                stack: error.stack,
                url: url,
                currentBook: this.currentBook?.title,
                currentChapter: this.currentChapter?.title
            });
            alert(`加载章节失败: ${error.message}\n请检查网络连接或稍后重试`);
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
            const PAGE_SIZE = 200;
            const totalPages = Math.ceil(chapters.length / PAGE_SIZE);
            let currentPage = 1;

            // 创建分页函数
            const renderPage = (page) => {
                const start = (page - 1) * PAGE_SIZE;
                const end = start + PAGE_SIZE;
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