$(function() {
  // Get handle to the chat div
  var $chatWindow = $('#messages');

  // Connected to twilio?
  var connected = false;

  // Manages the state of our access token we got from the server
  var accessManager;

  var map = {
    "joy": "joy.png",
    "anger": "anger.png",
    "disgust": "disgust.png",
    "fear": "fear.png",
    "sadness": "sad.png",
    "unknown": "unknown.png"
  };

  // Our interface to the IP Messaging service
  var messagingClient;

  // A handle to the "general" chat channel - the one and only channel we
  // will have in this sample app
  var generalChannel;

  // The server will assign the client a random username - store that value
  // here
  var username;

  var waitingForEnter = true;

  var infogroup = $('<div class="info-group">');
    $chatWindow.append(infogroup);

  // Helper function to print info messages to the chat window
  function print(infoMessage, asHtml) {
      var $msg = $('<div class="info">');
      if (asHtml) {
          $msg.html(infoMessage);
      } else {
          $msg.text(infoMessage);
      }
      infogroup.append($msg);
  }

  // Helper function to print chat message to the chat window
  function printMessage(fromUser, message) {
    var $user = $('<span class="username">').text(fromUser);
    var $usericon = $('<div class="user-icon">');
    var $maincontainer = $('<div class="main-container">');
    var $hr = $('<hr>');


    if (fromUser === username) {
      var $container = $('<div class="message-container me">');
      var $messagehead = $('<div class="message-head">');
      var $usericon = $('<div class="user-icon-me">');
      var $messagebody = $('<div class="message-body">');
    } else {
      var $container = $('<div class="message-container">');
      var $messagehead = $('<div class="message-head">');
      var toneObj = getTone(message);
      var $iconTone = $('<img>');
      $iconTone.attr('src', '/static/' + map[toneObj.toneID]);
      $iconTone.width("45px");
      $tooltip = $("<span>");
      $tooltip.addClass("tooltiptext");
      $tooltip.html("Anger: "+toneObj.anger+"%<br/>Sad: "+toneObj.sadness+"%<br/>Disgust: "+toneObj.disgust+"%<br/>Fear: "+toneObj.fear+"%<br/>Joy: "+toneObj.joy+"%")
      var $usericon = $('<div class="user-icon">').append($iconTone).append($tooltip);
      if (toneObj[toneObj.toneID] < 33) {
        $usericon.addClass("low");
      } else if (toneObj[toneObj.toneID] < 66) {
        $usericon.addClass("medium");
      } else {
        $usericon.addClass("high");
      }
      var $messagebody = $('<div class="message-body">');
    }

    var $message = $('<span class="message">').text(message);
    //var $container = $('<div class="message-container">');
    $messagehead.append($user);
    $messagebody.append($message);
    $container.append($messagehead).append($messagebody);
    $maincontainer.append($usericon).append($container);

    if(message.indexOf('.com') != -1 ||
    message.indexOf('.io') != -1 ||
    message.indexOf('www.') != -1 ||
    message.indexOf('http://') != -1 ||
    message.indexOf('https://') != -1)
    {
      var $linkedcontainer = $('<a>').attr('href', message);
      $linkedcontainer.append($container);
      $chatWindow.append($linkedcontainer);
    } else {
      $chatWindow.append($maincontainer);
    }

    $chatWindow.scrollTop($chatWindow[0].scrollHeight);
  }

  // Alert the user they have been assigned a random username
  print('Logging in...');

  var $input = $('#chat-input');

  function getTone(text) {
    var emotion_tone = null;
    var tone_id;
    var returnObj = {};
    $.ajax({
      url: "/tone",
      async : false,
      type: "POST",
      headers: {
          "Content-Type": "application/json; charset=utf-8",
      },
      contentType: "application/json",
      data: JSON.stringify({
          "text": text
      }),
      success: function (xhr) {
        // var jsonObj = JSON.parse(xhr.responseText);
        var jsonObj = xhr;
        var max = -999;

        for (var i =0; i< jsonObj.document_tone.tone_categories[0].tones.length;i++) {
          var tone = jsonObj.document_tone.tone_categories[0].tones[i];
          returnObj[tone.tone_id] = Math.floor(tone.score * 100)
          if (tone.score>max) {
            returnObj.toneID = tone.tone_id;
            max = tone.score;
          }
        }
        // return emotion_tone = emotion_tone + tone_id
        if (max == 0) {
          returnObj.toneID = "unknown"
        }
      }
    });
    return returnObj;
  }

  // Get an access token for the current user, passing a username (identity)
  // and a device ID - for browser-based apps, we'll always just use the
  // value "browser"
  function connectToTwilio() {
    $.getJSON('/token', {
        identity: username,
        device: 'browser'
    }, function(data) {
        // Alert the user they have been assigned a random username
        username = data.identity;
        print('You have authenticated as: '
            + '<span class="me">' + username + '</span>', true);

        // Initialize the IP messaging client
        accessManager = new Twilio.AccessManager(data.token);
        messagingClient = new Twilio.IPMessaging.Client(accessManager);

        // Get the general chat channel, which is where all the messages are
        // sent in this simple application
        print('Attempting to join "general" chat channel...');
        var promise = messagingClient.getChannelByUniqueName('general');
        promise.then(function(channel) {
            generalChannel = channel;
            if (!generalChannel) {
                // If it doesn't exist, let's create it
                messagingClient.createChannel({
                    uniqueName: 'general',
                    friendlyName: 'General Chat Channel'
                }).then(function(channel) {
                    console.log('Created general channel:');
                    console.log(channel);
                    generalChannel = channel;
                    setupChannel();
                });
            } else {
                console.log('Found general channel:');
                console.log(generalChannel);
                setupChannel();
            }
        });
    });
    connected = true;
  };

  // Set up channel after it has been found
  function setupChannel() {
      // Join the general channel
      generalChannel.join().then(function(channel) {
          print('Joined channel as '
              + '<span class="me">' + username + '</span>.', true);
      });

      // Listen for new messages sent to the channel
      generalChannel.on('messageAdded', function(message) {
          printMessage(message.author, message.body);
      });
  }

  // Send a new message to the general channel
  $input.on('keydown', function(e) {
      if (e.keyCode == 13 && /\S/.test($input.val())) {
        if (connected) {
          generalChannel.sendMessage($input.val());
        } else {
          username = $input.val();
          connectToTwilio();
          $input.attr("placeholder", "Enter your message");
        }
          $input.val('');
      }
  });

  /*
  $("#messages").on("click", ".message", function() {
    $.ajax({
      url: "/tone",
      type: "POST",
      headers: {
          "Content-Type": "application/json; charset=utf-8",
      },
      contentType: "application/json",
      data: JSON.stringify({
          "text": this.innerText
      }),
      success: function (xhr) {
        alert("success");
        // var jsonObj = JSON.parse(xhr.responseText);
        var jsonObj = xhr;
        var max = -999;
        var emotion_tone = "Emotion Tone: "
        var social_tone = "Social Tone: "
        var language_tone = "Language Tone: "
        var tone_id ="";

        for (var i =0; i< jsonObj.document_tone.tone_categories[0].tones.length;i++) {
          var tone = jsonObj.document_tone.tone_categories[0].tones[i];
          //alert(tone);
          if(tone.score>max){
            tone_id = tone.tone_id;
            max = tone.score;
          }
        }
        var max = -999;
        emotion_tone = emotion_tone + tone_id
        for (var i =0; i< jsonObj.document_tone.tone_categories[1].tones.length;i++) {
          var tone = jsonObj.document_tone.tone_categories[1].tones[i];
          //alert(tone);
          if(tone.score>max) {
            tone_id = tone.tone_id;
            max = tone.score;
          }
        }
        language_tone = language_tone + tone_id
        var max = -999;
        for (var i =0; i< jsonObj.document_tone.tone_categories[2].tones.length;i++){
          var tone = jsonObj.document_tone.tone_categories[2].tones[i];
          //alert(tone);
          if(tone.score>max){
            tone_id = tone.tone_id;
            max = tone.score;
          }
        }
        social_tone = social_tone + tone_id
        alert(emotion_tone+"\n"+language_tone+"\n"+social_tone);
      }
    });
  }); */
});

function startDictation() {
  if (window.hasOwnProperty('webkitSpeechRecognition')) {
    var recognition = new webkitSpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.lang = "en-US";
    recognition.start();

    recognition.onresult = function(e) {
      document.getElementById('chat-input').value = e.results[0][0].transcript;
      $("#chat-input").focus();
      recognition.stop();
    };

    recognition.onerror = function(e) {
      recognition.stop();
    }
  }
}
