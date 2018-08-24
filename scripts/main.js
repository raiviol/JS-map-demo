import apiConfig from '../../api_keys';

let myApp = {
config: {
// TODO anything here?



},
utils: {
 utils: function(filters = [], users = []) {
     this.filters = filters;
     this.users = users;

     // Returns true if filters is empty, or if idx represents filter
     this.inFilter = async function (data, idx, filterUsers=true)
     {
         // If user not in users, return false
         if (filterUsers && !this.users.includes(data[0][idx]))
         {
             return false;
         }
         for (let i = 0; i < this.filters.length; ++i)
         {
             let splt = this.filters[i].split(':');

             let group = await splt[0], opt = await splt[1];

             for (let j = 0; j < data.length; ++j)
             {
                 if (data[j][0] === group &&
                     data[j][idx] !== opt)
                 {
                     return false;
                 }
             }
         }
         return true;
     };

     // return true if timestamp is between given dates
     this.inDateRange = function(timestamp, dateStart, dateEnd)
     {
         // Timestamp example: "2017-02-23 13:43:54.523"

         let y =  Number(timestamp.slice(0, 4));
         let m =  Number(timestamp.slice(5, 7)) - 1; // counting starts from zero
         let d =  Number(timestamp.slice(8, 10));
         let h =  Number(timestamp.slice(11, 13));
         let mn = Number(timestamp.slice(14, 16));

         let date = new Date(y, m, d, h, mn);

         return (date >= dateStart && date <= dateEnd);
     };

     // Returns dataset and times sampled from arrays given, as arrays of length stepsize
     // Sums data from inside the step timeframe, so that graphs can be drawn,
     // since every event only counts as one.
     this.summarize = function(dataset, timearray, stepsize)
     {
         // create a array with both times and data, for sorting
         let timeseries = [];
         for (let i = 0; i < dataset.length; ++i )
         {
            timeseries.push({x: timearray[i], y: dataset[i]});
         }

         // Sort arrays by time
         function compare(a, b) { return a.x > b.x; }
         timeseries = timeseries.sort(compare);

         let newtimes = [];
         let newdata = [];

         let timesum = 0;
         let sum = 0;

         let steps = 0;
         let last;
         if (timeseries.length > 0)
         {
             last = timeseries[0].x;
         }

         // Sum data from each timeframe
         for (let i = 0; i < timeseries.length; ++i)
         {
            if (timeseries[i].x - last < stepsize)
            {
                sum += timeseries[i].y;
                //timesum += timeseries[i].x;

                steps += 1;

            } else {
                newdata.push(sum);
                newtimes.push(timeseries[i].x);

                timesum = 0;
                sum = 0;
                steps = 0;

                last = timeseries[i].x;
            }
         }
         return [newdata, newtimes];
     }
 }
},
widgets: {
 map: function(mapContainer, locDataFile)
 {
 // HERE platform
 this.platform = new H.service.Platform(
     {
     'app_id': apiConfig.app_id,
     'app_code': apiConfig.app_code,
     'useCIT': true,
     'useHTTPS': true
     }
 );
 this.platform = 

 this.locDataFile = locDataFile;

 // Obtain the default map types from the platform object:
 const defaultLayers = this.platform.createDefaultLayers();

 // Instantiate (and display) a map object:
 const map = new H.Map(
     mapContainer,
     defaultLayers.normal.map,
     {
         zoom: 13,
         center: {lat: 61.4954, lng: 23.7542}
     });

 // Create the default UI:
 const ui = H.ui.UI.createDefault(map, defaultLayers);

 // Add map events functionality to the map
 const mapEvents = new H.mapevents.MapEvents(map);

 // Add behavior to the map: panning, zooming, dragging.
 const behavior = new H.mapevents.Behavior(mapEvents);

 this.map = map;

 // -------------------------------
 // ------ Heatmap Utilities ------
 // -------------------------------
 this.filters = [];
 this.users = [];

 this.drawHeatMap = async function (map, dateStart, dateEnd, provider)
 {
     const parser = new myApp.widgets.csvParser();
     let data = await parser.parseCSV(this.locDataFile);

     let lat = data[6];
     let lng = data[7];

     let timestamps = data[8];

     let heatmapProvider;
     if (provider == null) {

         // Create heat map provider
         heatmapProvider = new H.data.heatmap.Provider({
             colors: new H.data.heatmap.Colors({
                 // light color version

                 '0': '#0431B4',
                 '0.1': '#0489B1',
                 '0.2': '#04B486',
                 '0.3': '#01DF3A',
                 '0.4': '#D7DF01',
                 '0.5': '#DBA901',
                 '0.55': '#DF7401',
                 '0.6': '#DF3A01',
                 '0.65': '#DF0101'

                 // dark color version
                 /*
                 '0':   '#086A87',
                 '0.1': '#088A4B',
                 '0.2': '#088A08',
                 '0.3': '#4B8A08',
                 '0.4': '#868A08',
                 '0.5': '#886A08',
                 '0.6': '#8A4B08',
                 '0.7': '#8A2908',
                 '0.8': '#8A0808'
                 */
             }, true),
             // Paint assumed values in regions where no data is available
             assumeValues: true
         });

     } else {
         heatmapProvider = provider;
     }
     heatmapProvider.clear();

     // Objcet containing utility functions
     let utility = new myApp.utils.utils(this.filters, this.users);

     // Add the data
     let dataLen = 0;
     for (let i = 0; i < lat.length; ++i) {
         let latitude = Number(lat[i]);
         let longitude = Number(lng[i]);

         if (!isNaN(latitude) && !isNaN(longitude) &&
             latitude !== 0 && longitude !== 0 &&
             await utility.inFilter(data, i) &&
             await utility.inDateRange(timestamps[i], dateStart, dateEnd))
         {
             heatmapProvider.addData(
                 [{lat: latitude, lng: longitude, value: 1}]
             );
             dataLen += 1;
         }
     }
     if (dataLen > 0) {
         // Create a semi-transparent heat map layer
         let heatmapLayer = new H.map.layer.TileLayer(heatmapProvider, {
             opacity: 0.7
         });

         // Add the layer to the map
         await this.map.addLayer(heatmapLayer);
     }
     return heatmapProvider;
 };
 },
 dateSlider: function(sliderContainer, dateMin, dateMax) {
     this.dateStart = dateMin;
     this.dateEnd = dateMax;

     sliderContainer.dateRangeSlider({
         bounds: {
             min: this.dateStart,
             max: this.dateEnd
         },
         defaultValues: {
             min: this.dateStart,
             max: this.dateEnd
         },

         formatter: function (val) {
             let days = val.getDate(),
                 month = val.getMonth() + 1,
                 year = val.getFullYear();

             return days + "/" + month + "/" + year
         }
     });

     this.update = function(attribute, dateMin, dateMax)
     {
         if (attribute === "formatter") {
             function format(n){
                 return n > 9 ? "" + n: "0" + n;
             }
             // if date difference < three days (in milliseconds), show hours and minutes
             if (dateMax - dateMin < 259200000) {
                 sliderContainer.dateRangeSlider("option", "formatter",
                     function (val) {
                         let date = new Date(val);

                         let minute = date.getMinutes(),
                             hour = date.getHours(),
                             days = date.getDate(),
                             month = date.getMonth() + 1,
                             year = date.getFullYear();

                         return format(days) + "/" + format(month) + "/" +
                                format(year) + " " +
                                format(hour) + ":" + format(minute);
                     });
             } else {
                 sliderContainer.dateRangeSlider("option", "formatter",
                     function (val) {
                         let date = new Date(val);

                         let days = date.getDate(),
                             month = date.getMonth() + 1,
                             year = date.getFullYear();

                         return format(days) + "/" + format(month) + "/" +
                                format(year);
                     });
             }
         }
         else {
             sliderContainer.dateRangeSlider(
                 attribute, dateMin, dateMax
             );
         }
     };
 },
 datePicker: function(datePickerContainer, minDate, maxDate){
     this.minDate = minDate;
     this.maxDate = maxDate;

     $(function () {
         datePickerContainer.daterangepicker({

             timePicker: true,
             showDropdowns: true,
             timePicker24Hour: true,
             linkedCalendars: false,
             drops: 'up',

             startDate: minDate,
             endDate: maxDate,

             minDate: minDate,
             maxDate: maxDate,

             locale: {
                 format: 'YY/MM/DD HH:mm'
             }
         });
     });
 },
 filter: function(filterMenu, dataFile)
 {
     this.locDataFile = dataFile;

     // Option group == column in data file, ie. title, type, action...
     this.createOptionGroup = async function(name, data)
     {
         let optgroup = document.createElement("OPTGROUP");
         optgroup.setAttribute("label", name);
         optgroup.setAttribute("id", name);

         let idx = 0;
         // find column with right attribute
         for (let i = 0; i < data.length; ++i)
         {
             if (data[i][0] === name)
             {
                 idx = i;
                 break;
             }
         }
         let added = [];
         for (let i = 0; i < data[idx].length; ++i)
         {
             let value = data[idx][i];

             if (!added.includes(value) && value !== name && value !== "")
             {
                 let option = document.createElement("OPTION");

                 // value == "group:option"
                 option.setAttribute("value", name + ":" + value);
                 option.innerHTML = value;

                 optgroup.append(option);
                 added.push(value);
             }
         }
         return optgroup;
     };

     // Option == value in selected column
     this.addOptions = async function (options)
     {
         const parser = new myApp.widgets.csvParser();
         let data = await parser.parseCSV(this.locDataFile);

         for (let i = 0; i < options.length; ++i)
         {
             let optgroup = await this.createOptionGroup(options[i], data);

             filterMenu.append(optgroup);
         }
         filterMenu.trigger("chosen:updated");
     };

     this.disableGroup = async function(filterText)
     {
         let splt = filterText.split(':');

         let groupName = splt[0];

         let group = document.getElementById(groupName);

         let children = group.childNodes;

         for (let c=0; c < children.length; ++c)
         {
             if ( children[c].value !== filterText)
             {
                 children[c].setAttribute('disabled', 'disabled');
             }
         }
         filterMenu.trigger("chosen:updated");
     };

     this.enableGroup = async function(filterText)
     {
         let splt = filterText.split(':');

         let groupName = splt[0];

         let group = document.getElementById(groupName);

         let children = group.childNodes;

         for (let c=0; c < children.length; ++c)
         {
             if ( children[c].value !== filterText)
             {
                 children[c].removeAttribute('disabled');
             }
         }
         filterMenu.trigger("chosen:updated");
     };
    
     this.options = ["Action", "Category", "Notification id",
                     "Title", "Type", "Userid"];
     this.addOptions(this.options);

     // activate chosenjs
     $(function ()
     {
         filterMenu.chosen({
             disable_search_threshold: 10,
             no_results_text: "No results match",
             placeholder_text_multiple: "Select filters",
             include_group_label_in_selected: true,
             width: "60%"
         });
     });
 },
 userfilter: function(dataFile, dateStart, dateEnd)
 {
     this.users = [];
     this.maxUsers = 0;
     this.filters = [];
     this.dataFile = dataFile;

     this.dateStart = dateStart;
     this.dateEnd = dateEnd;

     this.filterUsers = async function(init = false)
     {
         this.users = [];

         const parser = new myApp.widgets.csvParser();
         let data = await parser.parseCSV(this.dataFile);

         if (init)
         {
             for (let i = 1; i < data[0].length; ++i)
             {
                 if (!this.users.includes(data[0][i]))
                 {
                     this.users.push(data[0][i]);
                 }
             }
             this.maxUsers = this.users.length;

         } else {
             let utility = new myApp.utils.utils(this.filters);

             for (let i = 1; i < data[0].length; ++i) {
                 if (!this.users.includes(data[0][i]) &&
                     await utility.inFilter(data, i, false) &&
                     await utility.inDateRange(data[8][i], this.dateStart, this.dateEnd)) {
                     this.users.push(data[0][i]);
                 }
             }
         }
     };
     this.filterUsers(true);
 },
 csvParser: function()
 {
     // Parse csv file, returns contents in an array of arrays,
     // amount of which depends on amount of columns in the source file
     this.parseCSV = async function (filepath)
     {
         let alltext = await fetch(filepath)
             .then(response => response.text())
             .then(text => text);

         let UserId = [], NotificationId = [], Type = [], Category = [], Title = [],
             Action = [], Latitude = [], Longitude = [], Timestamp = [];

         let lines = alltext.split('\n');
         for (let i = 0; i < lines.length - 1; ++i) {

             let fields = lines[i].split('\t');
             //let fields = lines[i].split(',');

             UserId.push(fields[0].replace(/"/g, ''));
             NotificationId.push(fields[1].replace(/"/g, ''));
             Type.push(fields[2].replace(/"/g, ''));
             Category.push(fields[3].replace(/"/g, ''));
             Title.push(fields[4].replace(/"/g, ''));
             Action.push(fields[5].replace(/"/g, ''));
             Latitude.push(fields[6].replace(/"/g, ''));
             Longitude.push(fields[7].replace(/"/g, ''));
             Timestamp.push(fields[8].replace(/"/g, ''));
         }

         return [UserId, NotificationId, Type, Category, Title,
                 Action, Latitude, Longitude, Timestamp]
     }
 },
 chart: function(chartContainer)
 {

     this.users = [];
     this.filters = [];
     this.showAll = true;
     this.showUsers = false;

     // Transform datestring to date (or milliseconds since 1 January 1970 UTC)
     this.parseDate = async function(timestamp)
     {
         // Timestamp example: "2017-02-23 13:43:54.523"

         let y =  Number(timestamp.slice(0, 4));
         let m =  Number(timestamp.slice(5, 7))-1;
         let d =  Number(timestamp.slice(8, 10));
         let h =  Number(timestamp.slice(11, 13));
         let mn = Number(timestamp.slice(14, 16));

         let date = new Date(y, m, d, h, mn);

         return date.getTime();
     };
     // Add data to chart datasets
     this.addData = async function(filename, dateStart, dateEnd)
     {
         const parser = new myApp.widgets.csvParser();
         let data = await parser.parseCSV(filename);

         let lat = data[6];
         let lgn = data[7];
         let timestamps = data[8];

         // Filters depend on user input
         let filters;
         if ( this.showAll )
         {
             filters = [[], this.filters];

         } else {
             filters = [this.filters];
         }
         // Clear datasets
         this.removeData();

         let repeat;
         this.showUsers ? repeat = 2 : repeat = 1;

         for (let ff=0; ff < repeat; ++ff) {
             for (let f = 0; f < filters.length; ++f)
             {

                 let utility = new myApp.utils.utils(filters[f], this.users);

                 let dataset = [];
                 let labels = [];

                 for (let i = 0; i < lat.length; ++i)
                 {
                     let latitude = Number(lat[i]);
                     let longitude = Number(lgn[i]);

                     if (!isNaN(latitude) && !isNaN(longitude) &&
                         latitude !== 0 && longitude !== 0 &&
                         await utility.inFilter(data, i, ff === 1) &&
                         await utility.inDateRange(timestamps[i], dateStart, dateEnd))
                     {
                         dataset.push(1);
                         labels.push(await this.parseDate(timestamps[i]));
                     }
                 }
                 // Rescale x axis, automatic rescale acts weird
                 this.chart.options.scales.xAxes =
                     [
                         {
                             type: "time",
                             time: {min: dateStart, max: dateEnd}
                         }
                     ];

                 // Scale stepsize with date range
                 let stepsize = (dateEnd.getTime() - dateStart.getTime()) / 50;

                 // Calculate sums of events during timesteps
                 let out = utility.summarize(dataset, labels, stepsize);
                 dataset = out[0];
                 labels = out[1];

                 this.chart.data.datasets[f + 2*ff].data = dataset;

                 // labels == timesteps, applies to all datasets
                 if (f === 0 && ff === 0)
                 {
                     this.chart.data.labels = labels;
                 }

                 this.chart.options.title.text = "";
             }
         }
         await this.chart.update()
     };
     // Clear the datasets and timesteps
     this.removeData = async function() {
         this.chart.data.labels = [];

         for (let i=0; i < 4; ++i) {
             this.chart.data.datasets[i].data = [];
         }
     };
     let canvas = chartContainer.getElementsByClassName("Chart")[0];
     canvas.width  = canvas.offsetWidth;
     canvas.height = canvas.offsetHeight;

     let context = canvas.getContext('2d');

     this.filters = [];

     let data =   [];
     let labels = [];
     this.chart = new Chart(context, {
         type: 'line',
         data: {
             labels: labels,
             datasets: [{
                 data: data,
                 label: "All events",
                 backgroundColor:  ['rgba(122, 193, 255, 0.2)'],
                 borderColor: ['rgba(88, 147, 225, 0.2)'],
             },
             {
                 data: [],
                 label: "Filtered",
                 backgroundColor:  ['rgba(122, 193, 255, 0.2)'],
                 borderColor: ['rgba(33, 97, 140, 0.2)'],
             },
             {
                data: [],
                label: "Usergroup",
                backgroundColor:  ['rgba( 18, 215, 196, 0.2)'],
                borderColor: ['rgba(26, 188, 156, 0.2)'],
             },
             {
                 data: [],
                 label: "Usergroup filtered",
                 backgroundColor:  ['rgba(118, 215, 196, 0.2)'],
                 borderColor: ['rgba(23, 165, 137, 0.2)'],
             }]
         },
         options: {
             title: {
                 display: false,
                 text: 'Number of events since last time step'
             },
             showPointLabels: false,
             legend: {display:true},
             elements: {point: { radius: 1.5 }},
             scales: {
                 xAxes: [{
                     distribution: 'linear',
                     type: 'time',
                     ticks: {},
                     time: {

                         displayFormats: {
                             quarter: 'MMM YYYY'
                         }
                     }
                 }]
             }
         },
     });

     // TODO, possibly not needed at all
    this.update = function(value, arg1=null, arg2=null)
    {
        if ( value === "dates" ) {

        }
        else if ( value === "filters" ) {

        }
        this.chart.options.title.text = 'new title';
        this.chart.update();
    }
 }
}
};

// -----------------------------------------------------------------------------
// ------ Main -----------------------------------------------------------------
// -----------------------------------------------------------------------------

async function main() {
    // Event data from citytrack app
    const dataFile = 'fake_data.csv';

    // ------ HTML elements ------
    const mapContainer = document.getElementById('mapContainer');
    const datePickerContainer = $("#datetimes");
    const sliderContainer = $("#sliderContainer");
    const filterContainer = $('#filterSelector');
    const chartContainer = document.getElementById("chartContainer");
    const messageText = document.getElementById("messageArea");
    const messageBox = document.getElementById("messageBox");

    // Map object
    const map = new myApp.widgets.map(mapContainer, dataFile);

    // Heatmap toggle -button
    const button1 = document.getElementById('button1');
    // Map/charts toggle -button
    const button2 = document.getElementById('button2');
    // Show all/show filtered toggle button
    const button3 = document.getElementById('button3');
    // Filter users toggle -button
    const button4 = document.getElementById('button4');
    let filterUsersMode = false;

    // Dropdown menu for picking date ranges
    const datePicker = new myApp.widgets.datePicker(
        datePickerContainer,
        new Date(2016, 0, 1),
        new Date()
    );

    // Slider for picking date ranges
    const slider = new myApp.widgets.dateSlider(
        sliderContainer,
        datePicker.minDate,
        datePicker.maxDate
    );

    // Filter heatmap with citytrack event data
    const filter =  new myApp.widgets.filter(filterContainer, dataFile);

    const chart = new myApp.widgets.chart(chartContainer);
    chart.addData(dataFile, slider.dateStart, slider.dateEnd);

    const userFilter = new myApp.widgets.userfilter(
        dataFile,
        datePicker.minDate,
        datePicker.maxDate
    );
    map.users = userFilter.users;
    chart.users = userFilter.users;

    let heatMapOn = false; // for toggle switch
    let heatMap; // heatMapProvider -object

    // Called when filters or date range are changed
    async function updateHeatMap()
    {
        sliderContainer.attr('disabled', 'disabled');
        button1.disabled = true;
        filterContainer.attr('disabled', 'disabled');
        datePickerContainer.attr('disabled', 'disabled');
        if (heatMapOn)
        {
            heatMap = await heatMap.clear();
            heatMap = await map.drawHeatMap(
                map,
                slider.dateStart,
                slider.dateEnd,
                heatMap
            );
        }
        sliderContainer.removeAttr('disabled');
        button1.disabled = false;
        filterContainer.removeAttr('disabled');
        datePickerContainer.removeAttr('disabled');
    }

    // Date range changed
    datePickerContainer.on("apply.daterangepicker", function (e, data)
    {
        let dateStart = data.startDate.toDate();
        let dateEnd = data.endDate.toDate();

        slider.update("bounds", dateStart, dateEnd);
        slider.update("values", dateStart, dateEnd);
        slider.update("formatter", dateStart, dateEnd);
    });

    // Date range slider moved
    sliderContainer.bind("valuesChanged", async function (e, data)
    {
        slider.dateStart = await data.values.min;
        slider.dateEnd = await data.values.max;

        if ( filterUsersMode )
        {
            userFilter.dateStart = slider.dateStart;
            userFilter.dateEnd = slider.dateEnd;

        } else {
            chart.addData(dataFile, slider.dateStart, slider.dateEnd);
            await updateHeatMap();
        }
    });

    // Filters added/removed
    filterContainer.on('change', async function (evt, input)
    {
        let targets;
        filterUsersMode ? targets = [userFilter] : targets = [map, chart];

        if (input != null && input.selected != null)
        {
            for( let f=0; f < targets.length; ++f )
            {
                targets[f].filters.push(input.selected);
            }
            filter.disableGroup(input.selected);
        }
        if (input != null && input.deselected != null)
        {
            for( let f=0; f < targets.length; ++f ) {
                let index = targets[f].filters.indexOf(input.deselected);
                if (index !== -1)
                {
                    targets[f].filters.splice(index, 1);
                }
            }
            filter.enableGroup(input.deselected);
        }
        if ( !filterUsersMode )
        {
            chart.addData(dataFile, slider.dateStart, slider.dateEnd);
            await updateHeatMap();
        }
    });

    // Heatmap toggle -button clicked
    async function toggleHeatMap()
    {
        button1.disabled = true;

        if (!heatMapOn)
        {
            button1.value = "Heatmap ON";
            button1.style.background = "#239b56";

            heatMap = heatMap = await map.drawHeatMap(
                map,
                slider.dateStart,
                slider.dateEnd,
                heatMap
            );
            heatMapOn = true;

        } else {
            button1.value = "Heatmap OFF";
            button1.style.background = "#922b21";

            heatMap = await heatMap.clear();
            heatMapOn = false;
        }
        button1.disabled = false;
    }
    button1.addEventListener('click', toggleHeatMap);

    // Heatmap toggle -button clicked
    async function toggleDivs()
    {
        button2.disabled = true;

        if ( mapContainer.style.display === "none" )
        {
            mapContainer.style.display = 'block';
            chartContainer.style.display = 'none';
            button2.value = "Charts";

        } else {
            mapContainer.style.display= 'none';
            chartContainer.style.display = 'block';
            button2.value = "Map";
        }
        button3.style.display = chartContainer.style.display;

        button2.disabled = false;
    }
    button2.addEventListener('click', toggleDivs);

    // Filter toggle -button clicked
    async function toggleFilters()
    {
        button3.disabled = true;

        if ( chart.showAll === false )
        {
            chart.showAll = true;

            button3.value = "Show only filtered";

        } else {
            chart.showAll = false;

            button3.value = "Show all events";
        }
        chart.addData(dataFile, slider.dateStart, slider.dateEnd, true);

        button3.disabled = false;
    }
    button3.addEventListener('click', toggleFilters);

    // Filter toggle -button clicked
    async function toggleUserFilter()
    {
        button4.disabled = true;

        if ( filterUsersMode )
        {
            await userFilter.filterUsers();
            filterUsersMode = false;

            map.users = userFilter.users;
            chart.users = userFilter.users;

            chart.showUsers = userFilter.users.length < userFilter.maxUsers;
            chart.addData(dataFile, slider.dateStart, slider.dateEnd);

            await updateHeatMap();

            alert("Current group holds " + String(userFilter.users.length) + " users.");

            button4.value = "Filter users";
            button4.style.background = "#239b56"

        } else {
            filterUsersMode = true;

            userFilter.filters = map.filters;
            userFilter.dateStart = slider.dateStart;
            userFilter.dateEnd = slider.dateEnd;

            button4.value = "done";
            button4.style.background = "#922b21"
        }

        button4.disabled = false;
    }
    button4.addEventListener('click', toggleUserFilter);
}


main();
