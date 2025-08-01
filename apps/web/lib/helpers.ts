import MarkdownIt from 'markdown-it';


export const tryMarkdownToHtml = (text: string) => {
    try {
        // console.log("text", text);
        let textRendered = markdownToHtml(text);
        // console.log("textRendered", textRendered);
        if (!textRendered) {
            textRendered = enhancedMarkdownRenderer(text);
        }
        if (!textRendered) {
            textRendered = text;
        }

        return textRendered;
    } catch (error) {
        console.error("Error rendering markdown", error);
        return "";
    }
}

export const markdownToHtml = (text: string) => {
    try {
        // Enhanced markdown renderer without external dependencies
        const md = new MarkdownIt();
        // console.log("md", md);
        const rendered = md.render(text);
        // console.log("rendered", rendered);
        return rendered;
    } catch (error) {
        console.error("Error rendering markdown", error);
        return undefined;
    }
};

export const enhancedMarkdownRenderer = (text: string) => {
    if (!text || typeof text !== 'string') {
        return '';
    }

    // First, handle line breaks properly for long text
    let processedText = text
        // HTML escaping
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        // Headers
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        // Bold and italic
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/__(.*?)__/g, '<strong>$1</strong>')
        .replace(/_(.*?)_/g, '<em>$1</em>')
        // Code blocks
        .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        // Links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
        // Lists
        .replace(/^\* (.*$)/gim, '<li>$1</li>')
        .replace(/^- (.*$)/gim, '<li>$1</li>')
        .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
        // Blockquotes
        .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');

    // Handle line breaks and paragraphs more carefully
    // Split by double line breaks first
    const paragraphs = processedText.split(/\n\n+/);
    const processedParagraphs = paragraphs.map(paragraph => {
        if (paragraph.trim() === '') return '';

        // Check if paragraph already contains HTML tags
        if (/<[^>]+>/.test(paragraph)) {
            return paragraph;
        }

        // Replace single line breaks with <br> tags
        const withBreaks = paragraph.replace(/\n/g, '<br>');
        return `<p>${withBreaks}</p>`;
    });

    return processedParagraphs.join('');
};