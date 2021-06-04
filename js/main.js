let map, directionsDisplay, directionsService;
let murl = new URL(window.location.href);

var lat = 7.0754028,
    lng = 125.581717,
    myLatLng = { lat: lat, lng: lng };

var city = "Davao",
    black_list = ["Samal, Davao del Norte"];

var output_df, input1, input2;

var csr_link = (checkIsMobile()) ? "https://m.me/salamfooddelivery.csr" : "https://facebook.com/messages/t/salamfooddelivery.csr";
var messenger = "<a target='_blank' href='" + csr_link + "' style='text-decoration: none;'><i class='fab fa-facebook-messenger'></i>messenger</a>";
initMap();

function checkIsMobile () {
    if (typeof window.orientation !== 'undefined') return true;
    return false;
}

function initMap () {
    "use strict";

    var mapOptions = {
        center: myLatLng,
        zoom: 12,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        scaleControl: true,
        rotateControl: true,
        zoomControl: true,
        gestureHandling: (checkIsMobile()) ? "cooperative" : "greedy",
        mapId: "288ebbf7e4c6cacd",
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        zoomControlStyle: google.maps.ZoomControlStyle.SMALL,
        style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
        mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            position: google.maps.ControlPosition.TOP_CENTER
        }
    };

    output_df = document.getElementById("output");
    input1 = document.getElementById("location-1");
    input2 = document.getElementById("location-2");

    // Hide result box
    output_df.style.display = "none";

    // Create/Init map
    map = new google.maps.Map(document.getElementById('google-map'), mapOptions);

    // Create a DirectionsService object to use the route method and get a result for our request
    directionsService = new google.maps.DirectionsService();

    // Create a DirectionsRenderer object which we will use to display the route
    directionsDisplay = new google.maps.DirectionsRenderer({
        draggable: true,
        map,
        panel: document.getElementById("route-panel"),
    });;

    var map_center = new google.maps.LatLng(lat, lng);
    var map_circle = new google.maps.Circle({
        center: map_center,
        radius: 100
    });

    var map_options = {
        types: ['establishment'],
        componentRestrictions: { country: 'ph' },
        location: map_center,
        center: map_center,
        radius: 100,
        strictbounds: true
    }

    // Create autocomplete objects for all inputs
    var autocomplete1 = new google.maps.places.Autocomplete(input1, map_options);
    autocomplete1.setBounds(map_circle.getBounds());

    var autocomplete2 = new google.maps.places.Autocomplete(input2, map_options);
    autocomplete2.setBounds(map_circle.getBounds());

    // Preload URL Query
    cparseUrl(murl);
}

// Define calcRoute function
function calcRoute () {
    //create request
    // waypoints: [
    //     { location: "location3" },
    //     { location: "location4" },
    // ]
    var request = {
        origin: input1.value,
        destination: input2.value,
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
        provideRouteAlternatives: true,
        avoidFerries: true,
        avoidHighways: false,
        avoidTolls: true
    }
    if (request.origin.length > 0 && request.destination.length > 0) {
        // Routing
        directionsService.route(request, function (result, status) {
            if (status == google.maps.DirectionsStatus.OK) {
                computeTotalDistance(result);
                directionsDisplay.setDirections(result);
                directionsDisplay.addListener("directions_changed", () => {
                    computeTotalDistance(directionsDisplay.getDirections());
                });
            } else {
                google.maps.event.clearListeners(directionsDisplay, 'directions_changed');
                alert("Make sure your search is spelled correctly. Try adding a street, city, state, or zip code.");
            }
            var from, to;
            if (result.routes.length > 0) {
                from = result.routes[0].legs[0].start_address;
                to = result.routes[0].legs[0].end_address;
            }
            input1.style.color = (from == "" || from == null || from.length < 1) ? "red" : "#683496";
            input2.style.color = (to == "" || to == null || to.length < 1) ? "red" : "#683496";;
        });
    } else {
        alert("Please enter address!");
    }

}

function computeTotalDistance (result) {
    const myroute = result.routes[0];
    if (!myroute || myroute == null) return;

    console.log(result);

    // Detected Address
    var from = myroute.legs[0].start_address;
    var to = myroute.legs[0].end_address;

    //Get distance, time and delivery fee
    var d_km = myroute.legs[0].distance.value / 1000;
    var delivery_fee = CALCULATEDF(d_km.toFixed(1)).toFixed(2);

    var d_min = 10; //Estimated additional delivery time in minutes
    var delivery_time = Math.round((myroute.legs[0].duration.value / 60).toFixed(1));

    var html_result = "<div class='result-table' style='margin: 10px auto;'>";
    var contact_us = "<span class='info-small'>Please contact us on " + messenger + ".</span>";
    if (Math.round(d_km) > 60) {
        html_result += "<span class='highlight-bold'>Unfortunately we do not deliver to location greater than 50km.</span><br/>" + contact_us + "<br />";
    } else if (!(from.includes(city) || to.includes(city)) || (checkBlocklist(black_list, from) || checkBlocklist(black_list, to))) {
        html_result += "<span class='highlight-bold'>As of the moment we are only accepting deliveries at " + city + " City.</span><br />" + contact_us + "<br />";
    }
    else {
        html_result += "Distance Between: <span class='highlight-bold'>" + d_km.toFixed(1) + " kilometers</span><br />";
        html_result += "Estimated Duration: <span class='highlight-bold'>" + delivery_time + "-" + (delivery_time + 5) + " mins delivery</span><br />";
        html_result += "Delivery Fee: <span class='highlight-bold'>" + delivery_fee + " pesos only</span><br />";
        html_result += "<span class='info-small'>Chat with our CSR on " + messenger + ".</span>";
    }
    html_result += "</div>";
    $("#output").html(html_result);
    output_df.style.display = "block";

    history.pushState({}, "Direction", ".?from=" + from + "&to=" + to);
    murl = new URL(window.location.href);
}

function checkBlocklist (blocklist, text) {
    var result = false;
    blocklist.forEach(word => {
        if (text.includes(word)) {
            result = true;
        }
    });
    return result;
}


// Clear results
function clearRoute () {
    history.pushState({}, "Direction", "./");
    input1.value = "";
    input2.value = "";
    input1.style.color = "#683496";
    input2.style.color = "#683496";;
    resetRoute();
}

// Reset Map
function resetRoute () {
    output_df.style.display = "none";
    directionsDisplay.setDirections({ routes: [] });
    map.setCenter(myLatLng);
}

// Check Delivery Fee
function CALCULATEDF (km, type = "errands") {
    type = type.toLocaleLowerCase();
    var fee = (km > 0) ? 50 : 0;
    km = Math.round(km);
    if (type == "errands") {
        while (km > 15) {
            fee += 20;
            km--;
        }
        while (km > 5) {
            fee += 10;
            km--;
        }
    } else if (type == "system") {
        if (km > 0 && km <= 1.5) {
            fee = 35;
        } else if (km > 1.5 && km <= 3.5) {
            fee = 45;
        } else if (km > 3.5 && km <= 5.5) {
            fee = 65;
        } else if (km > 5.5 && km <= 7.5) {
            fee = 75;
        } else if (km > 7.5 && km <= 8.5) {
            fee = 85;
        } else if (km > 8.5 && km <= 9.5) {
            fee = 95;
        } else {
            fee = 95;
        }
    } else {
        fee = 0;
    }
    return fee;
}

function fetchAddress (p) {
    var Position = new google.maps.LatLng(p.coords.latitude, p.coords.longitude),
        Locater = new google.maps.Geocoder();

    Locater.geocode({ 'latLng': Position }, function (results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
            var _r = results[0];
            input1.value = _r.formatted_address;
        }
    });
}

function cparseUrl () {
    var from = murl.searchParams.get('from'),
        to = murl.searchParams.get('to');
    input1.value = from;
    input2.value = to;
    submitSearch();
}

function submitSearch () {
    var from = input1.value,
        to = input2.value;
    if (from.toLowerCase() == "my location") {
        getLocation();
        return;
    }
    if (from && to) {
        calcRoute();
    } else if (!from && to) {
        input1.focus()
    } else if (from && !to) {
        input2.focus();
    } else {
        input1.focus();
    }
}

function getLocation () {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(fetchAddress);
        submitSearch();
    } else {
        alert("Error: The Geolocation service failed.");
    }
}

$(document).keydown((event) => {
    if (event.key === "Enter") {
        submitSearch();
    } else if (event.key === "Backspace") {
        var x = document.activeElement.tagName;
        if (x !== "INPUT") {
            clearRoute();
        }
    } else {
        return;
    }
});
