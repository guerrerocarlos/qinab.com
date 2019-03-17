var unified = require("unified");
var parse = require("rehype-parse");
var customPlugin = require("./customPlugin");
var rehype2remark = require("rehype-remark");
var stringify = require("remark-stringify");
var markdown = require("remark-parse");
var remark2html = require("remark-html");

document.md2html = function(str) {
  return new Promise((success, reject) => {
    unified()
      .use(markdown, { commonmark: true })
      .use(customPlugin)
      .use(remark2html, { commonmark: true })
      .process(str)
      .then(result => {
        success(result.contents);
      });
  });
};

document.html2md = function(str) {
  return new Promise((success, reject) => {
    unified()
      .use(parse)
      .use(rehype2remark)
      .use(stringify)
      .use(customPlugin)
      .process(str)
      .then(result => {
        success(result.contents);
      });
  });
};
