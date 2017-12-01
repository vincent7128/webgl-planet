var planet;
window.addEventListener('load', function() {
    planet = new WebGLPlanet({
        dom: document.querySelector('.webgl-planet'),
        R: 6371
    });
    var line = [];
    var red = Color('red').vec4();
    var blue = Color('blue').vec4();
    var black = Color('black').vec4();
    var green = Color('green').vec4();
    var lineHeight = 200;
    for (var lat = 80; lat >= -80; lat -= 10) {
        planet.drawLine([[360, lat, 50],[0, lat, 50]], red);
    }

    for (var lng = 360; lng >= 0; lng -= 10) {
        planet.drawLine([[lng, 80, 50], [lng, -80, 50]], blue);
    }

    planet.drawLine([[-45, 45, lineHeight], [45, 45, lineHeight]], black);
    planet.drawLine([[45, 45, lineHeight], [45, -45, lineHeight]], black);

    planet.drawLine([[45, -45, lineHeight], [-45, -45, lineHeight]], black);
    planet.drawLine([[-45, -45, lineHeight], [-45, 45, lineHeight]], black);

    planet.drawLine([[0, 0, lineHeight], [45, 45, lineHeight]], green);
    planet.drawLine([[0, 0, lineHeight], [-45, 45, lineHeight]], green);

    planet.drawLine([[0, 0, lineHeight], [-45, -45, lineHeight]], green);
    planet.drawLine([[0, 0, lineHeight], [45, -45, lineHeight]], green);

    planet.drawLine([[0, 0, lineHeight], [45, 45/2, lineHeight]], green);
    planet.drawLine([[0, 0, lineHeight], [-45, 45/2, lineHeight]], green);

    planet.drawLine([[0, 0, lineHeight], [45, -45/2, lineHeight]], green);
    planet.drawLine([[0, 0, lineHeight], [-45, -45/2, lineHeight]], green);

    planet.drawLine([[0, 0, lineHeight], [45/2, 45, lineHeight]], green);
    planet.drawLine([[0, 0, lineHeight], [-45/2, 45, lineHeight]], green);

    planet.drawLine([[0, 0, lineHeight], [45/2, -45, lineHeight]], green);
    planet.drawLine([[0, 0, lineHeight], [-45/2, -45, lineHeight]], green);

    planet.drawText('90', [90, 0, 100], 6);
    planet.drawText('180', [180, 0, 100], 6);
    planet.drawText('-90', [-90, 0, 100], 6);
    planet.drawText('N', [0, 90, 100], 6);
    planet.drawText('S', [0, -90, 100], 6);
    for (var lat = 80; lat >= -80; lat -= 10) {
        planet.drawText(lat, [ 0, lat, 100], 6);
    }
});