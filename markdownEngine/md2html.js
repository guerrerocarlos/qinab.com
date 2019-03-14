// var vfile = require("to-vfile");
var unified = require("unified");
var markdown = require("remark-parse");
// var remark2rehype = require("remark-rehype");
// var format = require("./format");
// var html = require("rehype-stringify");
var customPlugin = require("./customPlugin");
var remark2html = require("remark-html");

// if (document === undefined) {
//   var document = {};
// }

document.md2html = unified()
  .use(markdown, { commonmark: true })
  .use(customPlugin)
  .use(remark2html);

// if (require.main === module) {
//   var input = `---
//   layout: post
//   title:  "How to Compile Hashicorp Terraform using Docker"
//   date:   2017-06-21 13:40:02 -0400
//   categories: iac provisioning hashicorp terraform
//   comments: true
//   crosspost_to_medium: true
//   ---
//   I am going to show you the way to compile Terraform by Hashicorp from source
//   code using Docker. By using Docker, we save time since we do not need to install
//   golang and we don't have to setup the development environment. So save time and
//   hit the hay.
//   `
//   document.md2html.process(input).then(result => {
//     console.log("TCL: result", result.contents);
//   });
// }
