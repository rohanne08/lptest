var name = '';
var visitorLocation = '';
var triedCountry = false;

// Called when the SDK initializes successfully
var notificationHandler = function(data) {
    console.log("Notification:", data);
};

// Called after a command (like write) is executed
var notifyWhenDone = function(err) {
    if (err) {
        console.error("Command failed:", err);
    }
};

// Called when visitorName is available
var updateCallback = function(data) {
    var path = data.key;
    var value = data.newValue;

    if (path === 'visitorInfo.visitorName') {
        name = value;

        // Greet visitor
        lpTag.agentSDK.command(lpTag.agentSDK.cmdNames.write,
            { text: 'Hello ' + name + '!' }, notifyWhenDone);

        // Mention their location if known
        if (visitorLocation) {
            lpTag.agentSDK.command(lpTag.agentSDK.cmdNames.write,
                { text: 'I see you are from ' + visitorLocation }, notifyWhenDone);
        }
    }
};

// Success handler for getting city/country
var onSuccess = function(data) {
    visitorLocation = data;
    lpTag.agentSDK.bind('visitorInfo.visitorName', updateCallback, notifyWhenDone);
};

// Fallback to country if city fails
var onError = function(err) {
    if (!triedCountry) {
        triedCountry = true;
        lpTag.agentSDK.get('country', onSuccess, onError);
    } else {
        console.warn("Failed to retrieve location.");
        lpTag.agentSDK.bind('visitorInfo.visitorName', updateCallback, notifyWhenDone);
    }
};

// MAIN INIT
lpTag.agentSDK.init({
    notificationCallback: notificationHandler,
    success: function () {
        console.log("SDK initialized");

        // Try getting city
        lpTag.agentSDK.get('city', onSuccess, onError);

        // Bind to visitor messages
        lpTag.agentSDK.bind("consumerMessage", function(data) {
            if (data && data.text) {
                const message = data.text.trim();
                if (message.includes("?")) {
                    // Show message in widget (example assumes there's a div#output in your HTML)
                    const outputDiv = document.getElementById("output");
                    if (outputDiv) {
                        outputDiv.innerText = "Visitor asked: " + message;
                    }

                    // Send notification to agent
                    lpTag.agentSDK.command(lpTag.agentSDK.cmdNames.write,
                        { text: "Visitor just asked: \"" + message + "\"" }, notifyWhenDone);
                }
            }
        }, notifyWhenDone);
    },
    error: function (err) {
        console.error("SDK failed to initialize:", err);
    }
});
