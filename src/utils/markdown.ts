import { Readability } from '@mozilla/readability';
import TurndownService from 'turndown';

export async function parseContentToMarkdown(documentClone: Document, url: string, title?: string, forceFullPage: boolean = false): Promise<string> {
    const reader = new Readability(documentClone);
    const article = forceFullPage ? null : reader.parse();

    const turndownService = new TurndownService({
        headingStyle: 'atx',
        codeBlockStyle: 'fenced'
    });

    let markdown = '';

    if (!forceFullPage && article && article.content && article.content.length > 200) {
        const contentMarkdown = turndownService.turndown(article.content);
        markdown = `# ${article.title || title}\n\n${contentMarkdown}`;
    } else {
        // Fallback to full body markdown if readability fails or returns too little content
        // Remove scripts and styles first to clean up
        const scripts = documentClone.querySelectorAll('script, style, nav, footer, header, aside');
        scripts.forEach(node => node.remove());

        const bodyMarkdown = turndownService.turndown(documentClone.body);
        markdown = `# ${title}\n\n${bodyMarkdown}`;
    }

    markdown += `\n\n---\n[출처]: ${url}\n[정리]: KLIC-Clipper`;

    return markdown;
}

export function copyToClipboard(text: string): Promise<void> {
    return navigator.clipboard.writeText(text);
}
