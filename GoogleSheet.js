class GoogleSheet {
    constructor(id) {
        this.id = id;
    }
    async load(callback = false, options = false) {
        const sheet = {};
        let moreData;
        let sheetNumber = options && options.hasOwnProperty('start') ? options.start : 1;
        const sheetNumberEnd = options && options.hasOwnProperty('end') ? options.end : false;
        do {
            moreData = false;
            const url = 'https://spreadsheets.google.com/feeds/list/' + this.id + '/' + sheetNumber + '/public/values?alt=json';

            const response = await fetch(url);
            // console.log('response', response);
            console.log(`sheet${sheetNumber} ${response.status}`);
            const data = response.status == 200 ? await response.json() : false;

            if(data) {
                const sheetName = await getSheetName(data);
                const rows = await buildRows(data);
                sheet[sheetName] = rows;

                if(!sheetNumberEnd || sheetNumber != sheetNumberEnd) {
                    sheetNumber++;
                    moreData = true;
                }
            }
        }
        while (moreData);

        if(callback && typeof callback == 'function') {
           return callback(sheet);
        }
        return sheet;
    }
}

async function buildRows(data) {

    const rows = [];

    if (data.feed.entry) {
        data.feed.entry.forEach(row => {
            // console.log('row => ', row);
            let rowObj = {};
            for (let field in row) {
                if (field.substring(0, 3) == 'gsx') {
                    rowObj[field.split('$')[1]] = row[field].$t;
                }
            }
            rows.push(rowObj);
        });
    } else {
        console.warn('No data in sheet');
        return "No data found";
    }

    return rows;
}

async function getSheetName(data) {
    return  data.feed.title.$t.toLowerCase().trim();
}