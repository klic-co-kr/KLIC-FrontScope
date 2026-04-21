import { useState } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { KillSwitch } from '../components/KillSwitch';
import { Onboarding } from '../components/Onboarding';
import { Cart } from '../components/Cart';
import { ActionButtons } from '../components/ActionButtons';
import { DonationSection } from '../components/DonationSection';
import { ThemeProvider } from '@/lib/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { useStorage } from '../hooks/useStorage';
import { extractYoutubeLinks } from '../utils/youtube';
import { parseContentToMarkdown, copyToClipboard } from '../utils/markdown';

function App() {
    const [links, setLinks] = useStorage<string[]>('collectedLinks', []);
    const [showDonation, setShowDonation] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');

    const showStatus = (msg: string) => {
        setStatusMessage(msg);
        setTimeout(() => setStatusMessage(''), 3000);
    };

    const handleRemoveLink = (index: number) => {
        const newLinks = [...links];
        newLinks.splice(index, 1);
        setLinks(newLinks);
        showStatus('삭제되었습니다');
    };

    const handleClearLinks = () => {
        setLinks([]);
        showStatus('장바구니가 비워졌습니다');
    };

    const handleCopyLinks = () => {
        if (links.length > 0) {
            copyToClipboard(links.join('\n')).then(() => {
                showStatus(`${links.length}개 링크 복사됨`);
            });
        }
    };

    const handleClipVisible = () => {
        extractYoutubeLinks(false).then((newLinks) => {
            if (newLinks.length > 0) {
                copyToClipboard(newLinks.join('\n')).then(() => {
                    showStatus(`${newLinks.length}개 영상 링크 복사됨`);
                });
            } else {
                showStatus('복사할 내용을 찾지 못했습니다');
            }
        });
    };

    const handleClipAll = () => {
        extractYoutubeLinks(true).then((newLinks) => {
            if (newLinks.length > 0) {
                copyToClipboard(newLinks.join('\n')).then(() => {
                    showStatus(`${newLinks.length}개 영상 링크 복사됨`);
                });
            } else {
                showStatus('복사할 내용을 찾지 못했습니다');
            }
        });
    };

    const handleCopyPageContent = async () => {
        showStatus('본문 추출 중...');
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab.id) return;

        try {
            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => document.documentElement.outerHTML
            });

            if (results && results[0] && results[0].result) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(results[0].result, 'text/html');
                const markdown = await parseContentToMarkdown(doc, tab.url || '', tab.title || '');

                await copyToClipboard(markdown);
                showStatus('본문이 복사되었습니다');
            } else {
                showStatus('페이지 정보를 가져올 수 없습니다');
            }
        } catch (err) {
            console.error(err);
            showStatus('오류가 발생했습니다');
        }
    };

    const handleClipSelection = async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab.id) return;

        try {
            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => window.getSelection()?.toString() || ""
            });

            if (results && results[0] && results[0].result) {
                const text = results[0].result;
                const markdown = `> ${text}\n\n---\n[출처]: ${tab.url} (${tab.title})\n[정리]: KLIC-Clipper`;
                await copyToClipboard(markdown);
                showStatus('선택 영역이 복사되었습니다');
            } else {
                showStatus('선택된 텍스트가 없습니다');
            }
        } catch (err) {
            console.error(err);
            showStatus('오류가 발생했습니다');
        }
    };

    const handleClipFullPage = async () => {
        showStatus('전체 페이지 추출 중...');
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab.id) return;

        try {
            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => document.documentElement.outerHTML
            });

            if (results && results[0] && results[0].result) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(results[0].result, 'text/html');

                const markdown = await parseContentToMarkdown(doc, tab.url || '', tab.title || '', true);
                await copyToClipboard(markdown);
                showStatus('전체 페이지가 복사되었습니다');
            }
        } catch (err) {
            console.error(err);
            showStatus('오류가 발생했습니다');
        }
    }

    return (
        <ThemeProvider>
            <div className="w-[320px] p-5 bg-background font-sans text-foreground">
                <Header />
                <KillSwitch />

                {links.length === 0 ? (
                    <Onboarding />
                ) : (
                    <Cart
                        items={links}
                        onRemove={handleRemoveLink}
                        onClear={handleClearLinks}
                        onCopy={handleCopyLinks}
                    />
                )}

                <ActionButtons
                    onCopyPageContent={handleCopyPageContent}
                    onClipFullPage={handleClipFullPage}
                    onClipSelection={handleClipSelection}
                    onClipVisibleVideos={handleClipVisible}
                    onClipAllVideos={handleClipAll}
                />

                {statusMessage && (
                    <div className="text-center text-xs text-primary font-bold mt-3 h-4 animate-pulse">
                        {statusMessage}
                    </div>
                )}

                <DonationSection isVisible={showDonation} />

                <Footer onDonate={() => setShowDonation(!showDonation)} />

                <Toaster />
            </div>
        </ThemeProvider>
    );
}

export default App;
