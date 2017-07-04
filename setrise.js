var request = require('request');
const Bulb = require('tplink-lightbulb')
const config = require("./config.json"); //Make sure the config exists.
var schedule = require('node-schedule');
if (config.useColors) {
   var color = require('colors');
}

var version = 1.5;
console.log("[DEBUG] Setrise daemon is starting.".bgYellow)
console.log("[DAEMON] Version -> " +  version + " LAT -> " + config.latitude + " LONG -> " + config.longitude)
var endpoint = 'https://api.sunrise-sunset.org/json?'
if (config.buzzingMitigation) {
    if (config.dimAfterTwoHours) {
        console.log("[WARNING] Buzzing mitigation and dim after two hours are enabled! The lamp will Buzz after the two hours!".bgYellow)
    }
  console.log("[ALERT] Lamp buzzing mitigation is enabled. The light will ramp up faster.")
}

function ignite(brightness, lampObject, calledFrom, expireSched) {
    const options = {}
    options.brightness = parseInt(brightness)
    lampObject.set(true, 200, options)
    .then(status => {
        if (status.on_off == 1) {
            console.log("[SUCCESS] The light ignited at " + options.brightness + "% brightness!")
            if (expireSched == true) {
                if (config.autoReset) {
                    console.log("[DEBUG] Ending the schedule, it will respawn at " + config.reinitialize + ":00 tomorrow. (AUTO MODE)")
                }else {
                    console.log("[DEBUG] Ending the schedule, it will not respawn as autoReset is false")
                }

                calledFrom.cancel() //End schedule
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
        console.log("The sun will set at " + time[0] + ":" + time[1] + " Timezone configured: UTC" + config.time_offset.plus_minus + config.time_offset.offset)
        var twoHoursBefore = parseInt(time[0] - 2)
        var oneHourBefore = parseInt(time[0] - 1)
        var twoHoursAfter = parseInt(time[0]) + parseInt(2)
        var twoHoursBefore = schedule.scheduleJob('0 '+time[1] + ' ' + twoHoursBefore.toString() + ' * * *', function(){
            console.log("[DEBUG] Two hours before sunset, starting up!".bgYellow)
            if (config.buzzingMitigation) {
                ignite('45', lamp, twoHoursBefore, true)
            }else {
                ignite('30', lamp, twoHoursBefore, true)
            }

            });
        var oneHourBefore = schedule.scheduleJob('0 '+time[1] + ' ' + oneHourBefore.toString() + ' * * *', function(){
            console.log("[DEBUG] One hour before sunset, ramping up brightness.".bgYellow)
            if (config.buzzingMitigation) {
              ignite('70', lamp, oneHourBefore, true)
            }else {
              ignite('50', lamp, oneHourBefore, true)
            }


        });
        var sunset = schedule.scheduleJob('0 '+time[1] + ' ' + time[0] + ' * * *', function() {
            console.log("[DEBUG] Sunset event rasied, ramping up.".bgYellow)
            if (config.buzzingMitigation) {
              ignite('100', lamp, sunset, true)
            }else{
              ignite('90', lamp, sunset, true)
            }

        })
        if (config.dimAfterTwoHours) {
            var twoHoursAfter = schedule.scheduleJob('0 '+ time[1] + ' ' + twoHoursAfter.toString() + ' * * *', function() {
                console.log("[DEBUG] Two hours after sunset, dimming lamps. (Ignoring buzzing mitigation)".bgYellow)
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
    console.log("Auto scan is enabled. Locating bulbs...".bgYellow)
    const scan = Bulb.scan()
  .on('light', light => {
    light.info()
      .then(status => {
        scan.stop()
        console.log("Found a lamp!.".bgGreen)
        console.log("[LAMP] Found lamp! Model: "+status.model + " with the alias: " + status.alias)
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
console.log("Initlization complete!")
