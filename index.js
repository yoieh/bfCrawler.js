const fetch = require("node-fetch");
const fs = require("fs");
const moment = require("moment");
const prompt = require("prompt");

const sleepTime = 500 * 2;
const timeoutTime = 200;

let wordAmount = 0;
let wordNr = 0;
let tried = 0;
let found = 0;

const prompt_attributes = [
  {
    name: "url",
    validator: /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+(\/)$/,
    warning: "Invaled url, had to end with a /"
  },
  {
    name: "file"
  }
];

const saveLog = (file, log) => {
  var file = `logs/${file}.log`;
  var text = log + "\r\n";
  fs.appendFile(file, text, err => err && console.error(err));
};

const timeout = (ms, promise) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error("timeout"));
    }, ms);
    promise.then(resolve, reject);
  });
};

const get = (url, words) => {
  const word = words[wordNr];

  const newUrl = `${url}${word}`;
  const sleep = setTimeout(() => {
    tried++;
    const startCall = new Date();
    timeout(timeoutTime, fetch(newUrl))
      .then(res => {
        const msLeft = sleepTime * (wordAmount - wordNr + 1);
        const d = moment.duration(msLeft, "milliseconds");
        const hours = Math.floor(d.asHours());
        const mins = Math.floor(d.asMinutes()) - hours * 60;

        console.clear();
        console.log(
          `[${moment().format("LLLL")}]: ${wordNr +
            1} / ${wordAmount} words, ${found} found.`
        );
        console.log(`~Time left: ${hours}:${mins}`);
        console.log(
          `Will be done: ${moment()
            .add(d)
            .format("LLLL")}`
        );
        const endCall = new Date() - startCall;
        saveLog(
          "calls",
          `[${moment().format(
            "LLLL"
          )}]: Word: ${word}, url: ${newUrl}, status: ${res.status}, ms: ${endCall}`
        );
        if (res.status === 200) {
          found++;
          saveLog(
            "success",
            `[${moment().format(
              "LLLL"
            )}]: Word: ${word}, url: ${newUrl}, status: ${res.status}, ms: ${endCall}`
          );
        }
        wordNr++;
        tried = 0;
        wordNr < wordAmount && get(url, words);

        wordNr === wordAmount && console.log("done");
      })
      .catch(error => {
        saveLog(
          "error",
          `[${moment().format(
            "LLLL"
          )}]: ${error}, Word: ${word}, url: ${newUrl}`
        );
        tried < 3 &&
          setTimeout(() => {
            get(url, words);
          }, sleep);
        if (tried === 3) {
          console.error(
            `[${moment().format(
              "LLLL"
            )}]: tried ${tried} times stopping process, ran ${wordNr} words`
          );
          saveLog(
            "error",
            `[${moment().format(
              "LLLL"
            )}]: tried ${tried} times stopping process, ran ${wordNr} words`
          );
        }
      });
  }, sleepTime);
};

const run = () => {
  try {
    console.clear();
    prompt.start();

    prompt.get(prompt_attributes, function(err, result) {
      if (err) {
        console.log(err);
        return 1;
      } else {
        console.log("Command-line received data:");

        const array = fs
          .readFileSync(result.file)
          .toString()
          .split("\n")
          .map(w => w.replace("\r", ""));

        wordAmount = array.length;

        get(result.url, array);
      }
    });
  } catch (error) {
    console.error(error);
  }
};

run();
