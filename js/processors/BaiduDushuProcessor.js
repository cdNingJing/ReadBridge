class BaiduDushuProcessor extends BaseProcessor {
    async process(url) {
        const gid = url.match(/gid=(\d+)/)?.[1];
        if (!gid) {
            throw new Error("无效的百度读书URL");
        }

        const response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(`https://dushu.baidu.com/api/pc/getCatalog?gid=${gid}`)}`);
        const data = await response.text();
        const novelData = JSON.parse(data);

        // 尝试不同的数据结构路径
        let catalogData = novelData.data?.catalog || 
                         novelData.catalog || 
                         novelData.data?.chapterList ||
                         novelData.chapterList;

        if (!catalogData) {
            throw new Error("获取小说数据失败");
        }

        // 提取小说信息
        this.title = novelData.data?.novel?.title || 
                    novelData.novel?.title || 
                    novelData.data?.title || 
                    novelData.title || 
                    "未命名";

        this.author = novelData.data?.novel?.author || 
                     novelData.novel?.author || 
                     novelData.data?.author || 
                     novelData.author || 
                     "未知作者";

        // 提取章节列表
        this.chapters = catalogData.map(item => {
            const chapterTitle = item.title || item.name || item.chapterTitle || "";
            const chapterId = item.cid || item.id || item.chapterId || "";
            const isVolume = item.isVolume || item.type === "volume" || false;

            return {
                title: chapterTitle,
                url: `https://dushu.baidu.com/api/pc/getChapterContent?gid=${gid}&cid=${chapterId}`,
                isVolume: isVolume,
                volumeName: isVolume ? chapterTitle : "",
                chapterNumber: chapterId
            };
        });

        return {
            title: this.title,
            author: this.author,
            chapters: this.chapters
        };
    }

    async getChapterContent(chapterUrl) {
        const response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(chapterUrl)}`);
        const data = await response.text();
        const chapterJson = JSON.parse(data);
        
        let content = chapterJson.data?.content || "";
        content = this.cleanText(content);
        
        return {
            title: chapterJson.data?.title || "",
            content: this.formatText(content)
        };
    }
} 