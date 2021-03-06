var App = (function() {
    var map, self, threshold;

    threshold = 500; /* distance in meters */
    self = {};

    function setSelfLocation(e) {
        var marker;

        marker = L.marker([e.latlng.lat, e.latlng.lng]).addTo(map);
        self.currentLatLng = marker.getLatLng();
    }

    function getDataUrl(file) {
        return 'https://api.github.com/repos/vitoria-es/qualidade-das-praias/contents/data/<FILE>'.replace('<FILE>', file);
    }

    function loadPlayas() {
        var URL;

        URL = getDataUrl('balneabilidade.geojson');

        $.ajax({
            headers: {
                'Accept': 'application/vnd.github.v3.raw'
            },
            dataType: 'json',
            url: URL,
            success: function(geodata) {
                var playas;

                playas = L.mapbox.featureLayer(geodata);
                map.fitBounds(playas.getBounds());

                L.geoJson(geodata, {
                    onEachFeature: function(feature, layer) {
                        var options;
                        options = {
                            stroke: false,
                            color: feature.properties['marker-color'],
                            fillColor: feature.properties['marker-color']
                        }
                        L.circle(L.GeoJSON.coordsToLatLng(feature.geometry.coordinates), threshold, options).addTo(map);
                    }
                });

                self.playas = playas.toGeoJSON();
                self.closestPlaya = getClosestPlaya();

                if (isTooFar()) {
                    console.log('Tem certeza que tu tá na praia, brother?');
                } else if (isUpToDate()) {
                    switch (self.closestPlaya.properties.classificacao) {
                        case 'próprio':
                            console.info('Próprio');
                            break;
                        case 'impróprio':
                            console.warn('Impróprio');
                            break;
                        case 'interditado':
                            console.warn('Interditado');
                            break;
                    }
                } else {
                    console.log('Dados de balneabilidade desatualizados');
                }
            }
        });
    }

    function loadHistory() {
        var URL = getDataUrl('historico.json');

        $.ajax({
            headers: {
                'Accept': 'application/vnd.github.v3.raw'
            },
            dataType: 'json',
            url: URL,
            success: function(response) {
                self.historyData = response.data;
            }
        });
    }

    function isUpToDate() {
        var today, validUntil;

        today = moment();
        validUntil = moment(self.historyData[0].valid_until);

        return today.isBefore(validUntil) || today.isSame(validUntil, 'day');
    }

    function isTooFar() {
        return self.closestPlaya.distance > threshold;
    }

    function getClosestPlaya() {
        var closest, distances, playaProps;

        closest = -1;
        distances = [];

        for (var i = 0, length = self.playas.features.length; i < length; i++) {
            var playaCoords, playaLatLng, distanceToPlaya;

            playaCoords = self.playas.features[i].geometry.coordinates;
            playaLatLng = L.GeoJSON.coordsToLatLng(playaCoords);
            distanceToPlaya = self.currentLatLng.distanceTo(playaLatLng);

            distances[i] = distanceToPlaya;

            if (closest === -1 || distanceToPlaya < distances[closest]) {
                closest = i;
            }
        }

        playaProps = self.playas.features[closest].properties;

        return {
            properties: playaProps,
            distance: distances[closest]
        };
    }

    function bindEvents() {
        map.on('locationfound', function(e) {
            setSelfLocation(e);
            loadHistory();
//          getLastAnalysis();
            loadPlayas();
        });
        map.on('locationerror', function() {
            alert('Não foi possível encontrar sua localização.');
        });
    }

    return {
        initMap: function() {
            map = L.mapbox.map('map', 'examples.map-9ijuk24y');
            map.locate({ setView: false });
            bindEvents();
        },
        self: self
    };
}());

(function() {
    App.initMap();
})();