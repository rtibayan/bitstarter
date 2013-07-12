#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var rest = require('restler');
var program = require('commander');
var cheerio = require('cheerio');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlData = function(htmlData, checksfile) {
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = htmlData(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

var processHtml = function(htmlData, checksfile) {
    var checkJson = checkHtmlData(htmlData, checksfile);
    var outJson = JSON.stringify(checkJson, null, 4);
    console.log(outJson);
}

if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to file')
        .option('-u, --url <url_path>', 'Path of URL')
        .parse(process.argv);

    if (program.url && !program.file) {
        // call restler to grab data and process with callback function
	rest.get(program.url).on('complete', function(data) {
            if (data instanceof Error) {
                console.log("Error accessing URL", program.url, ". Exiting.");
                process.exit(1);
            }
            // use cheerio to convert html string to cheerio data
            htmlData = cheerio.load(data);
            processHtml(htmlData, program.checks);
        });
    }
    else if (program.file && !program.url) {
        // use call method to convert html file to cheerio data
        htmlData = cheerioHtmlFile(program.file);
        processHtml(htmlData, program.checks);
    }
    else {
        console.log("Input only 1 file or url to check. Exiting.");
        process.exit(1);
    }

} else {
    exports.checkHtmlFile = checkHtmlFile;
}
