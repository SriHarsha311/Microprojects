var express = require('express');
const { WebhookClient } = require("dialogflow-fulfillment");
const { Payload } = require("dialogflow-fulfillment");
var randomstring = require("randomstring");
var router = express.Router();
var app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://127.0.0.1:27017';
const dbName = 'chatbot';
let user = '';
const issue = 'Issue_details';
let db;
MongoClient.connect(url, { useUnifiedTopology: true, useNewUrlParser: true }, (err, client) => {   
    db = client.db(dbName);
});
app.post("/dialogflow", express.json(), (req, res) => {
    const agent = new WebhookClient({ request: req, response: res });
    let intentMap = new Map();
    intentMap.set("Default Welcome Intent", welcome);
    intentMap.set("Default Fallback Intent", defaultFallback);
    intentMap.set("Default Welcome Intent - custom", get_user);
    intentMap.set("Default Welcome Intent - custom - custom", payload);
    intentMap.set("Default Welcome Intent - custom - custom - select.number", get_ticket);
    agent.handleRequest(intentMap);

    async function get_user(agent) {
        const an = agent.parameters.number;
        const found = await db.collection("User_details").findOne({ acno: an });
        if (found == null) {
            await agent.add("Oops!!It looks like that number does not belong to any account");
        } else {
            user = found.username;
            await agent.add("Hello " + user + "!!!\nHow may I assist you");
        }
    }

    function welcome(agent) {
        agent.add('Hi, I am assistant. I can help you in various service. Please enter your account number to proceed further');
    }

    function defaultFallback(agent) {
        agent.add('Sorry! I am unable to understand this at the moment. I am still learning humans. You can pick any of the service that might help me.');
    }

    function get_ticket(agent) {
        var issue_vals = { 1: "Internet Down", 2: "Slow Internet", 3: "Buffering problem", 4: "Other issues", 5: "No connectivity" };
        const num = agent.parameters.issue_num;
        if (num > issue_vals.length || num < 1) {
            agent.add("Invalid choice!!!Please choose again");
            return;
        }
        var val = issue_vals[num];
        var trouble_ticket = randomstring.generate(7);
        var status = "pending";
        let date_ob = new Date(Date.now());
        var time_date = date_ob.getFullYear() + "-" + (date_ob.getMonth() + 1) + "-" + date_ob.getDate();
        var myobj = { username: user, issue: val, status: status, time_date: time_date, trouble_ticket: trouble_ticket };
        db.collection("Issue_details").insertOne(myobj, function(err, res) {
            if (err) throw err;
        });
        agent.add("The issue reported is: " + val + "\nThe ticket number is: " + trouble_ticket + "\nWe will solve this issue as soon as possible.Please use this ticket number to track the status of your complaint in our website");
    }

    function payload(agent) {
        var payLoadData = {
            "richContent": [
                [{
                        "type": "list",
                        "title": "Internet Down",
                        "subtitle": "Press '1' for Internet is down",
                        "event": {
                            "name": "",
                            "languageCode": "",
                            "parameters": {}
                        }
                    },
                    {
                        "type": "divider"
                    },
                    {
                        "type": "list",
                        "title": "Slow Internet",
                        "subtitle": "Press '2' Slow Internet",
                        "event": {
                            "name": "",
                            "languageCode": "",
                            "parameters": {}
                        }
                    },
                    {
                        "type": "divider"
                    },
                    {
                        "type": "list",
                        "title": "Buffering problem",
                        "subtitle": "Press '3' for Buffering problem",
                        "event": {
                            "name": "",
                            "languageCode": "",
                            "parameters": {}
                        }
                    },
                    {
                        "type": "divider"
                    },
                    {
                        "type": "list",
                        "title": "Other issues",
                        "subtitle": "Press '4' for Other issues",
                        "event": {
                            "name": "",
                            "languageCode": "",
                            "parameters": {}
                        }
                    },
                    {
                        "type": "divider"
                    },
                    {
                        "type": "list",
                        "title": "No connectivity",
                        "subtitle": "Press '5' for No connectivity",
                        "event": {
                            "name": "",
                            "languageCode": "",
                            "parameters": {}
                        }
                    }
                ]
            ]
        };
        agent.add(new Payload(agent.UNSPECIFIED, payLoadData, { sendAsMessage: true, rawPayload: true }));
    }
});
app.listen(process.env.PORT || 8080);
module.exports = router;