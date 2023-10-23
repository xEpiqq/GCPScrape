import { onDocumentCreated } from "firebase-functions/v2/firestore";
import {gotScraping} from 'got-scraping'
import * as cheerio from 'cheerio';
import { updateDoc, arrayUnion, doc, runTransaction, collection, addDoc } from 'firebase/firestore';
import { db } from "./firebase.js";
import https from 'https';

export const scraperRebirth = onDocumentCreated({
    document: "/queue/{documentId}",
    timeoutSeconds: 60,
    memory: "1GiB",
  },

async (event) => {

    const snapshot = event.data;
        if (!snapshot) {
            console.log("No data associated with the event");
            return;
        }
        const data = snapshot.data();
        const list_id = data.list_id;
        const url_i = data.url_i;
        const obj_id = data.obj_id;
        const url_id = "http://" + url_i // maybe this needs to be https ///////////////////////////////////////////////////

        const res = await gotScraping({ url: url_id, })
        const html = res.body
        const $ = cheerio.load(html)
        const links = $('a')
        const hrefs = links.map((i, link) => $(link).attr('href')).get()
    
        let facebook = "", twitter = "", instagram = "", youtube = "", linkedin = "", tiktok = "", contact_us = "";
    
        for (let i = 0; i < hrefs.length; i++) {
            if (hrefs[i].includes('facebook')) {
                facebook = hrefs[i]
            }
            if (hrefs[i].includes('twitter')) {
                twitter = hrefs[i]
            }
            if (hrefs[i].includes('instagram')) {
                instagram = hrefs[i]
            }
            if (hrefs[i].includes('youtube')) {
                youtube = hrefs[i]
            }
            if (hrefs[i].includes('linkedin')) {
                linkedin = hrefs[i]
            }
            if (hrefs[i].includes('tiktok')) {
                tiktok = hrefs[i]
            }
            if (hrefs[i].includes('contact')) {
                contact_us = hrefs[i]
            }
            if (hrefs[i].includes('Contact')) {
                contact_us = hrefs[i]
            }
            if (hrefs[i].includes('CONTACT')) {
                contact_us = hrefs[i]
            }
        }
    
        const template = await checkTemplate(html)
    
        // build the contact_us_url
        let contact_us_url = ""
        if (contact_us.includes('http')) {
            contact_us_url = contact_us
        }

        if (contact_us.includes('www')) {
            contact_us_url = contact_us
        }

        if (contact_us.includes('http') === false && contact_us.includes('www') === false) {
            contact_us_url = url_id + contact_us
        }

        // find emails
        let emails = []
        const emailRegex = /[\w\d\.-]+@[\w\d\.-]+\.[\w\d\.-]+/g
        emails = html.match(emailRegex)
        if (contact_us !== "") {
            try {
                const contact_us_query = await gotScraping({ url: contact_us_url, })
                const contact_us_html = contact_us_query.body
                const contact_us_emails = contact_us_html.match(emailRegex)
                if (contact_us_emails) {
                    for (let i = 0; i < contact_us_emails.length; i++) {
                        emails.push(contact_us_emails[i])
                    }
                }
            } catch {
                console.log("contact us page does not exist")
            }
        }

        if (emails) {
            const unique_emails = [...new Set(emails)]
            emails = unique_emails
        }

        // remove emails if they end in an image extension
        if (emails) {
            for (let i = emails.length - 1; i >= 0; i--) {
                const email = emails[i];
                const prohibitedExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.bmp', '.tif', '.tiff', '.pdf'];

                if (prohibitedExtensions.some(extension => email.includes(extension))) {
                    emails.splice(i, 1);
                }
            }
        }

        let fbEmail = ""

        if (facebook !== "") {
        try {
            const facebook_without_slash = facebook.endsWith("/") ? facebook.slice(0, -1) : facebook;
            const facebook_with_about = facebook_without_slash + "/about";

            const response = await fetch("https://cbwscu6x0j.execute-api.us-west-2.amazonaws.com/default/fb-scrape-0", {
            "body": JSON.stringify({
                facebook: facebook_with_about,
                list_id: list_id,
                obj_id: obj_id
            }),
            "method": "POST",
            });
            
            const json = await response.json();
            fbEmail = json.fbEmail;
            console.log(fbEmail)
        } catch {
            console.log("no fb email")
        }
        }

        if (fbEmail === "") {
            try {
            const response = await fetch("https://cbwscu6x0j.execute-api.us-west-2.amazonaws.com/default/fb-scrape-0", {
            "body": JSON.stringify({
                facebook: facebook,
                list_id: list_id,
                obj_id: obj_id
            }),
            "method": "POST",
            });
            
            const json = await response.json();
            fbEmail = json.fbEmail;
            console.log(fbEmail)
        } catch {
            console.log("no fb email")
        }
        }


        const docRef = doc(db, `sheets/${list_id}`)

        await runTransaction(db, async (transaction) => {
            const userSnapshot = await transaction.get(docRef);
            const listsArray = userSnapshot.data().lists;
            const targetIndex = listsArray.findIndex((list) => list.sheetItemId === obj_id);
    
            if (targetIndex !== -1) {
                listsArray[targetIndex].emails = emails ? emails : [];
                listsArray[targetIndex].email = emails && emails.length > 0 ? emails[0] : "";
                listsArray[targetIndex].facebook = facebook ? facebook : "";
                listsArray[targetIndex].twitter = twitter ? twitter : "";
                listsArray[targetIndex].instagram = instagram ? instagram : "";
                listsArray[targetIndex].youtube = youtube ? youtube : "";
                listsArray[targetIndex].linkedin = linkedin ? linkedin : "";
                listsArray[targetIndex].tiktok = tiktok ? tiktok : "";
                listsArray[targetIndex].contactUs = contact_us ? contact_us : "";
                listsArray[targetIndex].fbEmail = fbEmail ? fbEmail : "";
                // listsArray[targetIndex].hasSSL = secured ? secured : false;
                listsArray[targetIndex].template = template ? template : "";
            }
            transaction.update(docRef, { lists: listsArray });
        });

        if (facebook !== "") {
            await addDoc(collection(db, "fbqueue"), {
                facebook: facebook,
                list_id: list_id,
                obj_id: obj_id,
            });
        }

        return "Function Complete";
});

async function checkTemplate(html) {
    const template_array = []
    const template_sites = ["wix", "weebly", "godaddy", "wordpress", "shopify", "squarespace", "jimdo", "webnode", "site123", "big cartel", "voog", "yola", "webflow", "zyro", "ucraft", "clickfunnels", "websitebuilder", "zoho", "carrd", "sitebuilder", "site2you", "siteground", "siteorigin", "sitey", "simplesite"];
    const html_lower = html.toLowerCase()
    // every time a template is found, add it to the array
    for (let i = 0; i < template_sites.length; i++) {
        if (html_lower.includes(template_sites[i])) {
            template_array.push(template_sites[i])
        }
    }

    let template = ""
    let max = 0
    for (let i = 0; i < template_array.length; i++) {
        let count = 0
        for (let j = 0; j < template_array.length; j++) {
            if (template_array[i] === template_array[j]) {
                count++
            }
        }
        if (count > max) {
            max = count
            template = template_array[i]
        }
    }

    if (template) {
        return template
    }

    return "custom"
}


async function checkSSL(url) {
  try {
    const response = await new Promise((resolve, reject) => {
      https.get(url, (res) => {
        resolve(res);
      }).on('error', (err) => {
        reject(err);
      });
    });

    return response.statusCode === 200; // Check if the status code is 200 (OK)
  } catch (error) {
    console.error(error);
    return false; // Handle any errors during the request
  }
}