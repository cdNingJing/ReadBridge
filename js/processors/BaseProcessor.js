class BaseProcessor {
    constructor() {
        this.title = "";
        this.author = "";
        this.chapters = [];
        this.proxyServices = [
            {
                name: 'allorigins',
                url: 'https://api.allorigins.win/raw?url=',
                enabled: true,
                retryCount: 0
            },
            {
                name: 'codetabs',
                url: 'https://api.codetabs.com/v1/proxy?quest=',
                enabled: true,
                retryCount: 0
            }
        ];
    }

    async process(url) {
        throw new Error("process method must be implemented");
    }

    async getChapterContent(chapterUrl) {
        throw new Error("getChapterContent method must be implemented");
    }

    cleanText(text) {
        return text
            .replace(/\s+/g, " ")
            .replace(/\n+/g, "\n")
            .trim();
    }

    formatText(text) {
        return text
            .split("\n")
            .map(paragraph => paragraph.trim())
            .filter(paragraph => paragraph.length > 0)
            .map(paragraph => `<p>${paragraph}</p>`)
            .join("");
    }

    async fetchWithProxy(url, retryCount = 0) {
        const maxRetries = 3;
        const maxProxyRetries = this.proxyServices.length;

        for (let proxyIndex = 0; proxyIndex < maxProxyRetries; proxyIndex++) {
            const proxyService = this.proxyServices[proxyIndex];
            if (!proxyService.enabled) continue;

            try {
                const proxyUrl = proxyService.url + encodeURIComponent(url);
                console.log(`尝试使用代理服务 ${proxyService.name}，URL: ${proxyUrl}`);

                const response = await fetch(proxyUrl, {
                    method: 'GET',
                    mode: 'cors',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const text = await response.text();

                // 检查是否是错误页面
                if (text.includes('chrome-error://chromewebdata/') || 
                    text.includes('ERR_CONNECTION_TIMED_OUT') ||
                    text.includes('ERR_CONNECTION_REFUSED') ||
                    text.includes('ERR_NAME_NOT_RESOLVED') ||
                    text.includes('408 Request Timeout')) {
                    console.log(`代理服务 ${proxyService.name} 返回错误页面，尝试下一个代理服务`);
                    proxyService.enabled = false;
                    continue;
                }

                // 检查内容是否为空或无效
                if (!text || text.length < 100) {
                    console.log(`代理服务 ${proxyService.name} 返回内容无效，尝试下一个代理服务`);
                    proxyService.enabled = false;
                    continue;
                }

                console.log(`代理服务 ${proxyService.name} 成功获取内容，长度: ${text.length}`);
                return text;
            } catch (error) {
                console.log(`代理服务 ${proxyService.name} 请求失败:`, error);
                proxyService.enabled = false;
                
                if (proxyIndex === maxProxyRetries - 1) {
                    if (retryCount < maxRetries) {
                        console.log(`所有代理服务都失败，等待后重试 (${retryCount + 1}/${maxRetries})`);
                        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
                        return this.fetchWithProxy(url, retryCount + 1);
                    }
                    throw new Error('所有代理服务都失败');
                }
            }
        }
    }
} 