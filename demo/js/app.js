(function  () {
	$(document).foundation();

	// First lets create our drawing surface out of existing SVG element
	// If you want to create new surface just provide dimensions
	// like s = Snap(800, 600);
	var s = Snap("#svg");
	var galleon = s.select("#ship").animate({x: 600}, 2000);
})();