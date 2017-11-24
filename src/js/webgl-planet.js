(function() {
    var vertexShaderScript =
        'attribute vec4 vertexPosition;\
         attribute vec2 textureCoord;\
         uniform mat4 projectionMatrix;\
         uniform mat4 modelViewMatrix;\
         varying vec2 coord;\
         void main(void) {\
             gl_Position = projectionMatrix * modelViewMatrix * vertexPosition;\
             coord = textureCoord;\
         }',
        fragmentShaderScript =
        'precision mediump float;\
         uniform bool useColor;\
         uniform vec4 vertexColor;\
         uniform sampler2D sampler;\
         varying vec2 coord;\
         void main(void) {\
             if (useColor) {\
                 gl_FragColor = vertexColor;\
             } else {\
                 vec4 color = texture2D(sampler, vec2(coord.s, coord.t));\
                 gl_FragColor = vec4(color.rgb, color.a);\
             }\
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
            minZoom: -3,
            maxZoom: -1.01
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
        var rotateEvent = handleMouseMove.bind(this),
            zoomEvent = handleMouseWheel.bind(this);
        canvas.addEventListener('mousedown', function(event) {
            canvas.style.cursor = 'grabbing';
            this.lastX = event.clientX;
            this.lastY = event.clientY;
            canvas.addEventListener('mousemove', rotateEvent);
        }.bind(this), false);
        canvas.addEventListener('mouseup', function(event) {
            canvas.style.cursor = 'grab';
            canvas.removeEventListener('mousemove', rotateEvent);
        }, false);
        canvas.addEventListener('mouseover', function(event) {
            canvas.addEventListener('wheel', zoomEvent);
        }, false);
        canvas.addEventListener('mouseout', function(event) {
            canvas.removeEventListener('wheel', zoomEvent);
        }, false);
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
                this.drawFeature(feature);
            }.bind(this));
        } else if ('Feature' === geojson.type) {
            this.drawFeature(geojson);
        }
    };

    fn.drawFeature = function(feature) {
        switch (feature.geometry.type) {
            case 'Point':
                setTimeout(function() {
                    this.drawPoint(
                        feature.geometry.coordinates[0],
                        Color('black').vec4()
                    );
                }.bind(this), 0);
                break;
            case 'MultiPoint':
                feature.geometry.coordinates.forEach(function(coordinates) {
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
                        feature.geometry.coordinates[0],
                        Color('red').vec4()
                    );
                }.bind(this), 0);
                break;
            case 'MultiLineString':
                feature.geometry.coordinates.forEach(function(coordinates) {
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
                        feature.geometry.coordinates[0],
                        Color('green').vec4()
                    );
                }.bind(this), 0);
                break;
            case 'MultiPolygon':
                feature.geometry.coordinates.forEach(function(coordinates) {
                    setTimeout(function() {
                        this.drawPolygon(
                            coordinates[0],
                            Color('green').vec4()
                        );
                    }.bind(this), 0);
                }.bind(this));
                break;
        }
    };

    fn.drawText = function(text, coordinate, zoom) {
        var gl = this.gl,
            img = textImage.toImage(text, function() {
                var w = img.width * zoom,
                    h = img.height * zoom,
                    r = coordinate[2] || this.opt.R + 10,
                    a = distancePoint(coordinate, w, -90, r),
                    b = distancePoint(coordinate, w, 90, r),
                    c = distancePoint(coordinate, w, 90, r),
                    d = distancePoint(coordinate, w, -90, r);
                if (coordinate[1] === 90) {
                    a = distancePoint(a, h, -90, r);
                    b = distancePoint(b, h, 90, r);
                    c = distancePoint(c, h, -90, r);
                    d = distancePoint(d, h, 90, r);
                } else if (coordinate[1] === -90) {
                    a = distancePoint(a, h, 90, r);
                    b = distancePoint(b, h, -90, r);
                    c = distancePoint(c, h, 90, r);
                    d = distancePoint(d, h, -90, r);
                } else {
                    a = distancePoint(a, h, 0, r);
                    b = distancePoint(b, h, 0, r);
                    c = distancePoint(c, h, 180, r);
                    d = distancePoint(d, h, 180, r);
                }
                a.push(r);
                b.push(r);
                c.push(r);
                d.push(r);
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
        positions = positions.concat(toPoints(coordinates[0], coordinates[0][2] || this.opt.R));
        positions = positions.concat(toPoints(coordinates[1], coordinates[1][2] || this.opt.R));
        positions = positions.concat(toPoints(coordinates[2], coordinates[2][2] || this.opt.R));
        positions = positions.concat(toPoints(coordinates[3], coordinates[3][2] || this.opt.R));
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
        indices = [
            0, 1, 2,
            0, 2, 3
        ];
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
        coords = [
            0, 0,
            1, 0,
            1, 1,
            0, 1,
        ];
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
            positions = toPoints(coordinate, coordinate[2] || this.opt.R),
            indexBuffer = gl.createBuffer(),
            indices = [0];
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
        this.buffers.push({
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
            indices = [],
            last = coordinates.length - 1;
        coordinates.forEach(function(coordinate, i) {
            positions = positions.concat(toPoints(
                coordinate,
                coordinate[2] || this.opt.R
            ));
            indices.push(i);
            if (i < last) {
                indices.push(i + 1);
            }
        }.bind(this));
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
        this.buffers.push({
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
            indices = [],
            last = coordinates.length - 1;;
        coordinates.forEach(function(coordinate, i) {
            positions = positions.concat(toPoints(
                coordinate,
                coordinate[2] || this.opt.R
            ));
            indices.push(i);
            if (i < last) {
                indices.push(i + 1);
            }
        }.bind(this));
        indices.push(0);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
        this.buffers.push({
            // TODO fill up polygon with triangles
            type: gl.LINES, //gl.POINTS, // gl.TRIANGLES,
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
        gl.uniformMatrix4fv(
            gl.uniforms.projectionMatrix,
            false,
            gl.projectionMatrix
        );
        gl.uniformMatrix4fv(
            gl.uniforms.modelViewMatrix,
            false,
            gl.modelViewMatrix
        );
        this.buffers.forEach(function(buffer) {
            renderBuffer(buffer);
        });

        function renderBuffer(buffer) {
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer.position);
            gl.vertexAttribPointer(gl.attribs.vertexPosition, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(gl.attribs.vertexPosition);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer.indices);
            if (buffer.texture) {
                gl.uniform1i(gl.uniforms.useColor, false);
                gl.bindBuffer(gl.ARRAY_BUFFER, buffer.texture.coords);
                gl.vertexAttribPointer(gl.attribs.textureCoord, 2, gl.FLOAT, false, 0, 0);
                gl.enableVertexAttribArray(gl.attribs.textureCoord);
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, buffer.texture);
                gl.uniform1i(gl.uniforms.sampler, 0);
            } else {
                gl.uniform1i(gl.uniforms.useColor, true);
                gl.disableVertexAttribArray(gl.attribs.textureCoord);
                gl.uniform1i(gl.uniforms.sampler, null);
                gl.uniform4fv(gl.uniforms.vertexColor, buffer.color);
            }
            gl.drawElements(buffer.type, buffer.size, gl.UNSIGNED_SHORT, 0);
        }
    };

    function initGL(gl) {
        var vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vertexShaderScript);
        gl.compileShader(vertexShader);
        var vertexFragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(vertexFragmentShader, fragmentShaderScript);
        gl.compileShader(vertexFragmentShader);
        var program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, vertexFragmentShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw "Could not initialise shaders";
        }
        gl.attribs = {
            vertexPosition: gl.getAttribLocation(program, 'vertexPosition'),
            textureCoord: gl.getAttribLocation(program, 'textureCoord'),
        };
        gl.uniforms = {
            projectionMatrix: gl.getUniformLocation(program, 'projectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(program, 'modelViewMatrix'),
            vertexColor: gl.getUniformLocation(program, 'vertexColor'),
            useColor: gl.getUniformLocation(program, 'useColor'),
            sampler: gl.getUniformLocation(program, 'sampler')
        };
        gl.useProgram(program);
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
        // TODO find bester way with tessellation
        var latitudeBands = 180 / 6;
        var longitudeBands = 360 / 6;
        for (var latNumber = 0; latNumber <= latitudeBands; latNumber++) {
            var theta = latNumber * Math.PI / latitudeBands;
            var sinTheta = Math.sin(theta);
            var cosTheta = Math.cos(theta);
            for (var longNumber = 0; longNumber <= longitudeBands; longNumber++) {
                var phi = longNumber * 2 * Math.PI / longitudeBands;
                var sinPhi = Math.sin(phi);
                var cosPhi = Math.cos(phi);
                var x = cosPhi * sinTheta;
                var y = cosTheta;
                var z = sinPhi * sinTheta;
                positions.push(this.opt.R * x);
                positions.push(this.opt.R * y);
                positions.push(this.opt.R * z);
            }
        }
        var size = longitudeBands + 1;
        for (var latNumber = 0; latNumber < latitudeBands; latNumber++) {
            for (var longNumber = 0; longNumber < longitudeBands; longNumber++) {
                var first = (latNumber * size) + longNumber;
                var second = first + size;
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
        this.buffers.push({
            type: gl.TRIANGLES,
            color: color,
            position: positionBuffer,
            indices: indexBuffer,
            size: indices.length
        });
        render.call(this);
    };

    function handleMouseMove(event) {
        event.preventDefault();
        var newX = event.clientX;
        var newY = event.clientY;
        this.x -= degToRad(this.lastY - newY) / 10;
        if (Math.round(this.x / Math.PI) % 2) {
            this.y += degToRad(this.lastX - newX) / 10;
        } else {
            this.y -= degToRad(this.lastX - newX) / 10;
        }
        render.call(this);
        this.lastX = newX;
        this.lastY = newY;
    }

    var zlevel = 100;

    function handleMouseWheel(event) {
        event.preventDefault();
        this.zoom(Math.floor((this.z - (event.deltaY / zlevel)) * zlevel) / zlevel);
    }

    function earcut(coords, dim) {
        var array = [],
            dim = dim || 2;
        for (var i = 0, j = coords.length + 1 - dim; i < j; i += dim) {
            var a = [];
            for (var k = i, l = k + dim; k < l; k++) {
                a.push(coords[k]);
            }
            a.push(0);
            array.push(a);
        }
        array.sort(function(a, b) {
            if (a[0] < b[0]) {
                if (a[1] > b[1]) {
                    if (a[1] < b[1]) {
                        return 1;
                    }
                }
            }
            return -1;
        });
        var indices = [];
    }

    function degToRad(degrees) {
        return degrees * Math.PI / 180;
    }

    function radToDeg(radians) {
        return radians * 180 / Math.PI;
    }

    function distancePoint(coordinate, distance, azimuth, radius) {
        var angle = distance / radius,
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
        return [(radToDeg(lng) + 540) % 360 - 180, radToDeg(lat)];
    }

    function toPoints(coordinate, radius) {
        var lng = (180 + coordinate[0]) * (Math.PI / 180),
            lat = (90 - coordinate[1]) * (Math.PI / 180);
        return [-radius * Math.sin(lat) * Math.cos(lng),
            radius * Math.cos(lat),
            radius * Math.sin(lat) * Math.sin(lng)
        ];
    }

    function powerOf2(value) {
        return (value & -value) === value;
    }
})();