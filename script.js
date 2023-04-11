let minLvl = document.getElementById('minLvl')
let maxLvl = document.getElementById('maxLvl')
let maxSpawnTime = document.getElementById('maxSpawnTime')

let focusBasedRefreshCounter = true

tableConfig = {
    "ignoredColumns": ['id'],
    "autoRefreshTableInverval": 300
}

function checkDocumentFocus() {
    if (document.hasFocus()) {
        if (!focusBasedRefreshCounter){
            refreshTable()
            currentRefreshTableInterval = refreshTableInterval
            focusBasedRefreshCounter = true
        }
    } else {
        focusBasedRefreshCounter = false
    }
}

setInterval(checkDocumentFocus, 500);

function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for(let i = 0; i <ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
}

function convertRemaingTime(targetDate){
    let countDown, hours, minutes, seconds, nowUtc, days
    nowUtc = new Date().toUTCString()
    countDown = targetDate - Date.parse(nowUtc);
    hours = Math.floor(
      (countDown % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    minutes = Math.floor((countDown % (1000 * 60 * 60)) / (1000 * 60));
    seconds = Math.floor((countDown % (1000 * 60)) / 1000);
    if (hours < 10){hours = `0${hours}`}
    if (minutes < 10){minutes = `0${minutes}`}
    if (seconds < 10){seconds = `0${seconds}`}
    return `${hours}:${minutes}:${seconds}`
  }

function generateTableData(rbDataStatic, rbDataRealTimeHashMap){
    let tableData = []
    let wordArray, dateArray, timeArray
    rbDataStatic.forEach(function (item) {
        if (rbDataRealTimeHashMap.hasOwnProperty(item.id)){
            
            item['status'] = (rbDataRealTimeHashMap[item.id].status == "0") ? 'dead' : 'alive'
            
            wordArray = rbDataRealTimeHashMap[item.id].date.split(' ');
            item['dateString'] = wordArray[0]
            item['winStartString'] = wordArray[1]
            item['winEndString'] = wordArray[3]
            
            dateArray = item['dateString'].split('-')

            timeArray = item['winStartString'].split(':')
            item['dateWinStart'] = Date.UTC(dateArray[0], dateArray[1], dateArray[2], timeArray[0], timeArray[1]);

            timeArray = item['winEndString'].split(':')
            item['dateWinEnd'] = Date.UTC(dateArray[0], dateArray[1], dateArray[2], timeArray[0], timeArray[1]);

            if (item['status'] == 'dead'){
                item['winEndTimeRemaining'] = convertRemaingTime(item['dateWinEnd'])
                item['winStartTimeRemaining'] = convertRemaingTime(item['dateWinStart'])
                item['highlightClass'] = ""
                if (item['winEndTimeRemaining'].substring(0, 2) == "00"){
                    item['winStartTimeRemaining'] = "00:00:00"
                    item['highlightClass'] = `spawning`
                }else if (item['winStartTimeRemaining'].substring(0, 2) == "00"){
                    item['highlightClass'] = `winSoon`
                }
            }else{
                item['winStartTimeRemaining'] = "00:00:00"
                item['winEndTimeRemaining'] = "00:00:00"
                item['highlightClass'] = `alive`
            }
            tableData.push({
                "name": item.name,
                "level": item.level,
                "status": item.status,
                "ttwo": item.winStartTimeRemaining,
                "ttwc": item.winEndTimeRemaining,
                "loc": item.id,
                "class": item.highlightClass
            })
        }
    })
    return tableData
}

function generateTableHead(table, data) {
    let thead = table.createTHead();
    thead.setAttribute("id", "rbTable")
    let row = thead.insertRow();
    for (let key of data) {
        if (key == 'class'){
            continue
        }
        let th = document.createElement("th");
        let text = document.createTextNode(key);
        th.appendChild(text);
        row.appendChild(th);
    }
}

function time(timeStamp, cell, type, rowElem){
    let text = document.createTextNode(`${timeStamp}`);

    setInterval(calculate, 1000);
    
    function calculate(){
        let currentTimestamp = cell.textContent
        if (currentTimestamp == "00:00:00"){
            if (type == 'end'){
                rowElem.classList.add("alive");
                rowElem.classList.remove("spawning");
            }
            return
        }
        let timeArray = currentTimestamp.split(':')
        let i = 0
        for (let t of timeArray){
            timeArray[i] = parseInt(t)
            i++;
        }
        seconds = timeArray[0] * 3600
        seconds += timeArray[1] * 60
        seconds += timeArray[2]

        seconds += -1
        if (seconds <= 3600 && type == 'start'){
            rowElem.classList.add("winSoon");
        }
        if (seconds <= 3600 && type == 'end'){
            rowElem.classList.add("spawning");
            rowElem.classList.remove("winSoon");
        }

        timeArray[0] = Math.floor(
            (seconds % (60 * 60 * 24)) / (60 * 60)
        );
        timeArray[1] = Math.floor((seconds % (60 * 60)) / 60);
        timeArray[2] = Math.floor((seconds % 60));

        i = 0;
        for (let t of timeArray){
            if (t <= 0){
                timeArray[i] = 0
            }
            timeArray[i] = t.toString();
            if (timeArray[i].length == 1){
                timeArray[i] = `0${timeArray[i]}`
            }
            i++;
        }
        cell.innerHTML = `${timeArray[0]}:${timeArray[1]}:${timeArray[2]}`
    }
    
    return text
}

function applyFilter(item){
    if (item.level > parseInt(maxLvl.value)){
        return false
    }
    if (item.level < parseInt(minLvl.value)){
        return false
    }
    let timeArray = item['ttwo'].split(':')
    if (parseInt(timeArray[0]) >= parseInt(maxSpawnTime.value)){
        return false
    }
    return true
}

function convertIdToLink(text, id, type){
    let node = document.createTextNode(text); 
    let link = document.createElement('a');
    if (type == 'drop'){
        link.setAttribute('href', `https://interlude.wiki/db/npc/${id}.html`);
    }
    if (type == 'loc'){
        link.setAttribute('href', `https://interlude.wiki/db/loc/${id}.html`);
    }
    link.appendChild(node);
    return link
}

function generateTable(table, data) {
    for (let element of data) {
        if (!applyFilter(element)){
            continue
        }
        let row = table.insertRow();
        let i = 0
        if (element.class != ""){
            row.setAttribute('class', element.class);
        }
        for (key in element) {
            if (key == 'class'){
                continue
            }
                
            let type
            let cell = row.insertCell();
            let text = document.createTextNode(element[key]);
            if (i == 0){
                let link = convertIdToLink(element[key], element.loc, 'drop')
                cell.appendChild(link);
            }else if (i == 3 || i == 4){
                type = (i == 3) ? 'start' : 'end'
                cell.appendChild(time(element[key], cell, type, row));
            }
            else if (i == 5){
                let link = convertIdToLink('loc', element.loc, 'loc')
                cell.appendChild(link);
            }else{
                cell.appendChild(text);
            }
            i++;
        }
    }
}

function refreshTable(){
    if (!enableWebsite){
        let p1 = document.getElementById('p1')
        let p2 = document.getElementById('p2')
        p1.innerHTML = "This website is not available in Putin's Russia."
        p2.innerHTML = 'Slava Ukraini!'
        return
    }
    let rbDataRealTimeHashMap = {}
    fetch('https://seasons.l2reborn.org/wp-content/uploads/raids/raids.json', {cache: "no-cache"})
        .then((response) => response.json())
        .then(responseJson => {
        responseJson.forEach(function (item) {
            rbDataRealTimeHashMap[item.id.toString()] = item
        })
        let tableData = generateTableData(rbDataStatic, rbDataRealTimeHashMap)
        let previousTable = document.getElementById('rbTable')
        if (previousTable){
            document.cookie = `tableSettings=${maxLvl.value}-${minLvl.value}-${maxSpawnTime.value}; expires=Thu, 18 Dec 2033 12:00:00 UTC`
            previousTable.remove()
        }else{
            let tableSettings = getCookie('tableSettings')
            if (tableSettings) {
                arr = tableSettings.split('-')
                maxLvl.value = parseInt(arr[0]) 
                minLvl.value = parseInt(arr[1]) 
                maxSpawnTime.value = parseInt(arr[2]) 
            }
        }
        let table = document.querySelector("table");
        let data = Object.keys(tableData[0]);
        generateTableHead(table, data);
        generateTable(table, tableData);
        })
}

let refreshTableInterval = tableConfig.autoRefreshTableInverval
let currentRefreshTableInterval = refreshTableInterval
let tableRefreshInterval
let tableRefreshCountdownIndicator = document.getElementById('tableRefreshCountdownIndicator')
let minutes, seconds
function checkTableRefresh(){
    currentRefreshTableInterval += -1
    minutes = Math.floor((currentRefreshTableInterval % (60 * 60)) / (60));
    seconds = Math.floor((currentRefreshTableInterval % 60));
    if (minutes < 10){minutes = `0${minutes}`}
    if (seconds < 10){seconds = `0${seconds}`}
    tableRefreshCountdownIndicator.innerHTML = `${minutes}:${seconds}`
    if (currentRefreshTableInterval == 0) {
        refreshTable()
        currentRefreshTableInterval = refreshTableInterval
    }
}

function startTable(){
    refreshTable()
    currentRefreshTableInterval = refreshTableInterval
    if (tableRefreshInterval) {
        clearInterval(tableRefreshInterval);
    }
    tableRefreshInterval = setInterval(checkTableRefresh, 1000);
}

startTable()
