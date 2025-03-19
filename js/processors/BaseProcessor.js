class BaseProcessor {
    constructor() {
        this.title = "";
        this.author = "";
        this.chapters = [];
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
} 