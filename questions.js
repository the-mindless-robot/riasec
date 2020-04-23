


const onet = new OnetWebService(config.username);
let path = '/mnm/interestprofiler/questions';
if (config.spanish) {
    path = '/mpp/interestprofiler/questions';
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
    console.debug('called');
    if (response.hasOwnProperty('error')) {
        console.log('Error', response.error);
    } else {
        console.log('Response', response);
        buildQuestionsObj(response.question);
    }
});

function buildQuestionsObj(questionsArray) {
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
    console.log('questions', questions);
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
    if (config.pagination) {
        buildPagination(questionsList);
    } else {
        let container = document.querySelector("#questions ol");
        container.innerHTML = "";
        for (let q of questionsList) {
            container.innerHTML += q;
        }
        setupRouter();
    }




    return;
}

function buildPagination(questionsList) {
    console.log('display questions1');

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
    appStart();
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
    const inputs = selectInputs();
    for (let input of inputs) {

        const stars = input.parentElement.querySelectorAll('.material-icons');
        stars.forEach(star => star.classList.remove('active', 'selected'));

    }
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
    displayResults(RIASEC);
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

    console.log('inputs', typeof inputs);
    let inputsArray = Array.from(inputs);
    console.log('inputsArray', inputsArray);
    return inputsArray;
}

function initStars() {
    const stars = document.querySelectorAll('.material-icons');
    const allStars = Array.from(stars);
    console.log('allStars', allStars);

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
        starElems[i].classList.add('active');
    }

    ev.target.classList.add('selected');
}

function clearStars(stars) {
    for (let star of stars) {
        star.classList.remove('active', 'selected');
    }
}