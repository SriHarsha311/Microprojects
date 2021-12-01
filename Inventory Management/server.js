const express = require('express');
const app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
const MongoClient = require('mongodb').MongoClient;
const res = require('express/lib/response');
const { redirect, render } = require('express/lib/response');
const url = 'mongodb://localhost:27017';
var prompt = require('prompt');
const readline = require("readline");
const { rawListeners } = require('process');
const { log } = require('console');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

prompt.start();
app.listen(3000, () => {
    console.log('listening on 3000');
});
app.set('view engine', 'ejs');
app.use(express.static('public')); //path to style sheets which will to be href in index.ejs(path relative to server.js file)
var db;
MongoClient.connect(url, { useUnifiedTopology: true, useNewUrlParser: true }, (err, client) => {
    if (err) return console.log(err);
    app.get('/', (req, res) => {
        db = client.db("admin").admin();
        // List all the available databases
        db.listDatabases(function(err, result) {
            res.render('index_databases.ejs', { users: result['databases'] });
            // console.log(result['databases']);
            // db.close();
        });
    });
    app.get('/addDB', (req, res) => {
        res.render('addDB.ejs');
    });
    app.get('/show', (req, res) => {
        db = client.db(req.query.dbName);
        console.log(req.query.dbName);
        db.collection('Products').find({}).toArray((err, result) => {
            // console.log(db)
            console.log(result);
            res.render('index.ejs', { users: result, dbName: req.query.dbName });
        });
    });
    app.post('/addedDB', (req, res) => {
        MongoClient.connect(url, { useUnifiedTopology: true, useNewUrlParser: true }, function(err, client) {
            var db1 = client.db(req.body.CSName);
            if (err) throw err;
            db1.createCollection("Products", function(err, result) {
                if (err) {
                    console.log('already undi');
                    return;
                }
                console.log("database and Collection created!");
                client.close();
            });
        });
        db = client.db("admin");
        var pass = getPassword();
        // console.log(pass);
        db.collection('Passwords').insertOne({
            username: req.body.CSName,
            password: pass
        }, (err, result) => {
            if (err) throw err;
            console.log("1 data inserted succesfully");
        });
        // console.log(pass);
        setTimeout(() => {
            res.redirect('/');
            // db.listDatabases(function(err, result) {
            //     // console.log(result['databases']);
            //     res.render('index_databases.ejs', { users: result['databases'] });
            //     // console.log(result['databases'])
            // });
            // console.log('waiting');
        }, 1000);
    });
    app.get('/add', (req, res) => {
        console.log(req.query.dbName);
        res.render('add.ejs', { dbName: req.query.dbName });
    });
    app.post('/added', (req, res) => {
        db = client.db(req.query.dbName);
        db.collection('Products').find({ 'Product ID': Number(req.body.pid) }).toArray((err, result) => {
            if (result.length == 0) {
                db.collection('Products').insertOne({
                    'Product ID': Number(req.body.pid),
                    'Brand': req.body.brand,
                    'Category': req.body.category,
                    'Name': req.body.pname,
                    'Size': Number(req.body.size),
                    'Quantity': Number(req.body.quantity),
                    'Cost Price': Number(req.body.cp),
                    'Selling Price': Number(req.body.sp),
                }, (err, result) => {
                    if (err) throw err;
                    console.log("1 data inserted succesfully");
                });
            } else {
                db.collection('Products').updateOne({
                    'Product ID': Number(req.body.pid)
                }, {
                    $set: {
                        'Size': result[0].Size + Number(req.body.size),
                        'Quantity': result[0].Quantity + Number(req.body.quantity),
                        'Cost Price': result[0]['Cost Price'] + Number(req.body.cp),
                        'Selling Price': result[0]['Selling Price'] + Number(req.body.sp),
                    }
                }, (err, result) => {
                    if (err) throw err;
                    console.log("1 data edited succesfully");
                });
            }
            res.redirect(`/show?dbName=${req.query.dbName}`);
        });
    });
    app.get('/edit', (req, res) => {
        db = client.db(req.query.dbName);
        db.collection('Products').find({ 'Product ID': Number(req.query.pid) }).toArray((err, result) => {
            res.render('edit.ejs', { users: result, dbName: req.query.dbName });
        });
    });
    app.post('/edited', (req, res) => {
        db = client.db(req.query.dbName);
        db.collection('Products').updateOne({
            'Product ID': Number(req.body.pid)
        }, {
            $set: {
                'Quantity': Number(req.body.newqty),
                'Cost Price': Number(req.body.newcp),
                'Selling Price': Number(req.body.newsp)
            }
        }, (err, result) => {
            if (err) throw err;
            console.log("1 data edited succesfully");
        });
        res.redirect('/show?dbName=' + req.query.dbName);
    });
    app.get('/delete', (req, res) => {
        db = client.db(req.query.dbName);
        console.log(req.query.dbName);
        console.log(Number(req.query.pid));
        db.collection('Products').deleteOne({
            'Product ID': Number(req.query.pid)
        }, (err, result) => {
            if (err) throw err;
            console.log("1 data deleted succesfully");
        });
        // res.redirect('/show?dbName=' + req.query.dbName);
        res.redirect(`/show?dbName=${req.query.dbName}`);
    });
    app.get('/update', (req, res) => {
        res.render('update.ejs', { dbName: req.query.dbName });
    });
    app.post('/updated', (req, res) => {
        db = client.db(req.query.dbName);
        db.collection('Products').find({ 'Product ID': Number(req.body.pid) })
            .toArray((err, result) => {
                if (result.length == 0) {
                    // res.send("No such product exists,please don't try scam sales");
                    msg = "This product is not present in our inventory,so this sale can't be made now";
                    res.render('error.ejs', { msg: msg, dbName: req.query.dbName });
                } else if (Number(req.body.quantity) > Number(result[0].Quantity)) {
                    // res.send("thondi ra idi");
                    msg = `We only have ${result[0].Quantity} ${result[0].Name} now,we can't sell more than that`;
                    res.render('error.ejs', { msg: msg });
                } else {
                    if (req.body.quantity == result[0].Quantity) {
                        db.collection('Products').deleteOne({
                            'Product ID': Number(req.body.pid)
                        }, (err, result) => {
                            if (err) throw err;
                        });
                    } else {
                        db.collection('Products').updateOne({
                            'Product ID': Number(req.body.pid)
                        }, {
                            $set: {
                                'Quantity': result[0].Quantity - Number(req.body.quantity),
                            }
                        }, (err, result) => {
                            if (err) throw err;
                        });
                    }
                    var date_ob = new Date(req.body.date);
                    let date = date_ob.getDate();
                    let month = date_ob.getMonth() + 1;
                    let year = date_ob.getFullYear();
                    var time_date = date + "-" + month + "-" + year;
                    db.collection('Sales').insertOne({
                        'Purchase Date': time_date,
                        'Product ID': req.body.pid,
                        'Quantity': req.body.quantity,
                        'Unit Price': req.body.cp,
                        'Total Sales': Number(req.body.cp) * Number(req.body.quantity),
                    });
                    res.redirect('/details?dbName=' + req.query.dbName);
                }
            });
    });
    app.get('/details', (req, res) => {
        db = client.db(req.query.dbName);
        db.collection('Sales').find({}).toArray((err, result) => {
            res.render('details.ejs', { users: result, dbName: req.query.dbName });
        });
    });
    app.get('/deleteDB', (req, res) => {
        db = client.db(req.query.dbName);
        db.dropDatabase(function(err, result) {
            console.log("Error : " + err);
            if (err) throw err;
            console.log("Operation Success ? " + result);
        });
        db = client.db("admin");
        db.collection("Passwords").deleteOne({
            "username": req.query.dbName
        }, (err, result) => {
            if (err) throw err;
        });
        res.redirect('/');
    });
    app.get('/auth', (req, res) => {
        console.log(req.query.operation);
        res.render('auth.ejs', { dbName: req.query.dbName, pid: req.query.pid, operation: req.query.operation });
    });
    app.post('/authcheck', (req, res) => {
        if (req.query.operation === 'deleteDB') {
            if (req.body.username === "admin" && req.body.password == "admin123") {
                res.redirect('/deleteDB?dbName=' + req.query.dbName);
            } else {
                res.render('error.ejs', { msg: 'Invalid details', dbName: req.query.dbName });
            }
        } else {
            var db1 = client.db('admin');
            db1.collection("Passwords").find({
                "username": req.body.username,
                "password": req.body.password
            }).toArray((err, result) => {
                if (result.length === 0) {
                    console.log(result);
                    res.render('error.ejs', { msg: 'Invalid details', dbName: req.query.dbName });
                } else {
                    console.log(result);
                    res.redirect('/' + req.query.operation + '?dbName=' + req.query.dbName + (req.query.operation == 'add' ? '' : ('&pid=' + req.query.pid)));
                }
            });
        }
    });
});

function getPassword() {
    // var pass = document.getElementById("password").innerHTML;
    var alph = "abcdefghijklmnopqrstuvwxyz";
    alph += alph.toUpperCase();
    var str = "";
    var spl = "!@#$%^&*_+-=;':\",.<>\\/?|";
    let passlen = 10;
    let alphlen = Math.round(passlen * 7 / 10);
    let splen = Math.round(passlen * 2 / 10);
    let numlen = passlen - alphlen - splen;
    for (let i = 0; i < alphlen; i++) {
        let ind = Math.floor(Math.random() * alph.length);
        str += (alph.charAt(ind));
    }
    for (let i = 0; i < splen; i++) {
        let ind = Math.floor(Math.random() * spl.length);
        str += (spl.charAt(ind));
    }
    for (let i = 0; i < numlen; i++) {
        let ind = Math.floor(Math.random() * 10);
        str += ind;
    }
    for (i = passlen - 1; i > 0; i--) {
        j = Math.floor(Math.random() * i)
        k = str.charAt(i);
        str = str.replace(str.charAt(i), str.charAt(j));
        str = str.replace(str.charAt(j), k);
    } //Fisher Yates method of shuffling
    return str;
}