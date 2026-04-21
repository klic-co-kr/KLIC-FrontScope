/// <reference types="chrome" />
export function extractYoutubeLinks(allFrames: boolean = false): Promise<string[]> {
    return new Promise((resolve) => {
        // Script to run in the page
        const script = () => {
            const links = Array.from(document.querySelectorAll('a[href*="/watch?v="]'));
            const uniqueLinks = new Set<string>();

            links.forEach((el) => {
                const element = el as HTMLAnchorElement;
                // Check visibility if needed, but for 'all' we might just take all
                // Original logic checked visibility for one button and all for another.
                // We will implement refined logic in the component calling this if needed.

                let href = element.getAttribute("href");
                if (href) {
                    if (href.includes("&")) href = href.split("&")[0];
                    uniqueLinks.add("https://www.youtube.com" + href);
                }
            });
            return Array.from(uniqueLinks);
        };

        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            if (!tabs[0]?.id) {
                resolve([]);
                return;
            }

            try {
                const results = await chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id, allFrames },
                    func: script,
                });

                const allLinks = new Set<string>();
                results.forEach((frameResult) => {
                    if (frameResult.result) {
                        frameResult.result.forEach((link: string) => allLinks.add(link));
                    }
                });
                resolve(Array.from(allLinks));

            } catch (err) {
                console.error("Failed to extract links", err);
                resolve([]);
            }
        });
    });
}
