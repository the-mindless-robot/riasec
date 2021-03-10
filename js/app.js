/*
  aaaaaaaaaaaaa  ppppp   ppppppppp   ppppp   ppppppppp
  a::::::::::::a p::::ppp:::::::::p  p::::ppp:::::::::p
  aaaaaaaaa:::::ap:::::::::::::::::p p:::::::::::::::::p
           a::::app::::::ppppp::::::ppp::::::ppppp::::::p
    aaaaaaa:::::a p:::::p     p:::::p p:::::p     p:::::p
  aa::::::::::::a p:::::p     p:::::p p:::::p     p:::::p
 a::::aaaa::::::a p:::::p     p:::::p p:::::p     p:::::p
a::::a    a:::::a p:::::p    p::::::p p:::::p    p::::::p
a::::a    a:::::a p:::::ppppp:::::::p p:::::ppppp:::::::p
a:::::aaaa::::::a p::::::::::::::::p  p::::::::::::::::p
 a::::::::::aa:::ap::::::::::::::pp   p::::::::::::::pp
  aaaaaaaaaa  aaaap::::::pppppppp     p::::::pppppppp
                  p:::::p             p:::::p
                  p:::::p             p:::::p
                 p:::::::p           p:::::::p
                 p:::::::p           p:::::::p
                 p:::::::p           p:::::::p
                 ppppppppp           ppppppppp

*/

const router = new PanelRouter('panels', 'mainPanel');

async function app() {

    const firstPanel = router.getPanelInstance(0);
    firstPanel.elem.classList.add('loading');

    router._showLoader();
    const dataLoaded = await loadAllData();
    if(dataLoaded) {
        // hide loader
        router.setPanelOptions(0, {onActivated: finishLoading(firstPanel)});

        appStart();

    } else {
        console.error('fail: data did not load');
    }
}

function finishLoading(firstPanel) {
    setTimeout(()=>{
        router._hideLoader();
        firstPanel.elem.classList.remove('loading');
    }, 500);
}

function appStart() {
    router.start();
    setEventListeners();
    setProgressBar(router);
}

function setEventListeners() {
    const assessmentBtns = document.querySelectorAll('.startBtn');
    for(const btn of assessmentBtns) {
        btn.addEventListener('click', (event)=>{
            const target = event.target.tagName;
            const type = target === 'A'? event.target.dataset.type : event.target.parentElement.dataset.type;

            console.log('use type', target, type);
            setQuestions(type);
        });
    }
}

/*TODO: has to be invoked after questions/results sections are built*/
function updateEventListeners() {
    document.getElementById('resultsBtn').addEventListener('click', getResults);
    document.getElementById('clear').addEventListener('click', clearValues);

}

function setQuestions(assessmentType) {
    console.log('use this type:', assessmentType);
    console.log('current version:', dataObjects.version);

    // display questions
    displayQuestions(assessmentType);

    // set new current type
    dataObjects.version = assessmentType;

    // update router
    router.updateRouter();

    // update event listeners
    updateEventListeners();

    // true if reset
    setProgressBar(router, true);

    // updateProgressBar(increment);
    // updateHelpDisplay();

    //show first page of quesitons
    //TODO: control timing to avoid race condition
    //
    setTimeout(() => { router._forward(); }, 100);

}


app();

/*

            dddddddd
            d::::::d                          tttt
            d::::::d                       ttt:::t
            d::::::d                       t:::::t
            d:::::d                        t:::::t
    ddddddddd:::::d   aaaaaaaaaaaaa  ttttttt:::::ttttttt      aaaaaaaaaaaaa
  dd::::::::::::::d   a::::::::::::a t:::::::::::::::::t      a::::::::::::a
 d::::::::::::::::d   aaaaaaaaa:::::at:::::::::::::::::t      aaaaaaaaa:::::a
d:::::::ddddd:::::d            a::::atttttt:::::::tttttt               a::::a
d::::::d    d:::::d     aaaaaaa:::::a      t:::::t              aaaaaaa:::::a
d:::::d     d:::::d   aa::::::::::::a      t:::::t            aa::::::::::::a
d:::::d     d:::::d  a::::aaaa::::::a      t:::::t           a::::aaaa::::::a
d:::::d     d:::::d a::::a    a:::::a      t:::::t    tttttta::::a    a:::::a
d::::::ddddd::::::dda::::a    a:::::a      t::::::tttt:::::ta::::a    a:::::a
 d:::::::::::::::::da:::::aaaa::::::a      tt::::::::::::::ta:::::aaaa::::::a
  d:::::::::ddd::::d a::::::::::aa:::a       tt:::::::::::tt a::::::::::aa:::a
   ddddddddd   ddddd  aaaaaaaaaa  aaaa         ttttttttttt    aaaaaaaaaa  aaaa


*/

const dataObjects = {
    version: false
};

async function loadAllData() {
    const [onetResponse, programData] = await Promise.all([loadOnetData(), loadProgramData()]);
    const [onetDataObjects, programDataObjects] = await Promise.all([buildOnetDataObjects(onetResponse), buildProgramDataObjects(programData)]);

    // const onetDataObjects = await buildOnetDataObjects(onetResponse);
    dataObjects.onet = onetDataObjects;

    // const programData = await loadProgramData();
    // const programDataObjects = await buildProgramDataObjects(programData);
    dataObjects.programs = programDataObjects;

    console.debug('this is the MAIN dataObject', dataObjects);

    // displayQuestionOnets(dataObjects.onet.questionsHTML);
    // appStart();
    return true;
}


/*

           88
           88                                     ,d
           88                                     88
,adPPYba,  88,dPPYba,    ,adPPYba,   ,adPPYba,  MM88MMM
I8[    ""  88P'    "8a  a8P_____88  a8P_____88    88
 `"Y8ba,   88       88  8PP"""""""  8PP"""""""    88
aa    ]8I  88       88  "8b,   ,aa  "8b,   ,aa    88,
`"YbbdP"'  88       88   `"Ybbd8"'   `"Ybbd8"'    "Y888

*/

function loadProgramData() {
    return new Promise((resolve, reject) => {
        try {
            const programSheet = new GoogleSheet(config.sheet);
            const programData = programSheet.load(formatData, { end: 3 });
            resolve(programData);
        }
        catch(error) {
            console.error('failed to load program data', error);
            reject(error);
        }
    });
}

function buildProgramDataObjects(programData) {

    const programDataObjects = {};
    programDataObjects.codesToPrograms = programData.codesToPrograms;
    programDataObjects.areas = addAreaRankings(programData);
    programDataObjects.programsToUrls = programData.programsToUrls;

    return programDataObjects;
}

function formatData(data) {
    console.log('data', data);

    const programsToUrls = data.hasOwnProperty('programs') ? formatProgramUrls(data.programs) : false;
    const codesToPrograms = data.hasOwnProperty('programs') ? formatProgramCodes(data.programs) : false;
    const areas = data.hasOwnProperty('areas') && data.hasOwnProperty('shortdesc') ? formatAreaDefinitions(data.areas, data.shortdesc) : false;


    return { codesToPrograms, areas, programsToUrls };
}

function formatAreaDefinitions(areas, shortdesc) {
    const areaDefinitions = {};
    for (const area of areas) {
        const letter = area.label.charAt(0).toUpperCase();
        const areaLabel = area.label;
        const desc = area.desc;
        areaDefinitions[letter] = { areaLabel, desc };
    }

    for(const area of shortdesc) {
        const letter = area.label.charAt(0).toUpperCase();
        areaDefinitions[letter].shortdesc = buildShortDesc(area);
    }
    console.log('areaDefinitions', areaDefinitions);
    return areaDefinitions;
}

function buildShortDesc(area) {
    const areaClone = {...area};
    delete areaClone.label;

    const shortDesc = [];

    for(const key in areaClone) {
        const desc = area[key];
        if(typeof desc == 'string' && desc.length > 0) {
            shortDesc.push(desc);
        }
    }
    console.debug('shortDesc', shortDesc);
    return shortDesc;
}

function formatProgramCodes(programs) {
    const codesToPrograms = {};
    for (const program of programs) {
        const codeArray = buildCodeArray(program.hollandcode);
        for (const code of codeArray) {
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

function formatProgramUrls(programs) {
    const programsToUrls = {};
    for (const program of programs) {
        const discipline = program.hasOwnProperty('discipline') && program.discipline.length > 0 ? program.discipline.trim() : false;
        const url = program.hasOwnProperty('url') && program.url.length > 0 ? `https://www.sdmesa.edu/academics/academic-programs/${program.url.trim()}.shtml` : false;
        const codes = program.hasOwnProperty('hollandcode') && program.hollandcode.length > 0 ? program.hollandcode.trim() : false;
        const codesArray = program.hasOwnProperty('hollandcode') && program.hollandcode.length > 0 ? buildCodeArray(program.hollandcode) : false;
        if (discipline && url && codes && codesArray && !programsToUrls.hasOwnProperty(discipline)) {
            programsToUrls[discipline] = { url, codes, codesArray };
        }
    }
    // console.log('programsToUrls', programsToUrls);
    return programsToUrls;
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



function addAreaRankings(formattedData) {
    const areaRanking = formattedData.areas;
    const allCodes = Object.keys(formattedData.codesToPrograms);
    const areas = ['R', 'I', 'A', 'S', 'E', 'C'];
    for (let char of areas) {
        let numProgramsInArea = 0;
        for (let code of allCodes) {
            if (code.indexOf(char) != -1) {
                let numPrograms = Number(formattedData.codesToPrograms[code].length);
                numProgramsInArea += numPrograms;
            }
        }
        areaRanking[char].programs = numProgramsInArea;
    }

    // TODO: create options object for sortObjByKey
    const areasSorted = sortObjByKey(areaRanking, areas, 'programs');
    const fullNameSorted = areasSorted.map(area => areaRanking[area].areaLabel);
    areaRanking.sorted = fullNameSorted;
    console.debug('areaRanking', areaRanking);
    return areaRanking;
}


/*
                                        ,d
                                        88
 ,adPPYba,   8b,dPPYba,    ,adPPYba,  MM88MMM
a8"     "8a  88P'   `"8a  a8P_____88    88
8b       d8  88       88  8PP"""""""    88
"8a,   ,a8"  88       88  "8b,   ,aa    88,
 `"YbbdP"'   88       88   `"Ybbd8"'    "Y888


*/

function loadOnetData() {
    return new Promise((resolve, reject) => {
        const onet = new OnetWebService(config.username);
        let path = '/mnm/interestprofiler/questions';
        if (config.spanish) {
            path = '/mpp/interestprofiler/questions';
        }

        onet.call(path, { start: 1, end: 60 }, (response) => {
            if (response.hasOwnProperty('error')) {
                console.error('Error', response.error);
                reject(response.error);
            } else {
                resolve(response);
            }
        });

    });
}

function buildOnetDataObjects(response) {
    return new Promise((resolve, reject) => {
        const data = {};
        data.response = response;
        data.questionsByArea = parseQuestions(data.response.question);
        data.questionsHTML = randomizeQuestions(data.questionsByArea);
        resolve(data);
    });
}


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
    // console.log('questions', questions);
    // return questions;
    // randomizeQuestions(questions);
    return questions;
}

function randomizeQuestions(questions) {
    // copy object without reference
    const allQuestions = JSON.parse(JSON.stringify(questions));
    const areas = Object.keys(questions);
    const arrayOfQuestionsHTML = [];

    let numOptions = config.numTotalOptionsPerArea;

    for (let i = 0; i < config.numQuestionsPerArea; i++) {
        for (area of areas) {
            //get random number
            const index = getRandomNumber(numOptions);
            //add to list
            const question = allQuestions[area][index];
            // console.log(area+':'+index, question);
            // let questionHTML = buildLiHTML(question, area);
            // console.log('html', questionHTML);
            arrayOfQuestionsHTML.push(buildLiHTML(question, area));
            //remove from options
            allQuestions[area].splice(index, 1);
        }
        numOptions--;
    }
    // displayQuestionOnets(arrayOfQuestionsHTML);
    return arrayOfQuestionsHTML;
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



/*

            dddddddd
            d::::::d  iiii                                       lllllll
            d::::::d i::::i                                      l:::::l
            d::::::d  iiii                                       l:::::l
            d:::::d                                              l:::::l
    ddddddddd:::::d iiiiiii     ssssssssss   ppppp   ppppppppp    l::::l   aaaaaaaaaaaaayyyyyyy           yyyyyyy
  dd::::::::::::::d i:::::i   ss::::::::::s  p::::ppp:::::::::p   l::::l   a::::::::::::ay:::::y         y:::::y
 d::::::::::::::::d  i::::i ss:::::::::::::s p:::::::::::::::::p  l::::l   aaaaaaaaa:::::ay:::::y       y:::::y
d:::::::ddddd:::::d  i::::i s::::::ssss:::::spp::::::ppppp::::::p l::::l            a::::a y:::::y     y:::::y
d::::::d    d:::::d  i::::i  s:::::s  ssssss  p:::::p     p:::::p l::::l     aaaaaaa:::::a  y:::::y   y:::::y
d:::::d     d:::::d  i::::i    s::::::s       p:::::p     p:::::p l::::l   aa::::::::::::a   y:::::y y:::::y
d:::::d     d:::::d  i::::i       s::::::s    p:::::p     p:::::p l::::l  a::::aaaa::::::a    y:::::y:::::y
d:::::d     d:::::d  i::::i ssssss   s:::::s  p:::::p    p::::::p l::::l a::::a    a:::::a     y:::::::::y
d::::::ddddd::::::ddi::::::is:::::ssss::::::s p:::::ppppp:::::::pl::::::la::::a    a:::::a      y:::::::y
 d:::::::::::::::::di::::::is::::::::::::::s  p::::::::::::::::p l::::::la:::::aaaa::::::a       y:::::y
  d:::::::::ddd::::di::::::i s:::::::::::ss   p::::::::::::::pp  l::::::l a::::::::::aa:::a     y:::::y
   ddddddddd   dddddiiiiiiii  sssssssssss     p::::::pppppppp    llllllll  aaaaaaaaaa  aaaa    y:::::y
                                              p:::::p                                         y:::::y
                                              p:::::p                                        y:::::y
                                             p:::::::p                                      y:::::y
                                             p:::::::p                                     y:::::y
                                             p:::::::p                                    yyyyyyy
                                             ppppppppp

*/

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

function displayQuestions(assessmentType) {

    const questionsList = buildQuestionList(assessmentType);
    const questionsPerPage = getQuestionsPerPage(assessmentType);
    const numPages = 6; //number of question pages not total pages

    const questionsObj = {
        assessmentType,
        numPages,
        questionsPerPage,
        questionsList
    };

    buildPagination(questionsObj);
    initStars();
}

function buildQuestionList(assessmentType) {
    if(assessmentType == 'quick') {
        return getQuickVersionQuestions();
    }
    return [...dataObjects.onet.questionsHTML];
}

function getQuestionsPerPage(assessmentType) {
    const numQuestions = assessmentType == 'quick' ? 1 : 10;
    return numQuestions;
}

function buildPagination(questionsObj) {
    console.debug('questionsObj:', questionsObj);

    const panelsContainer = document.getElementById('panels');
    const resultsPanel = copyAndRemoveResultsPanel(panelsContainer);

    clearPrevQuestionPanels(panelsContainer);
    addNewQuestionPanels(panelsContainer, questionsObj);
    panelsContainer.appendChild(resultsPanel);

    return;
}

function copyAndRemoveResultsPanel(panelsContainer) {
    console.debug('COPYING');
    const resultsElem = panelsContainer.querySelector('#results');
    const resultsElemClone = resultsElem.cloneNode(true);
    panelsContainer.removeChild(resultsElem);

    return resultsElemClone;
}

function clearPrevQuestionPanels(panelsContainer) {
    console.debug('DELETING');
    const questionPanels = panelsContainer.querySelectorAll('[data-area="questions"]');
    console.warn('CLEARING PANELS',questionPanels);
    for(const panel of questionPanels) {
        panelsContainer.removeChild(panel);
    }
    return;
}

function addNewQuestionPanels(container, questionsObj) {
    console.debug('BUILDING');
    const panelsContainer = container;
    for (let i = 0; i < questionsObj.numPages; i++) {
        const newPanel = buildPanel();
        const panelContent = questionsObj.assessmentType == 'quick' ? buildQuickVersionContent(i, questionsObj) : buildDetailVersionContent(i, questionsObj);
        newPanel.innerHTML = panelContent;
        panelsContainer.appendChild(newPanel);
    }
}

function buildPanel() {
    const newPanel = document.createElement('div');
    newPanel.classList.add('panel');
    newPanel.classList.add('mainPanel');
    newPanel.dataset.area = 'questions';
    return newPanel;
}


/*

                          88              88
                          ""              88
                                          88
 ,adPPYb,d8  88       88  88   ,adPPYba,  88   ,d8
a8"    `Y88  88       88  88  a8"     ""  88 ,a8"
8b       88  88       88  88  8b          8888[
"8a    ,d88  "8a,   ,a88  88  "8a,   ,aa  88`"Yba,
 `"YbbdP'88   `"YbbdP'Y8  88   `"Ybbd8"'  88   `Y8a
         88
         88
*/



function getQuickVersionQuestions() {
    const areaQuestionsHTML = [];
    const areas = Object.keys(dataObjects.programs.areas);
    console.warn("AREAs", areas);
    for(const area of areas) {
        if(area.length == 1 ) {
            const areaData = dataObjects.programs.areas[area];
            areaQuestionsHTML.push(buildAreaQuestionHTMLv2(areaData));
        }
    }
    console.warn("AREA HTML", areaQuestionsHTML);
    return areaQuestionsHTML;
}

function buildQuickVersionContent(i, questionsObj) {
    return `<div class="panel-content areaQuestion">
                <br/><br/>
                <div id="questions">
                   ${questionsObj.questionsList[i]}
                </div>
                <div class="nav">
                    ${getNavValue(i, questionsObj.numPages)}
                </div>
            </div>`;
}

function buildAreaQuestionHTMLv2(area) {
    return `<ul>
                ${buildAreaShortDesc(area.shortdesc)}
            </ul>

        <br/>
        <div class="value" data-area="${area.areaLabel}">
            <span class="ratingLabel">Disagree</span>
            <i data-value="1" class="material-icons">star</i>
            <i data-value="2" class="material-icons">star</i>
            <i data-value="3" class="material-icons">star</i>
            <i data-value="4" class="material-icons">star</i>
            <i data-value="5" class="material-icons">star</i>
            <span class="ratingLabel">Agree</span>
        </div>
        <div class="divider"></div>
    `;
}

function buildAreaQuestionHTML(area) {
    return `
        <h2>${area.areaLabel}</h2>
        <p class="areaDesc">${area.desc}</p>
        <p><span class="examples">Examples</span>
            <ul>
                ${getAreaExamples(area.areaLabel)}
            </ul>
        </p>
        <br/>
        <div class="value" data-area="${area.areaLabel}">
            <span class="ratingLabel">Disagree</span>
            <i data-value="1" class="material-icons">star</i>
            <i data-value="2" class="material-icons">star</i>
            <i data-value="3" class="material-icons">star</i>
            <i data-value="4" class="material-icons">star</i>
            <i data-value="5" class="material-icons">star</i>
            <span class="ratingLabel">Agree</span>
        </div>
        <div class="divider"></div>
    `;
}

function buildAreaShortDesc(shortDesc) {
    let examplesHTML = "";

    for(const desc of shortDesc) {
        examplesHTML += buildExampleHTML(desc);
    }

    return examplesHTML;

}


function getAreaExamples(area) {
    console.warn("DATA OBJECTS",dataObjects.onet.questionsByArea[area]);
    const allQuestions = [...dataObjects.onet.questionsByArea[area]];
    let examplesHTML = "";
    let numOptions = allQuestions.length - 1;

    for(let i = 0; i < 3; i++) {
        const randomIndex = getRandomNumber(numOptions);
        const example = allQuestions[randomIndex];
        examplesHTML += buildExampleHTML(example);
        allQuestions.splice(randomIndex, 1);
        numOptions--;
    }

    return examplesHTML;

}

function buildExampleHTML(example) {
    return `<li>${example}</li>`;
}



/*

         88                                   88  88
         88                ,d                 ""  88
         88                88                     88
 ,adPPYb,88   ,adPPYba,  MM88MMM  ,adPPYYba,  88  88
a8"    `Y88  a8P_____88    88     ""     `Y8  88  88
8b       88  8PP"""""""    88     ,adPPPPP88  88  88
"8a,   ,d88  "8b,   ,aa    88,    88,    ,88  88  88
 `"8bbdP"Y8   `"Ybbd8"'    "Y888  `"8bbdP"Y8  88  88


*/

function buildDetailVersionContent(i, questionsObj) {
    return `<div class="panel-content onet">
    <h2>I would like to...</h2>
        <div id="questions">
            <ol>
            ${addQuestions(i, questionsObj.questionsPerPage, questionsObj.questionsList)}
            </ol>
        </div>
        <div class="nav">
            ${getNavValue(i, questionsObj.numPages)}
        </div>
    </div>`;
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


8b,dPPYba,   ,adPPYYba,  8b       d8
88P'   `"8a  ""     `Y8  `8b     d8'
88       88  ,adPPPPP88   `8b   d8'
88       88  88,    ,88    `8b,d8'
88       88  `"8bbdP"Y8      "8"


*/

function getNavValue(i, numPages) {
    const lastPage = i == numPages - 1 ? true : false;
    if (lastPage) {
        return `<a class="prev mainPanel">
                    <span class="iconify" data-icon="ic:baseline-chevron-left" data-inline="false"></span>
                    <span class="btnLabel">PREV</span>
                </a>
                <a id="resultsBtn" class="next mainPanel">
                    <span class="btnLabel">RESULTS</span>
                    <span class="iconify" data-icon="ic:baseline-leaderboard" data-inline="false"></span>
                </a>`;
    }
    return `<a class="prev mainPanel">
                <span class="iconify" data-icon="ic:baseline-chevron-left" data-inline="false"></span>
                <span class="btnLabel">PREV</span>
            </a>
            <a class="next mainPanel">
                <span class="btnLabel">NEXT</span>
                <span class="iconify" data-icon="ic:baseline-chevron-right" data-inline="false"></span>
            </a>`;
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

function setProgressBar(router, reset = false) {

    //TODO:fix hard coded numpanels
    // dont count first panel
    // const numPanels = router.getNumPanels() - 1;
    const numPanels = 9;
    const increment = Math.ceil(100 / numPanels);
    // console.log('increment', numPanels, increment);

    setNextBtns(increment, router.getNextBtns());
    setPrevBtns(increment, router.getPrevBtns());

    if(reset) {
        updateProgressBar(increment);
        // updateHelpDisplay();
    }
}

function setNextBtns(increment, btns) {
    btns.forEach(btn => {
        btn.addEventListener('click', (ev) => {
            updateProgressBar(increment);
            // updateHelpDisplay();
        });
    });
}

function setPrevBtns(increment, btns) {
    btns.forEach(btn => {
        btn.addEventListener('click', (ev) => {
            updateProgressBar(increment, true);
            // updateHelpDisplay();
        });
    });
}

function updateProgressBar(increment, backward = false) {

    const progress = document.getElementById('progress');
    const progressDims = progress.getBoundingClientRect();
    const progressBarDims = document.getElementById('progress-bar').getBoundingClientRect();

    const currentWidth = Math.ceil((progressDims.width / progressBarDims.width) * 100);
    let newWidth = currentWidth;

    if (backward && currentWidth > 0) {
        newWidth = currentWidth - Number(increment);
    }
    if (!backward && currentWidth < 100) {
        newWidth = currentWidth + Number(increment);
    }

    progress.style.width = newWidth + '%';
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
    const isActive = helpContent.classList.contains('active');
    console.debug('current', currentPanel);

    if (dataArea && dataArea == 'questions') {
        // console.log('in questions', isActive);

        if (!isActive) {
            helpContent.style.display = 'block';
            setTimeout(() => {
                // console.log('in questions delay');
                helpContent.classList.add('active');
            }, 80);
        }

    }

    if (!dataArea || dataArea != 'questions') {
        // console.log('remove');
        helpContent.classList.remove('active');
        setTimeout(() => {
            // console.log('left questions delay');
            helpContent.style.display = 'none';
        }, 300);
    }


}



/*


                                                                           lllllll         tttt
                                                                           l:::::l      ttt:::t
                                                                           l:::::l      t:::::t
                                                                           l:::::l      t:::::t
rrrrr   rrrrrrrrr       eeeeeeeeeeee        ssssssssss   uuuuuu    uuuuuu   l::::lttttttt:::::ttttttt        ssssssssss
r::::rrr:::::::::r    ee::::::::::::ee    ss::::::::::s  u::::u    u::::u   l::::lt:::::::::::::::::t      ss::::::::::s
r:::::::::::::::::r  e::::::eeeee:::::eess:::::::::::::s u::::u    u::::u   l::::lt:::::::::::::::::t    ss:::::::::::::s
rr::::::rrrrr::::::re::::::e     e:::::es::::::ssss:::::su::::u    u::::u   l::::ltttttt:::::::tttttt    s::::::ssss:::::s
 r:::::r     r:::::re:::::::eeeee::::::e s:::::s  ssssss u::::u    u::::u   l::::l      t:::::t           s:::::s  ssssss
 r:::::r     rrrrrrre:::::::::::::::::e    s::::::s      u::::u    u::::u   l::::l      t:::::t             s::::::s
 r:::::r            e::::::eeeeeeeeeee        s::::::s   u::::u    u::::u   l::::l      t:::::t                s::::::s
 r:::::r            e:::::::e           ssssss   s:::::s u:::::uuuu:::::u   l::::l      t:::::t    ttttttssssss   s:::::s
 r:::::r            e::::::::e          s:::::ssss::::::su:::::::::::::::uul::::::l     t::::::tttt:::::ts:::::ssss::::::s
 r:::::r             e::::::::eeeeeeee  s::::::::::::::s  u:::::::::::::::ul::::::l     tt::::::::::::::ts::::::::::::::s
 r:::::r              ee:::::::::::::e   s:::::::::::ss    uu::::::::uu:::ul::::::l       tt:::::::::::tt s:::::::::::ss
 rrrrrrr                eeeeeeeeeeeeee    sssssssssss        uuuuuuuu  uuuullllllll         ttttttttttt    sssssssssss







*/

/*

88                        88  88           88
88                        ""  88           88
88                            88           88
88,dPPYba,   88       88  88  88   ,adPPYb,88
88P'    "8a  88       88  88  88  a8"    `Y88
88       d8  88       88  88  88  8b       88
88b,   ,a8"  "8a,   ,a88  88  88  "8a,   ,d88
8Y"Ybbd8"'    `"YbbdP'Y8  88  88   `"8bbdP"Y8


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
    const highlightedAreas = document.querySelectorAll('.area.highlight');
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
async function getRIASEC(results) {
    console.warn('dataObject', dataObjects);
    let sortedResults = sortObjByKey(results, dataObjects.programs.areas.sorted);
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
    // console.log('all', uniquePermutations);
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
    // console.log('remainingAreas', remainingAreas);

    for (let area of remainingAreas) {
        let within = checkValues(baselineValue, r.scores[area]);
        let newCode = r.code.slice(0, 2) + area.charAt(0).toUpperCase();
        // console.log('newCode', newCode);
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
    // console.log(decimal, percent, Math.floor(percent));

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
        const codesToPrograms = dataObjects.programs.codesToPrograms;
        const codes = RIASEC.permuts;
        let programs = [];
        RIASEC.matched = {};
        for (let code of codes) {
            //codes to program from data
            if (codesToPrograms.hasOwnProperty(code)) {
                // programs = [...programs, [code, ...codesToPrograms[code]]];
                programs = [...programs, ...codesToPrograms[code]];
                RIASEC.matched[code] = true;
            } else {
                console.debug('No match found: ', code);
                RIASEC.matched[code] = false;
            }
        }

        console.log('programs', programs);
        console.log('unique', removeDuplicates(programs));
        console.log('RIASEC.matched', RIASEC.matched);

        RIASEC.programs = removeDuplicates(programs);

        dataObjects.results = RIASEC;

        //TODO: this is bad need to refactor
        findCareerMatches(RIASEC);

}

async function findCareerMatches(RIASEC) {

    console.warn('THIS', RIASEC.code);
    const url = `https://infinite-spire-51367.herokuapp.com/career/riasec/${RIASEC.code}`;
    const response = await fetch(url);
    const careers = response.status == 200 ? await response.json() : false;
    console.debug('CAREERS!!!!!!!', careers);

    const careerObj = transformCareers(careers);
    console.debug('Career OBJ', careerObj);

    RIASEC.careers = careerObj;
    dataObjects.results = RIASEC;

    displayResults(RIASEC);

}

function transformCareers(careers) {
    const careersObj = {};
    for(const group of careers) {
        const id = group._id;
        careersObj[id] = group.careers;
    }
    return careersObj;
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
    setCodeAndDesc(RIASEC);
    // setOptionsAndMatches(RIASEC);
    // setBarGraph(RIASEC);
    setPrograms(RIASEC);
    setCareers(RIASEC.code);
}

function setCodeAndDesc(RIASEC) {
    const codeElem = document.getElementById('code');
    codeElem.innerHTML = RIASEC.code;
    buildDescription(RIASEC.code);
}

function setOptionsAndMatches(RIASEC) {
    let permutString = '';
    for (let code of RIASEC.permuts) {
        const matched = checkIfMatched(RIASEC.matched, code);
        permutString += getCodeHTML(code, matched);
    }
    document.getElementById('permuts').innerHTML = `(${RIASEC.permuts.length}) ${permutString}`;
}

function setBarGraph(RIASEC) {
    for (let area of RIASEC.areas) {
        const areaElem = document.getElementById(area);
        const areaScore = document.getElementById(area + '-score');
        const areaValue = document.getElementById(area + '-value');

        areaScore.innerHTML = RIASEC.scores[area];

        const scorePercent = computePercent(RIASEC.scores[area]);
        areaValue.style.width = scorePercent + "%";

        if (RIASEC.code.indexOf(area.charAt(0)) != -1) {
            areaElem.classList.add('highlight');
        }
    }
}

function getCodeHTML(code, matched = false) {
    if (matched) {
        return `<span class="code">${code}</span>`;
    }
    return `<span class="code unmatched">${code}</span>`;
}

function checkIfMatched(MatchesObj, code) {
    if (MatchesObj.hasOwnProperty(code) && MatchesObj[code] === true) {
        return true;
    }
    return false;
}

function buildDescription(code) {
    const descContainer = document.getElementById('desc');
    let allDescHTML = '';
    for (const letter of code) {
        // console.log('letter', dataObjects.programs.areas[letter.toUpperCase()]);
        const desc = dataObjects.programs.areas[letter.toUpperCase()].desc;
        const areaLabel = dataObjects.programs.areas[letter.toUpperCase()].areaLabel;
        const descHTML = `<div class="desc">
                            <h4><span>${areaLabel}</span></h4>
                            <p>${desc}</p>
                          </div>`;
        allDescHTML += descHTML;
    }
    descContainer.innerHTML = allDescHTML;
}


function setPrograms(RIASEC) {
    let matchesHTML = "";
    const matchesContainer = document.getElementById('matches');
    const numMatches = RIASEC.programs.length;

    // show first 15
    for(let i = 0; i < 15; i++) {
        const program = RIASEC.programs[i];
        if(program) {
            matchesHTML += buildMatchHTML(program, RIASEC);
        }

    }

    matchesContainer.innerHTML = matchesHTML;

    if(numMatches > 15) {
        const showMoreBtnElem = buildShowMoreBTN();
        matchesContainer.append(showMoreBtnElem);
    }


}

function buildShowMoreBTN() {
    const showMoreBTN = document.createElement("A");
    showMoreBTN.id = "showMore";
    showMoreBTN.classList.add('actionBtn', 'blue', 'v-align');
    showMoreBTN.innerHTML = `<span class="iconify" data-icon="mdi:plus-thick" data-inline="false"></span> Show More Matches`;

    showMoreBTN.addEventListener('click', (ev)=>{
        console.log('MOAR!!!', dataObjects.results.programs);
        const matches = [...dataObjects.results.programs];
        // const removeMatches = matches.splice(0, 15);
        // console.warn("REMOVED", removeMatches);
        // console.warn("REMAINING", matches);

        moreMatchesHTML = '';
        for(const program of matches) {
            moreMatchesHTML += buildMatchHTML(program, dataObjects.results);
        }

        const moreBtn = document.getElementById('showMore');
        const matchesContainer = document.getElementById('matches');
        matchesContainer.removeChild(moreBtn);
        matchesContainer.innerHTML = moreMatchesHTML;

    });

    return showMoreBTN;
}

function buildMatchHTML(program, RIASEC) {
    if (dataObjects.programs.programsToUrls.hasOwnProperty(program)) {
        const programObj = dataObjects.programs.programsToUrls[program];
        const url = programObj.hasOwnProperty('url') && programObj.url.length > 0 ? programObj.url.trim() : false;
        const codes = programObj.hasOwnProperty('codesArray') && programObj.codesArray.length > 0 ? ` ${getMatchedCodeHTML(programObj.codesArray, RIASEC)}` : ``;
        if (url) {
            return `<span class="program"><a href="${url}" target="_blank">${program}</a>${codes}</span>`;
        }
        return `<span class="program">${program}${codes}</span>`;

    } else {
        console.debug('No program found:', program);
    }

}

/* TODO: need codes to array */
function getMatchedCodeHTML(codes, RIASEC) {
    let codeHTML = '';
    const matchedCodes = buildMatchedCodesArray(codes, RIASEC);

    for (const code of matchedCodes) {

        codeHTML += `<span class="code">${code}</span>`;

    }
    return codeHTML;
}

function buildMatchedCodesArray(codes, RIASEC) {
    const matchedCodesArray = [];
    for (const code of codes) {
        if (checkIfMatched(RIASEC.matched, code)) {
            matchedCodesArray.push(code);
        }
    }
    if (matchedCodesArray.length > 1) {
        return reOrderArray(matchedCodesArray, RIASEC.permuts);
    }
    return matchedCodesArray;
}

function reOrderArray(array, orderByArray) {
    console.log('matchedCodes', array);
    array.sort((a, b) => {
        let valueA, valueB;
        valueA = orderByArray.indexOf(a);
        valueB = orderByArray.indexOf(b);

        if (valueA < valueB) {
            return -1;
        }
        if (valueA > valueB) {
            return 1;
        }

        // names must be equal
        return 0;
    });
    console.log('matchedCodesSorted', array);
    return array;
}


/*




 ,adPPYba,  ,adPPYYba,  8b,dPPYba,   ,adPPYba,   ,adPPYba,  8b,dPPYba,  ,adPPYba,
a8"     ""  ""     `Y8  88P'   "Y8  a8P_____88  a8P_____88  88P'   "Y8  I8[    ""
8b          ,adPPPPP88  88          8PP"""""""  8PP"""""""  88           `"Y8ba,
"8a,   ,aa  88,    ,88  88          "8b,   ,aa  "8b,   ,aa  88          aa    ]8I
 `"Ybbd8"'  `"8bbdP"Y8  88           `"Ybbd8"'   `"Ybbd8"'  88          `"YbbdP"'


*/

function setCareers(code) {
    const riasecArray = getCodesArray(code);
    console.log('riasecArray', riasecArray);
    for(const code of riasecArray) {
        console.log('code loop', code);
    }
}

function getCodesArray(code) {
    console.log(code);
    const a = code[0] || '';
    const b = code[1] || '';
    const c = code[2] || '';

    return [`${a}${b}${c}`, `${a}${b}`, `${a}`, `${a}${c}${b}`, `${a}${c}`, `${b}${a}${c}`, `${b}${a}`];
}

/*


                                                                iiii  lllllll
                                                               i::::i l:::::l
                                                                iiii  l:::::l
                                                                      l:::::l
    eeeeeeeeeeee       mmmmmmm    mmmmmmm     aaaaaaaaaaaaa   iiiiiii  l::::l
  ee::::::::::::ee   mm:::::::m  m:::::::mm   a::::::::::::a  i:::::i  l::::l
 e::::::eeeee:::::eem::::::::::mm::::::::::m  aaaaaaaaa:::::a  i::::i  l::::l
e::::::e     e:::::em::::::::::::::::::::::m           a::::a  i::::i  l::::l
e:::::::eeeee::::::em:::::mmm::::::mmm:::::m    aaaaaaa:::::a  i::::i  l::::l
e:::::::::::::::::e m::::m   m::::m   m::::m  aa::::::::::::a  i::::i  l::::l
e::::::eeeeeeeeeee  m::::m   m::::m   m::::m a::::aaaa::::::a  i::::i  l::::l
e:::::::e           m::::m   m::::m   m::::ma::::a    a:::::a  i::::i  l::::l
e::::::::e          m::::m   m::::m   m::::ma::::a    a:::::a i::::::il::::::l
 e::::::::eeeeeeee  m::::m   m::::m   m::::ma:::::aaaa::::::a i::::::il::::::l
  ee:::::::::::::e  m::::m   m::::m   m::::m a::::::::::aa:::ai::::::il::::::l
    eeeeeeeeeeeeee  mmmmmm   mmmmmm   mmmmmm  aaaaaaaaaa  aaaaiiiiiiiillllllll


*/

document.getElementById('send').addEventListener('click', runEmailSequence);
document.getElementById('close').addEventListener('click', closeModal);

function closeModal() {
    const elem = document.querySelector('.modal');
    const modal = M.Modal.getInstance(elem);
    clearFormData(elem);
    modal.close();
}

function clearFormData(elem) {
    const inputs = elem.querySelectorAll('input');
    for(const input of inputs) {
        input.value = "";
    }

    const labels = elem.querySelectorAll('label');
    for(const label of labels) {
        label.classList.remove('active');
    }

    const msg = document.getElementById('msg');
    msg.style.display = "none";


}

function runEmailSequence() {
    // show loader
    const loader = document.getElementById('modal-loader');
    loader.style.display = 'flex';

    // get values
    const userInputs = getFormValues();
    console.log('userInputs', userInputs);

    const results = dataObjects.results;
    const userData = {
        ...userInputs,
        code: results.code,
        artistic: results.scores.Artistic,
        conventional: results.scores.Conventional,
        enterprising: results.scores.Enterprising,
        investigative: results.scores.Investigative,
        realistic: results.scores.Realistic,
        social: results.scores.Social,
        version: dataObjects.version,
        programs: convertToString(results.programs),
        email_list: convertToHTML(results.programs)
    }
    console.debug('RESULTS', userData);
    // build request
    const url = './php/request.php';
    const method = 'POST';

    const data = new FormData;
    const table = 'riasec_users';
    const action = 'INSERT';
    const dataString = JSON.stringify(userData);
    data.append('table', table);
    data.append('dataString', dataString);
    data.append('action', action);

    const request = {url, method, data};
    console.log('REQUEST', request);

    // send request
    Handshake.send(request).then(response => {
        const loader = document.getElementById('modal-loader');

        // parse response
        const responseData = JSON.parse(response);
        console.log('RESPONSE:', responseData);

        // display response
        if(responseData.result.httpCode === 201 || responseData.result.httpCode === 200) {
            showSuccess();
        } else {
            showError();
        }

        // hide loader
        loader.style.display = 'none';
    });

}

function showSuccess() {
    const msg = document.getElementById('msg');
    msg.classList.add('success');
    msg.innerHTML = "Email sent.  You will receive your results shortly.";
}

function showError() {
    const msg = document.getElementById('msg');
    msg.classList.add('error');
    msg.innerHTML = "Whoops, it looks like something went wrong.  Please try again.";
}


function convertToString(array) {
    let string = "";
    for(const value of array) {
        string += `${value}, `;
    }
    string = string.substring(0, string.length - 2);
    return string;
}

function convertToHTML(array) {
    let listHTML = "";
    for(const item of array) {
        listHTML += buildHTML(item);
    }
    return listHTML;
}

function buildHTML(item) {
    const link = dataObjects.programs.programsToUrls[item].url;
    const codes = dataObjects.programs.programsToUrls[item].codes;
    return `<li><a href="${link}">${item}</a> ${codes}</li>`;
}

function getFormValues() {
    const emailForm = new FormGrunt('get');
    console.log('FORM', emailForm);
    return emailForm.getAllInputValues();
}