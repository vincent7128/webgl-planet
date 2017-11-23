var planet;
window.addEventListener('load', function() {
    planet = new WebGLPlanet({
        dom: document.querySelector('.webgl-planet'),
        R: 6371
    });
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json', true);
    xhr.onreadystatechange = function(e) {
        if (this.readyState == 4 && this.status == 200) {
            planet.drawGeoJSON(JSON.parse(this.responseText));
        }
    };
    xhr.send();
});