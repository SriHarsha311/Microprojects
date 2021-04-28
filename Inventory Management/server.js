const express = require('express');
const app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://localhost:27017';
app.listen(3000, () => {
    console.log('listening on 3000');
});
app.set('view engine', 'ejs');
app.use(express.static('public')); //path to style sheets which will to be href in index.ejs(path relative to server.js file)
var result;

MongoClient.connect(url, { useUnifiedTopology: true, useNewUrlParser: true }, (err, client) => {
    if (err) return console.log(err);
    console.log('Connected');
    db = client.db("Inventory");
    app.get('/', (req, res) => {
        db.collection('Products').find({}).toArray((err, result) => {
            res.render('index.ejs', { users: result });
        });
    });
    app.get('/update', (req, res) => {
        res.render('update.ejs');
    });
    app.get('/edit', (req, res) => {
        db.collection('Products').find({ 'Product ID': Number(req.query.pid) }).toArray((err, result) => {
            res.render('edit.ejs', { users: result });
        });
    });
    app.get('/add', (req, res) => {
        res.render('add.ejs');
    });
    app.get('/details', (req, res) => {
        db.collection('Sales').find({}).toArray((err, result) => {
            res.render('details.ejs', { users: result });
        });
    });
    app.post('/updated', (req, res) => {
        db.collection('Products').find({ 'Product ID': Number(req.body.pid) })
            .toArray((err, result) => {
                if (result.length == 0) {
                    // res.send("No such product exists,please don't try scam sales");
                    msg = "This product is not present in our inventory,so this sale can't be made now";
                    res.render('error.ejs', { msg: msg });
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
                    res.redirect('/details');
                }
            });
    });
    app.post('/added', (req, res) => {
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
            res.redirect('/');
        });
    });
    app.post('/edited', (req, res) => {
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
        res.redirect('/');
    });
    app.get('/delete', (req, res) => {
        console.log(Number(req.query.pid));
        db.collection('Products').deleteOne({
            'Product ID': Number(req.query.pid)
        }, (err, result) => {
            if (err) throw err;
            console.log("1 data deleted succesfully");
        });
        res.redirect('/');
    });
});