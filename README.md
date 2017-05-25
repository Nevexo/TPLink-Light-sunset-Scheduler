# TPLink-Light-sunset-Scheduler
A dogey, skratty program to turn your TP-Link smart light on when it's around the sunset time.

# Configuring this to work
Wow, you're really using it?

Okay then. Let's install all of the stuff this project needs, for each of the dependencies in this list type
```
npm install --save [name]
```
```
colors
request
node-schedule
tplink-lightbulb
```
(An option to turn off the colours in the output is coming soon as PuTTY and some other programs stugle to dislpay it.)
Now you'll need to configure it.

Find your longitude and latitude (http://www.latlong.net/) and place them in the config. I shouldn't have to tell you where they go.

Now you've done that, it should find your bulb on it's own (unless you reconfigure it (https://github.com/Nevexo/TPLink-Light-sunset-Scheduler/blob/master/README.md#what-everything-else-does))

To start it, run
```
node setrise.js
```

![probably deleted this image by accident. I'll fix it one day](http://nev.lovewump.us/FxhXY7gvk.png)
# What everything else does

```
autoscan
```
Autoscan will find your lightbulb automatically at startup, you can leave the lampIP empty.
```
lampIP
```
If you have autoScan disabled, put the IP address of your TP-Link bulb in here.
```
autoReset
```
Autoreset will automatically re-schedule your lighting tasks the next day based off the hour set in "reinitialize".
```
reinitialize
```
This is the hour (in 24hr time format) that the system should check for a new sunset time and recreate the days schedules. This is only used when autoReset is enabled.
```
dimAfterTwoHours
```
When set to true, this sets your lights to 30% 2 hours after the sun goes down.

And that's it, it's a huge doge-job of a program and probably won't work for long.
