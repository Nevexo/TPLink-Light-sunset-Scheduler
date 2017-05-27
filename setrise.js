var request = require('request');
const Bulb = require('tplink-lightbulb')
const config = require("./config.json"); //Make sure the config exists.
var schedule = require('node-schedule');
var color = require('colors');
var version = 1.5;
console.log("[DEBUG] Setrise daemon is starting.".bgYellow)
console.log("[DAEMON] Version -> " +  version + " LAT -> " + config.latitude + " LONG -> " + config.longitude)
var endpoint = 'https://api.sunrise-sunset.org/json?'


function ignite(brightness, lampObject, calledFrom, expireSched) {
    const options = {}
    options.brightness = parseInt(brightness)
    lampObject.set(true, 200, options)
    .then(status => {
        if (status.on_off == 1) {
            console.log("[SUCCESS] The light ignited at " + options.brightness + "% brightness!")
            if (expireSched == true) {
                console.log("[DEBUG] Ending the schedule, it will respawn at " + config.reinitialize + ":00 tomorrow. (AUTO MODE)")
                calledFrom.cancel()
            }

        }else {
            console.log("[FAIL] The lamp reported an off state. Maybe the connection was dropped?".bgRed)
        }
    })
}

function init(lamp) {
    request({
        url: endpoint + "lat=" + config.latitude + "&lng=" + config.longitude + "&date=today",
        json: true
    }, function (error, response, body) {
        var data = body.results.sunset
        var data = data.split(":")
        var time = []
        if (data[2].substring(3) == "PM") {
            var content = parseInt(data[0]) + 12
            time.push(content.toString());
        }else {
            var content = parseInt(data[0]) - 12
            time.push(content.toString());
        }
        time.push(data[1])
        if (config.time_offset.plus_minus == "+") {
            data = parseInt(time[0]) + parseInt(config.time_offset.offset)
        }else {
            data = parseInt(time[0]) - parseInt(config.time_offset.offset)
        }
        time[0] = data.toString()
        console.log(time)
        console.log("The sun will set at " + time[0] + ":" + time[1] + "Timezone configured: ")
        var twoHoursBefore = parseInt(time[0] - 2)
        var oneHourBefore = parseInt(time[0] - 1)
        var twoHoursAfter = parseInt(time[0]) + parseInt(2)
        var twoHoursBefore = schedule.scheduleJob('0 '+time[1] + ' ' + twoHoursBefore.toString() + ' * * *', function(){
            console.log("[DEBUG] Powering up lamp at brightness, 30% (ACTIVATING) (TWO HOURS BEFORE SUNSET)".bgYellow)
            ignite('30', lamp, twoHoursBefore, true)

            });
        var oneHourBefore = schedule.scheduleJob('0 '+time[1] + ' ' + oneHourBefore.toString() + ' * * *', function(){
            console.log("[DEBUG] Updating brightness to 50% (ACTIVE) (ONE HOUR UNTIL SUNSET)".bgYellow)
            ignite('50', lamp, oneHourBefore, true)

        });
        var sunset = schedule.scheduleJob('0 '+time[1] + ' ' + time[0] + ' * * *', function() {
            console.log("[DEBUG] Updating brightness to 90% (ACTIVE) (SUNSET) ...".bgYellow)
            ignite('90', lamp, sunset, true)
        })
        if (config.dimAfterTwoHours) {
            var twoHoursAfter = schedule.scheduleJob('0 '+ time[1] + ' ' + twoHoursAfter.toString() + ' * * *', function() {
                console.log("[DEBUG] Updating brightness to 30% (ACTIVE) (TWO HOURS AFTER SUNSET)".bgYellow)
                ignite('30', lamp, twoHoursAfter, true)
            })
        }


    })
}
if (config.autoReset) { //reinitialize automatically every time the time is config.reinitialize (24 hour.)
    var runLoop = schedule.scheduleJob('0 ' + config.reinitialize + ' 00 * * *', function() {
        console.log("[TIME] The time is " + config.reinitialize + ":00, re-creating the schedules.")
        init(lamp) //Reinitialize
        console.log("[TIME] Finished, going to sleep for 24 hours.")
    });
}


if (config.autoScan) {
    const scan = Bulb.scan()
  .on('light', light => {
    light.info()
      .then(status => {
        scan.stop()
        console.log("Found a lamp!.".bgGreen)
        console.log("[LAMP] Found lamp model: "+status.model + " with the alias: " + status.alias)
        var lamp = light //Create lamp object
      })
  })
}else {
    var lamp = new Bulb(config.lampIP) //Configure the lamp without autoScan
    lamp.info()
    .then(status => {
        console.log("[LAMP] Connected to lamp model: "+status.model + " with the alias: " + status.alias)
    })
}

init(lamp) //initialize the program.
