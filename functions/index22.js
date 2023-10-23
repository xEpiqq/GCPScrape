import http from 'http';
import https from 'https';

var popularWebsites = [
    "https://www.twitch.tv",
    "https://www.ebay.com",
    "https://www.github.com",
    "https://www.stackoverflow.com",
    "https://www.tumblr.com",
    "https://www.aliexpress.com",
    "https://www.dropbox.com",
    "https://www.imgur.com",
    "https://www.yelp.com",
    "https://www.hulu.com"
    "https://never"
];

async function checkWebsiteStatus(url) {
    try {
        const response = await fetch(url);
        if (response.ok) {
            console.log(`${url} is accessible.`);
        } else {
            console.error(`${url} returned status ${response.status}.`);
        }
    } catch (error) {
        console.error(`${url} is not accessible. Error: ${error}`);
    }
}

// Loop through the websites and check their status
popularWebsites.forEach(checkWebsiteStatus);
