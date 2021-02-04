// runs on request object
/*
 const request = {
                url: url,
                method: type,
                data: data
            }
*/
/*
*  url => endpoint to hit
*  method => GET, POST, PUT... etc.
*  data => form data
*   INSERT: table, dataString
*   GET: table, fieldName, fieldValue
*   PUT: table, fieldName, fieldValue, dataString
*/

class Handshake {
    static send(request) {
        return new Promise((resolve, reject) => {
            let xhr = new XMLHttpRequest();
            xhr.open(request.method || "GET", request.url);
            // console.log('req', xhr);
            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        resolve(xhr.responseText);
                    } else {
                        reject({ "XHR_ERROR": xhr.statusText });
                    }
                }
            };
            if (request.method === 'POST') {
                xhr.send(request.data);
            } else {
                xhr.send();
            }
        });
    }
}