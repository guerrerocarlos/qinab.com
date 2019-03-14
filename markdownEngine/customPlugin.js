const spaceSeparated = require("space-separated-tokens");

function escapeRegExp(str) {
  return str.replace(/[-[]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

const C_NEWLINE = "\n";
const C_FENCE = "|";

function compilerFactory(nodeType) {
  let text;
  let title;

  return {
    blockHeading(node) {
      console.log("TCL: blockHeading -> blockHeading", blockHeading);
      title = this.all(node).join("");
      return "";
    },
    blockBody(node) {
      console.log("TCL: blockBody -> blockBody", blockBody);
      text = this.all(node)
        .map(s => s.replace(/\n/g, "\n| "))
        .join("\n|\n| ");
      return text;
    },
    block(node) {
      console.log("TCL: block -> block", block);
      text = "";
      title = "";
      this.all(node);
      if (title) {
        return `[[${nodeType} | ${title}]]\n| ${text}`;
      } else {
        return `[[${nodeType}]]\n| ${text}`;
      }
    }
  };
}

module.exports = function blockPlugin(availableBlocks = {}) {
  //   console.log("availableBlocks", availableBlocks);
  //   const pattern = Object.keys(availableBlocks)
  //     .map(escapeRegExp)
  //     .join("|");

  //   if (!pattern) {
  //     throw new Error(
  //       "remark-custom-blocks needs to be passed a configuration object as option"
  //     );
  //   }

  const regex = new RegExp(`---\n`);

  function blockTokenizer(eat, value, silent) {
    const now = eat.now();
    const keep = regex.exec(value);
    if (!keep) return;
    if (keep.index !== 0) return;
    const [eaten] = keep;
    // console.log(
    //   "TCL: blockTokenizer -> eaten, blockType, blockTitle",
    //   eaten,
    //   blockType,
    //   blockTitle
    // );

    /* istanbul ignore if - never used (yet) */
    if (silent) return true;

    const linesToEat = [];
    const content = [];

    let idx = 0;
    var breakThisOne = false;
    while ((idx = value.indexOf(C_NEWLINE)) !== -1) {
      const next = value.indexOf(C_NEWLINE, idx + 1);
      // either slice until next NEWLINE or slice until end of string
      const lineToEat =
        next !== -1 ? value.slice(idx + 1, next) : value.slice(idx + 1);
      // remove leading `FENCE ` or leading `FENCE`
      const line = lineToEat; //.slice(lineToEat.startsWith(`${C_FENCE} `) ? 2 : 1);
      linesToEat.push(lineToEat);
      value = value.slice(idx + 1);

      if (lineToEat.indexOf("---") === 0) {
        break;
      }
      content.push(line);
    }

    console.log("content", content);

    // const contentString = content.join(C_NEWLINE);
    var rows = [];

    const exit = this.enterBlock();
    // const contents = {
    //   type: `jekyllCustomBlockBody`,
    //   data: {
    //     hName: "tr",
    //     hProperties: {
    //       className: "jekyll-metadata-tr"
    //     }
    //   },
    //   children: this.tokenizeBlock(contentString, now)
    // };

    // const blockChildren = [contents];

    content.forEach(line => {
      console.log("line", typeof line, line);
      var metadataParts = line.split(": ");
      console.log("metadataParts", typeof metadataParts, metadataParts);

      rows.push({
        type: `jekyllCustomBlockBody`,
        data: {
          hName: "tr",
          hProperties: {
            className: "jekyll-metadata-tr"
          }
        },
        children: [
          {
            type: `jekyllMetadataColums`,
            data: {
              hName: "th",
              hProperties: {
                className: "jekyll-metadata-th jekyll-metadata-attr"
              }
            },
            children: this.tokenizeBlock(metadataParts[0], now)
          },
          {
            type: `jekyllMetadataColums`,
            data: {
              hName: "th",
              hProperties: {
                className: `jekyll-metadata-th jekyll-metadata-value ${metadataParts[0] === 'title' ? 'jekyll-metadata-title': ''}`
              }
            },
            children: this.tokenizeBlock(metadataParts[0] === 'title' ? metadataParts[1].slice(1).slice(0,metadataParts[1].length-2) : metadataParts[1], now)
          }
        ]
      });
    });

    exit();

    console.log("rows", JSON.stringify(rows, null, 2));

    const stringToEat = eaten + linesToEat.join(C_NEWLINE);

    // const potentialBlock = availableBlocks[blockType];
    // const titleAllowed =
    //   potentialBlock.title &&
    //   ["optional", "required"].includes(potentialBlock.title);
    // const titleRequired =
    //   potentialBlock.title && potentialBlock.title === "required";

    // if (titleRequired && !blockTitle) return;
    // if (!titleAllowed && blockTitle) return;

    const add = eat(stringToEat);

    // const exit = this.enterBlock();
    // const contents = {
    //   type: `jekyllCustomBlockBody`,
    //   data: {
    //     hName: "tr",
    //     hProperties: {
    //       className: "jekyll-metadata-tr"
    //     }
    //   },
    //   children: this.tokenizeBlock(contentString, now)
    // };
    // exit();

    // const blockChildren = [contents];

    return add({
      type: `jekyllCustomBlock`,
      data: {
        hName: "table",
        hProperties: {
          className: ["jekyll-metadata-table"]
        }
      },
      children: rows
    });
  }

  const Parser = this.Parser;

  // Inject blockTokenizer
  const blockTokenizers = Parser.prototype.blockTokenizers;
  const blockMethods = Parser.prototype.blockMethods;
  if (blockTokenizers) {
    blockTokenizers.customBlocks = blockTokenizer;

    blockMethods.splice(
      blockMethods.indexOf("fencedCode") + 1,
      0,
      "customBlocks"
    );
  }

  //   console.log('blockMethods', blockMethods)

  const Compiler = this.Compiler;
  if (Compiler) {
    const visitors = Compiler.prototype.visitors;
    if (!visitors) return;

    var originalTable = visitors["table"];
    var attr;
    var value;
    
    visitors["table"] = function block(node) {
      if (node.children[0].children.length == 2) {
        return `---\n${node.children
          .map(each => {
            attr = each.children[0].children[0].children[0].value;
            value = each.children[1].children[0].children[0].value;
            if (attr === "title") {
              value = `"${value}"`;
            }
            return `${attr}: ${value}`;
          })
          .join("\n")} \n---\n`;
      }

      return originalTable.apply(this, arguments);
    };
  }

  if (blockTokenizers) {
    const interruptParagraph = Parser.prototype.interruptParagraph;
    const interruptList = Parser.prototype.interruptList;
    const interruptBlockquote = Parser.prototype.interruptBlockquote;

    interruptParagraph.splice(interruptParagraph.indexOf("fencedCode") + 1, 0, [
      "customBlocks"
    ]);
    interruptList.splice(interruptList.indexOf("fencedCode") + 1, 0, [
      "customBlocks"
    ]);
    interruptBlockquote.splice(
      interruptBlockquote.indexOf("fencedCode") + 1,
      0,
      ["customBlocks"]
    );
  }
  // Inject into interrupt rules
};
