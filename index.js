const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://heroku_kdphxpvt:gupct7sqemvrh8oqdg93gq7qsh@ds233288.mlab.com:33288/heroku_kdphxpvt')

const tntSchema = new mongoose.Schema({
  name: String,
  content: String
});

const File = mongoose.model("File", tntSchema);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
app.use(express.static('dist'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/dist/index.html'));
});

app.post('/savetnt', (req, res) => {
  // const data = new File({name:'x', content: 'd'}).save().then(r => {
  //   console.log(r);
  // })
  res.send(req.body);
});

app.listen(process.env.PORT || 4000, () => {
  console.log(`Server running on port ${process.env.PORT || 4000}`);
});
