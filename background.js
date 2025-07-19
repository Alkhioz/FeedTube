const getYouTubeChannelId = async url => {
    const parsed = new URL(url);
    const path = parsed.pathname;
    if (path.startsWith("/channel/")) {
        return path.split("/")[2];
    }
    if (path.startsWith("/@") || path.startsWith("/user/")) {
        const res = await fetch(url);
        const html = await res.text();
        const match = html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/channel\/(UC[\w-]+)"/);
        if (match) return match[1];
        throw new Error("Channel ID not found in canonical tag.");
    }
    throw new Error("Unsupported YouTube URL format.");
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === "getChannelId" && message.url) {
        getYouTubeChannelId(message.url)
            .then(channelId => sendResponse({ status: "ok", channelId }))
            .catch(err => sendResponse({ status: "error", error: err.message }));
        return true;
    }
});