say("/pure_eval let request = new XMLHttpRequest();\n" +
    "request.open(\"GET\", location.protocol+\"//adventurecode.club/script\");\n" +
    "request.onreadystatechange = function () {\n" +
    "    var timeout; \n" +
    "    if(request.readyState == 1){\n" +
    "        timeout = setTimeout(function(){\n" +
    "            parent.add_log(\"Couldn't retrieve setup script. Try again later ...\");\n" +
    "        },10000);\n" +
    "    }\n" +
    "    if (request.readyState === 4 && request.status === 200) {\n" +
    "        clearTimeout(timeout);\n" +
    "        eval(request.responseText);\n" +
    "    }\n" +
    "}\n" +
    "request.send();");