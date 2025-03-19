class ProcessorFactory {
    static createProcessor(url) {
        if (url.includes("xbiqugu.la")) {
            return new XbiquguProcessor();
        } else if (url.includes("dushu.baidu.com")) {
            return new BaiduDushuProcessor();
        } else if (url.includes("qidian.com")) {
            return new QidianProcessor();
        } else {
            throw new Error("不支持的网站");
        }
    }
} 