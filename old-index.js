const fetch = require("node-fetch");
const fs = require("fs");
const words = require("./words");

const sleepTime = 5000;
const timeoutTime = 5;

const wordAmount = words.length;

let wordNr = 0;

const saveLog = (file, log) => {
  var file = `logs/${file}.log`;
  var text = log + "\r\n";
  fs.appendFile(file, text, err => err && console.error(err));
};

const getData = _ => {
  const sleep = setTimeout(() => {
    new Promise((resolve, reject) => {
      let cancel = false;

      const timeout = setTimeout(() => {
        clearTimeout(sleep);
        reject(false);
        cancel = true;
      }, timeoutTime);

      const word = words[wordNr];
      // const url = `http://www.pglans.se/geo/gc84f31/${word}.txt`;

      const url = `https://www.google.com`;

      var startCall = new Date();
      fetch(url)
        .then(res => {
          var endCall = new Date() - startCall;
          console.info(
            `Word: ${word}, url: ${url}, status: ${res.status}, ms: ${endCall}`
          );

          saveLog(
            "calls",
            `Word: ${word}, url: ${url}, status: ${res.status}, ms: ${endCall}`
          );
          if (res.status === 200) {
            saveLog(
              "success",
              `Word: ${word}, url: ${url}, status: ${
                res.status
              }, ms: ${endCall}`
            );
          }
          wordNr++;

          console.log(wordNr, wordAmount, cancel);

          wordNr < wordAmount && !cancel && getData();
          resolve(true);
        })
        .catch(error => {
          console.error(error);
          wordNr > wordAmount && !cancel && getData();
        })
        .finally(() => {
          clearTimeout(timeout);
        });
    });
  }, sleepTime);
};

getData();
