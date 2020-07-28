/*

         88
         88                ,d
         88                88
 ,adPPYb,88  ,adPPYYba,  MM88MMM  ,adPPYYba,
a8"    `Y88  ""     `Y8    88     ""     `Y8
8b       88  ,adPPPPP88    88     ,adPPPPP88
"8a,   ,d88  88,    ,88    88,    88,    ,88
 `"8bbdP"Y8  `"8bbdP"Y8    "Y888  `"8bbdP"Y8


*/
const onet = new OnetWebService(config.username);
let path = '/mnm/interestprofiler/questions';
if (config.spanish) {
    path = '/mpp/interestprofiler/questions';
}

function formatData(data) {
    console.log('data', data);
    const codesToPrograms = {};
    for (let program of data.sheet1) {
        const codeArray = buildCodeArray(program.hollandcode);
        for (let code of codeArray) {
            //check if exists
            if (codesToPrograms.hasOwnProperty(code)) {
                //if exists add program value to key
                codesToPrograms[code].push(program.discipline);
            } else {
                //create new key and add value
                codesToPrograms[code] = [program.discipline];
            }
        }
    }
    console.log('codesToPrograms', codesToPrograms);
    return codesToPrograms;
}

function buildCodeArray(codeString) {
    const [...codeArray] = removeSpaces(codeString).split(',');
    // console.log('value', codeArray);
    return codeArray;
}

function removeSpaces(string) {
    return string.replace(/\s/g, '');
}

//load/parse program data in background
const programData = new GoogleSheet(config.sheet);
let codesToPrograms = null;
let areaRanking = null;
programData.load(formatData).then(data => {
    codesToPrograms = data;
    areaRanking = getAreaRanking(data);
});

function getAreaRanking(data) {
    let areaRanking = {};
    let allCodes = Object.keys(data);
    let areas = ['R', 'I', 'A', 'S', 'E', 'C'];
    for (let char of areas) {
        let numProgramsInArea = 0;
        for (let code of allCodes) {
            if (code.indexOf(char) != -1) {
                let numPrograms = Number(data[code].length);
                numProgramsInArea += numPrograms;
            }
        }
        areaRanking[char] = numProgramsInArea;
    }

    const areasSorted = sortObjByKey(areaRanking);
    const fullNameSorted = areasSorted.map(area => charToArea(area));
    areaRanking.sorted = fullNameSorted;
    console.debug('areaRanking', areaRanking);
    return areaRanking;
}

function charToArea(char) {
    const areasMap = {
        R: "Realistic",
        I: "Investigative",
        A: "Artistic",
        S: "Social",
        E: "Enterprising",
        C: "Conventional"
    }
    return areasMap[char.toUpperCase()];
}

/*

                                                          88
                                                   ,d     ""
                                                   88
 ,adPPYb,d8  88       88   ,adPPYba,  ,adPPYba,  MM88MMM  88   ,adPPYba,   8b,dPPYba,   ,adPPYba,
a8"    `Y88  88       88  a8P_____88  I8[    ""    88     88  a8"     "8a  88P'   `"8a  I8[    ""
8b       88  88       88  8PP"""""""   `"Y8ba,     88     88  8b       d8  88       88   `"Y8ba,
"8a    ,d88  "8a,   ,a88  "8b,   ,aa  aa    ]8I    88,    88  "8a,   ,a8"  88       88  aa    ]8I
 `"YbbdP'88   `"YbbdP'Y8   `"Ybbd8"'  `"YbbdP"'    "Y888  88   `"YbbdP"'   88       88  `"YbbdP"'
         88
         88
*/

onet.call(path, { start: 1, end: 60 }, (response) => {
    if (response.hasOwnProperty('error')) {
        console.error('Error', response.error);
    } else {
        // console.log('Response', response);
        parseQuestions(response.question);
        appStart();
    }
});

function parseQuestions(questionsArray) {
    const questions = {};
    for (question of questionsArray) {
        if (questions.hasOwnProperty(question.area)) {
            // add to array of questions for area
            questions[question.area].push(question.text);
        } else {
            // create key and array
            // add value
            questions[question.area] = [question.text];
        }
    }
    randomizeQuestions(questions);
}

function randomizeQuestions(questions) {
    //copy object without reference
    let allQuestions = JSON.parse(JSON.stringify(questions));
    console.log('allQuestions', allQuestions);
    const areas = Object.keys(questions);
    const arrayOfQuestionsHTML = [];
    let numOptions = config.numTotalOptionsPerArea;

    for (let i = 0; i < config.numQuestionsPerArea; i++) {
        for (area of areas) {
            //get random number
            let index = getRandomNumber(numOptions);
            //add to list
            let question = allQuestions[area][index];
            // console.log(area+':'+index, question);
            // let questionHTML = buildLiHTML(question, area);
            // console.log('html', questionHTML);
            arrayOfQuestionsHTML.push(buildLiHTML(question, area));
            //remove from options
            allQuestions[area].splice(index, 1);
        }
        numOptions--;
    }
    displayQuestions(arrayOfQuestionsHTML)
}

/*
TODO: update icons and associated methods to iconify
*/
function buildLiHTML(question, area) {
    return `<li><div class="question">${question}</div>
        <div class="value" data-area="${area}">
            <i data-value="1" class="material-icons">star</i>
            <i data-value="2" class="material-icons">star</i>
            <i data-value="3" class="material-icons">star</i>
            <i data-value="4" class="material-icons">star</i>
            <i data-value="5" class="material-icons">star</i>
        </div>
        </li>`;
}

function getRandomNumber(limit) {
    return Math.floor(Math.random() * limit);
}

function displayQuestions(arrayOfQuestions) {
    let questionsList = [...arrayOfQuestions];
    buildPagination(questionsList);
}

function buildPagination(questionsList) {

    const odd = Number(config.numQuestionsPerArea) % 2 == 0 ? false : true;
    let questionsPerPage = 12;
    if (odd) {
        questionsPerPage = questionsList.length > 36 ? 15 : 10;
    }
    const numPages = Math.ceil(questionsList.length / questionsPerPage);

    const panelsContainer = document.getElementById('panels');
    const resultsElem = panelsContainer.querySelector('#results');
    const resultsElemClone = resultsElem.cloneNode(true);
    panelsContainer.removeChild(resultsElem);
    console.log('resElemClone', resultsElemClone);
    // panelsContainer.innerHTML = "";

    for (let i = 0; i < numPages; i++) {
        const newPanel = buildPanel();
        const panelContent = `<div class="panel-content">
            <h2>I would like to...</h2>
                <div id="questions">
                    <ol>
                    ${addQuestions(i, questionsPerPage, questionsList)}
                    </ol>
                </div>
                <div class="nav">
                    ${getNavValue(i, numPages)}
                </div>
            </div>`;
        newPanel.innerHTML = panelContent;
        panelsContainer.appendChild(newPanel);
    }
    panelsContainer.appendChild(resultsElemClone);
    return;
}

function buildPanel() {
    const newPanel = document.createElement('div');
    newPanel.classList.add('panel');
    newPanel.dataset.area = 'questions';
    return newPanel;
}

function getNavValue(i, numPages) {
    const lastPage = i == numPages - 1 ? true : false;
    if (lastPage) {
        return `<a class="prev">
                    <span class="iconify" data-icon="ic:baseline-chevron-left" data-inline="false"></span>
                    <span class="btnLabel">PREV</span>
                </a>
                <a id="resultsBtn" class="next">
                    <span class="btnLabel">RESULTS</span>
                    <span class="iconify" data-icon="ic:baseline-leaderboard" data-inline="false"></span>
                </a>`;
    }
    return `<a class="prev">
                <span class="iconify" data-icon="ic:baseline-chevron-left" data-inline="false"></span>
                <span class="btnLabel">PREV</span>
            </a>
            <a class="next">
                <span class="btnLabel">NEXT</span>
                <span class="iconify" data-icon="ic:baseline-chevron-right" data-inline="false"></span>
            </a>`;
}

function addQuestions(i, questionsPerPage, questionsList) {
    let questionsHTML = '';
    let index = i * questionsPerPage;
    const end = index + questionsPerPage;
    for (index; index < end; index++) {
        if (questionsList[index]) {
            questionsHTML += questionsList[index];
        }

    }
    return questionsHTML;
}


/*


                                        ,d
                                        88
8b,dPPYba,   ,adPPYba,   88       88  MM88MMM  ,adPPYba,  8b,dPPYba,
88P'   "Y8  a8"     "8a  88       88    88    a8P_____88  88P'   "Y8
88          8b       d8  88       88    88    8PP"""""""  88
88          "8a,   ,a8"  "8a,   ,a88    88,   "8b,   ,aa  88
88           `"YbbdP"'    `"YbbdP'Y8    "Y888  `"Ybbd8"'  88


*/
function appStart() {
    const router = new PanelRouter('panels');
    router.start();
    initStars();
    setEventListeners();
    setProgressBar(router);
}

function setEventListeners() {
    document.getElementById('resultsBtn').addEventListener('click', getResults);
    document.getElementById('clear').addEventListener('click', clearValues);
}

/*

                                                                                                 88
                                                                                                 88
                                                                                                 88
8b,dPPYba,   8b,dPPYba,   ,adPPYba,    ,adPPYb,d8  8b,dPPYba,   ,adPPYba,  ,adPPYba,  ,adPPYba,  88,dPPYba,   ,adPPYYba,  8b,dPPYba,
88P'    "8a  88P'   "Y8  a8"     "8a  a8"    `Y88  88P'   "Y8  a8P_____88  I8[    ""  I8[    ""  88P'    "8a  ""     `Y8  88P'   "Y8
88       d8  88          8b       d8  8b       88  88          8PP"""""""   `"Y8ba,    `"Y8ba,   88       d8  ,adPPPPP88  88
88b,   ,a8"  88          "8a,   ,a8"  "8a,   ,d88  88          "8b,   ,aa  aa    ]8I  aa    ]8I  88b,   ,a8"  88,    ,88  88
88`YbbdP"'   88           `"YbbdP"'    `"YbbdP"Y8  88           `"Ybbd8"'  `"YbbdP"'  `"YbbdP"'  8Y"Ybbd8"'   `"8bbdP"Y8  88
88                                     aa,    ,88
88                                      "Y8bbdP"
*/

function setProgressBar(router) {
    const numPanels = router.getNumPanels() - 1;
    const increment = Math.ceil(100 / numPanels);
    console.log('increment', increment);

    setNextBtns(increment, router.getNextBtns());
    setPrevBtns(increment, router.getPrevBtns());
}

function setNextBtns(increment, btns) {
    btns.forEach(btn => {
        btn.addEventListener('click', (ev) => {
            updateProgressBar(increment);
            updateHelpDisplay();
        });
    });
}

function setPrevBtns(increment, btns) {
    btns.forEach(btn => {
        btn.addEventListener('click', (ev) => {
            updateProgressBar(increment, true);
        });
    });
}

function updateProgressBar(increment, backward = false) {

    const progress = document.getElementById('progress');
    const progressDims = progress.getBoundingClientRect();
    const progressBarDims = document.getElementById('progress-bar').getBoundingClientRect();

    const currentWidth = Math.ceil((progressDims.width / progressBarDims.width) * 100);
    let newWidth = currentWidth;

    if(backward && currentWidth > 0) {
        newWidth = currentWidth - Number(increment);
    }
    if(!backward && currentWidth < 100) {
        newWidth = currentWidth + Number(increment);
    }

    progress.style.width = newWidth + '%';
}



/*

                                                88
                                                88    ,d
                                                88    88
8b,dPPYba,   ,adPPYba,  ,adPPYba,  88       88  88  MM88MMM  ,adPPYba,
88P'   "Y8  a8P_____88  I8[    ""  88       88  88    88     I8[    ""
88          8PP"""""""   `"Y8ba,   88       88  88    88      `"Y8ba,
88          "8b,   ,aa  aa    ]8I  "8a,   ,a88  88    88,    aa    ]8I
88           `"Ybbd8"'  `"YbbdP"'   `"YbbdP'Y8  88    "Y888  `"YbbdP"'


*/

function getResults() {
    let results;

    results = ratingEval();

    if (Object.keys(results).length < 6) {
        results = addEmptyAreas(results);
    }

    getRIASEC(results);
}

function clearValues() {
    const activeStars = document.querySelectorAll('i.activated');
    activeStars.forEach(star => star.classList.remove('activated', 'selected'));
    const highlightedAreas = document.querySelectorAll('.value.highlight');
    highlightedAreas.forEach(area => area.classList.remove('highlight'));
    const progress = document.getElementById('progress');
    progress.style.width = 0;

}

function addEmptyAreas(results) {
    const areas = ["Realistic", "Investigative", "Artistic", "Social", "Enterprising", "Conventional"];
    //shallow copy results
    let completeResults = JSON.parse(JSON.stringify(results));
    for (let area of areas) {
        if (!completeResults.hasOwnProperty(area)) {
            completeResults[area] = 0;
        }
    }
    return completeResults;
}

// resutls -> object; scores by RIASEC area
function getRIASEC(results) {

    let sortedResults = sortObjByKey(results, areaRanking.sorted);
    let code = "";
    for (let i = 0; i < 3; i++) {
        code += sortedResults[i].charAt(0);
    }

    const RIASEC = {
        scores: results,
        code: code.toUpperCase(),
        areas: sortedResults
    }
    // console.log('code', code);
    let permutations = getPermutations(code);
    // console.log('permuts', permutations);
    permutations = [...permutations, ...checkRemainingAreas(RIASEC)];
    permutations = [...permutations, ...twoLetterCodes(permutations)];
    const uniquePermutations = removeDuplicates(permutations);
    console.log('all', uniquePermutations);
    RIASEC.permuts = uniquePermutations;

    findProgramMatches(RIASEC);
}



function twoLetterCodes(permutations) {
    const twoLetterCodes = [];
    for (let value of permutations) {
        twoLetterCodes.push(value.slice(0, 2));
    }
    return twoLetterCodes;
}

function checkRemainingAreas(RIASEC) {
    const r = RIASEC;
    //use 3rd highest score as baseline
    let baselineValue = r.scores[r.areas[2]];
    //get bottom three areas
    let remainingAreas = r.areas.slice(3);
    let additionalPermuts = [];
    console.log('remainingAreas', remainingAreas);

    for (let area of remainingAreas) {
        let within = checkValues(baselineValue, r.scores[area]);
        let newCode = r.code.slice(0, 2) + area.charAt(0).toUpperCase();
        console.log('newCode', newCode);
        if (within.fivePercent) {
            //get all permutaions of new code
            let permuts = getPermutations(newCode);
            //add to additional
            additionalPermuts = [...additionalPermuts, ...permuts];
            // do not do both
            continue;
        }
        if (within.tenPercent) {
            additionalPermuts = [...additionalPermuts, newCode];
        }
    }
    return additionalPermuts;
}


function checkValues(baseline, testValue) {
    const diff = baseline - testValue;
    const results = {
        tenPercent: false,
        fivePercent: false
    };
    if (diff <= 5) {
        results.tenPercent = true;
    }
    if (diff <= 3) {
        results.fivePercent = true;
    }
    return results;
}

function getPermutations(string) {
    // console.log('start', string);
    //return single char
    if (string.length < 2) return string;

    const permutations = [];
    for (let i = 0; i < string.length; i++) {
        //    console.group();
        let first = string[i];
        //    console.log('first', first);
        if (string.indexOf(first) != i) continue; // skip it this time

        let remainingString = string.slice(0, i) + string.slice(i + 1, string.length); //Note: you can concat Strings via '+' in JS
        //   console.log('remaing', remainingString);
        //   console.groupEnd();
        for (let subPermutation of getPermutations(remainingString)) {
            permutations.push(first + subPermutation)
        }
    }
    return permutations;
}

function computePercent(value) {
    const maxScore = Number(config.numQuestionsPerArea) * 5;
    const decimal = Number(value) / maxScore;
    const percent = decimal * 100;
    console.log(decimal, percent, Math.floor(percent));

    return Math.floor(percent);
}

//obj -> object to be sorted
//orderBy -> array of obj's keys in specific order
//key -> if second level is obj -> key to sort by
function sortObjByKey(obj, orderBy = false, key = false) {
    let array;
    if (orderBy) {
        array = [...orderBy];
    } else {
        array = Object.keys(obj);
    }
    array.sort((a, b) => {
        let valueA, valueB;
        if (key) {
            valueA = obj[a][key];
            valueB = obj[b][key];
        } else {
            valueA = obj[a];
            valueB = obj[b];
        }

        if (valueA > valueB) {
            return -1;
        }
        if (valueA < valueB) {
            return 1;
        }
        return 0;
    });
    return array;
}

function ratingEval() {
    const inputs = selectInputs();
    const results = {};
    for (let input of inputs) {
        let value = Number(input.dataset.value);
        let area = input.parentElement.dataset.area;
        if (results.hasOwnProperty(area)) {
            results[area] += value;
        } else {
            results[area] = value;
        }
    }

    return results;
}

/*

                                                    88
                                  ,d                88
                                  88                88
88,dPYba,,adPYba,   ,adPPYYba,  MM88MMM  ,adPPYba,  88,dPPYba,    ,adPPYba,  ,adPPYba,
88P'   "88"    "8a  ""     `Y8    88    a8"     ""  88P'    "8a  a8P_____88  I8[    ""
88      88      88  ,adPPPPP88    88    8b          88       88  8PP"""""""   `"Y8ba,
88      88      88  88,    ,88    88,   "8a,   ,aa  88       88  "8b,   ,aa  aa    ]8I
88      88      88  `"8bbdP"Y8    "Y888  `"Ybbd8"'  88       88   `"Ybbd8"'  `"YbbdP"'


*/

function findProgramMatches(RIASEC) {

    const codes = RIASEC.permuts;
    let programs = [];
    RIASEC.unmatchedCodes = [];
    for (let code of codes) {
        //codes to program from data
        if (codesToPrograms.hasOwnProperty(code)) {
            programs = [...programs, ...codesToPrograms[code]];
        } else {
            console.debug('No match found: ', code);
            RIASEC.unmatchedCodes.push(code);
        }
    }

    console.log('programs', programs);
    console.log('unique', removeDuplicates(programs));

    displayResults(RIASEC);
    displayMatches(removeDuplicates(programs));
}

function removeDuplicates(array) {
    const arrayCopy = [...array];
    let uniqueArray = arrayCopy.filter((value, index) => {
        //only return first instance
        return arrayCopy.indexOf(value) === index;
    });
    return uniqueArray;
}


/*

         88  88                          88
         88  ""                          88
         88                              88
 ,adPPYb,88  88  ,adPPYba,  8b,dPPYba,   88  ,adPPYYba,  8b       d8
a8"    `Y88  88  I8[    ""  88P'    "8a  88  ""     `Y8  `8b     d8'
8b       88  88   `"Y8ba,   88       d8  88  ,adPPPPP88   `8b   d8'
"8a,   ,d88  88  aa    ]8I  88b,   ,a8"  88  88,    ,88    `8b,d8'
 `"8bbdP"Y8  88  `"YbbdP"'  88`YbbdP"'   88  `"8bbdP"Y8      Y88'
                            88                               d8'
                            88                              d8'
*/
function displayResults(RIASEC) {
    console.log('RIASEC', RIASEC);
    for (let area of RIASEC.areas) {
        let areaElem = document.getElementById(area);
        areaElem.innerHTML = RIASEC.scores[area];

        let scorePercent = computePercent(RIASEC.scores[area]);
        areaElem.style.width = scorePercent + "%";

        if (RIASEC.code.indexOf(area.charAt(0)) != -1) {
            areaElem.classList.add('highlight');
        }
    }

    let codeElem = document.getElementById('code');
    codeElem.innerHTML = RIASEC.code;

    let permutString = '';
    for (let code of RIASEC.permuts) {
        permutString += `<span class="code">${code}</span>`;
    }
    document.getElementById('permuts').innerHTML = `(${RIASEC.permuts.length}) ${permutString}`;
    highlightUnmatched(RIASEC);
}

function highlightUnmatched(RIASEC) {
    let codes = document.querySelectorAll('span.code');
    codes = Array.from(codes);
    for (let code of codes) {
        if (RIASEC.unmatchedCodes.indexOf(code.innerHTML) != -1) {
            code.classList.add('unmatched');
        }
    }
}

function displayMatches(programs) {
    let matchesHTML = "";
    for (let program of programs) {
        matchesHTML += buildMatchHTML(program);
    }
    document.getElementById('matches').innerHTML = matchesHTML;
}

function buildMatchHTML(program) {
    return `<span class="program">${program}</span>`;
}


/*
             ,d
             88
,adPPYba,  MM88MMM  ,adPPYYba,  8b,dPPYba,  ,adPPYba,
I8[    ""    88     ""     `Y8  88P'   "Y8  I8[    ""
 `"Y8ba,     88     ,adPPPPP88  88           `"Y8ba,
aa    ]8I    88,    88,    ,88  88          aa    ]8I
`"YbbdP"'    "Y888  `"8bbdP"Y8  88          `"YbbdP"'


*/

function selectInputs() {
    const inputs = document.querySelectorAll("#questions i.selected");
    let inputsArray = Array.from(inputs);
    return inputsArray;
}

function initStars() {
    const stars = document.querySelectorAll('.material-icons');
    const allStars = Array.from(stars);
    for (let star of allStars) {
        star.addEventListener('click', adjustRating);
    }
}

function adjustRating(ev) {
    const value = ev.target.dataset.value;
    const parent = ev.target.parentElement;
    const stars = parent.querySelectorAll('.material-icons');
    const starElems = Array.from(stars);
    clearStars(starElems);
    for (let i = 0; i < value; i++) {
        starElems[i].classList.add('activated');
    }

    ev.target.classList.add('selected');
}

function clearStars(stars) {
    for (let star of stars) {
        star.classList.remove('activated', 'selected');
    }
}

/*

88                       88
88                       88
88                       88
88,dPPYba,    ,adPPYba,  88  8b,dPPYba,
88P'    "8a  a8P_____88  88  88P'    "8a
88       88  8PP"""""""  88  88       d8
88       88  "8b,   ,aa  88  88b,   ,a8"
88       88   `"Ybbd8"'  88  88`YbbdP"'
                             88
                             88
*/

function updateHelpDisplay() {
    const activePanels = document.querySelectorAll('.panel.active');
    const currentPanel = activePanels[activePanels.length - 1];
    const dataArea = currentPanel.dataset.area || false;
    const helpContent = document.getElementById('helpContent');

    console.debug('current', currentPanel);

    if(dataArea && dataArea == 'questions') {
        console.log('in questions');
        helpContent.style.display = 'block';
        return;
    }

    helpContent.style.display = 'none';

}