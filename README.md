# AdventureLandDrops
AdventureLand server side code from: https://gitlab.com/Draivin/adventure-drops/tree/master
Contribute your drop collection to the http://adventurecode.club/ database.

## Adventure Land CODE to contribute drop rates
Once you have an API key (request one on the Discord from me @NexusNull#6364), put this code block in your CODE, _**outside**_ of any kind of loop like setInterval:

Execute this code to install the contribution code. Collection will stay active for the entire session, after than you will have to enable it again.
```javascript
say("/pure_eval let request = new XMLHttpRequest();\n" +
    "request.open(\"GET\", location.protocol+\"//localhost:8081/script\");\n" +
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
```

## To update data.js
Get the file data.js from: http://adventure.land/data.js and replace `var G` with `module.exports`

## To update skins.json
```javascript
JSON.stringfy(parent.FC);
```
Don't forget to add the Franky, Jrat and elementals at end.
```
"franky": "/images/tiles/monsters/monster1.png",
"jrat": "/images/tiles/monsters/monster1.png",
"eelemental": "/images/tiles/monsters/monster1.png",
"felemental": "/images/tiles/monsters/monster1.png",
"nelemental": "/images/tiles/monsters/monster1.png",
"welemental": "/images/tiles/monsters/monster1.png"
```

## To update dimensions.json
```javascript
JSON.stringfy(parent.XYWH);
```
Don't forget to add the Franky, Jrat and elementals at end.
```
  "franky": [
    0,
    0,
    0,
    0
  ],
  "jrat": [
    0,
    0,
    0,
    0
  ],
  "welemental": [
    0,
    0,
    0,
    0
  ],
  "felemental": [
    0,
    0,
    0,
    0
  ],
  "nelemental": [
    0,
    0,
    0,
    0
  ],
  "eelemental": [
    0,
    0,
    0,
    0
  ]
```