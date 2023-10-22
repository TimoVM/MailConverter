function loadJSONFromURL(url) {
    var request = new XMLHttpRequest();
    request.open('GET', url, false);
    request.send(null);
    return JSON.parse(request.responseText);
}

function initiateMailAssembly(nextByteCombinations) {
    var minPossibilities = {};
    nextByteCombinations.forEach(nextByteCombination => {
        var startingChar = "00";
        var linkCost = distanceDict[startingChar+nextByteCombination[0]] + distanceDict[nextByteCombination[0] + nextByteCombination[1]] + 2;
        if ((!isNaN(linkCost)) && (!(nextByteCombination[1] in minPossibilities) || ((nextByteCombination[1] in minPossibilities) && (linkCost < minPossibilities[nextByteCombination[1]][1]))))
        {
            minPossibilities[nextByteCombination[1]] = [nextByteCombination, linkCost]
        };
    });
    return Object.values(minPossibilities)
}

function iterateMailAssembly(nextByteCombinations, possibleMailList) {
    var minPossibilities = {};
    possibleMailList.forEach(mailData => { 
        var startingChar = mailData[0].slice(-1);  
        nextByteCombinations.forEach(nextByteCombination => {
            var linkCost = mailData[1] + distanceDict[startingChar+nextByteCombination[0]] + distanceDict[nextByteCombination[0] + nextByteCombination[1]] + 2;
            if ((!isNaN(linkCost)) && (!(nextByteCombination[1] in minPossibilities) || ((nextByteCombination[1] in minPossibilities) && (linkCost < minPossibilities[nextByteCombination[1]][1]))))
            {
                minPossibilities[nextByteCombination[1]] = [mailData[0].concat(nextByteCombination), linkCost]
            };
        });
    });
    return Object.values(minPossibilities)
}

function sanitizeInput() {
    var textBox = document.getElementById("Input")
    var input = textBox.value
    input = input.replace(/[^0-9a-f-A-F]/g, "");
    textBox.value = input
}

function HookOutput(finalMailArray) {
    var element = document.getElementById("Output");
    finalMailArray.forEach((finalMail, idx) => {
        var tag = document.createElement("h1");
        var text = document.createTextNode("Mail "+ (idx+1).toString());
        var child = tag.createElement("p1");
        var childSpan = child.createElement("span")
        childSpan.setAttribute("class","gscfont")
        childSpan.setAttribute("style","background: url(/MailConverter/CharSets/Characterset_KoreanGS.png) -0px -0px;")
        tag.appendChild(text);
        element.appendChild(tag);
    });
}

function convertCodes() {
combinedDict = loadJSONFromURL('./MailConvCombinedDict.json')
distanceDict = loadJSONFromURL('./MailConvDistanceDict.json')
var textBox = document.getElementById("Input")
var input = textBox.value
if (input.length%2 != 0) {
    input = input.padEnd(input.length+1, "0")
}
if (input.length%32 != 0) {
    input = input.padEnd(input.length+(32-input.length%32), "0")
}
console.log(input)
console.log(input.length)
var finalMailArray = []
for (let index = 0; index < input.length; index+=32) {
    var assembledMail = []
    var checksum = 0
    var mailCode = input.slice(index, index + 32)
    for (let byteIndex = 0; byteIndex < 32; byteIndex += 2) {
        var byteString = mailCode.slice(byteIndex, byteIndex+2)
        checksum += parseInt(byteString, 16)
        if (byteIndex == 0) {
            assembledMail = initiateMailAssembly(combinedDict[byteString])
            } else {
            assembledMail = iterateMailAssembly(combinedDict[byteString], assembledMail)
            }
        }
    
    var minLinkCost = assembledMail[0][1]
    var finalMail = assembledMail[0][0]
    for (let i = 0; i < assembledMail.length; i++) {
        if (assembledMail[i][1] < minLinkCost){
            minLinkCost = assembledMail[i][1]
            finalMail = assembledMail[i][0]
        }
    }
    finalMailArray.push([finalMail, (checksum%256).toString(16).padStart(2, '0').toUpperCase(), minLinkCost])
}
finalMailArray.forEach(finalMail => {
    console.log(finalMail[0])
});
HookOutput(finalMailArray)
}