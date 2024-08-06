//
// DeeKay: Finder of Lost Articles
//
// Author: Max Dymond (maxmakesmagic)
//

const wayback_prefix = "https://web.archive.org/web/";

async function sha1_text(text) {
    // Hash the text using SHA-1 - we're not using it for its
    // cryptographic properties, just to generate a hash for the text
    const msg = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-1', msg);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

function get_urls() {
    const url = location.href;
    var urls = [url];

    // If the URL matches the pattern of a Wiki-generated URL then generate the
    // other URLs that might be valid
    const pattern = /https:\/\/magic\.wizards\.com\/en\/news\/(.*)/;
    const match = url.match(pattern);

    if (match) {
        const path = match[1];
        urls.push("https://magic.wizards.com/en/articles/archive/" + path);
        urls.push("http://magic.wizards.com/en/articles/archive/" + path);
    }

    // If the URL starts with https://, try it with http://
    if (url.startsWith("https://")) {
        urls.push("http://" + url.substring(8));
    }

    console.log("URLs: " + urls);
    return urls;
}

function detect404() {
    // 404 pages have a div with the data-fetch-key attribute set to "Error404:0"
    var error = document.querySelectorAll('[data-fetch-key="Error404:0"]');
    if (error.length > 0) {
        console.log("404 error detected");
        return true;
    }
    else {
        console.log("No 404 error detected");
        return false;
    }
}

function add_bar(url, url_description, url_text) {
    // Construct the bar to inject
    var link = document.createElement('a');
    link.appendChild(document.createTextNode(url_text));
    link.setAttribute("href", url);

    var bar = document.createElement('div');
    bar.appendChild(document.createTextNode(url_description));
    bar.appendChild(link);
    bar.setAttribute("style", "width: 100%; height: 40px;background: #373737;color: #FFF;line-height: 40px; z-index: 100000; padding-left: 1em;");

    // Inject the bar at the top of the page
    document.body.prepend(bar);
}

// Detect if the page had a 404 error and inject a link if possible
async function main() {
    if (!detect404()) {
        console.log("No 404 error detected");
        return;
    }

    // Get the set of URLs to try for this page.
    const urls = get_urls();
    var bar_added = false;

    // Try each URL in turn
    for (const i in urls) {
        const url = urls[i];
        console.log("Trying URL: " + url);

        // Get the hash of the URL
        var hash = await sha1_text(url);
        console.log("URL map: " + url + " => " + hash);

        // Split it at the 2nd character
        const prefix = hash.substring(0, 2);
        const suffix = hash.substring(2);

        // Construct the JSON resource file
        const resource_file = "/hashes/" + prefix + ".json";

        // Fetch the JSON resource file
        bar_added = await fetch(chrome.runtime.getURL(resource_file))
            .then(response => response.json())
            .then(data => {
                // Check if the URL hash is in the JSON file
                if (data[suffix]) {
                    console.log("URL hash found in " + resource_file + ": " + data[suffix]);

                    // Generate the URL
                    const new_url = wayback_prefix + data[suffix] + "/" + url;
                    console.log("New URL: " + new_url);

                    // Add a bar at the top of the page
                    add_bar(new_url, "DeeKay has found a working article link: ", "let's go!");
                    return true;
                }
                else {
                    console.log("Hash not found in JSON file");
                    return false;
                }
            })
            .catch(err => console.log("Error: " + err));

        if (bar_added) {
            console.log("Added a navigation bar; stopping")
            break;
        }
    }

    if (!bar_added)
    {
        if (typeof browser === "undefined") {
            manifest = chrome.runtime.getManifest();
            version = manifest.version;
        }
        else {
            manifest = browser.runtime.getManifest();
            version = manifest.version;
        }

        // No bar was added, add a link to the issue tracker
        encoded_url = encodeURIComponent(location.href);
        new_url = "https://github.com/maxmakesmagic/deekay/issues/new?template=missingurl.yml&title=[Missing]%3A+"+encoded_url+"&url="+encoded_url+"&version="+version;
        add_bar(new_url, "DeeKay couldn't find a working article link. ", "Report this issue");
    }
}

main().then(() => console.log("Done!"));
