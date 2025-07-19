const getElement = (ID, parent=document) => parent.querySelector(ID);
const addEvent = (element, type, callback) => { element.addEventListener(type, callback); };
let channels = [];

const saveChannels = _ => {
    chrome.storage.local.set({ channels });
};

const loadChannels = async _ => {
    const result = await chrome.storage.local.get('channels');
    channels = result.channels ?? [];
    renderChannels();
};

const removeChannel = channel => {
    return _ => {
        channels = channels.filter(r => r !== channel);
        saveChannels();
        renderChannels();
    }
};

const renderChannels = _ => {
    const channelsContainer = getElement("#channels");
    channelsContainer.innerHTML = "";
    channels.map( channel => {
        const template = getElement("#channel-item-template");
        const content = template.content.cloneNode(true);
        getElement('div[data-url]', content).innerHTML = channel;
        addEvent(getElement('button', content), "click", removeChannel(channel));
        channelsContainer.appendChild(content);
    });
};

const addChannel = channelElement => {
    return _ => {
        const url = channelElement.value.trim();
        chrome.runtime.sendMessage({ type: "getChannelId", url }, async (response) => {
            if (response.status === "ok") {
                const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${response.channelId}`;
                const newChannel = rssUrl;
                channels = [...channels, newChannel];
                saveChannels();
                renderChannels();
            } else {
                output.textContent = `❌ Error: ${response.error}`;
            }
        });
    }
};

document.addEventListener("DOMContentLoaded", _e => {
    loadChannels();
    const channelPattern = getElement("#pattern");
    const addChannelButton = getElement("#addChannel");
    addEvent(addChannelButton, "click", addChannel(channelPattern));
});