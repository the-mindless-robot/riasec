class GoogleSheet {
	constructor(id) {
		this.id = id;
	}

	async load(callback = false) {
		const sheet = {};

		const APIkey = config.apiKey;
		const sheetTitles = await this._getSheetTitles(APIkey);
		console.debug('titles', sheetTitles);

		for(const title of sheetTitles) {
			const encodedTitle = encodeURIComponent(title);
			const url = 'https://sheets.googleapis.com/v4/spreadsheets/' + this.id + '/values/' + encodedTitle + '?key='+ APIkey;
			const data = await this._requestData(url);
			if(data) {
                // format sheet title if necessary
                const formattedTitle = title.toLowerCase().trim();
				const rows = this._buildRowsV4(data);
				sheet[formattedTitle] = rows;
			}
		}

		if(callback && typeof callback == 'function') {
			return callback(sheet);
		}
		return sheet;
	}

	async _requestData(url) {
		const response = await fetch(url);
		const data = response.status == 200 ? await response.json() : false;
		return data;
	}

	async _getSheetTitles(APIkey) {
		const sheets = [];
		const url = 'https://sheets.googleapis.com/v4/spreadsheets/' + this.id + '/?key='+ APIkey;
		const data = await this._requestData(url);

		if(data) {
			for(const sheet of data.sheets) {
				sheets.push(sheet.properties.title);
			}
			return sheets;
		}

		return false;

	}

	_buildRowsV4(data) {
		const rows = [];

		if(data.values) {

			const labels = data.values[0];

			for(let row=1; row < data.values.length; row++) {
				const rowObj = {};

				const rowValues = data.values[row];

				for(let i=0; i < labels.length; i++) {
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
