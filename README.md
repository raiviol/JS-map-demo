# JS Map demo

This is a location data visualization demo, written in javascript. 

Location information can be visualized over a map as a heatmap, and as a chart with timeline.

Data and user groups can be filtered by time and data data types. 

## How to run
You will need your own HERE JS api credentials, they can be aquirred [here](https://developer.here.com/develop/javascript-api).

To get your app_id and app_code in the demo, create a file called API_keys.js in
scripts -folder, and add following code in it:
``` javascript
module.exports = 
{
    'app_id'  : {YOUR_APP_ID},
    'app_code': {YOUR_APP_CODE},
}
```
Where {YOUR_APP_ID} and {YOUR_APP_CODE} are the credentials you got from the previous step.

A randomly generated data file is provided, however, if you wish to use your own data,
create a .csv -file with same fields as in 'fake_data.csv', and modify const dataFile
at main.js main function to point to your file.
