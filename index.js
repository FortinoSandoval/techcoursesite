const express = require('express');
const app = express();

const cors = require('cors');
const path = require('path');
const multer = require('multer');
const methodOverride = require('method-override');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const fs = require("fs");

const DIR = './uploads';

// middleware
app.use(bodyParser.json());
app.use(methodOverride('_method'));
app.use(cors());
app.use(express.static('dist'));
app.set('view engine', 'ejs');

// mysql Connection
const connection = mysql.createConnection({
  host     : '162.241.60.122',
  user     : 'techcour_adm',
  password : 'Fortielchilo',
  database : 'techcour_raw'
});

// Storage Engine
const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, DIR);
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/dist/index.html'));
});

app.post('/savetnt', upload.single('file'), (req, res) => {
  connection.connect();
  
  const fileData = {
    file_name: req.body.fileName,
    type: req.file.mimetype,
    tnt: fs.readFileSync(req.file.path)
  };

  connection.query("INSERT INTO `tnt_file` SET ?", fileData, (err, result) => {
    if (err) {
      res.send(err);
    } else {
      res.send(result);
    }
    fs.readdir(DIR, (err, files) => {
      if (err) throw err;
    
      for (const file of files) {
        fs.unlink(path.join(DIR, file), err => {
          if (err) throw err;
        });
      }
    });
    
  });
  connection.end();
});

app.listen(process.env.PORT || 4000, () => {
  console.log(`Server running on port ${process.env.PORT || 4000}`);
});

/**
 * CREATE TABLE `tnt_file` (
  `tnt_id` int(10) UNSIGNED NOT NULL,
  `tnt` blob NOT NULL,
  `file_name` varchar(45) CHARACTER SET latin1 COLLATE latin1_general_ci NOT NULL,
  `type` varchar(45) CHARACTER SET latin1 COLLATE latin1_general_ci NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

 */