var UI = require('ui');
var OCRed = '#be2424';
var ajax = require('ajax');
var busesInfoMenu;

var localFavoriteStops = decodeURIComponent(localStorage.getItem('favoriteStops'));
var localFavoriteDestinations = decodeURIComponent(localStorage.getItem('favoriteDestinations'));

var favoriteStops = [];
if (localFavoriteStops !== undefined && localFavoriteStops !== "" &&  localFavoriteStops !== null) {
  favoriteStops = JSON.parse(localFavoriteStops);
}

var favoriteDestinations = [];
if (localFavoriteDestinations !== undefined && localFavoriteDestinations !== "" &&  localFavoriteDestinations !== null) {
  favoriteDestinations = JSON.parse(localFavoriteDestinations);
}

var main = new UI.Card({
  title: 'OC Transpo Tracker',
  body: 'Select: Favourite buses\nDown: Favourite destinations',
  titleColor: OCRed
});
var busesMenu = new UI.Menu({
  'highlightBackgroundColor': OCRed,
  'highlightTextColor': 'white',
  'sections': [{
    'title': 'Favourite Buses',
    'items':  getFavoriteStopsMenu()
  }]
});
var busesLoadingMenu = new UI.Menu({
  'highlightBackgroundColor': OCRed,
  'highlightTextColor': 'white',
  'sections': [{
    'items': [{
      'title': 'Loading...'
    }]
  }]
});
var busesInfoMenu = new UI.Menu({
  'highlightBackgroundColor': OCRed,
  'highlightTextColor': 'white',
  'sections': [{
    'titleColor': '#9a0036',
  }]
});
main.show();
main.on('click', 'select', function(e) {
  "use strict";
  if (favoriteStops === null) {
    showCard("Favorite Stops", 'You have no favourites.\nGo to the app configuration to add some.');
  }
  else {
    busesMenu.show();
    busesMenu.on('select', function(e) {
      busesLoadingMenu.sections.title = e.item.title;
      busesLoadingMenu.show();
      var stop = e.item.stop, bus = e.item.bus, title = e.item.title;
      showBusSchedule(stop, bus, title);
      
      busesInfoMenu.on('select', function() {
        console.log('refresh');
        showBusSchedule(stop, bus, title);
      });
    });
  }
});

main.on('click', 'down', function(e){
  if (favoriteDestinations === null) {
    var nullFavs = new UI.Card({
      'title': 'Favorite Destinations',
      'body': 'You have no favourites.\nGo to the app configuration to add some.',
      'titleColor': OCRed
    });
    nullFavs.show();
  } 
  else {
    var destinationsMenu = new UI.Menu({
      'highlightBackgroundColor': OCRed,
      'highlightTextColor': 'white',
      'sections': [{
        'title': 'Favourite Destinations',
        'items': getFavoriteDestinations()
      }]
    });
    destinationsMenu.show();
    
    destinationsMenu.on('select', function(e) {
      var destinationsLoadingMenu = new UI.Menu({
        'highlightBackgroundColor': OCRed,
        'highlightTextColor': 'white',
        'sections': [{
          'title': e.item.title,
          'items': [{
            'title': 'Loading...'
          }]
        }]
      });
      destinationsLoadingMenu.show();
      
      var options = { 'enableHighAccuracy': true, 'timeout': 5000, 'maximumAge': 0 };
      
      navigator.geolocation.getCurrentPosition(
        function(pos){
          var currentLocation = pos.coords;
          
          /*console.log('Your current position is:');
          console.log('Latitude : ' + currentLocation.latitude);
          console.log('Longitude: ' + currentLocation.longitude);
          console.log('More or less ' + currentLocation.accuracy + ' meters.');*/
          var day = (new Date()).getUTCDate().toString();
          if (day.length === 1) {
            day = "0"+day;
          }
          var googleAPIURL = "http://octracker.mattohara.ca/GetDirectionsForLocation.php?origin="+currentLocation.latitude+","+currentLocation.longitude+"&destination=" + e.item.subtitle + "&key=AIzaSyBQkSgvnEcL-IwkWmBjTqLDJNlEGX-a300&p="+day;
          //var googleAPIURL = "http://octracker.mattohara.ca/GetDirectionsForLocation.php?origin=45.4196763,-75.6952768&destination=" + e.item.subtitle + "&key=AIzaSyBQkSgvnEcL-IwkWmBjTqLDJNlEGX-a300&p="+day;
          //console.log('url: '+googleAPIURL);
          
          ajax (
            {
              'url': googleAPIURL, 
              'method': 'get'
            },
            function(data, status, request) {
              
              //console.log('Data: '+data);
              data = JSON.parse(data);
              
              var tripData = "";
              
              if (data.status === "ZERO_RESULTS") {
                tripData = "No results found.";
              }
              else {
                if (data.routes[0].legs[0].departure_time !== undefined) {
                  tripData = "Depart at " + data.routes[0].legs[0].departure_time.text + "\n\n";
                }
                else if (data.routes[0].legs[0].start_address !== undefined){
                  tripData = "Depart from " + data.routes[0].legs[0].start_address + "\n\n";
                }
                
                data.routes[0].legs[0].steps.forEach(function(step){
                  switch (step.travel_mode) {
                    case 'WALKING':
                      tripData += step.html_instructions + "\n\n";
                      break;
                    case 'TRANSIT':
                      tripData += step.transit_details.departure_time.text + ": Catch " + step.transit_details.line.short_name + " " + step.transit_details.headsign + " at " + step.transit_details.departure_stop.name+"\n\n";
                      tripData += step.transit_details.arrival_time.text + ": Exit bus at " + step.transit_details.arrival_stop.name+"\n\n";
                      break;
                    default:
                      tripData += step.html_instructions + "\n\n";
                      break;
                  }
                });
                
                if (data.routes[0].legs[0].arrival_time !== undefined) {
                  tripData += "Arrive at " + data.routes[0].legs[0].arrival_time.text;
                }
                else if (data.routes[0].legs[0].end_address !== undefined) {
                  tripData += "Arrive at " + data.routes[0].legs[0].end_address;
                }
                
              }
              
              showCard(e.item.title, tripData);
              
              
              destinationsLoadingMenu.hide();
            },
            function (error, status, request) {
              showCard("Error", error+"\nStatus: "+status);
              destinationsLoadingMenu.hide();
            }
          );
        }, 
        function(err){
          showCard("Error", "Current location unavailable.");
        }, 
        options);
    });
  }
});

function showCard(errorTitle, errorBody) {
  var card = new UI.Card({
    'title': errorTitle,
    'titleColor': OCRed,
    'body': errorBody,
    'scrollable': true
  });
  card.show();
  return card;
}

function getFavoriteStopsMenu(){
  var favoriteStopsMenu = [];
  if (favoriteStops !== null) {
    favoriteStops.forEach(function(item){
      favoriteStopsMenu.push({
        'title': item.bus.toString() + ' ' + item.name,
        'subtitle': 'Stop number ' + item.stop,
        'titleColor': OCRed,
        'stop': item.stop,
        'bus': item.bus
      });
    });
  }
  return favoriteStopsMenu;
}

function getFavoriteDestinations(){
  var favoriteDestinationsMenu = [];
  if (favoriteDestinations !== null) {
    favoriteDestinations.forEach(function(item){
      favoriteDestinationsMenu.push({
        'title': item.name,
        'subtitle':item.address,
        'titleColor': OCRed
      });
    });
  }
  return favoriteDestinationsMenu;
}

function getTripsForBus(route){
  var tripsMenu = [];
  if (route !== undefined){
    if (route.Trips !== undefined && route.Trips.Trip !== undefined) {
      route.Trips.Trip.forEach(function(trip){
        var subtitleText = trip.TripDestination + '.';
        if (trip.GPSSpeed !== '') {
          subtitleText = ' GPS Lock. ' + subtitleText;
        }
        tripsMenu.push({
          'title': trip.AdjustedScheduleTime + " min - " + trip.TripStartTime,
          'subtitle': subtitleText
        });
      });
    }
    else {
      tripsMenu.push({
        title: 'No trips found.'
      });                  
    }
  }
  return tripsMenu;
}

function showBusSchedule(stop, bus, title){
  busesLoadingMenu.show();
  busesInfoMenu.hide();
  console.log("stop: "+stop);
  console.log("bus: "+bus);
  console.log("title: "+title);
  ajax (
    {
      'url': "http://octracker.mattohara.ca/GetNextTripsForStop.php?appID=9e094046&apiKey=311f37deac014635df08a2ca1640f154&stopNo="+stop+"&routeNo="+bus,
      'method': 'get'
    },
    function(data, status, request) {
      //console.log(data);
      data = JSON.parse(data);
      var route = data.Route.RouteDirection;
      var section = {
        title: title,
        items: getTripsForBus(route)
      };
      console.log(JSON.stringify(section));
      busesInfoMenu.section(0, section);
      busesInfoMenu.show();
      busesLoadingMenu.hide();
    },
    function (error, status, request) {
      showCard("Error", error+"\nStatus: "+status);
      busesLoadingMenu.hide();
    }
  );
}

Pebble.addEventListener('showConfiguration', function(e) {
  Pebble.openURL('http://octracker.mattohara.ca/config-app.php?data='+JSON.stringify(localStorage.getItem('favoriteStops')));
});

Pebble.addEventListener('webviewclosed', function(e) {
  console.log("webviewclosed.");
  
  var data = JSON.parse(decodeURIComponent(e.response));
  
  console.log(JSON.stringify(favoriteStops));
  console.log(JSON.stringify(favoriteDestinations));
  
  favoriteStops = JSON.parse(data.favoriteStops);
  favoriteDestinations = JSON.parse(data.favoriteDestinations);
  
  localStorage.setItem('favoriteStops', JSON.stringify(favoriteStops));
  localStorage.setItem('favoriteDestinations', JSON.stringify(favoriteDestinations));
  
  var settingsUpdateCard = new UI.Card({
    'title': 'Settings',
    'titleColor': OCRed,
    'body': 'Settings updated.'
  });
  settingsUpdateCard.show();
});


