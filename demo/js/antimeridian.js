var planet;
window.addEventListener('load', function() {
    planet = new WebGLPlanet({
        dom: document.querySelector('.webgl-planet'),
        R: 6371
    });
    var line = [];
    var red = Color('red').vec4();
    var blue = Color('blue').vec4();
    for (var lat = 90; lat >= -90; lat -= 6) {
        for (var lng = 360; lng >= 0; lng -= 6) {
            line.push([lng, lat, 50]);
        }
        planet.drawLine(line, red);
        line = [];
    }
    for (var lng = 360; lng >= 0; lng -= 6) {
        for (var lat = 90; lat >= -90; lat -= 6) {
            line.push([lng, lat, 50]);
        }
        planet.drawLine(line, blue);
        line = [];
    }
    for (var lat = 80; lat >= -80; lat -= 10) {
        planet.drawText(lat, [ 0, lat, 100], 6);
    }
    planet.drawText('90', [90, 0, 100], 6);
    planet.drawText('180', [180, 0, 100], 6);
    planet.drawText('-90', [-90, 0, 100], 6);
    planet.drawText('N', [0, 90, 100], 6);
    planet.drawText('S', [0, -90, 100], 6);
});