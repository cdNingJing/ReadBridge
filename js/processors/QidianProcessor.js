class QidianProcessor extends BaseProcessor {
    async process(url) {
        const bookId = url.match(/book\/(\d+)/)?.[1];
        if (!bookId) {
            throw new Error("无效的起点中文网URL");
        }

        // 尝试使用API获取数据
        const apiUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://m.qidian.com/api/book/category/getCategory?bookId=${bookId}`)}`;
        const response = await fetch(apiUrl);
        const data = await response.text();

        try {
            const novelData = JSON.parse(data);
            if (novelData.data && novelData.data.vs) {
                this.title = novelData.data.bk?.title || "未命名";
                this.author = novelData.data.bk?.author || "未知作者";

                this.chapters = novelData.data.vs.map(item => ({
                    title: item.cnt?.title || "",
                    url: `https://m.qidian.com/book/${bookId}/chapter/${item.cnt?.id}`,
                    isVolume: item.cnt?.isVip === 1,
                    volumeName: item.cnt?.isVip === 1 ? item.cnt?.title : "",
                    chapterNumber: item.cnt?.id
                }));
            } else {
                throw new Error("API返回数据格式错误");
            }
        } catch (e) {
            // 如果API失败，尝试解析HTML
            const htmlResponse = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`);
            const html = await htmlResponse.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");

            this.title = doc.querySelector(".book-info h1")?.textContent || 
                        doc.querySelector(".book-title")?.textContent || 
                        "未命名";

            this.author = doc.querySelector(".book-info .author")?.textContent?.replace(/[作\s者：:]/g, "") || 
                         doc.querySelector(".book-author")?.textContent?.replace(/[作\s者：:]/g, "") || 
                         "未知作者";

            const chapterLinks = doc.querySelectorAll(".chapter-item a, .chapter-list a");
            this.chapters = Array.from(chapterLinks)
                .filter(a => {
                    const text = a.textContent.trim();
                    return text.match(/^第[一二三四五六七八九十百千万]+章/) || 
                           text.match(/^第\d+章/) ||
                           text.match(/^第[一二三四五六七八九十百千万]+卷/);
                })
                .map(a => {
                    const text = a.textContent.trim();
                    let chapterInfo = {
                        title: text,
                        url: a.href,
                        isVolume: false,
                        volumeName: "",
                        chapterNumber: ""
                    };

                    if (text.match(/^第[一二三四五六七八九十百千万]+卷/)) {
                        chapterInfo.isVolume = true;
                        chapterInfo.volumeName = text;
                    } else {
                        const match = text.match(/第(\d+)章/);
                        if (match) {
                            chapterInfo.chapterNumber = match[1];
                        }
                    }

                    return chapterInfo;
                });
        }

        return {
            title: this.title,
            author: this.author,
            chapters: this.chapters
        };
    }

    async getChapterContent(chapterUrl) {
        const response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(chapterUrl)}`);
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        
        let content = doc.querySelector(".chapter-content")?.textContent || "";
        content = this.cleanText(content);
        
        return {
            title: doc.querySelector(".chapter-title")?.textContent || "",
            content: this.formatText(content)
        };
    }
} 