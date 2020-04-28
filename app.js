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
    for (let program of data.Sheet1) {
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

//load program data in background
const programData = new GoogleSheet(config.sheet);
let codesToPrograms = null;
programData.load(formatData).then(data =>{codesToPrograms=data;});

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
    console.debug('called');
    if (response.hasOwnProperty('error')) {
        console.log('Error', response.error);
    } else {
        console.log('Response', response);
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

// @TODO build html for rating function
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
    console.log('resElemClone', resultsElemClone);
    panelsContainer.innerHTML = "";

    for (let i = 0; i < numPages; i++) {
        let panel = `<div class="panel">
            <div class="panel-content">
            <h2>Questions</h2>
                <div id="questions">
                    <ol>
                    ${addQuestions(i, questionsPerPage, questionsList)}
                    </ol>
                </div>
                <div class="nav">
                    ${getNavValue(i, numPages)}
                </div>
            </div>
        </div>`;
        panelsContainer.innerHTML+= panel;
    }
    panelsContainer.appendChild(resultsElemClone);
    return;
}

function getNavValue(i, numPages) {
    const lastPage = i == numPages-1 ? true : false;
    if(lastPage) {
        return `<button class="prev">PREV</button>
        <button id="resultsBtn" class="next">GET RESULTS</button>`;
    }
    return `<button class="prev">PREV</button><button class="next">NEXT</button>`;
}

function addQuestions(i, questionsPerPage, questionsList) {
    let questionsHTML = '';
    let index = i * questionsPerPage;
    const end = index + questionsPerPage;
    for(index; index < end; index++) {
        if(questionsList[index]) {
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
}

function setEventListeners() {
    document.getElementById('resultsBtn').addEventListener('click', getResults);
    document.getElementById('clear').addEventListener('click', clearValues);
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
    console.log('in results');

    results = ratingEval();

    if (Object.keys(results).length < 6) {
        results = addEmptyAreas(results);
    }

    getRIASEC(results);
}

function clearValues() {
    const activeStars = document.querySelectorAll('i.activated');
    activeStars.forEach(star => star.classList.remove('activated', 'selected'));
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
    console.log('results', results);
    let sortedResults = sortByScore(results);
    console.log('sorted', sortedResults);
    // @TODO check for equal values
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

    displayResults(RIASEC);
    findProgramMatches(uniquePermutations);
}

function twoLetterCodes(permutations) {
    const twoLetterCodes = [];
    for (let value of permutations) {
        twoLetterCodes.push(value.slice(0,2));
    }
    return twoLetterCodes;
}

function checkRemainingAreas(RIASEC) {
    const r = RIASEC;
    let baselineValue = r.scores[r.areas[2]];
    let remainingAreas = r.areas.slice(3);
    let additionalPermuts = [];
    console.log('remainingAreas', remainingAreas);

    for(let area of remainingAreas) {
        let within = checkValues(baselineValue, r.scores[area]);
        let newCode = r.code.slice(0,2) + area.charAt(0).toUpperCase();
        console.log('newCode', newCode);
        if(within.onePoint) {
            //get all permutaions of new code
            let permuts = getPermutations(newCode);
            console.log('permuts', permuts);
            //add to additional
            additionalPermuts = [...additionalPermuts, ...permuts];
            // do not do both
            continue;
        }
        if(within.tenPercent) {
            additionalPermuts = [...additionalPermuts, newCode];
        }
    }
    console.log('add', additionalPermuts);
    return additionalPermuts;
}


function checkValues(baseline, testValue) {
    const diff = baseline - testValue;
    const results = {
        tenPercent: false,
        onePoint: false
    };
    if(diff < 5) {
        results.tenPercent = true;
    }
    if(diff <= 1) {
        results.onePoint = true;
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

function sortByScore(results) {
    let areas = Object.keys(results);
    areas.sort((a, b) => {
        let valueA = results[a];
        let valueB = results[b];

        if (valueA > valueB) {
            return -1;
        }
        if (valueA < valueB) {
            return 1;
        }
        return 0;
    });
    return areas;
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

function findProgramMatches(codes) {
    //from config
    console.log('original', codesToPrograms);
    const codeToProgram = JSON.parse(JSON.stringify(codesToPrograms));
    console.log('copy', codeToProgram);
    let programs = [];
    for(let code of codes) {
        if(codeToProgram.hasOwnProperty(code)) {
            programs = [...programs, ...codeToProgram[code]];
        } else {
            console.debug('No match found: ', code);
        }
    }
    console.log('programs', programs);
    console.log('unique', removeDuplicates(programs));

    displayMatches(removeDuplicates(programs));
}

function removeDuplicates(array) {
    const arrayCopy = [...array];
    let uniqueArray = arrayCopy.filter((value, index)=>{
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

        if (RIASEC.areas.indexOf(area) < 3) {
            areaElem.classList.add('highlight');
        }

        let codeElem = document.getElementById('code');
        codeElem.innerHTML = RIASEC.code;
    }

    let permutString = '';
    for(let code of RIASEC.permuts) {
        permutString += code + " ";
    }
    document.getElementById('permuts').innerHTML = permutString;
}

function displayMatches(programs) {
    let matchesHTML = "";
    for(let program of programs) {
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