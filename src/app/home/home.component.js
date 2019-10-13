(function () {
  'use strict';

  angular.module('app').component('home', {
    controller: HomeController,
    controllerAs: 'vm',
    templateUrl: 'app/home/home.view.html',
  });

  /** @ngInject */
  function HomeController($state, $http, $scope, Upload, $timeout) {
    const vm = this;

    $scope.apiUrl = location.hostname === 'localhost' && location.port !== '4000' ? 'api' : '';

    $scope.uploadTnt = (file, fileName) => {
      if (!file || !fileName) return;
      let formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', fileName);
      return $http({
        url: `${$scope.apiUrl}/savetnt`,
        method: 'POST',
        data: formData,
        headers: { 'Content-Type': undefined },
        transformRequest: angular.identity
      });
    };

    $scope.submitted = false;
    vm.data = {
      categories: [],
      tags: []
    };
    
    $scope.selectPublishOpts = [
      {
        esp: 'Borrador',
        val: 'draft'
      },
      {
        esp: 'Publicado',
        val: 'publish'
      },
      {
        esp: 'Programar',
        val: 'future'
      }
    ];

    $scope.selectedList = [];
    $scope.selectedListText = [];

    if (!localStorage.credentials) {
      vm.showLogin = true;
    }

    if (!localStorage.getItem('categories') && !vm.showLogin) {
      const { username, password } = JSON.parse(localStorage.getItem('credentials'));
      const DTO = {
        basic: authenticateUser(username, password)
      }
      $http.post(`${$scope.apiUrl}/categories`, DTO).then(({ data }) => {
        const categories = data.map(x => ({ id: x.id, text: decodeHtml(x.name) }));
        localStorage.setItem('categories', JSON.stringify(categories));
        $scope.categories = categories;
      });
    } else {
      $scope.categories = JSON.parse(localStorage.getItem('categories'));
    }

    vm.saveCredentials = () => {
      $scope.invalidCredentials = false;
      $scope.loading = true;
      const credentials = {
        username: vm.username,
        password: vm.password
      };
      document.querySelector('body').classList.add('request');
      $scope.auth(credentials).then(({data}) => {
        document.querySelector('body').classList.remove('request');
        $scope.loading = false;
        if (!data) $scope.invalidCredentials = true;
        else if (data) {
          localStorage.setItem('credentials', JSON.stringify(credentials));
          $state.reload();
          bulmaToast.toast({
            message: 'Logged in!',
            duration: 2000,
            type: 'is-primary',
            position: 'bottom-right',
            animate: { in: 'fadeIn', out: 'fadeOut' }
          });
        }
      })
    };

    $scope.logout = () => {
      localStorage.clear();
      $state.reload();
      bulmaToast.toast({
        message: 'Logged out!',
        duration: 2000,
        type: 'is-primary',
        position: 'bottom-right',
        animate: { in: 'fadeIn', out: 'fadeOut' }
      }); 
    };

    vm.getInfo = () => {
      if (!$scope.files) return;
      vm.data.categories = [];
      $scope.selectedListText = [];
      $scope.selectedList.forEach((el, index) => {
        if (el) {
          vm.data.categories.push(index);
          $scope.selectedListText.push($scope.categories.find(x => x.id === index).text);
        }
      });

      vm.data.tags = vm.tagString.split(',').map(str => str.trim())

      if($scope.selectedListText.length === 0) {
        bulmaToast.toast({
          message: 'Selecciona al menos 1 categoria.',
          duration: 2000,
          type: 'is-danger',
          position: 'bottom-right',
          animate: { in: 'fadeIn', out: 'fadeOut' }
        });
        return;
      }

      // Get HTML Data from textarea
      const htmlData = JSON.stringify(vm.courseHtml);

      // Create H2 elements for sub headers
      var h2Req = document.createElement('h2');
      h2Req.appendChild(document.createTextNode('Knowledge necessary to take the course'));
      var h2Learn = document.createElement('h2');
      h2Learn.appendChild(document.createTextNode('At the end of the course you\'ll be able to:'));
      var h2Aud = document.createElement('h2');
      h2Aud.appendChild(document.createTextNode('Why you should take this course:'));

      // Ad Element
      const adElement = htmlToElement('<div id="801385746" class="post-footer-mobile-ad" style="margin-top: 3em;"> <script type="text/javascript"> try { window._mNHandle.queue.push(function (){ window._mNDetails.loadTag("801385746", "300x250", "801385746"); }); } catch (error) {} </script> </div>');
  
      
      /** ---- Get Requirements ---- */
      const subRequiremenets = htmlData.substring(htmlData.indexOf('requirements__content'), htmlData.length);
      const subRequiremenets2 = subRequiremenets.substring(subRequiremenets.indexOf('<ul'), subRequiremenets.length);
      const subRequiremenets3 = subRequiremenets2.substring(0, subRequiremenets2.indexOf('</ul>') + 5);
      const requi = decodeURI(subRequiremenets3)
      
      const htmlJsonString = html2json(decodeURI(requi));
      const requiremenets = document.createElement('ul');
      
      htmlJsonString.child[0].child.forEach(el => {
        if (el.node === 'element') {
          var li = document.createElement('li');
          requiremenets.appendChild(li);
          li.innerHTML = li.innerHTML + el.child[0].text
        }
      });
            
      /** ---- Get audience ---- */
      const subAudience = htmlData.substring(htmlData.indexOf('audience__list') - 12, htmlData.length);
      const subAudience2 = subAudience.substring(0, subAudience.indexOf('</ul>') + 5);


      const htmlAudJsonString = html2json(decodeURI(subAudience2));
      const audienceList = document.createElement('ul');
    
      htmlAudJsonString.child[0].child.forEach(el => {
        if (el.node === 'element') {
          var li = document.createElement('li');
          audienceList.appendChild(li);
          li.innerHTML = li.innerHTML + el.child[0].text
        }
      });

      // Enrolled users get
      const subUrl = htmlData.substring(htmlData.indexOf('og:url') + 19)
      let finalUrl = subUrl.substring(0, subUrl.indexOf('>') - 2);
      
      if (vm.courseCoupon) {
        finalUrl += `?couponCode=${vm.courseCoupon}`
      }
      
      /** Go to course link */
      const courseLink = document.createElement('a');
      courseLink.target = '_blank';
      courseLink.rel = 'noreferrer noopener';
      courseLink.innerText = `Download now`;
      
      /** Title get */
      const subTitle = htmlData.substring(htmlData.indexOf('<h1'), htmlData.indexOf('</h1'));
      var title = subTitle.substring(subTitle.indexOf('\\n') + 2, subTitle.length - 2);
      title = title.replace(/&amp;/g, '&');
      vm.data.title = title;
      courseLink.href = `http://shrinker.techcoursesite.com/?course=${vm.data.title}`;

      if (vm.data.discount === 100) {
        vm.data.categories.push(50);
        vm.data.tags.push(`${title} coupon code`);
        vm.data.tags.push(`udemy free course`);
        vm.data.tags.push(`udemy discount`);
      } else if (vm.data.discount !== 'FREE') {
        vm.data.tags.push(`${title} coupon code`);
        vm.data.tags.push(`udemy discount`);
      }

      $scope.selectedListText.forEach(el => {
        vm.data.tags.push(el);
      });

      /** Extract get */
      const subHeadLine = htmlData.substring(htmlData.indexOf('clp-lead__headline'));
      const subHeadLine2 = subHeadLine.substring(subHeadLine.indexOf('\\n') + 2);
      var headLine = subHeadLine2.substring(0, subHeadLine2.indexOf('\\n'));
      headLine = headLine.replace(/&amp;/g, '&');
      vm.data.excerpt = headLine;

      /** Featured image */
      const subImage = htmlData.substring(htmlData.indexOf('srcset=\\"') + 9);
      const subImage2 = subImage.substring(subImage.indexOf('1x') + 4);
      const image = subImage2.substring(0, subImage2.indexOf('2x') - 1);
      vm.image = image;

      /** Create course link btn */

      /** What you'll learn information */
      const skillsToLean = [];
      let subKnowledge = htmlData;
      while(subKnowledge.indexOf('what-you-get__text') !== -1) {
        subKnowledge = subKnowledge.substring(subKnowledge.indexOf('what-you-get__text') + 21, subKnowledge.length);
        skillsToLean.push(subKnowledge.substring(0, subKnowledge.indexOf('</span>')));
      }

      const skillsList = document.createElement('ul');
    
      skillsToLean.forEach((el, index) => {
        if (index % 2 !== 0) {
          var li = document.createElement('li');
          skillsList.appendChild(li);
          li.innerHTML = li.innerHTML + el;
        }
      });

      /** Course summary */

      // Instructor get
      const subInstructor = htmlData.substring(htmlData.indexOf('instructor-name-top') + 25, htmlData.length);
      const subInstructor2 = subInstructor.substring(subInstructor.indexOf('>') + 3);
      const subInstructor3 = subInstructor2.substring(0, subInstructor2.indexOf('<'));

      // Enrolled users get
      const subEnrolled = htmlData.substring(htmlData.indexOf('enrollment') + 15);
      const enrolledUsers = subEnrolled.substring(0, subEnrolled.indexOf('students') - 1);
      
      // Enrolled users get
      const subLang = htmlData.substring(htmlData.indexOf('clp-lead__locale'));
      const subLang2 = subLang.substring(subLang.indexOf('</span>') + 9);
      const lang = subLang2.substring(0, subLang2.indexOf('</d') - 2);

      // hours
      const subHours = htmlData.substring(htmlData.indexOf('video-content-length') + 25);
      const hours = subHours.substring(0, subHours.indexOf(' hours'));
      
      const summaryElement = `<div style="margin-bottom: 1em;">
      <h2>Course Summary</h2>
      <div><b>Course duration</b>: <label style="margin: 0;">${hours} Hours</label></div>
      <div> <b>Instructor</b>: <label style="margin: 0;">${subInstructor3}</label></div>
      <div> <b>Language</b>: <label style="margin: 0;">${lang}</label></div>
      <div> <b>Students enrolled</b>: <label style="margin: 0;">${enrolledUsers}</label></div>
      <div><b>Certificate of Completion</b>: <label style="margin: 0;">YES!</label> </div>
      </div>`;

      const summaryElementDesc = `<div style="margin-bottom: 1em;">
      <h2 class="title is-3">Course Summary</h2>
      <div><b>Course duration</b>: <label style="margin: 0;">${hours} Hours</label></div>
      <div> <b>Instructor</b>: <label style="margin: 0;">${subInstructor3}</label></div>
      <div> <b>Language</b>: <label style="margin: 0;">${lang}</label></div>
      <div> <b>Students enrolled</b>: <label style="margin: 0;">${enrolledUsers}</label></div>
      <div><b>Certificate of Completion</b>: <label style="margin: 0;">YES!</label> </div>
      </div>`;


      // Put all elements together and send in content property to data
      const finalContent = htmlToElement(summaryElement).outerHTML + h2Learn.outerHTML + skillsList.outerHTML + h2Aud.outerHTML + audienceList.outerHTML + adElement.outerHTML +  h2Req.outerHTML + requiremenets.outerHTML + courseLink.outerHTML;

      vm.data.content = finalContent;

      // Display description preview in app
      const descDiv = document.getElementById('courseDesc');
      const stringContent = htmlToElement(summaryElementDesc).outerHTML + h2Learn.outerHTML + skillsList.outerHTML + h2Aud.outerHTML + audienceList.outerHTML +  h2Req.outerHTML + requiremenets.outerHTML + courseLink.outerHTML;

      const descriptionInApp = htmlToElement(stringContent);
      descriptionInApp.childNodes.forEach(element => {
        if (element.nodeName === 'H2') {
          element.classList = 'title is-3';
        }
      }); 
      document.querySelector('body').classList.add('request');

      vm.verifyDuplicatedPost(vm.data).then(({ data }) => {
        document.querySelector('body').classList.remove('request');
        if (data.message !== 'Duplicated post') {
          $scope.submitted = true;
          descDiv.appendChild(descriptionInApp);
        } else {
          vm.reset();
          bulmaToast.toast({
            message: 'Post already exists!',
            duration: 2000,
            type: 'is-danger',
            position: 'bottom-right',
            animate: { in: 'fadeIn', out: 'fadeOut' }
          });
        }
      })
    };

    vm.reset = () => {
      vm.courseHtml = '';
      $scope.submitted = false;
      vm.tagString = '';
      if (vm.bcalendar && vm.bcalendar[0]) {
        vm.bcalendar[0].clear();
      }
      try {
        document.getElementById('calendar').style.display = 'none';
      } catch (error) {}
      vm.courseCoupon = '';
      vm.data = {
        status: 'publish',
        tags: []
      };
      $scope.selectedList = [];
      $scope.selectedListText = [];
      document.getElementById('courseDesc').innerHTML = '';
    };

    vm.send = () => {
      $scope.uploadTnt($scope.files[0], vm.data.title).then(() => {
        $scope.loading = true;
        document.querySelector('body').classList.add('request');
        vm.httpSendPost(vm.data).then(({ data }) => {
          document.querySelector('body').classList.remove('request');
          $scope.loading = false;
          if (data.statusCode === 201) {
            vm.reset();
            bulmaToast.toast({
              message: 'Information sent!',
              duration: 2000,
              type: 'is-info',
              position: 'bottom-right',
              animate: { in: 'fadeIn', out: 'fadeOut' }
            });
          }
        });
      });
    };

    $scope.auth = ({ username, password }) => {
      const dto = {
        basic: authenticateUser(username, password)
      };
      return $http.post(`${$scope.apiUrl}/auth`, dto);
    }

    vm.httpSendPost = data => {
      const { username, password } = JSON.parse(localStorage.getItem('credentials'));
      const DTO = {
        data,
        image: vm.image,
        basic: authenticateUser(username, password)
      }
      return $http.post(`${$scope.apiUrl}/post`, DTO);
    };

    vm.verifyDuplicatedPost = data => {
      const { username, password } = JSON.parse(localStorage.getItem('credentials'));
      const DTO = {
        data,
        image: vm.image,
        basic: authenticateUser(username, password)
      }
      return $http.post(`${$scope.apiUrl}/validpost`, DTO);
    };

    function authenticateUser(username, password) {
      return "Basic " + btoa(username + ":" + password);
    }

    function decodeHtml(html) {
      var txt = document.createElement("textarea");
      txt.innerHTML = html;
      return txt.value;
  }  

    function htmlToElement(html) {
      var element = document.createElement('div');
      element.innerHTML = html;
      return(element);
    }

    $scope.publishSelect = opt => {
      vm.data.status = opt;
      if (opt === 'future') {
        // Initialize all input of date type.
        vm.bcalendar = bulmaCalendar.attach('[type="date"]', {
          type: 'datetime',
          color: 'info',
          validateLabel: 'OK',
          todayLabel: 'Hoy',
          lang: 'es',
          displayMode: 'dialog'
        });

        // To access to bulmaCalendar instance of an element
        const element = document.querySelector('#datepicker');
        if (element) {
          // bulmaCalendar instance is available as element.bulmaCalendar
          element.bulmaCalendar.on('select', datepicker => {
            vm.data.date = moment(datepicker.data.value()).format();
          });
        }
        document.getElementById('calendar').style.display = 'block';
      } else {
        document.getElementById('calendar').style.display = 'none';
      }
    };


  }

})();
