var App = (function() {
    var map, self = this;

    function setSelfLocation(e) {
        var marker = L.marker([e.latlng.lat, e.latlng.lng]).addTo(map);
        self.currentLatLng = marker.getLatLng();
    }

    function getDataUrl(file) {
        return 'https://api.github.com/repos/vitoria-es/qualidade-das-praias/contents/data/<FILE>'.replace('<FILE>', file);
    }

    function loadPlayas() {
        var URL = getDataUrl('balneabilidade.geojson');

        $.ajax({
            headers: {
                'Accept': 'application/vnd.github.v3.raw'
            },
            dataType: 'json',
            url: URL,
            success: function(geodata) {
                var playas = L.mapbox.featureLayer(geodata).addTo(map);
                self.playas = playas.toGeoJSON();
                self.closestPlaya = getClosestPlaya();
                if (isPlayaTooFar(self.closestPlaya.distance)) {
                    alert('Tem certeza que tu tá na praia, brother?');
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

    function isUpToDate(analysis) {
        var now = new Date();
        return analysis['valid_until'] < now;
    }

    function isPlayaTooFar(distance) {
        var THRESHOLD = 100; // max distance in meters to a playa for it to be considered
        return distance > THRESHOLD;
    }

    function getLastAnalysis() {
        return self.historyData[0];
    }

    function getClosestPlaya() {
        var closest = -1,
            distances = [];

        for (var i = 0, length = self.playas.features.length; i < length; i++) {
            var playaCoords = self.playas.features[i].geometry.coordinates,
                playaLatLng = L.marker([playaCoords[1], playaCoords[0]]).getLatLng(),
                distanceToPlaya = self.currentLatLng.distanceTo(playaLatLng);
            distances[i] = distanceToPlaya;
            if (closest === -1 || distanceToPlaya < distances[closest]) {
                closest = i;
            }
        }

        return {
            name: self.playas.features[closest].properties['nome'],
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
            map.locate({ setView: true });
            bindEvents();
        }
    };
}());

(function() {
    App.initMap();
})();