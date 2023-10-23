
// async function facebookEmail (facebook) {
//     const FBEmailRegex = /([a-zA-Z0-9._-]+\\u0040[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g
//     // let fbUrl = facebook + "/about"
//     let fbEmail = ""

//     try {
//         const resy = await gotScraping({ url: facebook + "/about", })
//         const fbhtml = resy.body
//         const fbEmails = fbhtml.match(FBEmailRegex)
//         const fbEmailOne  = fbEmails[0]
//         fbEmail = fbEmailOne.replace("\\u0040", "@")
//     } catch (error) {
//         console.log("Facebook Email Scrape Failed")
//         console.log(error)
//     }
//     return fbEmail
    
// }