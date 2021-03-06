(function() {
    var vertexShaderScript =
        'attribute vec4 vertexPosition;\
         uniform mat4 projectionMatrix;\
         uniform mat4 modelViewMatrix;\
         void main(void) {\
             gl_Position = projectionMatrix * modelViewMatrix * vertexPosition;\
         }',
        vertexFragmentScript =
        'precision mediump float;\
         uniform vec4 vertexColor;\
         void main(void) {\
             gl_FragColor = vertexColor;\
         }',
        textureShaderScript =
        'attribute vec4 vertexPosition;\
         attribute vec2 textureCoord;\
         uniform mat4 projectionMatrix;\
         uniform mat4 modelViewMatrix;\
         varying vec2 coord;\
         void main(void) {\
             gl_Position = projectionMatrix * modelViewMatrix * vertexPosition;\
             coord = textureCoord;\
         }',
        textureFragmentScript =
        'precision mediump float;\
         uniform sampler2D sampler;\
         varying vec2 coord;\
         void main(void) {\
             vec4 color = texture2D(sampler, vec2(coord.s, coord.t));\
             gl_FragColor = vec4(color.rgb, color.a);\
         }',
        textImage = TextImage({
            align: 'center',
            color: '#000000',
            size: 24,
            stroke: 4,
            strokeColor: '#FFFFFF',
        }),
        _option = {
            R: 1,
            minZoom: -4,
            maxZoom: -1 + (-1 / 100)
        },
        fn;

    window.WebGLPlanet = function(opt) {
        for (var key in _option) {
            if (!opt[key]) {
                opt[key] = _option[key];
            }
        }
        this.opt = opt;
        var canvas = document.createElement('canvas');
        opt.dom.appendChild(canvas);
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.cursor = 'grab';
        var gl = this.gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        if (!gl) {
            throw "Unable to initialize WebGL. Your browser may not support it.";
        }
        initGL(gl);
        window.addEventListener(
            'resize',
            this.resizeEvent = this.updateSize.bind(this),
            false
        );
            var mouseRotateEvent = handleMouseMove.bind(this),
                mouseZoomEvent = handleMouseWheel.bind(this);
            canvas.addEventListener('mousedown', function(event) {
                canvas.style.cursor = 'grabbing';
                this.lastX = event.clientX;
                this.lastY = event.clientY;
                canvas.addEventListener('mousemove', mouseRotateEvent);
            }.bind(this), false);
            canvas.addEventListener('mouseup', function(event) {
                canvas.style.cursor = 'grab';
                canvas.removeEventListener('mousemove', mouseRotateEvent);
            }, false);
            canvas.addEventListener('mouseover', function(event) {
                canvas.addEventListener('wheel', mouseZoomEvent);
            }, false);
            canvas.addEventListener('mouseout', function(event) {
                canvas.removeEventListener('wheel', mouseZoomEvent);
            }, false);
        if (window.TouchEvent) {
            var touchRotateEvent = handleTouchMove.bind(this),
                touchZoomEvent = handleTouchZoom.bind(this);
            canvas.addEventListener('touchstart', function(event) {
                event.preventDefault();
                if (event.touches.length < 2) {
                    canvas.removeEventListener('touchmove', touchRotateEvent);
                    return;
                }
                this.lastScale = event.scale;
                this.lastX = event.touches[0].screenX;
                this.lastY = event.touches[0].screenY;
                canvas.addEventListener('touchmove', touchRotateEvent);
                canvas.addEventListener('touchmove', touchZoomEvent);
            }.bind(this), false);
            canvas.addEventListener('touchend', function(event) {
                event.preventDefault();
                canvas.removeEventListener('touchmove', touchRotateEvent);
                canvas.removeEventListener('touchmove', touchZoomEvent);
            }, false);
        }
        this.center(0, 0);
        this.zoom(opt.minZoom);
        this.updateSize();
        this.buffers = [];
        sphere.call(this);
        return this;
    };

    fn = window.WebGLPlanet.prototype;

    fn.center = function(lng, lat) {
        if (arguments.length == 2) {
            this.x = degToRad(lat);
            this.y = degToRad(-lng - 90);
            if (this.buffers) render.call(this);
        }
        return [-radToDeg(this.y) - 90, radToDeg(this.x)];
    };

    fn.zoom = function(zoom) {
        if (zoom !== undefined) {
            zoom = Math.min(Math.max(zoom, this.opt.minZoom), this.opt.maxZoom);
            if (zoom !== this.z) {
                this.z = zoom;
                if (this.buffers) render.call(this);
            }
        }
        return this.z;
    };

    fn.drawGeoJSON = function(geojson) {
        if ('FeatureCollection' === geojson.type) {
            geojson['features'].forEach(function(feature) {
                this.drawGeoJSON(feature);
            }.bind(this));
        } else if ('Feature' === geojson.type) {
            switch (geojson.geometry.type) {
                case 'Point':
                    setTimeout(function() {
                        this.drawPoint(
                            geojson.geometry.coordinates[0],
                            Color('black').vec4()
                        );
                    }.bind(this), 0);
                    break;
                case 'MultiPoint':
                    geojson.geometry.coordinates.forEach(function(coordinates) {
                        setTimeout(function() {
                            this.drawPoint(
                                coordinates[0],
                                Color('black').vec4()
                            );
                        }.bind(this), 0);
                    }.bind(this));
                    break;
                case 'LineString':
                    setTimeout(function() {
                        this.drawLine(
                            geojson.geometry.coordinates[0],
                            Color('red').vec4()
                        );
                    }.bind(this), 0);
                    break;
                case 'MultiLineString':
                    geojson.geometry.coordinates.forEach(function(coordinates) {
                        setTimeout(function() {
                            this.drawLine(
                                coordinates[0],
                                Color('red').vec4()
                            );
                        }.bind(this), 0);
                    }.bind(this));
                    break;
                case 'Polygon':
                    setTimeout(function() {
                        this.drawPolygon(
                            geojson.geometry.coordinates[0],
                            Color('green').vec4()
                        );
                    }.bind(this), 0);
                    break;
                case 'MultiPolygon':
                    geojson.geometry.coordinates.forEach(function(coordinates) {
                        setTimeout(function() {
                            this.drawPolygon(
                                coordinates[0],
                                Color('green').vec4()
                            );
                        }.bind(this), 0);
                    }.bind(this));
                    break;
            }
        }
    };

    fn.drawText = function(text, coordinate, zoom) {
        var gl = this.gl,
            img = textImage.toImage(text, function() {
                var w = img.width * zoom,
                    h = img.height * zoom,
                    a = distancePoint(this, coordinate, w, -90),
                    b = distancePoint(this, coordinate, w, 90),
                    c = distancePoint(this, coordinate, w, 90),
                    d = distancePoint(this, coordinate, w, -90);
                if (coordinate[1] === 90) {
                    a = distancePoint(this, a, h, -90);
                    b = distancePoint(this, b, h, 90);
                    c = distancePoint(this, c, h, -90);
                    d = distancePoint(this, d, h, 90);
                } else if (coordinate[1] === -90) {
                    a = distancePoint(this, a, h, 90);
                    b = distancePoint(this, b, h, -90);
                    c = distancePoint(this, c, h, 90);
                    d = distancePoint(this, d, h, -90);
                } else {
                    a = distancePoint(this, a, h, 0);
                    b = distancePoint(this, b, h, 0);
                    c = distancePoint(this, c, h, 180);
                    d = distancePoint(this, d, h, 180);
                }
                this.drawImage(img, [a, b, c, d]);
            }.bind(this));
    };

    fn.drawImage = function(image, coordinates) {
        var gl = this.gl,
            texture = gl.createTexture(),
            positionBuffer = gl.createBuffer(),
            coordBuffer = gl.createBuffer(),
            indexBuffer = gl.createBuffer(),
            positions = [],
            indices,
            coords;
        positions.push.apply(positions, toXYZ(this, coordinates[0]));
        positions.push.apply(positions, toXYZ(this, coordinates[1]));
        positions.push.apply(positions, toXYZ(this, coordinates[2]));
        positions.push.apply(positions, toXYZ(this, coordinates[3]));
        indices = [
            0, 1, 2,
            0, 2, 3
        ];
        coords = [
            0, 0,
            1, 0,
            1, 1,
            0, 1,
        ];
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, coordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coords), gl.STATIC_DRAW);
        texture.coords = coordBuffer;
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        if (powerOf2(image.width) && powerOf2(image.height)) {
            gl.generateMipmap(gl.TEXTURE_2D);
        } else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }
        this.buffers.push({
            program: gl.textureProgram,
            type: gl.TRIANGLES,
            texture: texture,
            position: positionBuffer,
            indices: indexBuffer,
            size: indices.length
        });
        render.call(this);
    };

    fn.drawPoint = function(coordinate, color) {
        var gl = this.gl,
            positionBuffer = gl.createBuffer(),
            positions = toXYZ(this, coordinate),
            indexBuffer = gl.createBuffer(),
            indices = [0];
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
        this.buffers.push({
            program: gl.vertexProgram,
            type: gl.POINT,
            color: color,
            position: positionBuffer,
            indices: indexBuffer,
            size: indices.length
        });
        render.call(this);
    };

    fn.drawLine = function(coordinates, color) {
        var gl = this.gl,
            positionBuffer = gl.createBuffer(),
            positions = [],
            indexBuffer = gl.createBuffer(),
            indices = [];
        coordinates = lineMidPoints(coordinates);
        for (var i = 0, j = coordinates.length; i < j; i++) {
            positions.push.apply(positions, toXYZ(this, coordinates[i]));
        }
        for (var i = 0, j = positions.length / 3, k = j - 1; i < j; i++) {
            indices.push(i);
            if (i < k) {
                indices.push(i + 1);
            }
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
        this.buffers.push({
            program: gl.vertexProgram,
            type: gl.LINES,
            color: color,
            position: positionBuffer,
            indices: indexBuffer,
            size: indices.length
        });
        render.call(this);
    };

    fn.drawPolygon = function(coordinates, color) {
        var gl = this.gl,
            positionBuffer = gl.createBuffer(),
            positions = [],
            indexBuffer = gl.createBuffer(),
            indices = [];
        coordinates = lineMidPoints(coordinates);
        for (var i = 0, j = coordinates.length; i < j; i++) {
            coordinates[i][2] = coordinates[i][2] || 10;
        }
        for (var i = 0, j = coordinates.length; i < j; i++) {
            positions.push.apply(positions, toXYZ(this, coordinates[i]));
        }
        for (var i = 0, j = positions.length / 3, k = j - 1; i < j; i++) {
            indices.push(i);
            if (i < k) {
                indices.push(i + 1);
            }
        }
        // coordinates.forEach(function(coordinate, i) {
        //     positions.push.apply(positions, toXYZ(this, coordinate));
        //     indices.push(i);
        //     if (i < last) {
        //         indices.push(i + 1);
        //     }
        // }.bind(this));
        indices.push(0);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
        this.buffers.push({
            program: gl.vertexProgram,
            // TODO fill up polygon with triangles
            type: gl.LINES, // gl.TRIANGLES,
            color: color,
            position: positionBuffer,
            indices: indexBuffer,
            size: indices.length
        });
        render.call(this);
    };

    fn.updateSize = function() {
        var gl = this.gl;
        gl.canvas.width = gl.canvas.offsetWidth;
        gl.canvas.height = gl.canvas.offsetHeight;
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        if (this.buffers) render.call(this);
    };

    fn.destroy = function() {
        window.removeEventListener('resize', this.resizeEvent, false);
    };

    function render() {
        var gl = this.gl;
        mat4.perspective(
            this.gl.projectionMatrix,
            45 * Math.PI / 180,
            this.gl.canvas.clientWidth / this.gl.canvas.clientHeight,
            1, -this.opt.R * this.z * 0.9
        );
        mat4.identity(gl.modelViewMatrix);
        mat4.translate(
            gl.modelViewMatrix,
            gl.modelViewMatrix, [0.0, 0.0, this.opt.R * this.z]
        );
        mat4.rotate(
            gl.modelViewMatrix,
            gl.modelViewMatrix,
            this.x, [1, 0, 0]
        );
        mat4.rotate(
            gl.modelViewMatrix,
            gl.modelViewMatrix,
            this.y, [0, 1, 0]
        );
        this.buffers.forEach(function(buffer) {
            renderBuffer(buffer);
        });

        function renderBuffer(buffer) {
            gl.useProgram(buffer.program.program);
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer.position);
            gl.vertexAttribPointer(buffer.program.attribs.vertexPosition, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(buffer.program.attribs.vertexPosition);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer.indices);
            if (buffer.texture) {
                gl.bindBuffer(gl.ARRAY_BUFFER, buffer.texture.coords);
                gl.vertexAttribPointer(buffer.program.attribs.textureCoord, 2, gl.FLOAT, false, 0, 0);
                gl.enableVertexAttribArray(buffer.program.attribs.textureCoord);
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, buffer.texture);
                gl.uniform1i(buffer.program.uniforms.sampler, 0);
            } else {
                gl.uniform4fv(buffer.program.uniforms.vertexColor, buffer.color);
            }
            gl.uniformMatrix4fv(
                buffer.program.uniforms.projectionMatrix,
                false,
                gl.projectionMatrix
            );
            gl.uniformMatrix4fv(
                buffer.program.uniforms.modelViewMatrix,
                false,
                gl.modelViewMatrix
            );
            gl.drawElements(buffer.type, buffer.size, gl.UNSIGNED_SHORT, 0);
        }
    };

    function initGL(gl) {
        var vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vertexShaderScript);
        gl.compileShader(vertexShader);
        var vertexFragment = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(vertexFragment, vertexFragmentScript);
        gl.compileShader(vertexFragment);
        var vertexProgram = gl.createProgram();
        gl.attachShader(vertexProgram, vertexShader);
        gl.attachShader(vertexProgram, vertexFragment);
        gl.linkProgram(vertexProgram);
        if (!gl.getProgramParameter(vertexProgram, gl.LINK_STATUS)) {
            throw "Could not initialise shaders";
        }
        gl.vertexProgram = {
            program: vertexProgram,
            attribs: {
                vertexPosition: gl.getAttribLocation(vertexProgram, 'vertexPosition')
            },
            uniforms: {
                projectionMatrix: gl.getUniformLocation(vertexProgram, 'projectionMatrix'),
                modelViewMatrix: gl.getUniformLocation(vertexProgram, 'modelViewMatrix'),
                vertexColor: gl.getUniformLocation(vertexProgram, 'vertexColor')
            }
        };

        var textureShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(textureShader, textureShaderScript);
        gl.compileShader(textureShader);
        var textureFragment = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(textureFragment, textureFragmentScript);
        gl.compileShader(textureFragment);
        var textureProgram = gl.createProgram();
        gl.attachShader(textureProgram, textureShader);
        gl.attachShader(textureProgram, textureFragment);
        gl.linkProgram(textureProgram);
        if (!gl.getProgramParameter(textureProgram, gl.LINK_STATUS)) {
            throw "Could not initialise shaders";
        }
        gl.textureProgram = {
            program: textureProgram,
            attribs: {
                vertexPosition: gl.getAttribLocation(textureProgram, 'vertexPosition'),
                textureCoord: gl.getAttribLocation(textureProgram, 'textureCoord')
            },
            uniforms: {
                projectionMatrix: gl.getUniformLocation(textureProgram, 'projectionMatrix'),
                modelViewMatrix: gl.getUniformLocation(textureProgram, 'modelViewMatrix'),
                sampler: gl.getUniformLocation(textureProgram, 'sampler')
            }
        };

        gl.projectionMatrix = mat4.create();
        gl.modelViewMatrix = mat4.create();
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clearDepth(1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.depthMask(true);
        gl.enable(gl.BLEND);
        gl.depthMask(true);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    }

    function sphere() {
        var color = this.opt.sphere || Color('#E0FFFF').vec4(),
            gl = this.gl,
            positionBuffer = gl.createBuffer(),
            positions = [],
            indexBuffer = gl.createBuffer(),
            indices = [];
        var data = []
        for (var lat = 90; lat >= -90; lat--) {
            for (var lng = 0; lng <= 360; lng++) {
                data.push([lng, lat]);
            }
        }
        parallel(
            data,
            function(d) {
                positions.push.apply(positions, toXYZ(this, d));
            }.bind(this),
            function(d, i) {
                this.positions = positions;
                var size = 361;
                for (var lat = 0; lat < 180; lat++) {
                    for (var lng = 0; lng < 360; lng++) {
                        var first = (lat * 361) + lng;
                        var second = first + 361;
                        indices.push(first);
                        indices.push(second);
                        indices.push(first + 1);
                        indices.push(second);
                        indices.push(second + 1);
                        indices.push(first + 1);
                    }
                }
                gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
                this.buffers.unshift({
                    program: gl.vertexProgram,
                    type: gl.TRIANGLES,
                    color: color,
                    position: positionBuffer,
                    indices: indexBuffer,
                    size: indices.length
                });
                render.call(this);
            }.bind(this)
        );
    };

    function handleMouseMove(event) {
        event.preventDefault();
        rotateEvent.call(this, event.clientX, event.clientY);
    }

    function handleTouchMove(event) {
        event.preventDefault();
        if (this.lastScale === event.scale) {
            rotateEvent.call(this, event.touches[0].screenX, event.touches[0].screenY);
        }
    }

    function rotateEvent(x, y) {
        this.x -= degToRad(this.lastY - y) / 10;
        if (Math.round(this.x / Math.PI) % 2) {
            this.y += degToRad(this.lastX - x) / 10;
        } else {
            this.y -= degToRad(this.lastX - x) / 10;
        }
        render.call(this);
        this.lastX = x;
        this.lastY = y;
    }

    var zlevel = 100;

    function handleMouseWheel(event) {
        event.preventDefault();
        this.zoom(Math.floor((this.z - (event.deltaY / zlevel)) * zlevel) / zlevel);
    }

    function handleTouchZoom(event) {
        event.preventDefault();
        this.zoom(Math.floor((this.z - (this.lastScale - event.scale)) * zlevel) / zlevel);
        this.lastScale = event.scale;
    }

    function degToRad(degrees) {
        return degrees * Math.PI / 180;
    }

    function radToDeg(radians) {
        return radians * 180 / Math.PI;
    }

    function distancePoint(planet, coordinate, distance, azimuth) {
        var radius = coordinate[2] !== undefined ? coordinate[2] + planet.opt.R : planet.opt.R,
            angle = distance / radius,
            azimuth = degToRad(azimuth),
            lng = degToRad(coordinate[0]),
            lat = degToRad(coordinate[1]),
            sinLat = Math.sin(lat),
            cosLat = Math.cos(lat),
            sinAngle = Math.sin(angle),
            cosAngle = Math.cos(angle),
            alpha = sinLat * cosAngle + cosLat * sinAngle * Math.cos(azimuth);
        lat = Math.asin(alpha);
        lng = degToRad(coordinate[0]) +
            Math.atan2(
                Math.sin(azimuth) * sinAngle * cosLat,
                cosAngle - sinLat * alpha
            );
        return [(radToDeg(lng) + 540) % 360 - 180, radToDeg(lat), coordinate[2]];
    }

    function toXYZ(planet, coordinate) {
        var radius = coordinate[2] !== undefined ? coordinate[2] + planet.opt.R : planet.opt.R,
            lng = (180 + coordinate[0]) * (Math.PI / 180),
            lat = (90 - coordinate[1]) * (Math.PI / 180);
        return [-radius * Math.sin(lat) * Math.cos(lng),
            radius * Math.cos(lat),
            radius * Math.sin(lat) * Math.sin(lng)
        ];
    }

    function powerOf2(value) {
        return (value & -value) === value;
    }

    function parallel(data, work, then) {
        var end = data.length - 1;
        data.forEach(function(d, i) {
            setTimeout(function() {
                work(d);
                if (i == end && then) {
                    then(d, i);
                }
            }.bind(this), 0);
        }.bind(this));
    }

    function lineMidPoints(coordinates) {
        var array = [];
        for (var i = 0, j = coordinates.length - 1; i < j; i++) {
            array.push(coordinates[i]);
            var a = coordinates[i],
                b = coordinates[i + 1],
                rad = Math.atan2(b[1] - a[1], b[0] - a[0]),
                deg = radToDeg(rad),
                m = (b[1] - a[1]) / (b[0] - a[0]);
            switch (deg) {
                case 0:
                    for (var lng = a[0]; lng <= b[0]; lng++) {
                        array.push([
                            lng,
                            a[1],
                            a[2]
                        ]);
                    }
                    break;
                case 180:
                    for (var lng = a[0]; lng >= b[0]; lng--) {
                        array.push([
                            lng,
                            a[1],
                            a[2]
                        ]);
                    }
                    break;
                case 90:
                    for (var lat = a[1]; lat <= b[1]; lat++) {
                        array.push([
                            a[0],
                            lat,
                            a[2]
                        ]);
                    }
                    break;
                case -90:
                    for (var lat = a[1]; lat >= b[1]; lat--) {
                        array.push([
                            a[0],
                            lat,
                            a[2]
                        ]);
                    }
                    break;
                default:
                    if (deg > -45 && deg < 45) {
                        for (var lng = a[0]; lng <= b[0]; lng++) {
                            array.push([
                                lng,
                                (m * (lng - a[0])) + a[1],
                                a[2]
                            ]);
                        }
                    } else if (deg > 135 || deg < -135) {
                        for (var lng = a[0]; lng >= b[0]; lng--) {
                            array.push([
                                lng,
                                (m * (lng - a[0])) + a[1],
                                a[2]
                            ]);
                        }
                    } else if (deg > 0) {
                        for (var lat = a[1]; lat <= b[1]; lat++) {
                            array.push([
                                ((lat - a[1]) / m) + a[0],
                                lat,
                                a[2]
                            ]);
                        }
                    } else {
                        for (var lat = a[1]; lat >= b[1]; lat--) {
                            array.push([
                                ((lat - a[1]) / m) + a[0],
                                lat,
                                a[2]
                            ]);
                        }
                    }
            };
        }
        array.push(coordinates[coordinates.length - 1]);
        return array;
    }
})();