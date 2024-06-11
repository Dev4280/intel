document.addEventListener('DOMContentLoaded', function () {
    let platform = new H.service.Platform({
        apikey: 'quEwuMK4MrRFVgFlCfdhuUt4uqQ4vKGlbrG5Fs6t5OM' // Replace with your HERE Maps API key
    });

    let defaultLayers = platform.createDefaultLayers();
    let map = new H.Map(document.getElementById('map'),
        defaultLayers.vector.normal.map, {
        center: { lat: 52.5, lng: 13.4 },
        zoom: 10,
        pixelRatio: window.devicePixelRatio || 1
    });
    window.addEventListener('resize', () => map.getViewPort().resize());

    let behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));
    let ui = H.ui.UI.createDefault(map, defaultLayers);

    let searchService = platform.getSearchService();
    let router = platform.getRoutingService(null, 8);

    document.getElementById('start_button').addEventListener('click', () => {
        let startLocation = document.getElementById('start').value;
        let destinationLocation = document.getElementById('destination').value;
        let vehicleType = document.getElementById('vehicle_type').value;

        if (!startLocation || !destinationLocation) {
            alert('Please enter both start and destination locations.');
            return;
        }

        searchService.geocode({ q: startLocation }, (startResult) => {
            if (startResult.items.length === 0) {
                alert('Start location not found');
                return;
            }
            let startCoords = startResult.items[0].position;
            searchService.geocode({ q: destinationLocation }, (destResult) => {
                if (destResult.items.length === 0) {
                    alert('Destination location not found');
                    return;
                }
                let destCoords = destResult.items[0].position;
                calculateRoute(startCoords, destCoords, vehicleType);
            }, showError);
        }, showError);
    });

    function calculateRoute(startCoords, destCoords, vehicleType) {
        router.calculateRoute(
            {
                routingMode: 'fast',
                transportMode: 'car',
                origin: `${startCoords.lat},${startCoords.lng}`,
                destination: `${destCoords.lat},${destCoords.lng}`,
                alternatives: 3,  // Request up to 3 alternative routes
                return: 'polyline,summary'
            },
            (result) => {
                if (result.routes.length === 0) {
                    alert('No route found');
                    return;
                }

                // Clear any previous routes and markers
                map.removeObjects(map.getObjects());

                // Add markers for start and destination
                addMarker(startCoords, 'Start');
                addMarker(destCoords, 'Destination');

                result.routes.forEach((route, index) => {
                    let section = route.sections[0];

                    // Ensure section has a polyline
                    if (!section.polyline) {
                        alert('Route section has no polyline');
                        return;
                    }

                    let distance = section.summary.length / 1000; // Convert to km

                    fetch('/calculate_toll', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            start: startCoords,
                            destination: destCoords,
                            distance: distance,
                            vehicle_type: vehicleType
                        })
                    })
                    .then(response => response.json())
                    .then(data => {
                        document.getElementById('toll').innerText = `Toll: ₹${data.toll.toFixed(2)}`;
                    })
                    .catch(showError);

                    try {
                        let linestring = H.geo.LineString.fromFlexiblePolyline(section.polyline);
                        let routeLine = new H.map.Polyline(linestring, {
                            style: { strokeColor: index === 0 ? 'blue' : 'grey', lineWidth: 3 }
                        });
                        map.addObject(routeLine);
                        if (index === 0) {
                            map.getViewModel().setLookAtData({ bounds: routeLine.getBoundingBox() });
                        }
                    } catch (error) {
                        console.error('Error processing polyline:', error);
                        alert('Failed to process route polyline');
                    }
                });
            },
            showError
        );
    }
    
    function addMarker(coords, label) {
        let marker = new H.map.Marker(coords);
        marker.setData(label);
        map.addObject(marker);
        marker.addEventListener('tap', function (evt) {
            let bubble = new H.ui.InfoBubble(evt.target.getGeometry(), {
                content: evt.target.getData()
            });
            ui.addBubble(bubble);
        }, false);
    }

    function showError(error) {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
    }
});
