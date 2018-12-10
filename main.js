/** @type {WebGLRenderingContext} */
var gl
var shaderProgram
var mvMatrix = mat4.create()
var mvMatrixStack = []
var pMatrix = mat4.create()
var eventAfterRender = new CustomEvent('after-render');
var eventLightFollow = new CustomEvent('light-follow');
var rotater = 1;
var dir = [1, 1, 1];

var centerOfR = undefined;
var centerR = undefined;

var revTranslate = [0.0, 0.0, 0.0];
var revRotate = 0;

var cameraAngle = 0;

function initGL(canvas) {
    try {
        gl = canvas.getContext('webgl')
        gl.viewportWidth = canvas.width
        gl.viewportHeight = canvas.height
    } catch (e) {
        if (!gl) {
            alert('Tidak bisa inisialisasi WebGL')
        }
    }
}

function getShader(id) {
    var shaderScript = document.getElementById(id)
    if (!shaderScript) {
        return null
    }
    var str = ''
    var k = shaderScript.firstChild
    while (k) {
        if (k.nodeType == 3) {
            str += k.textContent
        }
        k = k.nextSibling
    }
    var shader
    if (shaderScript.type == 'x-shader/x-fragment') {
        shader = gl.createShader(gl.FRAGMENT_SHADER)
    } else if (shaderScript.type = 'x-shader/x-vertex') {
        shader = gl.createShader(gl.VERTEX_SHADER)
    } else {
        return null
    }
    gl.shaderSource(shader, str)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader))
        return null
    }
    return shader
}


function initProj(id){
    id = id || 'webGL';
    var canvasGL = document.getElementById(id);
    canvasGL.width = window.innerWidth; 
    canvasGL.height = window.innerHeight;

    gl = canvasGL.getContext('experimental-webgl');
    gl.VIEWPORT_WIDTH = canvasGL.width;
    gl.VIEWPORT_HEIGHT = canvasGL.height;

    function initShaders() {
        var fragmentShader = getShader('shader-fs')
        var vertexShader = getShader('shader-vs')

        this.shaderProgram = gl.createProgram()

        gl.attachShader(this.shaderProgram, fragmentShader)
        gl.attachShader(this.shaderProgram, vertexShader)
        gl.linkProgram(this.shaderProgram)

        if (!gl.getProgramParameter(this.shaderProgram, gl.LINK_STATUS)) {
            alert('Tidak bisa menginisialisasi shaders')
        }

        gl.useProgram(this.shaderProgram)
        
        this.shaderProgram.vertexPositionAttribute = gl.getAttribLocation(this.shaderProgram, 'aVertexPosition')
        gl.enableVertexAttribArray(this.shaderProgram.vertexPositionAttribute)
        
        this.shaderProgram.vertexColorAttribute = gl.getAttribLocation(this.shaderProgram, 'aVertexColor')
        gl.enableVertexAttribArray(this.shaderProgram.vertexColorAttribute)
        
        this.shaderProgram.vertexNormalAttribute = gl.getAttribLocation(this.shaderProgram, "aVertexNormals");
        gl.enableVertexAttribArray(this.shaderProgram.vertexNormalAttribute);

        this.shaderProgram.textureCoordAttribute = gl.getAttribLocation(this.shaderProgram, "aTextureCoord");
        gl.enableVertexAttribArray(this.shaderProgram.textureCoordAttribute);

        this.shaderProgram.pMatrixUniform = gl.getUniformLocation(this.shaderProgram, 'uPMatrix')
        this.shaderProgram.mvMatrixUniform = gl.getUniformLocation(this.shaderProgram, 'uMVMatrix')
        this.shaderProgram.nMatrixUniform = gl.getUniformLocation(this.shaderProgram, "uNMatrix");
        this.shaderProgram.samplerUniform = gl.getUniformLocation(this.shaderProgram, "uSampler");
        this.shaderProgram.useLightingUniform = gl.getUniformLocation(this.shaderProgram, "uUseLighting");
        this.shaderProgram.ambientColorUniform = gl.getUniformLocation(this.shaderProgram, "uAmbientColor");
        this.shaderProgram.lightingDirectionUniform = gl.getUniformLocation(this.shaderProgram, "uLightingDirection");
        this.shaderProgram.pointLightingLocationUniform = gl.getUniformLocation(this.shaderProgram, "uPointLightingLocation");
        this.shaderProgram.pointLightingColorUniform = gl.getUniformLocation(this.shaderProgram, "uPointLightingColor");
        this.shaderProgram.alphaUniform = gl.getUniformLocation(this.shaderProgram, "uAlpha");
        this.shaderProgram.shiniUniform = gl.getUniformLocation(this.shaderProgram, "uShininess");
    }

    initShaders = initShaders.bind(this);
    initShaders();

    this.mvMatrixOne = mat4.create();
    this.pMatrixOne = mat4.create();
    this.mvMatrixStackOne = [];

    this.mvMatrixTwo = mat4.create();
    this.pMatrixTwo = mat4.create();
    this.mvMatrixStackTwo = [];

    this.mvMatrixThree = mat4.create();
    this.pMatrixThree = mat4.create();
    this.mvMatrixStackThree = [];

    this.mvMatrixFour = mat4.create();
    this.pMatrixFour = mat4.create();
    this.mvMatrixStackFour = [];
    
    this.object3dBuffer = [];

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
}

initProj.prototype.mvPushMatrix = function(idx) {
    let temp = mat4.create();

    let mvMat, mvMatStack;
    if(idx == 1){
        mvMat = this.mvMatrixOne;
        mvMatStack = this.mvMatrixStackOne;
    } else if(idx == 2){
        mvMat = this.mvMatrixTwo;
        mvMatStack = this.mvMatrixStackTwo;
    } else if(idx == 3) {
        mvMat = this.mvMatrixThree;
        mvMatStack = this.mvMatrixStackThree;
    } else {
        mvMat = this.mvMatrixFour;
        mvMatStack = this.mvMatrixStackFour;
    }

    mat4.copy(temp, mvMat);
    mvMatStack.push(temp);
}

initProj.prototype.mvPopMatrix = function(idx) {
    let mvMatStack;
    if(idx == 1){
        mvMatStack = this.mvMatrixStackOne;
        this.mvMatrixOne  = mvMatStack.pop();
    } else if(idx == 2){
        mvMatStack = this.mvMatrixStackTwo;
        this.mvMatrixTwo  = mvMatStack.pop();
    } else if(idx == 3) {
        mvMatStack = this.mvMatrixStackThree;
        this.mvMatrixThree  = mvMatStack.pop();
    } else {
        mvMatStack = this.mvMatrixStackFour;
        this.mvMatrixFour  = mvMatStack.pop();
    }
}

initProj.prototype.setMatrixUniform = function(idx) {
    let tempMatrix = mat3.create();

    let mvMatrix, pMatrix;
    if(idx == 1){
        mvMatrix = this.mvMatrixOne;
        pMatrix = this.pMatrixOne;
    } else if(idx == 2){
        mvMatrix = this.mvMatrixTwo;
        pMatrix = this.pMatrixTwo;
    } else if(idx == 3) {
        mvMatrix = this.mvMatrixThree;
        pMatrix = this.pMatrixThree;
    } else {
        mvMatrix = this.mvMatrixFour;
        pMatrix = this.pMatrixFour;
    }

    mat3.normalFromMat4(tempMatrix, mvMatrix);

    gl.uniformMatrix4fv(this.shaderProgram.pMatrixUniform, false, pMatrix)
    gl.uniformMatrix4fv(this.shaderProgram.mvMatrixUniform, false, mvMatrix)
    gl.uniformMatrix3fv(this.shaderProgram.nMatrixUniform, false, tempMatrix)
}

async function handleLoadedTexture(texture) {
    await gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    await gl.bindTexture(gl.TEXTURE_2D, texture);
    
    await gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    await gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    await gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    0.5
0.5
    texture.loaded = true;
}

initProj.prototype.add = function(obj) {
    let buffer = {}
    if(obj.type === 'geometry') {
        buffer.id = obj.id;

        buffer.obj3d = obj;

        buffer.position = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer.position);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(obj.vertices), gl.STATIC_DRAW);
        buffer.position.itemSize = 3;
        buffer.position.numItems = obj.vertices.length / buffer.position.itemSize;

        buffer.normal = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer.normal);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(obj.normals), gl.STATIC_DRAW);
        buffer.normal.itemSize = 3;
        buffer.normal.numItems = obj.normals.length / buffer.normal.itemSize;

        buffer.indices = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer.indices);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(obj.indices), gl.STATIC_DRAW);
        buffer.indices.itemSize = 1;
        buffer.indices.numItems = obj.indices.length / buffer.indices.itemSize;

        buffer.texture = gl.createTexture();
        buffer.texture.loaded = false;
        buffer.texture.image = new Image();
        buffer.texture.image.onload = function () {
            handleLoadedTexture(buffer.texture);
        }
        buffer.texture.image.src = obj.textureSrc;

        buffer.textureCoord = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer.textureCoord);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(obj.textureCoord), gl.STATIC_DRAW);
        buffer.textureCoord.itemSize = 2;
        buffer.textureCoord.numItems = obj.textureCoord.length / buffer.textureCoord.itemSize;

        buffer.color = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer.color);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(obj.colors), gl.STATIC_DRAW);
        buffer.color.itemSize = 4;
        buffer.color.numItems = obj.colors.length / buffer.color.itemSize;

        this.object3dBuffer.push(buffer);
    } else {
        gl.uniform1i(this.shaderProgram.useLightingUniform, 1);
        gl.uniform1f(this.shaderProgram.shiniUniform, 5.0);
        buffer.obj3d = obj;

        this.object3dBuffer.push(buffer);
    }
}

initProj.prototype.renderOne = function(sw, sh, ew, eh) {
    gl.scissor(sw, sh, ew, eh)
    gl.viewport(sw, sh, ew, eh);
    gl.clear(gl.COLOR_BUFFER_BIT, gl.DEPTH_BUFFER_BIT);

    mat4.perspective(this.pMatrixOne, glMatrix.toRadian(45), gl.VIEWPORT_WIDTH/gl.VIEWPORT_HEIGHT, 0.1, 1000.0)

    mat4.identity(this.mvMatrixOne);

    mat4.translate(this.mvMatrixOne, this.mvMatrixOne, [0.0, 0.0,-50.0])

    for(let i = 0; i < this.object3dBuffer.length; i++) {
        this.mvPushMatrix(1);

        let o = this.object3dBuffer[i];

        if(o.obj3d.type === 'geometry') {
            var ev = new CustomEvent(o.id);

            document.dispatchEvent(ev);
            mat4.multiply(this.mvMatrixOne, this.mvMatrixOne, o.obj3d.matrixWorld);

            gl.bindBuffer(gl.ARRAY_BUFFER, o.position);
            gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, o.position.itemSize, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, o.color);
            gl.vertexAttribPointer(this.shaderProgram.vertexColorAttribute, o.color.itemSize, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, o.normal);
            gl.vertexAttribPointer(this.shaderProgram.vertexNormalAttribute, o.normal.itemSize, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, o.textureCoord);
            gl.vertexAttribPointer(this.shaderProgram.textureCoordAttribute, o.textureCoord.itemSize, gl.FLOAT, false, 0, 0);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, o.texture);
            gl.uniform1i(this.shaderProgram.samplerUniform, 0);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, o.indices);

            let temp = [];
            for(let i = 0; i < o.obj3d.vertices_.length; i++){
                temp.push(multiply(this.mvMatrixOne, o.obj3d.vertices_[i]));
            }
            o.obj3d.position = JSON.parse(JSON.stringify(temp));

            this.setMatrixUniform(1);

            gl.drawElements(gl.TRIANGLES, o.indices.numItems, gl.UNSIGNED_SHORT, 0);
        } else if (o.obj3d.type === 'ambient-light') {
            gl.uniform3f(this.shaderProgram.ambientColorUniform, o.obj3d.color.r, o.obj3d.color.g, o.obj3d.color.b);
        } else if (o.obj3d.type === 'point-light') {
            document.dispatchEvent(eventLightFollow);
            gl.uniform3f(this.shaderProgram.pointLightingLocationUniform, o.obj3d.position.x, o.obj3d.position.y, o.obj3d.position.z)
            gl.uniform3f(this.shaderProgram.pointLightingColorUniform, o.obj3d.color.r, o.obj3d.color.g, o.obj3d.color.b);
        }

        this.mvPopMatrix(1);

    }

    document.dispatchEvent(eventAfterRender);
}

initProj.prototype.renderTwo = function(sw, sh, ew, eh) {
    gl.scissor(sw, sh, ew, eh)
    gl.viewport(sw, sh, ew, eh);
    gl.clear(gl.COLOR_BUFFER_BIT, gl.DEPTH_BUFFER_BIT);

    mat4.perspective(this.pMatrixTwo, glMatrix.toRadian(45), gl.VIEWPORT_WIDTH/gl.VIEWPORT_HEIGHT, 0.1, 1000.0)

    mat4.identity(this.mvMatrixTwo);

    mat4.translate(this.mvMatrixTwo, this.mvMatrixTwo, [0.0, 0.0,-50.0])

    document.addEventListener('right-click', function(){
        THETA = 0;
        PHI = 0;
    });

    mat4.rotateY(this.mvMatrixTwo, this.mvMatrixTwo, THETA);
    mat4.rotateX(this.mvMatrixTwo, this.mvMatrixTwo, PHI);

    for(let i = 0; i < this.object3dBuffer.length; i++) {
        this.mvPushMatrix(2);

        let o = this.object3dBuffer[i];

        if(o.obj3d.type === 'geometry') {
            mat4.multiply(this.mvMatrixTwo, this.mvMatrixTwo, o.obj3d.matrixWorld);

            gl.bindBuffer(gl.ARRAY_BUFFER, o.position);
            gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, o.position.itemSize, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, o.color);
            gl.vertexAttribPointer(this.shaderProgram.vertexColorAttribute, o.color.itemSize, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, o.normal);
            gl.vertexAttribPointer(this.shaderProgram.vertexNormalAttribute, o.normal.itemSize, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, o.textureCoord);
            gl.vertexAttribPointer(this.shaderProgram.textureCoordAttribute, o.textureCoord.itemSize, gl.FLOAT, false, 0, 0);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, o.texture);
            gl.uniform1i(this.shaderProgram.samplerUniform, 0);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, o.indices);

            let temp = [];
            for(let i = 0; i < o.obj3d.vertices_.length; i++){
                temp.push(multiply(this.mvMatrixTwo, o.obj3d.vertices_[i]));
            }
            o.obj3d.position = JSON.parse(JSON.stringify(temp));

            this.setMatrixUniform(2);

            gl.drawElements(gl.TRIANGLES, o.indices.numItems, gl.UNSIGNED_SHORT, 0);
        } 
        else if (o.obj3d.type === 'ambient-light') {
            gl.uniform3f(this.shaderProgram.ambientColorUniform, o.obj3d.color.r, o.obj3d.color.g, o.obj3d.color.b);
        } else if (o.obj3d.type === 'point-light') {
            gl.uniform3f(this.shaderProgram.pointLightingLocationUniform, o.obj3d.position.x, o.obj3d.position.y, o.obj3d.position.z)
            gl.uniform3f(this.shaderProgram.pointLightingColorUniform, o.obj3d.color.r, o.obj3d.color.g, o.obj3d.color.b);
        }

        this.mvPopMatrix(2);

    }

    document.dispatchEvent(eventAfterRender);
}

initProj.prototype.renderThree = function(sw, sh, ew, eh) {
    gl.scissor(sw, sh, ew, eh)
    gl.viewport(sw, sh, ew, eh);
    gl.clear(gl.COLOR_BUFFER_BIT, gl.DEPTH_BUFFER_BIT);

    mat4.perspective(this.pMatrixThree, glMatrix.toRadian(45), gl.VIEWPORT_WIDTH/gl.VIEWPORT_HEIGHT, 0.1, 1000.0)

    mat4.identity(this.mvMatrixThree);

    let tempMatR = this.object3dBuffer[1].obj3d.matrixWorld;

    for(let i = 0; i < this.object3dBuffer.length; i++) {
        this.mvPushMatrix(3);

        let o = this.object3dBuffer[i];
        if(i == 1) continue;
        if(o.obj3d.type === 'geometry') {
            revTranslate[0] += (-window.dir[0])*0.1;
            revTranslate[1] += (-window.dir[1])*0.1;
            revTranslate[2] += (-window.dir[2])*0.1;
            revRotate += (-window.rotater*0.5);


            let tempMat = Object.assign([], o.obj3d.matrixWorld);
        
            mat4.rotate(tempMat, tempMat, glMatrix.toRadian(revRotate), [0, 0, 1]);
            mat4.translate(tempMat, tempMat, [-revTranslate[0], revTranslate[2], -revTranslate[1]])

            mat4.multiply(this.mvMatrixThree, this.mvMatrixThree, tempMat );


            gl.bindBuffer(gl.ARRAY_BUFFER, o.position);
            gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, o.position.itemSize, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, o.color);
            gl.vertexAttribPointer(this.shaderProgram.vertexColorAttribute, o.color.itemSize, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, o.normal);
            gl.vertexAttribPointer(this.shaderProgram.vertexNormalAttribute, o.normal.itemSize, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, o.textureCoord);
            gl.vertexAttribPointer(this.shaderProgram.textureCoordAttribute, o.textureCoord.itemSize, gl.FLOAT, false, 0, 0);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, o.texture);
            gl.uniform1i(this.shaderProgram.samplerUniform, 0);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, o.indices);

            let temp = [];
            for(let i = 0; i < o.obj3d.vertices_.length; i++){
                temp.push(multiply(this.mvMatrixThree, o.obj3d.vertices_[i]));
            }
            o.obj3d.position = JSON.parse(JSON.stringify(temp));
            
            if(i == 1){
                centerOfR = o.obj3d.findCenterInFrontOf(1);
                centerR = o.obj3d.findCenter();
            }

            this.setMatrixUniform(3);

            gl.drawElements(gl.TRIANGLES, o.indices.numItems, gl.UNSIGNED_SHORT, 0);
        } 
        else if (o.obj3d.type === 'ambient-light') {
            gl.uniform3f(this.shaderProgram.ambientColorUniform, o.obj3d.color.r, o.obj3d.color.g, o.obj3d.color.b);
        } else if (o.obj3d.type === 'point-light') {
            gl.uniform3f(this.shaderProgram.pointLightingLocationUniform, o.obj3d.position.x, o.obj3d.position.y, o.obj3d.position.z)
            gl.uniform3f(this.shaderProgram.pointLightingColorUniform, o.obj3d.color.r, o.obj3d.color.g, o.obj3d.color.b);
        }

        this.mvPopMatrix(3);

    }
}

initProj.prototype.renderFour = function(sw, sh, ew, eh) {
    gl.scissor(sw, sh, ew, eh)
    gl.viewport(sw, sh, ew, eh);
    gl.clear(gl.COLOR_BUFFER_BIT, gl.DEPTH_BUFFER_BIT);

    mat4.perspective(this.pMatrixFour, glMatrix.toRadian(45), gl.VIEWPORT_WIDTH/gl.VIEWPORT_HEIGHT, 0.1, 1000.0)

    mat4.identity(this.mvMatrixFour);

    let cameraMatrix = mat4.create(), viewMatrix = mat4.create();
    mat4.rotateY(cameraMatrix, cameraMatrix, cameraAngle);
    mat4.translate(cameraMatrix, cameraMatrix, [0, 0, 50]);
    
    mat4.invert(viewMatrix,cameraMatrix);
    mat4.multiply(this.pMatrixFour, this.pMatrixFour,  viewMatrix);

    for(let i = 0; i < this.object3dBuffer.length; i++) {
        this.mvPushMatrix(4);

        let o = this.object3dBuffer[i];

        if(o.obj3d.type === 'geometry') {
            mat4.multiply(this.mvMatrixFour, this.mvMatrixFour, o.obj3d.matrixWorld);

            gl.bindBuffer(gl.ARRAY_BUFFER, o.position);
            gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, o.position.itemSize, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, o.color);
            gl.vertexAttribPointer(this.shaderProgram.vertexColorAttribute, o.color.itemSize, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, o.normal);
            gl.vertexAttribPointer(this.shaderProgram.vertexNormalAttribute, o.normal.itemSize, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, o.textureCoord);
            gl.vertexAttribPointer(this.shaderProgram.textureCoordAttribute, o.textureCoord.itemSize, gl.FLOAT, false, 0, 0);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, o.texture);
            gl.uniform1i(this.shaderProgram.samplerUniform, 0);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, o.indices);

            let temp = [];
            for(let i = 0; i < o.obj3d.vertices_.length; i++){
                temp.push(multiply(this.mvMatrixFour, o.obj3d.vertices_[i]));
            }
            o.obj3d.position = JSON.parse(JSON.stringify(temp));

            this.setMatrixUniform(4);

            gl.drawElements(gl.TRIANGLES, o.indices.numItems, gl.UNSIGNED_SHORT, 0);
        } 
        else if (o.obj3d.type === 'ambient-light') {
            gl.uniform3f(this.shaderProgram.ambientColorUniform, o.obj3d.color.r, o.obj3d.color.g, o.obj3d.color.b);
        } else if (o.obj3d.type === 'point-light') {
            gl.uniform3f(this.shaderProgram.pointLightingLocationUniform, o.obj3d.position.x, o.obj3d.position.y, o.obj3d.position.z)
            gl.uniform3f(this.shaderProgram.pointLightingColorUniform, o.obj3d.color.r, o.obj3d.color.g, o.obj3d.color.b);
        }

        this.mvPopMatrix(4);

    }
    cameraAngle += 0.02;
}

function Geometry(){
    this.id = btoa(Math.random()).substring(0,12);
    this.matrixWorld = mat4.create();

    this.temporaryMatrixWorld = undefined;

    this.rotation = {
        _x : 0,
        _y : 0,
        _z : 0,
        updateMatrixWorld : function(deg, array) {
            mat4.rotate(this.matrixWorld, this.matrixWorld, glMatrix.toRadian(deg), array);
        }.bind(this)
    }
    Object.defineProperties(this.rotation, {
        x : {
            get : function () {
                return this._x;
            },

            set: function (value) {
                this._x = value;
                this.updateMatrixWorld(this._x, [1, 0, 0]);
            }
        },
        y : {
            get : function () {
                return this._y;
            },

            set: function (value) {
                this._y = value;
                this.updateMatrixWorld(this._y, [0, 1, 0]);
            }
        },
        z : {
            get : function () {
                return this._z;
            },

            set: function (value) {
                this._z = value;
                this.updateMatrixWorld(this._z, [0, 0, 1]);
            }
        },
    });

    this.translate = {
        to : [0, 0, 0],
        updateMatrixWorld : function() {
            mat4.translate(this.matrixWorld, this.matrixWorld, this.translate.to);
        }.bind(this)
    }
    Object.defineProperties(this.translate,{
        mat : {
            get : function () {
                return this.to;
            },
            set : function (value) {
                this.to = value;
                this.updateMatrixWorld();
            },
        },
    });

    this.move = {
        direction : [0, 0, 0],
        vector : function(value) {
            this.direction[0] += value[0];
            this.direction[1] += value[1];
            this.direction[2] += value[2];
            this.updateMatrixWorld();
        },
        updateMatrixWorld : function() {
            mat4.translate(this.matrixWorld, this.matrixWorld, this.move.direction);
        }.bind(this)
    }

}
Geometry.prototype.constructor = Geometry;

function BoxGeometry(depth, width, height, step = 1, colored = false){
    Geometry.call(this);

    this.type = 'geometry';
    this.indices = [];
    this.vertices = [];
    this.vertices_ = [];
    this.normals = [];
    this.colors = [];
    this.textureCoord = [];
    this.textureSrc = undefined;
    this.position = [];

    this.step = step;

    var d = depth / 2;
    var w = width / 2;
    var h = height / 2;

    var counter = 0;
    for(let i = 0; i < 6; i+=step, counter++){
        for(let j = 0; j < 4; j++){
            var x = d, y = w, z = h;
            if(i & 4){ // LEFT RIGHT
                x *= (i&1)? -1 : 1;
                y *= (j&2)? 1 : -1;
                z *= (j&1)? 1 : -1;
                this.normals.push(1.0, 0, 0);
            } else if ( i & 2) { // BOTTOM TOP
                x *= (j&2)? 1 : -1;
                y *= (i&1)? -1 : 1;
                z *= (j&1)? 1 : -1;
                this.normals.push(0, 1.0, 0);
            } else { // FRONT BACK
                x *= (j&2)? 1 : -1;
                y *= (j&1)? 1 : -1;
                z *= (i&1)? -1 : 1;
                this.normals.push(0, 0, 1.0);
            }
            this.vertices.push(x, y, z);
            if(colored) this.colors.push(1.0, 1.0, 1.0, 1.0);
            else this.colors.push(0.0, 0.0, 0.0, 1.0);
        }
        var p = counter * 4;
        var q = counter * 4 + 1;
        var r = counter * 4 + 2;
        var s = counter * 4 + 3;
        this.indices.push(p, q, r);
        this.indices.push(q, r, s);
    }

    for(let i = 0; i < 6 / 3; i++, counter++){
        for(let j = 0; j < 4; j++){
            var x = d, y = w, z = h;
            if ( i & 2) { // BOTTOM TOP
                x *= (j&2)? 1 : -1;
                y *= (i&1)? -1 : 1;
                z *= (j&1)? 1 : -1;
            } else { // FRONT BACK
                x *= (j&2)? 1 : -1;
                y *= (j&1)? 1 : -1;
                z *= (i&1)? -1 : 1;
            }
            this.vertices_.push([x, y, z, 1.0]);
            this.position.push([x, y, z, 1.0]);
        }
    }
}

BoxGeometry.prototype.constructor = BoxGeometry;

BoxGeometry.prototype.addTexture = function(src) {
    this.textureSrc = src;
    for(let i = 0; i < 6; i+=this.step){
        this.textureCoord.push(0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0);
    }
}

BoxGeometry.prototype.render = function() {
    this.temporaryMatrixWorld = this.matrixWorld;
    document.addEventListener(this.id, this.action.bind(this));
}

BoxGeometry.prototype.findCenter = function() {
    let center = [0, 0, 0];
    for(let i = 0; i < this.position.length; i++){
        center[0] += this.position[i][0];
        center[1] += this.position[i][1];
        center[2] += this.position[i][2];
    }
    center[0] /= this.position.length;
    center[1] /= this.position.length;
    center[2] /= this.position.length;
    return center;
}

initProj.prototype.render = function() {
    gl.enable(gl.SCISSOR_TEST);

    let width = gl.VIEWPORT_WIDTH;
    let height = gl.VIEWPORT_HEIGHT;

    for(let a = 0; a < 2; a++){
        for(let b = 0; b < 2; b++){
            if( a == 0 && b == 0) this.renderOne(0 * width / 2, 1 * height / 2, width / 2, height / 2);
            if( a == 0 && b == 1) this.renderTwo(1 * width / 2, 1 * height / 2, width / 2, height / 2);
            if( a == 1 && b == 0) this.renderThree(0 * width / 2, 0 * height / 2, width / 2, height / 2);
            if( a == 1 && b == 1) this.renderFour(1 * width / 2, 0 * height / 2, width / 2, height / 2);
        }
    }
}

function Color(hex){
    if(hex.charAt(0) == '0' && hex.charAt(1) === 'x'){
        hex = hex.substr(2);
    }
    let values = hex.split('');
    this.r = parseInt(values[0].toString() + values[1].toString(), 16);
    this.g = parseInt(values[2].toString() + values[3].toString(), 16);
    this.b = parseInt(values[4].toString() + values[5].toString(), 16);
}

function AmbientLight(color, intensity = 1.0) {
    this.type = 'ambient-light';
    this.color = {};
    this.color.r = (color.r - 0)/255 * intensity;
    this.color.g = (color.g - 0)/255 * intensity;
    this.color.b = (color.b - 0)/255 * intensity;
}

function PointLight(color, position) {
    this.type = 'point-light';
    this.color = {};
    this.color.r = (color.r - 0)/255;
    this.color.g = (color.g - 0)/255;
    this.color.b = (color.b - 0)/255;
    this.position = position;
}

function multiply(a,b) {
    let c1,c2,c3,c4;
    c1 = a[0]*b[0] + a[4]*b[1] + a[8]*b[2] + a[12]*b[3]
    c2 = a[1]*b[0] + a[5]*b[1] + a[9]*b[2] + a[13]*b[3]
    c3 = a[2]*b[0] + a[6]*b[1] + a[10]*b[2] + a[14]*b[3]
    c4 = a[3]*b[0] + a[7]*b[1] + a[11]*b[2] + a[15]*b[3]
    return [c1,c2,c3,c4]
}