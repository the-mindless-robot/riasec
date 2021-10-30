class Sheet {
    constructor(a, b) {
        this.a = a;
        this.b = b;
    }

    async load(options = false) {
        const sheet = {};
        const sheetTitles = options?.sheetTitle ? options.sheetTitle : await this._getSheetTitles(this.b);
        
        if (options?.showTitles) {
            console.debug('titles', sheetTitles);
        }
        if(sheetTitles.constructor !== Array || sheetTitles.length <= 0 ) {
            console.error('sheetTitles must be array with at least one item', sheetTitles);
            return;
        }

        for (const title of sheetTitles) {
            const url = this._buildUrl(title);
            const data = await this._requestData(url);
            if (data) {
                const rows = this._buildRowsV4(data);
				const formattedTitle = title.toLowerCase().trim();
                sheet[formattedTitle] = rows;
            }
        }

        if (options?.hasOwnProperty("callback") && typeof options.callback == 'function') {
            return options.callback(sheet);
        }
        return sheet;
    }

    _buildUrl(title) {
        const encodedTitle = encodeURIComponent(title);
        const url = 'https://sheets.googleapis.com/v4/spreadsheets/' + this.a + '/values/' + encodedTitle + '?key=' + this.b;

        return url;
    }

    async _requestData(url) {
        const response = await fetch(url);
        const data = response.status == 200 ? await response.json() : false;

        return data;
    }

    async _getSheetTitles() {
        const sheets = [];
        const url = 'https://sheets.googleapis.com/v4/spreadsheets/' + this.a + '/?key=' + this.b;
        const data = await this._requestData(url);

        if (data) {
            for (const sheet of data.sheets) {
                sheets.push(sheet.properties.title);
            }
            return sheets;
        }

        return false;

    }

    _buildRowsV4(data) {
        const rows = [];

        if (data.values) {

            const labels = data.values[0];

            for (let row = 1; row < data.values.length; row++) {
                const rowObj = {};

                const rowValues = data.values[row];

                for (let i = 0; i < labels.length; i++) {
                    const label = this._removeSpecialCharsAndSpaces(labels[i].trim().toLowerCase());
                    const value = rowValues[i]?.trim() ?? '';

                    //                 console.debug(`${label} : ${value}`);
                    rowObj[label] = value;
                    //                 console.debug('rowObj', rowObj);
                }
                rows.push(rowObj)
            }
        }

        return rows;
    }

    _removeSpaces(string) {
        return string.replace(/\s+/g, '')
    }

    _removeSpecialCharsAndSpaces(string) {
        return string.replace(/[^\w]/g, '')
    }
}
