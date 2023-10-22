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
        var linkCost = distanceDict[startingChar + nextByteCombination[0]] + distanceDict[nextByteCombination[0] + nextByteCombination[1]] + 2;
        if ((!isNaN(linkCost)) && (!(nextByteCombination[1] in minPossibilities) || ((nextByteCombination[1] in minPossibilities) && (linkCost < minPossibilities[nextByteCombination[1]][1])))) {
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
            var linkCost = mailData[1] + distanceDict[startingChar + nextByteCombination[0]] + distanceDict[nextByteCombination[0] + nextByteCombination[1]] + 2;
            if ((!isNaN(linkCost)) && (!(nextByteCombination[1] in minPossibilities) || ((nextByteCombination[1] in minPossibilities) && (linkCost < minPossibilities[nextByteCombination[1]][1])))) {
                minPossibilities[nextByteCombination[1]] = [mailData[0].concat(nextByteCombination), linkCost]
            };
        });
    });
    return Object.values(minPossibilities)
}

function sanitizeInput() {
    var textBox = document.getElementById("Input")
    var input = textBox.value
    input = input.replace(/[^0-9a-f-A-F]/g, "").toUpperCase();
    textBox.value = input
}

function ConvertValueToCoordinates(value) {
    var xCoordinate = (parseInt("0x" + value, 16) % 16) * 16
    var yCoordinate = (parseInt("0x" + value, 16) - parseInt("0x" + value, 16) % 16) * 2
    return [xCoordinate, yCoordinate]
}

function HookOutput(finalMailArray) {
    var element = document.getElementById("Output");
    element.innerHTML = ""
    finalMailArray.forEach((finalMail, idx) => {
        var tag = document.createElement("h1");
        var text = document.createTextNode("Mail " + (idx + 1).toString());
        var tag2 = document.createElement("h2");
        var text2 = document.createTextNode("Button presses required: " + finalMail[1].toString() + " | checksum: " + finalMail[2]..toString(16).padStart(2, '0').toUpperCase());
        element.appendChild(tag);
        tag.appendChild(text);
        element.appendChild(tag2);
        tag2.appendChild(text2);
        for (let rowCount = 0; rowCount < 2; rowCount++) {
            var pTag = document.createElement("p")
            pTag.setAttribute("class", finalMail[0][rowCount])
            tag.appendChild(pTag);
            (finalMail[0].slice(rowCount * 16, (rowCount + 1) * 16)).forEach(value => {
                var childSpan = document.createElement("span")
                childSpan.setAttribute("class", "gscfont")
                var coordinates = ConvertValueToCoordinates(value)
                childSpan.setAttribute("style", "background: url(/MailConverter/CharSets/Characterset_KoreanGS.png) -" + coordinates[0] + "px -" + coordinates[1] + "px;")
                pTag.appendChild(childSpan);
                });
        }
    });
}

function convertCodes() {
    combinedDict = loadJSONFromURL('./MailConvCombinedDict.json')
    distanceDict = loadJSONFromURL('./MailConvDistanceDict.json')
    var textBox = document.getElementById("Input")
    var input = textBox.value
    if (input.length % 2 != 0) {
        input = input.padEnd(input.length + 1, "0")
    }
    if (input.length % 32 != 0) {
        input = input.padEnd(input.length + (32 - input.length % 32), "0")
    }
    console.log(input)
    console.log(input.length)
    var finalMailArray = []
    for (let index = 0; index < input.length; index += 32) {
        var assembledMail = []
        var checksum = 0
        var mailCode = input.slice(index, index + 32)
        for (let byteIndex = 0; byteIndex < 32; byteIndex += 2) {
            var byteString = mailCode.slice(byteIndex, byteIndex + 2)
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
            if (assembledMail[i][1] < minLinkCost) {
                minLinkCost = assembledMail[i][1]
                finalMail = assembledMail[i][0]
            }
        }
        finalMailArray.push([finalMail, (checksum % 256).toString(16).padStart(2, '0').toUpperCase(), minLinkCost])
    }
    finalMailArray.forEach(finalMail => {
        console.log(finalMail[0])
    });
    HookOutput(finalMailArray)
}