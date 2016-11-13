$(function() {
    // Get handle to the chat div 
    var $chatWindow = $('#messages');

    // Manages the state of our access token we got from the server
    var accessManager;

    // Our interface to the IP Messaging service
    var messagingClient;

    // A handle to the "general" chat channel - the one and only channel we
    // will have in this sample app
    var generalChannel;

    // The server will assign the client a random username - store that value
    // here
    var username;

    var whole_chat;


    // Helper function to print info messages to the chat window
    function print(infoMessage, asHtml) {
        var $msg = $('<div class="info">');
        if (asHtml) {
            $msg.html(infoMessage);
        } else {
            $msg.text(infoMessage);
        }
        $chatWindow.append($msg);
    }

    // Helper function to print chat message to the chat window
    function printMessage(fromUser, message) {

        var $user = $('<span class="username">').text(fromUser + ':');
        if (fromUser === username) {
            $user.addClass('me');
        }
        var $message = $('<span class="message">').text(message);

        var $container = $('<div class="message-container">');
        $container.append($user).append($message);
        $chatWindow.append($container);
        $chatWindow.scrollTop($chatWindow[0].scrollHeight);
    }

    // Alert the user they have been assigned a random username
    print('Logging in...');

    // Get an access token for the current user, passing a username (identity)
    // and a device ID - for browser-based apps, we'll always just use the 
    // value "browser"
    $.getJSON('/token', {
        identity: username,
        device: 'browser'
    }, function(data) {
        // Alert the user they have been assigned a random username
        username = data.identity;
        print('You have been assigned a random username of: ' 
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
    var $input = $('#chat-input');
    $input.on('keydown', function(e) {
        if (e.keyCode == 13) {

            generalChannel.sendMessage($input.val())
            $input.val('');
        }
    });



});

    $("#messages").on("click", ".message", function() {
        //alert(this.innerText);
        $.ajax({
             xhrFields: {
             withCredentials: true},
             url: "https://gateway.watsonplatform.net/tone-analyzer/api/v3/tone?version=2016-05-19",
             type: "POST", //This is what you should chage
             dataType: "application/json; charset=utf-8",
             username: "045219d5-c5c4-4e14-9402-1f59bf9699a7", // Most SAP web services require credentials
             password: "Y7KXum0M1f6o",
             processData: false,
             contentType: "application/json",
             data:"{\"text\":\" + "+this.innerText+" \"}",
             success: function () {
                 alert("success");
             },
             error: function (xhr, ajaxOptions) { //Add these parameters to display the required response
                 //alert("status>>>"+xhr.status);
                 //alert("Response>>>"+xhr.responseText);
                 var jsonObj = JSON.parse(xhr.responseText);
                 var max = -999;
                 var emotion_tone = "Emotion Tone: "
                 var social_tone = "Social Tone: "
                 var language_tone = "Language Tone: "
                 var tone_id ="";

                 for (var i =0; i< jsonObj.document_tone.tone_categories[0].tones.length;i++){
                     var tone = jsonObj.document_tone.tone_categories[0].tones[i];
                     //alert(tone);
                     if(tone.score>max){
                         tone_id = tone.tone_id;
                         max = tone.score;
                     }
                 }
                 var max = -999;
                 emotion_tone = emotion_tone + tone_id
                 for (var i =0; i< jsonObj.document_tone.tone_categories[1].tones.length;i++){
                     var tone = jsonObj.document_tone.tone_categories[1].tones[i];
                     //alert(tone);
                     if(tone.score>max){
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
