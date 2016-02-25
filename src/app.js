var UI = require('ui');
//var Vector2 = require('vector2');
var favoriteStops = localStorage.getItem('favoriteStops');
var OCRed = '#be2424';

//SEED
favoriteStops = [{
    bus: 31,
    name: 'VISENEAU / BARRINGTON',
    stop: 1756
  },
  {
    bus: 31,
    name: 'SLATER / KENT',
    stop: 3006
  },
  {
    bus: 94,
    name: 'SLATER / KENT',
    stop: 3006
  }
];

var main = new UI.Card({
  title: 'OC Transpo Tracker',
  icon: '',
  subtitle: '',
  body: 'Press up to find a bus.\nPress select to see favourites. ',
  titleColor: OCRed, // Named colors
  bodyColor: '' // Hex colors
});
main.show();

main.on('click', 'up', function(e){
  var findCard = new UI.Card({
    title: 'Find a station',
    titleColor: '#9a0036',
    icon: '',
    body: 'Coming soon.',
    
  });
  findCard.show();
});

main.on('click', 'select', function(e){
  if (favoriteStops === null) {
    var nullFavs = new UI.Card({
      title: 'OC Transpo Tracker',
      icon: '',
      body: 'You have no favourites.',
      titleColor: OCRed
    });
    nullFavs.show();
  }
  else {
    var favoriteStopsMenu = [];
    
    favoriteStops.forEach(function(item){
      favoriteStopsMenu.push({
        title: item.bus.toString() + ' ' + item.name,
        subtitle: 'Stop number ' + item.stop,
        titleColor: OCRed,
        stop: item.stop,
        bus: item.bus
      });
    });
    
    console.log(favoriteStopsMenu);
    var busesMenu = new UI.Menu({
      highlightBackgroundColor: OCRed,
      highlightTextColor: 'white',
      sections: [{
        title: 'Favourite Buses',
        items: favoriteStopsMenu
      }]
    });
    busesMenu.show();
    
    busesMenu.on('select', function(e) {
      var busesLoadingMenu = new UI.Menu({
        highlightBackgroundColor: OCRed,
        highlightTextColor: 'white',
        sections: [{
          title: e.item.title,
          items: [{
            title: 'Loading...'
          }]
        }]
      });
      busesLoadingMenu.show();
      
      var getRouteSummaryURL = "https://api.octranspo1.com/v1.2/GetNextTripsForStopAllRoutes";
      var ajax = require('ajax');
      
      ajax (
        {
          url: getRouteSummaryURL,
          method: 'post',
          data: {
            'appID': '9e094046',
            'apiKey': '311f37deac014635df08a2ca1640f154',
            'format':'json',
            'stopNo': e.item.stop
          }
        },
        function(data, status, request) {
          data = JSON.parse(data);
          var routes = data.GetRouteSummaryForStopResult.Routes.Route;
          var tripsMenu = [];
          
          if (routes !== undefined) {
            routes.forEach(function(route){
              if (route.RouteNo === e.item.bus){
                if (route.Trips !== undefined) {
                  route.Trips.forEach(function(trip){
                    var subtitleText = trip.TripDestination + '.';
                    //var iconText = '';
                    if (trip.GPSSpeed !== '') {
                      //iconText = 'system://images/LOCK_ICON_SMALL';
                      subtitleText = ' GPS Lock. ' + subtitleText;
                    }
                    tripsMenu.push({
                      title: trip.AdjustedScheduleTime + " min - " + trip.TripStartTime,
                      subtitle: subtitleText,
                      //icon: iconText
                    });
                  });
                }
                else {
                  tripsMenu.push({
                    title: 'No trips found'
                  });                  
                }
              }
            });
          }
          else {
            tripsMenu.push({
              title: 'No routes found'
            });                  
          }
          
          var busesInfoMenu = new UI.Menu({
            highlightBackgroundColor: OCRed,
            highlightTextColor: 'white',
            sections: [{
              title: e.item.title,
              titleColor: '#9a0036',
              items: tripsMenu
            }]
          });
          busesInfoMenu.show();
          busesLoadingMenu.hide();
        },
        function (error, status, request) {
          var busesErrorMenu = new UI.Menu({
            highlightBackgroundColor: OCRed,
            highlightTextColor: 'white',
            sections: [{
              title: e.item.title,
              titleColor: '#9a0036',
              items: [
                {
                  title:'Error',
                  subtitle: error
                },
                {
                  title: 'Status',
                  subtitle: status
                }
              ]
            }]
          });
          busesErrorMenu.show();
          busesLoadingMenu.hide();
        }
      );
    });
  }
});

main.on('click', 'down', function(e){
  var settingsCard = new UI.Card({
    title: 'Settings',
    titleColor: OCRed,
    icon: '',
    body: 'Coming soon.'
  });
  settingsCard.show();
});



