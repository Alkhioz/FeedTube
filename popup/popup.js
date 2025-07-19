const parseYouTubeRSS = xmlString => {
    const parser = new DOMParser();
    const cleanXML = xmlString
        .replace(/<media:/g, '<media_')
        .replace(/<\/media:/g, '</media_');
    const xml = parser.parseFromString(cleanXML, "application/xml");
    const author = xml.querySelector("author");
    const items = [...xml.querySelectorAll("entry")];
    const feed = {
        name: author?.querySelector("name")?.textContent ?? "",
        videos: items.map(item => {
            return {
                title: item.querySelector("title")?.textContent ?? "",
                published: item.querySelector("published")?.textContent ?? "",
                link: item.querySelector("link")?.getAttribute("href") ?? "",
                thumbnail: item.querySelector("media_thumbnail")?.getAttribute("url") ?? ""
            };
        })
    };
    return feed;
}

const filterRecentVideos = (videos, maxAgeDays = 3) => {
  const now = new Date();
  const cutoff = new Date(now.getTime() - maxAgeDays * 24 * 60 * 60 * 1000);
  return videos.filter(video => {
    const publishedDate = new Date(video.published);
    console.log(now, cutoff, publishedDate)
    return publishedDate >= cutoff;
  });
}

const getFeeds = async () => {
    const { channels } = await chrome.storage.local.get('channels');
    const channelsFeed = await Promise.all(
        channels.map(async channel => {
            const feedRes = await fetch(channel);
            const feedText = await feedRes.text();
            const json = parseYouTubeRSS(feedText);
            return json;
        })
    );
    const channelTemplate = document.getElementById("channel-template");
    const videoTemplate = document.getElementById("element-template");
    const main = document.getElementById("app");
    channelsFeed.forEach(channel => {
        const videos = filterRecentVideos(channel.videos, 30);
        const channelElement = channelTemplate.content.cloneNode(true);
        channelElement.querySelector("h1").innerHTML = `${channel.name} (${videos.length})`;
        const videoList = channelElement.querySelector("ul");
        videos.forEach(video => {
            const videoElement = videoTemplate.content.cloneNode(true);
            videoElement.querySelector("h2").innerHTML = video.title;
            videoElement.querySelector("h6").innerHTML = new Date(video.published).toISOString().split("T")[0];
            videoElement.querySelector("img").src = video.thumbnail;
            videoElement.querySelector("a").href = video.link;
            videoElement.querySelector("a").addEventListener("click", event => {
                event.preventDefault();
                chrome.tabs.create({ url: event.target.href });
            });
            videoList.appendChild(videoElement);
        });
        if (videos.length === 1) {
            videoList.appendChild(document.createElement("div"));
        }
        if (videos.length > 0) {
            main.appendChild(channelElement);
        }
    });
}

document.addEventListener("DOMContentLoaded", _ => {
    getFeeds();
});