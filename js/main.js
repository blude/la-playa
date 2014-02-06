var App = (function() {
	var map, lc;
	return {
		locateSelf: function() {
			var options = {
				follow: true,
				onLocationError: function(err) {
					alert('Não consegui encontrar sua localização');
				},
				onLocationOutsideMapBounds: function(context) {
					alert(context.options.strings.outsideMapBoundsMsg);
				},
				strings: {
					outsideMapBoundsMsg: "Você não está perto de uma praia monitorada"
				}
			};
			lc = L.control.locate(options).addTo(map);
			lc.locate();
		},
		initMap: function() {
			map = L.mapbox.map('map', 'examples.map-9ijuk24y');
			map.setView([-20.2576356,-40.2835713], 13);
			this.locateSelf();
		}
	};
}());

(function() {
	App.initMap();
})();