"use strict";

var https = require("https");
const functions = require("firebase-functions");

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(
  (request, response) => {
    const action = request.body.result.action;
    response.setHeader("Content-Type", "application/json");

    if (action != "input.getStockPrice") {
      response.send(buildChatResponse("I'm sorry, I don't know this."));
      return;
    }

    const parameters = request.body.result.parameters;
    var companyName = parameters["company_name"];
    var priceType = parameters["price_type"];
    var date = parameters["date"];

    getStockPrice(companyName, priceType, date, response);
  }
);

function buildChatResponse(chat) {
  return JSON.stringify({ speech: chat, displayText: chat });
}

function getStockPrice(companyName, priceType, date, cloudFnResponse) {
  console.log("In function getStockPrice");
  console.log("Company name:", companyName);
  console.log("Price Type:", priceType);
  console.log("Date:", date);

  var tickerMap = {
    apple: "AAPL",
    amazon: "AMZN",
    facebook: "FB",
    google: "GOOG",
    ibm: "IBM",
    microsoft: "MSFT"
  };

  var priceMap = {
    opening: "opening_price",
    closing: "closing_price",
    maximum: "high_price",
    high: "high_price",
    "high price": "high_price",
    low: "low_price",
    "low price": "low_price",
    minimum: "low_price"
  };

  var stockTicker = tickerMap[companyName.toLowerCase()];
  var priceTypeCode = priceMap[priceType.toLowerCase()];

  var pathString = `/historical_data?ticker=${stockTicker}&item=${priceTypeCode}&start_date=${date}&end_date=${date}`;

  console.log("Path String:", pathString);

  var username = "OmU0MjE1ZTFkYzBiMGEwNTkwNGRkYmYyOWU4Zjg4NTVi";
  var password = "OmYwNTQ4MWQ0MzA4M2RhMjUzMzM2ZmJlNTMyMzUxYTZj";

  var auth =
    "Basic " + new Buffer(username + ":" + password).toString("base64");

  var request = https.get(
    {
      host: "api.intrinio.com",
      path: pathString,
      headers: { Authorization: auth }
    },
    function(response) {
      var json = "";
      response.on("data", function(chunk) {
        console.log("Received JSON response:", chunk);
        json += chunk;
      });
      response.on("end", function() {
        var jsonData = JSON.parse(json);
        var stockPrice = jsonData.data[0].value;

        console.log("The stock price received:", stockPrice);

        var chat = `The ${priceType} price for ${companyName} on ${date} was ${stockPrice}.`;

        cloudFnResponse.send(buildChatResponse(chat));
      });
    }
  );
}
