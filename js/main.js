let map, directionsDisplay, directionsService, googleMap, marker, autocomplete1, autocomplete2;

let murl = new URL(window.location.href);
var lat = 7.070975,
    lng = 125.6103582,
    myLatLng = { lat: lat, lng: lng };

var city = "Davao",
    black_list = ["Samal, Davao del Norte"];

const citymap = {
    davao: {
        center: myLatLng,
        population: 1866401,
    }
}

var output_df, input1, input2;

var csr_link = (checkIsMobile()) ? "https://m.me/salamfooddelivery.csr" : "https://facebook.com/messages/t/salamfooddelivery.csr";
var messenger = "<a target='_blank' href='" + csr_link + "' style='text-decoration: none;'><i class='fab fa-facebook-messenger'></i>messenger</a>";

initMap();
toggleSearch();

function checkIsMobile () {
    if (typeof window.orientation !== 'undefined') return true;
    return false;
}

function initMap () {
    "use strict";

    var mapOptions = {
        center: myLatLng,
        zoom: 12,
        scaleControl: true,
        rotateControl: true,
        zoomControlStyle: google.maps.ZoomControlStyle.SMALL,
        gestureHandling: "greedy", //cooperative
        streetViewControl: true,
        streetViewControlOptions: {
            position: google.maps.ControlPosition.LEFT_CENTER
        },
        zoomControl: true,
        zoomControlOptions: {
            position: google.maps.ControlPosition.LEFT_CENTER
        },
        navigationControl: true,
        navigationControlOptions: {
            style: google.maps.NavigationControlStyle.SMALL
        },
        // mapId: "288ebbf7e4c6cacd",
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        mapTypeControl: true,
        mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            position: google.maps.ControlPosition.BOTTOM_CENTER
        },
        fullscreenControl: true,
        fullscreenControlOptions: {
            position: google.maps.ControlPosition.BOTTOM_LEFT
        }
    };

    googleMap = document.getElementById('google-map');
    output_df = document.getElementById("output");
    input1 = document.getElementById("location-1");
    input2 = document.getElementById("location-2");

    marker = new google.maps.Marker({
        map,
        anchorPoint: new google.maps.Point(0, -29),
    });

    // Hide result box
    output_df.style.display = "none";

    // Create/Init map
    map = new google.maps.Map(googleMap, mapOptions);
    for (const city in citymap) {
        // Add the circle for this city to the map.
        const cityCircle = new google.maps.Circle({
            strokeColor: "#683496",
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: "transparent",
            fillOpacity: 0.35,
            map,
            center: citymap[city].center,
            radius: Math.sqrt(citymap[city].population) * 100,
        });
    }

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
    autocomplete1 = new google.maps.places.Autocomplete(input1, map_options);
    autocomplete1.setBounds(map_circle.getBounds());
    autoCompleteChanged(autocomplete1, "ORIG");

    autocomplete2 = new google.maps.places.Autocomplete(input2, map_options);
    autocomplete2.setBounds(map_circle.getBounds());
    autoCompleteChanged(autocomplete2, "DEST");

    // Add a search-form control to the map.
    const searchForm = document.getElementById("direction-container");
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(searchForm);

    // Add a style-selector control to the map.
    const styleControl = document.getElementById("style-selector-control");
    map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(styleControl);
    // Set the map's style to the initial value of the selector.
    const styleSelector = document.getElementById("style-selector");
    map.setOptions({ styles: mapStyles[styleSelector.value] });
    // Apply new JSON when the user selects a different style.
    styleSelector.addEventListener("change", () => {
        map.setOptions({ styles: mapStyles[styleSelector.value] });
    });

    // Preload URL Query
    cparseUrl(murl);
}

// Define calcRoute function
function calcRoute () {
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
                    computeTotalDistance(directionsDisplay.getDirections(), "drag");
                });
            } else {
                google.maps.event.clearListeners(directionsDisplay, 'directions_changed');
                window.alert("Make sure your search is spelled correctly. Try adding a street, city, state, or zip code.");
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

function computeTotalDistance (result, ref = "default") {
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
    if (!(from.includes(city) || to.includes(city)) || (checkBlocklist(black_list, from) || checkBlocklist(black_list, to))) {
        html_result += "<span class='highlight-bold'>As of the moment we are only accepting deliveries at " + city + " City.</span><br />" + contact_us + "<br />";
    } else if (Math.round(d_km) > 60) {
        html_result += "<span class='highlight-bold'>Unfortunately we do not deliver to location greater than 50km.</span><br/>" + contact_us + "<br />";
    }
    else {
        html_result += "Distance Between: <span class='highlight-bold'>" + d_km.toFixed(1) + " kilometers</span><br />";
        html_result += "Estimated Duration: <span class='highlight-bold'>" + delivery_time + "-" + (delivery_time + 5) + " mins delivery</span><br />";
        html_result += "Delivery Fee: <span class='highlight-bold'>" + delivery_fee + " pesos only</span><br />";
        html_result += "<span class='info-small'>Chat with us on " + messenger + ".</span>";
    }
    html_result += "</div>";
    $("#output").html(html_result);
    output_df.style.display = "block";

    if (ref.toLowerCase() == "drag") {
        input1.value = from;
        input2.value = to;
    }

    history.pushState({}, "Direction", ".?from=" + myroute.bounds.oc.g + "," + myroute.bounds.Eb.g + "&to=" + myroute.bounds.oc.i + "," + myroute.bounds.Eb.i);
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
        } else if (km > 9.5 && km <= 14.5) {
            fee = 125;
        } else if (km > 14.5 && km <= 24.5) {
            fee = 155;
        } else if (km > 24.5 && km <= 29.5) {
            fee = 225;
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
    submitSearch((from || to) ? true : false);
}

function submitSearch (goinput = true) {
    var from = input1.value,
        to = input2.value;
    if (from.toLowerCase() == "my location") {
        getLocation();
        return;
    }
    if (from && to) {
        calcRoute();
        googleMap.focus();
    } else {
        if (goinput) {
            if (!from && to) {
                input1.focus();
            } else if (from && !to) {
                input2.focus();
            } else {
                input1.focus();
            }
        }
    }
}


function autoCompleteChanged (autocomplete, mode) {
    autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (mode === "ORIG") {
            this.autocomplete1 = place.place_id;
        } else {
            this.autocomplete2 = place.place_id;
        }
        submitSearch();
    });
}

function getLocation () {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(fetchAddress);
        submitSearch();
    } else {
        alert("Error: The Geolocation service failed.");
    }
}

var searchStatus = true;
function toggleSearch () {
    if (searchStatus) {
        $("#direction-container").addClass("transparentStyle");
        $("#iconToggleSearch").addClass("fa-plus");
        $("#direction-form").addClass("fadeOut");
        $("#direction-title").addClass('fadeOut');
    } else {
        $("#direction-container").removeClass("transparentStyle");
        $("#iconToggleSearch").removeClass("fa-plus");
        $("#direction-title").removeClass('fadeOut');
        $("#direction-form").removeClass("fadeOut");
    }
    searchStatus = !searchStatus;
}

var routeStatus = false;
function toggleRoute () {
    if (!routeStatus) {
        $("#route-panel").addClass("route-show");
        $("#route-panel").removeClass("route-hidden");
    } else {
        $("#route-panel").addClass("route-hidden");
        $("#route-panel").removeClass("route-show");
    }
    routeStatus = !routeStatus;
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