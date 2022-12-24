var accessToken = "";
var baseUri = "https://api.symbl.ai/v1/";
var uri = "";
const Symbl = window.Symbl;
const appid = '<Your App Id>';
const appsecret = '<Your App Secret>';
var sessionId = "";
var connectionId = "";
var conversationId = "";
getAccessToken();

var chartLabels = ['S1', 'S2']
var messageText = [];
var chartValues = [0, 0]
const ctx = document.getElementById('myChart');
var lineChart = new Chart;
var mtext = "";
//5815921015259136

sentimentChart();
const start = async () => {

    try {

        // Symbl recommends replacing the App ID and App Secret with an Access Token for authentication in production applications.
        // For more information about authentication see https://docs.symbl.ai/docs/developer-tools/authentication/.
        const symbl = new Symbl({
            appId: appid,
            appSecret: appsecret,
            // accessToken: '<your Access Token>' // for production use
        });

        // Open a Streaming API WebSocket Connection and start processing audio from your input device.
        const connection = await symbl.createAndStartNewConnection();
        sessionId = connection.sessionId;
        console.log("SessionID =", sessionId)
        connectionId = await connection.stream.connectionId;
        console.log("ConnectionId =", connection.stream.connectionId);
        conversationId = await connection.stream.conversationId;
        console.log("ConversationID = ", await connection.stream.conversationId);
        // Retrieve real-time transcription from the conversation.
        connection.on("speech_recognition", (speechData) => {
            const name = speechData.user ? speechData.user.name : "User";
            const transcript = speechData.punctuated.transcript;
            console.log(`${name}: `, transcript);
            document.querySelector("#speechRecognition").innerHTML = `${name}: ${transcript}`;
            //console.log("ConversationID during stream = ", connection.stream.conversationId);
            //console.log("Conversation ID: ", conversationId);
        });

        // Retrieve the topics of the conversation in real-time.
        //connection.on("topic", (topicData) => {
        //    topicData.forEach((topic) => {
        //        console.log(topic);
        //        console.log("Topic: " + topic.phrases);
        //    });
        //});
        let intId = setInterval(getMessages, 5000);

        // This is a helper method for testing purposes.
        // It waits 60 seconds before continuing to the next API call.
        await Symbl.wait(120000);
       
        // Stops processing audio, but keeps the WebSocket connection open.
        await connection.stopProcessing();

        clearInterval(intId);
        // Closes the WebSocket connection.
        connection.disconnect();
    } catch (e) {
        // Handle errors here.
    }
}


function getAccessToken() {
    const options = {
        method: 'POST',
        headers: { accept: 'application/json', 'content-type': 'application/json' },
        body: JSON.stringify({
            type: 'application',
            appId: '4d37435461695854324264777272426870593453654957656a4a556b784e5178',
            appSecret: '303841355145797263315439434e36745f55773856346c58386c5262534b694d7364474f4d654536776d6f6633366c574d4f7933335a3765454b2d5258505662'
        })
    };

    fetch('https://api.symbl.ai/oauth2/token:generate', options)
        .then(response => response.json())
        .then(response => accessToken = "Bearer " + response.accessToken)
        .catch(err => console.error(err));
}

function getTopics() {
    //showLoading();
    let id = conversationId;
    const options = {
        method: 'GET',
        headers: {
            accept: 'application/json',
            authorization: accessToken
        }
    };

    uri = baseUri + "conversations/" + id + "/topics?sentiment=true&customTopicVocabulary=dislike&customTopicVocabulary=not happy&customTopicVocabulary=great&customTopicVocabulary=black&customTopicVocabulary=thank you";

    fetch(uri, options)
        .then(response => response.json())
        .then(response => processReponse(response, 'topic'))
        .catch(err => console.error(err));
}

function getMessages() {
    //showLoading();
    let id = conversationId;
    const options = {
        method: 'GET',
        headers: {
            accept: 'application/json',
            authorization: accessToken
        }
    };

    uri = baseUri + "conversations/" + id + "/messages?sentiment=true";

    fetch(uri, options)
        .then(response => response.json())
        .then(response => processReponse(response, 'message'))
        .catch(err => console.error(err));
}


var index = 1;
function processReponse(data, cat) {
    if (cat === "topic") {
        if (data.topics.length > 0) {

            data.topics.forEach((topic) => {
                console.log(topic);
                let item = topic.type + " | " + topic.text;
                if (chartLabels.indexOf(item) === -1) {
                   
                    chartLabels.push(item);
                    chartValues.push(topic.sentiment.polarity.score);
                    console.log("Topic: " + topic.sentiment.suggested);
                    console.log("Score: " + topic.sentiment.polarity.score);
                    let suggestedsentment = topic.sentiment.suggested.toUpperCase();
                    if (suggestedsentment === "NEUTRAL") {
                        document.querySelector("#sentimentsuggestion").innerHTML = ' | ' + suggestedsentment + ' <i class="fa-light fa-face-meh mx-2"></i>';
                        document.getElementById("sentimentsuggestion").style.color = '#426EFF';
                    } else if (suggestedsentment === "NEGATIVE") {
                        document.querySelector("#sentimentsuggestion").innerHTML = ' | ' + suggestedsentment + ' <i class="fa-light fa-face-frown-slight mx-2"></i>';
                        document.getElementById("sentimentsuggestion").style.color = '#EF033E';
                    } else {
                        document.querySelector("#sentimentsuggestion").innerHTML = ' | ' + suggestedsentment + ' <i class="fa-light fa-face-smile mx-2"></i>';
                        document.getElementById("sentimentsuggestion").style.color = '#00FF37';
                    }

                    //' | ' + 'NEUTRAL ' + '<i class="fa-light fa-face-meh"></i>'
                }


            });

            lineChart.update();
            //let score = data.topics[0].sentiment.polarity.score;
            //console.log("Blah Blah Blah: " + data.topics[0] + " | " + cat);
            //console.log("polarity score: ", score)

            //sentimentChart();

        } else {
            console.log("No TOPIC data");
        }
    } else if (cat === "message") {
        if (data.messages.length > 0) {

            data.messages.forEach((message) => {
                console.log(message);
                let item = message.text;
                if (messageText.indexOf(item) === -1) {
                    messageText.push(item);
                    index++;
                    let yinfo = "S" + index;
                    chartLabels.push(yinfo);
                    chartValues.push(message.sentiment.polarity.score);
                    console.log("Message: " + message.sentiment.suggested);
                    console.log("Score: " + message.sentiment.polarity.score);
                    let suggestedsentment = message.sentiment.suggested.toUpperCase();
                    if (suggestedsentment === "NEUTRAL") {
                        document.querySelector("#sentimentsuggestion").innerHTML = ' | ' + suggestedsentment + ' <i class="fa-light fa-face-meh mx-2"></i>';
                        document.getElementById("sentimentsuggestion").style.color = '#426EFF';
                        let color = "color: #426EFF";
                        mtext += "<div><div class='float-start m-2'></div><div class='float-start my-2' style='width: 80%; " + color + "'>" + message.text + "</div><div class='clearfloat'></div></div>"
                        document.querySelector("#messagetext").innerHTML = mtext;
                    } else if (suggestedsentment === "NEGATIVE") {
                        document.querySelector("#sentimentsuggestion").innerHTML = ' | ' + suggestedsentment + ' <i class="fa-light fa-face-frown-slight mx-2"></i>';
                        document.getElementById("sentimentsuggestion").style.color = '#EF033E';
                        let color = "color: #EF033E";
                        mtext += "<div><div class='float-start m-2'></div><div class='float-start my-2' style='width: 80%; " + color + "'>" + message.text + "</div><div class='clearfloat'></div></div>"
                        document.querySelector("#messagetext").innerHTML = mtext;
                    } else {
                        document.querySelector("#sentimentsuggestion").innerHTML = ' | ' + suggestedsentment + ' <i class="fa-light fa-face-smile mx-2"></i>';
                        document.getElementById("sentimentsuggestion").style.color = '#00FF37';
                        let color = "color: #00FF37";
                        mtext += "<div><div class='float-start m-2'></div><div class='float-start my-2' style='width: 80%; " + color + "'>" + message.text + "</div><div class='clearfloat'></div></div>"
                        document.querySelector("#messagetext").innerHTML = mtext;
                    }

                    //' | ' + 'NEUTRAL ' + '<i class="fa-light fa-face-meh"></i>'
                }


            });

            lineChart.update();
            //let score = data.topics[0].sentiment.polarity.score;
            //console.log("Blah Blah Blah: " + data.topics[0] + " | " + cat);
            //console.log("polarity score: ", score)

            //sentimentChart();

        } else {
            console.log("No TOPIC data");
        }
    }
    
   
}



function sentimentChart() {
    document.querySelector("#sentimentsuggestion").innerHTML = ' | ' + 'NEUTRAL' + '<i class="fa-light fa-face-meh mx-2"></i>';
    //You can have multiple lines by adding multiple datasets: [example1, example2]
    //'Blue', 'Yellow', 'Green', 'Purple', 'Orange'
    // -.58, .55, .22, -.33, 1
    lineChart = new Chart (ctx, {
        type: 'line',
        data: {
            labels: chartLabels,
            datasets: [{
                label: 'Sentiment Analysis',
                data: chartValues,
                borderWidth: 1,
                borderColor: '#DD295C',
                backgroundColor: '#DD295C'

            }]
        },
        options: {
            animations: {
                tension: {
                    duration: 1000,
                    easing: 'linear',
                    from: 1,
                    to: 0,
                    loop: true
                }
            },
            scales: {
                y: { // defining min and max so hiding the dataset does not change scale range
                    min: -1,
                    max: 1
                }
            }
        }
    });
}


function subscribeToStream() {

    (async () => {

        try {

            // We recommend to remove appId and appSecret authentication for production applications.
            // See authentication section for more details
            const symbl = new Symbl({
                appId: appid,
                appSecret: appsecret
                // accessToken: '<your Access Toknen>'
            });

            // Open a Symbl Streaming API WebSocket Connection.
            const connection = await symbl.subscribeToConnection(sessionId);

            // Retrieve real-time transcription from the conversation
            connection.on("speech_recognition", (speechData) => {
                const { punctuated } = speechData;
                const name = speechData.user ? speechData.user.name : "User";
                console.log(`${name}: `, punctuated.transcript);
            });

            // This is just a helper method meant for testing purposes.
            // Waits 60 seconds before continuing to the next API call.
            await Symbl.wait(60000);;

            // Closes the WebSocket connection.
            connection.disconnect();
        } catch (e) {
            // Handle errors here.
        }

    })();
}