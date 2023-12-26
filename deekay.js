//
// DeeKay: Finder of Lost Articles
//
// Author: Max Dymond (maxmakesmagic)
//

const wayback_prefix = "https://web.archive.org/web/";

async function sha1_url() {
    // Hash the URL using SHA-1 - we're not using it for its
    // cryptographic properties, just to generate a hash for the URL
    const msg = new TextEncoder().encode(location.href);
    const hashBuffer = await crypto.subtle.digest('SHA-1', msg);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
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

// Detect if the page had a 404 error and inject a link if possible
async function main() {
    if (!detect404()) {
        console.log("No 404 error detected");
        return;
    }

    // Get the hash of the URL
    const url = await sha1_url();
    console.log("URL map: " + location.href + " => " + url);

    // Split it at the 2nd character
    const prefix = url.substring(0, 2);
    const suffix = url.substring(2);

    // Construct the JSON resource file
    const resource_file = "/hashes/" + prefix + ".json";

    // Fetch the JSON resource file
    await fetch(chrome.runtime.getURL(resource_file))
        .then(response => response.json())
        .then(data => {
            // Check if the URL hash is in the JSON file
            if (data[suffix]) {
                console.log("URL hash found in " + resource_file + ": " + data[suffix]);

                // Generate the URL
                const new_url = wayback_prefix + data[suffix] + "/" + location.href;
                console.log("New URL: " + new_url);

                // Construct the bar to inject
                var link = document.createElement('a');
                link.appendChild(document.createTextNode("let's go!"));
                link.setAttribute("href", new_url);

                var bar = document.createElement('div');
                bar.appendChild(document.createTextNode("DeeKay has found a working article link: "));
                bar.appendChild(link);
                bar.setAttribute("style", "width: 100%; height: 40px;background: #373737;color: #FFF;line-height: 40px; z-index: 100000; ");

                // Inject the bar at the top of the page
                document.body.prepend(bar);
            }
            else {
                console.log("Hash not found in JSON file");
            }
        })
        .catch(err => console.log("Error: " + err));
}

main().then(() => console.log("Done!"));
