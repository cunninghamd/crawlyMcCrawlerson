#!/usr/bin/env node

// Write a command-line program that crawls a website and returns all page URLs that contain a specific search keyword. For example:

// key elements of output: total pages crawled, total pages with results, a listing of each URL, and some context characters around the keyword 

// > crawly https://www.apple.com reimagined
// > Crawled 342 pages. Found 14 pages with the term ‘reimagined’:
// > https://www.apple.com/ => ‘We reimagined everything.’
// > https://www.apple.com/iphone => ‘she reimagined my face’
// > https://www.apple.com/iphone/deeplink => ‘ou reimagined me’

// Crawl two levels deep from the initial page
// Ignore pages on a different domain
// Only look at server-side generated content (plain old markup) - ignore client-side generated content (JS- generated markup)
// Only search for content within the HTML, not the HTML content itself (i.e., searching for the term ‘div’ should usually return nothing unless the term div is in the content itself)
// [Optional] Have it crawl efficiently (faster than 10 URLs per second)
// [Optional] Specify the depth of the search as a command line input

console.log("Hello, I'm Crawly McCrawlerson.");

const args = process.argv.slice(2); // get rid of node and path to script

const url = args.shift();
const searchTerm = args[0];
let depth = 2;
if (args.length > 1) {
    depth = args[1];
}

console.log("Today, I'll be crawling the URL: %s", url);
console.log("I'll be using the search term provided by you: %o", searchTerm);
console.log("And we'll be crawling to a depth of %s, so buckle up!", depth);
console.log("---------------------");

let Crawler = require("crawler");

var crawledUrls = [];

var found = 0;
var crawled = 0;
var matches = [];

var terms = [];

var c = new Crawler({
    rateLimit: 1000,
    callback : function(error, result, done) {
        if (error) {
            console.log(error);
        }
        else {
            // queues initial call, then recurses with itself
            crawlyMcCrawlerson(result.options.uri, result.$, result.options.level);
        }
        
        done();
    }
});

// get started
c.queue({
    uri: url,
    level: 0
});

c.on("request", () => {
    // console.log("Queue size: %s", c.queueSize);
});

c.on("drain", () => {
    console.log("Crawly crawled %s pages. Crawly found %s pages with the term '%s'.", crawled, found, searchTerm);
    if (found > 0) {
        console.log("Crawly will print the pages, with context:");
    }

    matches.map((match) => {
        console.log("%s => '%s'", match.url, match.context);
    });
});

function crawlyMcCrawlerson(crawlUrl, crawl, level) {
    if (!crawledUrls.includes(crawlUrl)) {
        crawledUrls.push(crawlUrl);
        
        crawled++;
        
        let $ = crawl;
        
        let urls = [];
        $("a").map((_, e) => {
            let href = $(e).attr("href");
            
            // let re = /[a-zA-Z0-9]/;
            
            if (href !== undefined && href != "/" && (href.substring(0, 1) == "/" || href.indexOf(crawlUrl) == 0 || href.indexOf("http") != 0)) { // && href.substring(0, 1).match(re)))) {
                urls.push(href);
            }
        });
        
        $("html body *").each(function(i, e) {
            if ($(this).name != "script" || $(this).name != "style") {
                let text = $(this).text();
                if (text == $(this).html() && text.trim() != "" && !text.trim().startsWith("{")) {
                    if (text.indexOf(searchTerm) >= 0) {
                        matches.push({ url: crawlUrl, context: text });
                        found++;
                        return false
                    }
                }
            }
        });
        
        if (level <= depth) {
            level++;
            
            urls.map((deepUrl) => {
                if (!deepUrl.startsWith("http")) {
                    if (deepUrl.indexOf("/") === 0) {
                        deepUrl = url + deepUrl.substring(1);
                    }
                    else {
                        deepUrl = url + "/" + deepUrl;
                    }
                }
                
                c.queue({
                    uri: deepUrl,
                    level: level
                });
            });
        }
    }
    
    // console.log("Crawly find content with title: %s", $("title"));
    // console.log("Crawly find urls: %o", urls);
    // console.log("Crawly found words: %o", terms);
    
    // let matches = terms.filter(term => term.indexOf(searchTerm) >= 0);
    // console.log("Crawly found matches: %o", matches);
}
