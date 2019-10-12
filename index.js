const express = require('express');
const app = express();
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const fs = require("fs");
const request = require('request');
const async = require('async')
const DIR = './uploads';

// middleware
app.use(cors());
app.use(express.static('dist'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// mysql Connection
const pool = mysql.createPool({
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


// Download the file to root directory
const download = function(uri, filename, callback) {
  request.head(uri, function(err, res, body) {
    request(uri)
      .pipe(fs.createWriteStream(filename))
      .on('close', callback);
  });
};

app.post('/auth', (req, res) => {
  const basic = req.body.basic;
  const postOptions = {
    url: 'https://techcoursesite.com/wp-json/wp/v2/posts',
    headers: {
      'User-Agent': 'request',
      Authorization: basic
    },
    method: 'POST',
    json: true
  };
  request(postOptions, (error, response) => {
    if (response.body.code === 'rest_cannot_create' || response.body.code === 'invalid_username') {
      res.send(false);
    } else if (response.body.code === 'empty_content') {
      res.send(true);
    }
  });
});

/**
 * @param {title} postTitleToFind
 * @param {basic} basicAuthString
 */
app.post('/validpost', (req, resp) => {
  const basic = req.body.basic;
  const title = req.body.title;

  const postSearchOpts = {
    url: `https://techcoursesite.com/wp-json/wp/v2/posts`,
    headers: {
      'User-Agent': 'request',
      Authorization: basic
    },
    qs: {
      'search': title
    },
    method: 'GET',
    json: true
  };

  request(postSearchOpts, (error, response, body) => {
    const alreadyExist = body.find(x => x.title.rendered === title)
    if (alreadyExist) {
      const res = {
        statusCode: 400,
        message: 'Duplicated post'
      };
      resp.send(false);
      return;
    }
    resp.send(true);
  });
});


// Post creation endpoint
app.post('/post', (req, resp, next) => {
  // Basic auth
  const basic = req.body.basic;
  const stringTags = req.body.data.tags;
  req.body.data.tags = [];
  const image = req.body.image;
  const finalData = req.body.data;
  const finalTitle = finalData.discount === 'FREE' ? `[FREE] ${finalData.title} [Udemy]` : `[${finalData.discount}% OFF] ${finalData.title} [Udemy]`;
  const imageName = image.substring(image.indexOf('480x270') + 8, image.length);
  
  function postTags(tag, callback) {
    const tagOptions = {
      url: 'https://techcoursesite.com/wp-json/wp/v2/tags',
      headers: {
        'User-Agent': 'request',
        Authorization: basic
      },
      method: 'POST',
      body: {
        name: tag
      },
      json: true
    };
  
    request(tagOptions,
      function(err, res, body) {
        callback(err, body);
      }
    );
  }
  
  async.map(stringTags, postTags, function (err, res) {
    if (err) return console.log(err);
    res.forEach(tagResp => {
      if (tagResp.id) {
        req.body.data.tags.push(tagResp.id)
      } else if (tagResp.data.term_id) {
        req.body.data.tags.push(tagResp.data.term_id)
      }
    });

    download(image, imageName, function () {
      // Form data for image upload to wp media
      const formData = {
        file: fs.createReadStream(__dirname + `/${imageName}`)
      };

      // request options for image upload
      const mediaOptions = {
        url: 'https://techcoursesite.com/wp-json/wp/v2/media',
        headers: {
          Authorization: basic,
          'Content-Disposition': `attachment; filename="${imageName}`,
          'content-type': 'application/octet-stream'
        },
        method: 'POST',
        formData: formData
      };

      request(mediaOptions, (error, response, body) => {
        const finalImageId = JSON.parse(body).id;

        // image delete
        fs.unlinkSync(__dirname + `/${imageName}`);

        // request options for post creation
        finalData.featured_media = finalImageId;
        finalData.title = finalTitle;
        
        const postOptions = {
          url: 'https://techcoursesite.com/wp-json/wp/v2/posts',
          headers: {
            'User-Agent': 'request',
            Authorization: basic
          },
          method: 'POST',
          body: finalData,
          json: true
        };
        request(postOptions, (error, response) => {
          resp.send(response);
        });
      });
    });
  });
});


app.post('/savetnt', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.send('no file uploaded');
  }
  pool.getConnection((err, connection) => {
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
      connection.release();
    });
  });
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