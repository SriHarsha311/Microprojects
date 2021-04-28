var express =  require('express');
var bodyParser = require('body-parser');
var app = express();
let middleware = require('./middleware.js');
let server = require('./server.js');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://127.0.0.1:27017';
const dbName = 'microproj';
const vent = 'vent';
const hosp = 'hosp';
let db;
MongoClient.connect(url, { useUnifiedTopology: true, useNewUrlParser: true }, (err, client) => {   
    db = client.db(dbName);
    app.get('/showHosp', middleware.checkToken, (req, res) => {
        db.collection(hosp).find().toArray().then(result => res.json(result));
    });
    app.get('/showVents', middleware.checkToken, (req, res) => {
        db.collection(vent).find().toArray().then(result => res.json(result));
    });
    app.post('/ventStatus', middleware.checkToken, (req,  res)  =>  {
        db.collection(vent).find({ "status": req.body.status }).toArray().then(result => res.json(result));
    });
    app.post('/ventStatusByHospName', middleware.checkToken, (req,  res)  =>  {
        db.collection(vent).find({ "name": req.body.hospname }).toArray().then(result => res.json(result));
    });
    app.post('/getHospDetailsByName', middleware.checkToken, (req,  res)  =>  {
        db.collection(hosp).find({ "name": req.body.hospname }).toArray().then(result => res.json(result));
    });
    app.post('/addNewVent', middleware.checkToken, (req, res) => {
        db.collection(vent).insert({
            "hId": req.body.hId,
            "ventilatorId": req.body.vId,
            "status": req.body.status,
            "name": req.body.name
        }).then(() =>
            res.send("Posting done successfully"));
    });
    app.put('/updateVentStatus', middleware.checkToken, (req, res) => {
        db.collection(vent).updateOne({ "ventilatorId": req.body.ventId }, { $set: { "status": req.body.ventStatus } }).then(() =>
            res.send("Updation done successfully"));
    });
    app.delete('/removeVent', middleware.checkToken, (req, res) => {
        db.collection(vent).deleteOne({ "ventilatorId": req.body.vId }).then(() =>
            res.send("Deleting done successfully"));
    });
});
app.listen(3000);