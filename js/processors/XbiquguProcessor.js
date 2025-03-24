class XbiquguProcessor extends BaseProcessor {
    constructor() {
        super();
        this.baseUrl = "http://www.xbiqugu.la";
        this.defaultNovelUrl = "http://www.xbiqugu.la/0/218/";  // 默认小说链接
        // 定义多个代理服务
        this.proxyServices = {
            allorigins: {
                name: "allorigins",
                url: "https://api.allorigins.win/raw?url=",
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
                }
            },
            codetabs: {
                name: "codetabs",
                url: "https://api.codetabs.com/v1/proxy?quest=",
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
                }
            }
        };
    }

    // 判断链接类型
    isChapterPage(url) {
        return /\/\d+\.html$/.test(url);
    }

    // 获取小说ID
    getNovelId(url) {
        const matches = url.match(/\/(\d+)\/(\d+)\/?/);
        if (matches) {
            return {
                categoryId: matches[1],
                novelId: matches[2]
            };
        }
        return null;
    }

    async fetchWithRetry(url) {
        let lastError;
        let retryCount = 0;
        const maxRetries = 3;

        console.log(`开始获取URL: ${url}`);
        console.log(`可用的代理服务: ${Object.keys(this.proxyServices).join(", ")}`);

        // 遍历所有代理服务
        for (const proxyServiceName in this.proxyServices) {
            const proxyService = this.proxyServices[proxyServiceName];
            console.log(`\n尝试使用代理服务: ${proxyService.name}`);
            console.log(`代理服务URL: ${proxyService.url}`);
            
            // 对每个代理服务尝试多次
            while (retryCount < maxRetries) {
                try {
                    const proxyUrl = proxyService.url + encodeURIComponent(url);
                    console.log(`构建代理URL: ${proxyUrl}`);
                    
                    const options = {
                        method: 'GET',
                        mode: 'cors',
                        headers: {
                            ...proxyService.headers,
                            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
                        }
                    };
                    console.log(`请求头:`, proxyUrl, options);

                    console.log(`开始第 ${retryCount + 1} 次请求...`);
                    const response = await fetch(proxyUrl, options);
                    console.log(`收到响应，状态码: ${response.status}`);
                    
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    
                    const text = await response.text();
                    console.log(`获取到内容长度: ${text.length} 字符`);
                    
                    if (!text || text.length < 100) {
                        throw new Error("获取到的内容无效");
                    }
                    
                    console.log(`使用代理服务 ${proxyService.name} 成功获取内容`);
                    return text;
                } catch (error) {
                    console.warn(`代理服务 ${proxyService.name} 第 ${retryCount + 1} 次请求失败:`, error.message);
                    lastError = error;
                    retryCount++;
                    
                    if (retryCount < maxRetries) {
                        const delay = 1000 * retryCount;
                        console.log(`等待 ${delay}ms 后重试...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                }
            }
            retryCount = 0;
            console.log(`代理服务 ${proxyService.name} 的所有尝试都失败了，尝试下一个代理服务`);
        }
        
        console.error(`所有代理服务都失败了，最后一个错误: ${lastError.message}`);
        throw new Error(`所有代理服务都失败了: ${lastError.message}`);
    }

    async process(url) {
        try {
            console.log(`开始处理URL: ${url}`);
            const content = await this.fetchWithRetry(url);
            console.log(`成功获取页面内容，长度: ${content.length} 字符`);

            // 创建DOM解析器
            const parser = new DOMParser();
            const doc = parser.parseFromString(content, "text/html");
            console.log("成功解析HTML内容");

            // 提取标题
            const title = doc.querySelector("h1").textContent.trim();
            console.log(`提取到标题: ${title}`);

            // 提取作者
            const author = doc.querySelector("#info p").textContent.replace("作者：", "").trim();
            console.log(`提取到作者: ${author}`);

            // 提取最后更新时间
            const lastUpdate = doc.querySelector("#info p:last-child").textContent.replace("最后更新：", "").trim();
            console.log(`提取到最后更新时间: ${lastUpdate}`);

            // 提取封面图片
            const coverImg = doc.querySelector("#fmimg img");
            const cover = coverImg ? coverImg.src : "";
            console.log(`提取到封面图片: ${cover}`);

            // 提取简介
            const description = doc.querySelector("meta[property='og:description']")?.getAttribute("content")?.trim() || "";
            console.log(`提取到简介: ${description}`);

            // 提取章节列表
            const chapters = [];
            const chapterLinks = doc.querySelectorAll("#list dl dd a");
            console.log(`找到 ${chapterLinks.length} 个章节链接`);

            // 获取基础URL
            const baseUrl = "http://www.xbiqugu.la";

            chapterLinks.forEach((link, index) => {
                const href = link.getAttribute("href");
                // 确保使用完整的URL
                const chapterUrl = href.startsWith("http") ? href : `${baseUrl}${href}`;
                chapters.push({
                    title: link.textContent.trim(),
                    url: chapterUrl,
                    index: index + 1
                });
            });

            console.log(`成功提取 ${chapters.length} 个章节信息`);

            return {
                title,
                author,
                lastUpdate,
                cover,
                description,
                chapters,
                url
            };
        } catch (error) {
            console.error("处理页面时出错:", error);
            throw error;
        }
    }

    // 处理链接，确保返回完整的URL
    normalizeUrl(href, baseUrl = this.baseUrl) {
        if (!href) return null;
        
        // 如果是根路径或者相对路径
        if (href === "/" || href === "#") return null;
        
        try {
            // 如果是相对路径，需要处理
            if (href.startsWith("/")) {
                return `${baseUrl}${href}`;
            }
            
            // 如果已经是完整的URL
            if (href.startsWith("http")) {
                return href;
            }
            
            // 其他情况，使用 URL 构造函数
            return new URL(href, baseUrl).href;
        } catch (error) {
            console.warn(`无效的URL: ${href}, 错误: ${error.message}`);
            return null;
        }
    }

    async getChapterContent(url) {
        try {
            console.log(`开始获取章节内容: ${url}`);
            
            // 标准化URL
            url = this.normalizeUrl(url);
            if (!url) {
                throw new Error("无效的章节URL");
            }
            
            const content = await this.fetchWithRetry(url);
            const parser = new DOMParser();
            const doc = parser.parseFromString(content, "text/html");

            // 获取章节标题
            const titleElement = doc.querySelector(".bookname h1, h1.wap_none, #main h1");
            const title = titleElement ? titleElement.textContent.trim() : "";
            console.log(`获取到章节标题: ${title}`);

            // 获取章节内容
            const contentElement = doc.querySelector("#content, .showtxt");
            let chapterContent = contentElement ? contentElement.innerHTML : "";
            
            // 清理和格式化内容
            chapterContent = this.cleanText(chapterContent);
            chapterContent = this.formatText(chapterContent);
            console.log(`获取到章节内容，长度: ${chapterContent.length}`);

            // 获取导航链接
            let prevUrl = null;
            let nextUrl = null;
            let catalogUrl = null;

            // 尝试多种选择器来获取链接
            const links = doc.querySelectorAll("a");
            links.forEach(link => {
                const text = link.textContent.trim();
                const href = link.getAttribute("href");
                
                if (text.includes("上一章")) {
                    prevUrl = this.normalizeUrl(href);
                } else if (text.includes("下一章")) {
                    nextUrl = this.normalizeUrl(href);
                } else if (text.includes("章节目录") || text.includes("目录")) {
                    catalogUrl = this.normalizeUrl(href);
                }
            });

            // 如果上面的方法没找到，尝试其他选择器
            if (!prevUrl) {
                const prevLink = doc.querySelector(".bottem2 a:nth-child(1), .prev_chapter");
                prevUrl = prevLink ? this.normalizeUrl(prevLink.getAttribute("href")) : null;
            }
            if (!nextUrl) {
                const nextLink = doc.querySelector(".bottem2 a:nth-child(3), .next_chapter");
                nextUrl = nextLink ? this.normalizeUrl(nextLink.getAttribute("href")) : null;
            }
            if (!catalogUrl) {
                const catalogLink = doc.querySelector(".bottem2 a:nth-child(2), .directory");
                catalogUrl = catalogLink ? this.normalizeUrl(catalogLink.getAttribute("href")) : null;
            }

            console.log("导航链接处理结果:", {
                prevUrl,
                nextUrl,
                catalogUrl
            });

            return {
                title,
                content: chapterContent,
                url,
                prevUrl,
                nextUrl,
                catalogUrl
            };
        } catch (error) {
            console.error("获取章节内容时出错:", error);
            throw error;
        }
    }

    cleanText(text) {
        if (!text) return "";
        
        return text
            // 移除脚本和样式标签
            .replace(/<script[\s\S]*?<\/script>/gi, "")
            .replace(/<style[\s\S]*?<\/style>/gi, "")
            // 移除广告内容
            .replace(/亲,点击进去[\s\S]*?老婆哦!/g, "")
            .replace(/手机站全新改版[\s\S]*?清新阅读！/g, "")
            .replace(/最新网址：[^\n]+/g, "")
            .replace(/http:\/\/[^\n]+/g, "")
            .replace(/本书首发来自.*?最新章节！/g, "")
            .replace(/手机用户请浏览.*?便捷清新的阅读！/g, "")
            .replace(/请记住本书首发域名.*?免费阅读！/g, "")
            .replace(/温馨提示：.*?最新章节！/g, "")
            .replace(/【推荐下，换源app.*?换源app】/g, "")
            .replace(/【鼠年大吉，看书追更不会迷路.*?换源app】/g, "")
            .replace(/香书小说网.*?最新章节/g, "")
            .replace(/笔趣阁.*?最新章节/g, "")
            .replace(/\[看本书最新章节请到.*?\]/g, "")
            .replace(/（本章未完，请点击下一页继续阅读）/g, "")
            .replace(/分享本书.*?最新章节！/g, "")
            .replace(/记住本站.*?免费阅读！/g, "")
            .replace(/喜欢.*?最新章节！/g, "")
            .replace(/收藏.*?最新章节！/g, "")
            .replace(/推荐都市大神老施新书:/g, "")
            // 移除HTML标签但保留换行
            .replace(/<br\s*\/?>/gi, "\n")
            .replace(/<p>/gi, "")
            .replace(/<\/p>/gi, "\n")
            .replace(/<[^>]+>/g, "")
            // 移除空白字符和换行
            .replace(/[ \t]+/g, " ")
            .replace(/\n\s*\n/g, "\n")
            .replace(/^\s*|\s*$/gm, "")
            // 移除HTML实体
            .replace(/&nbsp;/g, " ")
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, "\"")
            .replace(/&#39;/g, "'")
            // 移除多余的空行和空格
            .replace(/\n{3,}/g, "\n\n")
            .replace(/^\s+|\s+$/g, "")
            .trim();
    }

    formatText(text) {
        if (!text) return "";

        // 将文本分割成段落
        const paragraphs = text.split(/\n+/).map(p => p.trim()).filter(p => p);

        // 处理每个段落
        return paragraphs
            .map(paragraph => {
                // 如果段落长度小于15且包含特定广告关键词，跳过
                if (paragraph.length < 15 && 
                    (paragraph.includes("笔趣阁") || 
                     paragraph.includes("小说网") || 
                     paragraph.includes("手机站") || 
                     paragraph.includes("最新网址") ||
                     paragraph.includes("记住本站") ||
                     paragraph.includes("首发域名") ||
                     paragraph.includes("换源") ||
                     paragraph.includes("收藏") ||
                     paragraph.includes("推荐"))) {
                    return "";
                }
                return `<p class="novel-paragraph">${paragraph}</p>`;
            })
            .filter(p => p)  // 过滤掉空字符串
            .join("\n");
    }
} 