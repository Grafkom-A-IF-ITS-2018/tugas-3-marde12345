/** @type {WebGLRenderingContext} */
var gl
var shaderProgram
var mvMatrix = mat4.create()
var mvMatrixStack = []
var pMatrix = mat4.create()

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

function getShader(gl, id) {
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

function initShaders() {
    var fragmentShader = getShader(gl, 'shader-fs')
    var vertexShader = getShader(gl, 'shader-vs')
    shaderProgram = gl.createProgram()
    gl.attachShader(shaderProgram, fragmentShader)
    gl.attachShader(shaderProgram, vertexShader)
    gl.linkProgram(shaderProgram)
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert('Tidak bisa menginisialisasi shaders')
    }
    gl.useProgram(shaderProgram)
    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, 'aVertexPosition')
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute)
    shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, 'aVertexColor')
    gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute)
    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, 'uPMatrix')
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, 'uMVMatrix')
}

function mvPushMatrix() {
    var copy = mat4.create()
    mat4.copy(copy, mvMatrix)
    mvMatrixStack.push(copy)
}

function mvPopMatrix() {
    if (mvMatrixStack.length == 0) {
        throw 'Tumpukan matrix kosong'
    }
    mvMatrix = mvMatrixStack.pop()
}

function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix)
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix)
}

function generate3D(vertices, faces) {
    var result = []
    for (var a=0;a<faces.length;a++) {
        for(var b=0;b<faces[a].length;b++){
            result = result.concat(vertices[faces[a][b]])
        }
    }
    return result
}

function generateColor(vertices, faces) {
    var result = []
    var color_map = []
    for (var a=0;a<vertices.length;a++) {
        color_map.push([Math.random(), Math.random(), Math.random(), 1.0])
    }
    for (var a=0;a<faces.length;a++) {
        for (var b=0;b<faces[a].length;b++) {
            result = result.concat(color_map[faces[a][b]])
        }
    }
    return result
}

function vertexPosition(vertexs, matrix) {
    var result = []
    vertexs.push(1.0)
    for (var a=0;a<4;a++) {
        result.push((vertexs[0]*matrix[a]) + (vertexs[1]*matrix[a+4]) + (vertexs[2]*matrix[a+8]) + (vertexs[3]*matrix[a+12]))
    }
    result.pop()
    return result
}

function checkCollision(outer_matrix, huruf_matrix) {
    var realPos = []
    var outerFrag = []
    for (var a=0;a<objectBounderies.length;a++) {
        realPos.push(vertexPosition(objectBounderies[a], huruf_matrix))
    }
    for (var a=0;a<outerBounderies.length;a++) {
        outerFrag.push(vertexPosition(outerBounderies[a], outer_matrix))
    }
    for (var a=0;a<realPos.length;a++) {
        if (realPos[a][0] >= outerFrag[0][0]) {
            if (objectVertex[0] > 0) {
                objectVertex[0] = objectVertex[0] * -1.0
                objectRotation = objectRotation * -1.0
            }
        }
        if(realPos[a][0] <= outerFrag[1][0]) {
            if (objectVertex[0] < 0){
                objectVertex[0] = objectVertex[0] * -1.0
                objectRotation = objectRotation * -1.0
            }
        }
        if (realPos[a][1] >= outerFrag[0][1]) {
            if (objectVertex[1] > 0) {
                objectVertex[1] = objectVertex[1] * -1.0
                objectRotation = objectRotation * -1.0
            }
        }
        if(realPos[a][1] <= outerFrag[1][1]) {
            if (objectVertex[1] < 0) {
                objectVertex[1] = objectVertex[1] * -1.0
                objectRotation = objectRotation * -1.0
            }
        }
        if (realPos[a][2] >= outerFrag[0][2]) {
            if (objectVertex[2] > 0) {
                objectVertex[2] = objectVertex[2] * -1.0
                objectRotation = objectRotation * -1.0
            }
        }
        if(realPos[a][2] <= outerFrag[1][2]) {
            if (objectVertex[2] < 0) {
                objectVertex[2] = objectVertex[2] * -1.0
                objectRotation = objectRotation * -1.0
            }
        }
    }
}

var object
var objectColor
var objectBounderies
var objectAngle = 0
var objectRotation = 1.0*(Math.random() < 0.5 ? -1 : 1)
var objectTranslate = [0.0, 0.0, 0.0]
var objectVertex = [0.1*(Math.random() < 0.5 ? -1 : 1), 0.1*(Math.random() < 0.5 ? -1 : 1), 0.1*(Math.random() < 0.5 ? -1 : 1)]

var outer
var outerColor
var outerBounderies

var AColor = []
var Ccolor = []

function initBuffers() {
    var AVertex = [
        [-4.0, 7.0, 1.0], //m 0
        [4.0, 7.0, 1.0], //l 1
        [4.0, 5.0, 1.0], //k 2
        [-2.0, 5.0, 1.0], //j 3
        [-2.0, 1.0, 1.0], //i 4
 
        [4.0, 1.0, 1.0], //h 5
        [4.0, -1.0, 1.0], //g 6
        [-2.0, -1.0, 1.0], //f 7
        [-2.0, -5.0, 1.0], //e 8
        [4.0, -5.0, 1.0], //d 9
        
        [4.0, -7.0, 1.0], //c 10
        [-4.0, -7.0, 1.0], //b 11
        [-4.0, 7.0, -1.0], //m
        [4.0, 7.0, -1.0], //l
        [4.0, 5.0, -1.0], //k

        [-2.0, 5.0, -1.0], //j
        [-2.0, 1.0, -1.0], //i
        [4.0, 1.0, -1.0], //h
        [4.0, -1.0, -1.0], //g
        [-2.0, -1.0, -1.0], //f

        [-2.0, -5.0, -1.0], //e
        [4.0, -5.0, -1.0], //d
        [4.0, -7.0, -1.0], //c
        [-4.0, -7.0, -1.0] //b
    ]
    var AFaces = [
        [0, 1, 2],
        [0, 2, 3],
        [0, 3, 11],
        [11, 3, 8],
        [8, 11, 10],
        [8, 10, 9],
        [4, 7, 6],
        [4, 5, 6],

        [12, 13, 14],
        [12, 14, 15],
        [12, 15, 23],
        [23, 15, 20],
        [20, 23, 22],
        [20, 22, 21],
        [16, 19, 18],
        [16, 17, 18],

        [0, 11, 23],
        [12, 0, 23],

        [11, 10, 22],
        [11, 23, 22],

        [9, 10, 22],
        [9, 21, 22],

        [8, 9, 21],
        [8, 20, 21],

        [7, 8, 20],
        [7, 19, 20],

        [6, 7, 19],
        [6, 18, 19],

        [5, 6, 18],
        [5, 17, 18],

        [4, 5, 17],
        [4, 16, 17],

        [3, 4, 16],
        [3, 15, 16],

        [2, 3, 15],
        [2, 14, 15],

        [1, 2, 14],
        [1, 13, 14],

        [0, 1, 13],
        [0, 12, 13]
    ]

    var Hvertices = generate3D(AVertex, AFaces)
    AColor = generateColor(AVertex, AFaces)
    object = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, object)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(Hvertices), gl.STATIC_DRAW)
    object.itemSize = 3
    object.numItems = Hvertices.length / 3
    objectColor = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, objectColor)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(AColor), gl.STATIC_DRAW)
    objectColor.itemSize = 4
    objectColor.numItems = object.numItems
    objectBounderies = [
        [-4.0, 7.0, 1.0],
        [4.0, 7.0, 1.0],
        [4.0, -7.0, 1.0],
        [-4.0, -7.0, 1.0],
        [-4.0, 7.0, -1.0],
        [4.0, 7.0, -1.0],
        [4.0, -7.0, -1.0],
        [-4.0, -7.0, -1.0],
    ]

    var Cvertex = [
        [-25.0, 25.0, 25.0],
        [-25.0, -25.0, 25.0],
        [25.0, 25.0, 25.0],
        [25.0, -25.0, 25.0],
        [-25.0, 25.0, -25.0],
        [-25.0, -25.0, -25.0],
        [25.0, 25.0, -25.0],
        [25.0, -25.0, -25.0],
    ]
    var Cfaces = [
        [0,2],
        [0,4],
        [4,6],
        [2,6],
        [4,5],
        [6,7],
        [0,1],
        [2,3],
        [1,5],
        [5,7],
        [3,7],
        [1,3]
    ]
    var Cvertices = generate3D(Cvertex, Cfaces)
    Ccolor = generateColor(Cvertex, Cfaces)
    outer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, outer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(Cvertices), gl.STATIC_DRAW)
    outer.itemSize = 3
    outer.numItems = Cvertices.length / 3
    outerColor = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, outerColor)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(Ccolor), gl.STATIC_DRAW)
    outerColor.itemSize = 4
    outerColor.numItems = outer.numItems
    outerBounderies = [
        [25.0, 25.0, 25.0],
        [-25.0, -25.0, -25.0]
    ]
}

function drawScene() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    mat4.perspective(pMatrix, glMatrix.toRadian(45), gl.viewportWidth / gl.viewportHeight, 0.1, 200.0)
    mat4.identity(mvMatrix)
    mat4.translate(mvMatrix, mvMatrix, [0.0, 0.0, -100.0])
    mvPushMatrix()
    gl.bindBuffer(gl.ARRAY_BUFFER, outer)
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, outer.itemSize, gl.FLOAT, false, 0, 0)
    gl.bindBuffer(gl.ARRAY_BUFFER, outerColor)
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, outerColor.itemSize, gl.FLOAT, false, 0, 0)
    var outer_matrix = mat4.create()
    mat4.copy(outer_matrix, mvMatrix)
    //mat4.rotate(mvMatrix, mvMatrix, glMatrix.toRadian(objectAngle), [1.0, 1.0, 0.0])
    setMatrixUniforms()
    gl.drawArrays(gl.LINES, 0, outer.numItems)
    mvPopMatrix()

    mvPushMatrix()
    mat4.translate(mvMatrix, mvMatrix, objectTranslate)
    mat4.rotate(mvMatrix, mvMatrix, glMatrix.toRadian(objectAngle), [0.4, 2.0, 0.0])
    gl.bindBuffer(gl.ARRAY_BUFFER, object)
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, object.itemSize, gl.FLOAT, false, 0, 0)
    gl.bindBuffer(gl.ARRAY_BUFFER, objectColor)
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, objectColor.itemSize, gl.FLOAT, false, 0, 0)
    var huruf_matrix = mat4.create()
    mat4.copy(huruf_matrix, mvMatrix)
    setMatrixUniforms()
    gl.drawArrays(gl.TRIANGLES, 0, object.numItems)
    mvPopMatrix()
    checkCollision(outer_matrix, huruf_matrix)
}

var lastTime = 0
function animate() {
    var timeNow = new Date().getTime()
    if (lastTime != 0) {
        var elapsed = timeNow - lastTime
        objectAngle += ((90 * elapsed) / 1000.0)*objectRotation
        objectTranslate[0] += objectVertex[0]
        objectTranslate[1] += objectVertex[1]
        objectTranslate[2] += objectVertex[2]
    }
    lastTime = timeNow
}

function tick() {
    requestAnimationFrame(tick)
    drawScene()
    animate()
}

function webGLStart() {
    var canvas = document.getElementById('mycanvas')
    initGL(canvas)
    initShaders()
    initBuffers()
    gl.clearColor(0.0, 0.0, 0.0, 1.0)
    gl.enable(gl.DEPTH_TEST)
    tick()
}