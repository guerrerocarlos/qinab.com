var unified = require('unified')
// var createStream = require('unified-stream')
var parse = require('rehype-parse')
var customPlugin = require("./customPlugin");

var rehype2remark = require('rehype-remark')
var stringify = require('remark-stringify')

var input = `
<table class="jekyll-metadata-table"><tr class="jekyll-metadata-tr"><th class="jekyll-metadata-th"><p>layout</p></th><th class="jekyll-metadata-th"><p>post</p></th></tr><tr class="jekyll-metadata-tr"><th class="jekyll-metadata-th"><p>title</p></th><th class="jekyll-metadata-th"><p> How to Compile Hashicorp Terraform using Docker</p></th></tr><tr class="jekyll-metadata-tr"><th class="jekyll-metadata-th"><p>date</p></th><th class="jekyll-metadata-th"><p>  2017-06-21 13:40:02 -0400</p></th></tr><tr class="jekyll-metadata-tr"><th class="jekyll-metadata-th"><p>categories</p></th><th class="jekyll-metadata-th"><p>iac provisioning hashicorp terraform</p></th></tr><tr class="jekyll-metadata-tr"><th class="jekyll-metadata-th"><p>comments</p></th><th class="jekyll-metadata-th"><p>true</p></th></tr><tr class="jekyll-metadata-tr"><th class="jekyll-metadata-th"><p>crosspost_to_medium</p></th><th class="jekyll-metadata-th"><p>true</p></th></tr></table>
<p>I am going to show you the way to compile Terraform by Hashicorp from source
code using Docker. By using Docker, we save time since we do not need to install
golang and we don't have to setup the development environment. So save time and
hit the hay.</p>
` 

var processor = unified()
  .use(parse)
  .use(rehype2remark)
  .use(stringify)
  .use(customPlugin)

processor.process(input).then((result) => {
	console.log('TCL: result', result)
})

