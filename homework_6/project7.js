// Returns model-view transformation matrix from translations and X/Y rotations
function GetModelViewMatrix(translationX, translationY, translationZ, rotationX, rotationY) {
    const cx = Math.cos(rotationX), sx = Math.sin(rotationX);
    const cy = Math.cos(rotationY), sy = Math.sin(rotationY);

    const Rx = [
        1,  0,   0, 0,
        0, cx, sx, 0,
        0, -sx, cx, 0,
        0,  0,  0, 1
    ];

    const Ry = [
        cy, 0, -sy, 0,
        0,  1,  0,  0,
        sy, 0, cy,  0,
        0,  0,  0,  1
    ];

    const T = [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        translationX, translationY, translationZ, 1
    ];

    return MatrixMult(T, MatrixMult(Ry, Rx));
}


// MeshDrawer class implementation
class MeshDrawer {
    constructor() {
        this.swap = false;
        this.useTex = true;
        this.lightDir = [0, 0, -1];
        this.shininess = 1;

        this.prog = InitShaderProgram(this.vsSource(), this.fsSource());
        this.mvp = gl.getUniformLocation(this.prog, 'mvp');
        this.mv = gl.getUniformLocation(this.prog, 'mv');
        this.normTrans = gl.getUniformLocation(this.prog, 'normTrans');
        this.swapYZUniform = gl.getUniformLocation(this.prog, 'swapYZ');
        this.useTextureUniform = gl.getUniformLocation(this.prog, 'useTexture');
        this.lightDirUniform = gl.getUniformLocation(this.prog, 'lightDir');
        this.shininessUniform = gl.getUniformLocation(this.prog, 'shininess');

        this.vertPos = gl.getAttribLocation(this.prog, 'pos');
        this.texCoord = gl.getAttribLocation(this.prog, 'uv');
        this.normal = gl.getAttribLocation(this.prog, 'nrm');

        this.positionBuffer = gl.createBuffer();
        this.texCoordBuffer = gl.createBuffer();
        this.normalBuffer = gl.createBuffer();

        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }

    setMesh(vertPos, texCoords, normals) {
        this.numTriangles = vertPos.length / 3;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
    }

    swapYZ(swap) {
        this.swap = swap;
    }

    draw(matrixMVP, matrixMV, matrixNormal) {
        gl.useProgram(this.prog);

        gl.uniformMatrix4fv(this.mvp, false, matrixMVP);
        gl.uniformMatrix4fv(this.mv, false, matrixMV);
        gl.uniformMatrix3fv(this.normTrans, false, new Float32Array([
            matrixNormal[0], matrixNormal[1], matrixNormal[2],
            matrixNormal[3], matrixNormal[4], matrixNormal[5],
            matrixNormal[6], matrixNormal[7], matrixNormal[8]
        ]));

        gl.uniform1i(this.swapYZUniform, this.swap);
        gl.uniform1i(this.useTextureUniform, this.useTex);
        gl.uniform3fv(this.lightDirUniform, this.lightDir);
        gl.uniform1f(this.shininessUniform, this.shininess);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.vertexAttribPointer(this.vertPos, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.vertPos);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.vertexAttribPointer(this.texCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.texCoord);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.vertexAttribPointer(this.normal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.normal);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);

        gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);
    }

    setTexture(img) {
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
        gl.generateMipmap(gl.TEXTURE_2D);
    }

    showTexture(show) {
        this.useTex = show;
    }

    setLightDir(x, y, z) {
        this.lightDir = [x, y, z];
    }

    setShininess(shininess) {
        this.shininess = shininess;
    }

    vsSource() {
        return `
            attribute vec3 pos;
            attribute vec2 uv;
            attribute vec3 nrm;

            uniform mat4 mvp;
            uniform mat4 mv;
            uniform mat3 normTrans;
            uniform bool swapYZ;

            varying vec3 fragPos;
            varying vec2 texCoord;
            varying vec3 normal;

            void main() {
                vec3 position = pos;
                vec3 normalVec = nrm;

                if (swapYZ) {
                    position = position.xzy;
                    normalVec = normalVec.xzy;
                }

                fragPos = vec3(mv * vec4(position, 1.0));
                texCoord = uv;
                normal = normalize(normTrans * normalVec);
                gl_Position = mvp * vec4(position, 1.0);
            }
        `;
    }

    fsSource() {
        return `
            precision mediump float;
            uniform sampler2D tex;
            uniform bool useTexture;
            uniform vec3 lightDir;
            uniform float shininess;

            varying vec3 fragPos;
            varying vec2 texCoord;
            varying vec3 normal;

            void main() {
                vec3 norm = normalize(normal);
                vec3 light = normalize(lightDir);
                vec3 view = normalize(-fragPos);
                vec3 refl = reflect(-light, norm);

                float diff = max(dot(norm, light), 0.0);
                float spec = pow(max(dot(view, refl), 0.0), shininess);

                vec3 color = useTexture ? texture2D(tex, texCoord).rgb : vec3(1.0);
                vec3 result = color * diff + vec3(spec);
                gl_FragColor = vec4(result, 1.0);
            }
        `;
    }
}


// Simulation time step: Euler + spring + collision
function SimTimeStep(dt, positions, velocities, springs, stiffness, damping, particleMass, gravity, restitution) {
    const forces = positions.map(() => gravity.mul(particleMass));

    // Add spring & damping forces
    for (const { p0, p1, rest } of springs) {
        const x0 = positions[p0];
        const x1 = positions[p1];
        const v0 = velocities[p0];
        const v1 = velocities[p1];

        const dx = x1.sub(x0);
        const dir = dx.unit();
        const dist = dx.len();

        const springForce = dir.mul(stiffness * (dist - rest));
        const dampingForce = dir.mul(damping * dir.dot(v1.sub(v0)));
        const totalForce = springForce.add(dampingForce);

        forces[p0].inc(totalForce);
        forces[p1].dec(totalForce);
    }

    // Integrate using semi-implicit Euler
    for (let i = 0; i < positions.length; i++) {
        const a = forces[i].div(particleMass);
        velocities[i].inc(a.mul(dt));
        positions[i].inc(velocities[i].mul(dt));

        // Collision with box walls [-1, 1]
        for (const axis of ['x', 'y', 'z']) {
            if (positions[i][axis] < -1) {
                positions[i][axis] = -1;
                if (velocities[i][axis] < 0)
                    velocities[i][axis] *= -restitution;
            } else if (positions[i][axis] > 1) {
                positions[i][axis] = 1;
                if (velocities[i][axis] > 0)
                    velocities[i][axis] *= -restitution;
            }
        }
    }
}
