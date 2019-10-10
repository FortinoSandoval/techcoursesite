const express = require('express');
const cors = require('cors');
const app = express();
const request = require('request');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const async = require('async')

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
app.use(express.static('dist'));

// Download the file to root directory
const download = function(uri, filename, callback) {
  request.head(uri, function(err, res, body) {
    request(uri)
      .pipe(fs.createWriteStream(filename))
      .on('close', callback);
  });
};

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/dist/index.html'));
});

app.post('/auth', (req, res) => {
  const basic = req.body.basic;
  const postOptions = {
    url: 'https://techcoursesite.com/wp-json/wp/v2/posts',
    headers: {
      'User-Agent': 'request',
      Authorization: basic
    },
    method: 'GET',
    json: true
  };
  request(postOptions, (error, response) => {
    res.send(response);
  });
});

app.post('/verifypost', (req, resp) => {
  const basic = req.body.basic;
  const finalData = req.body.data;
  const finalTitle = finalData.discount === 'FREE' ? `[FREE] ${finalData.title} [Udemy]` : `[${finalData.discount}% OFF] ${finalData.title} [Udemy]`;

  const postSearchOpts = {
    url: 'https://techcoursesite.com/wp-json/wp/v2/posts',
    headers: {
      'User-Agent': 'request',
      Authorization: basic
    },
    qs: {
      'per_page': '100'
    },
    method: 'GET',
    json: true
  };
  request(postSearchOpts, (error, response, body) => {
    const alreadyExist = body.find(x => x.title.rendered === finalTitle)
    if (alreadyExist) {
      const res = {
        statusCode: 400,
        message: 'Duplicated post'
      };
      resp.send(res);
      return;
    }
    resp.send({});
  });
});

app.post('/verifypost', (req, resp) => {
  const postSearchOpts = {
    url: 'https://freecoursesite.com/wp-content/uploads/2019/10/FreeCourseSite.com-Udemy%20-%20The%20Build%20a%20SAAS%20App%20with%20Flask%20Course.torrent',
    headers: {
      'User-Agent': 'request'
    },
    method: 'GET',
    json: true
  };
  request(postSearchOpts, (error, response, body) => {
    console.log(body);
    resp.send(response);
  });
});

app.post('/getthat', (req, resp) => {
  const postSearchOpts = {
    url: 'https://freecoursesite.com/wp-content/uploads/2019/10/FreeCourseSite.com-Udemy%20-%20The%20Build%20a%20SAAS%20App%20with%20Flask%20Course.torrent',
    headers: {
      'User-Agent': 'request'
    },
    method: 'GET',
    json: true
  };
  request(postSearchOpts, (error, response, body) => {
    console.log(body);
    resp.send(body);
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

app.listen(process.env.PORT || 4000, () => {
  console.log(`Server running on port ${process.env.PORT || 4000}`);
});
