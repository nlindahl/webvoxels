import * as THREE from 'three'
var SimplexNoise = require('simplex-noise');
var sys = require('sys');

const chunkSizeX = 32;
const chunkSizeY = 64;
const chunkSizeZ = 32;

const noiseHeight = 62;
const noiseSize = 250;

export default class Chunk {
	constructor(scene, position, noiseFunc) {
		this._scene = scene;
		this._position = position;
		this._simplex = noiseFunc;
		this.changed = true;
	}

	rebuild() {
		var t0 = performance.now();
		this.generateInitialArray();
		var t1 = performance.now();
		console.log("Terrain generation took " + (t1 - t0) + " milliseconds.")
		
		t0 = performance.now();
		this.generateMesh();
		t1 = performance.now();
		console.log("Mesh generation took " + (t1 - t0) + " milliseconds.")
		this.changed = false;
	}

	generateInitialArray() {
		this._blocks = new Array(chunkSizeX);
		for(var x = 0; x < chunkSizeX; ++x) {
			var xBlocks = new Array(chunkSizeY);
			for(var y = 0; y < chunkSizeY; ++y) {
				var yBlocks = new Array(chunkSizeZ);
				for(var z = 0; z < chunkSizeZ; ++z) {
					if(this.noise((this._position.x + x)/noiseSize - 0.5, (this._position.z + z)/noiseSize - 0.5) > y)
						yBlocks[z] = 'dirt';
					else
						yBlocks[z] = 'air';
				}
				xBlocks[y] = yBlocks;
				yBlocks = null;
			}
			this._blocks[x] = xBlocks;
			xBlocks = null;
		}
	}

	noise(nx, nz) {
		return (this._simplex.noise2D(nx, nz) / 2 + 0.5) * noiseHeight;
	}

	shouldGenerateFace(x, y, z) {
		if (x >= 0 && x < chunkSizeX && y >= 0 && y < chunkSizeY && z >= 0 && z < chunkSizeZ) {
			return this._blocks[x][y][z] === 'air'
		}
		return true;
	}

	generateMesh() {

		var tmpGeometry = new THREE.Geometry();
		var matrix = new THREE.Matrix4();

		//Cretate the differente faces
		var topFace = new THREE.PlaneBufferGeometry(1, 1);
		topFace.rotateX(-Math.PI/2);
		topFace.translate(0, 0.5, 0);

		var botFace = new THREE.PlaneBufferGeometry(1, 1);
		botFace.rotateX(Math.PI/2);
		botFace.translate(0, -0.5, 0);

		var frontFace = new THREE.PlaneBufferGeometry(1, 1);
		frontFace.translate(0, 0, 0.5);

		var backFace = new THREE.PlaneBufferGeometry(1, 1);
		backFace.rotateX(Math.PI);
		backFace.translate(0, 0, -0.5);

		var leftFace = new THREE.PlaneBufferGeometry(1, 1);
		leftFace.rotateY(-Math.PI/2);
		leftFace.translate(-0.5, 0, 0);

		var rightFace = new THREE.PlaneBufferGeometry(1, 1);
		rightFace.rotateY(Math.PI/2);
		rightFace.translate(0.5, 0, 0);

		var topFaceGeometry = new THREE.Geometry().fromBufferGeometry(topFace);
		var botFaceGeometry = new THREE.Geometry().fromBufferGeometry(botFace);
		var frontFaceGeometry = new THREE.Geometry().fromBufferGeometry(frontFace);
		var backFaceGeometry = new THREE.Geometry().fromBufferGeometry(backFace);
		var leftFaceGeometry = new THREE.Geometry().fromBufferGeometry(leftFace);
		var rightFaceGeometry = new THREE.Geometry().fromBufferGeometry(rightFace);

		for(var x = 0; x < chunkSizeX; ++x) {
			for(var y = 0; y < chunkSizeY; ++y) {
				for(var z = 0; z < chunkSizeZ; ++z) {

					var blockType = this._blocks[x][y][z];
					if(blockType === 'air')
						continue;

					matrix.makeTranslation(
						this._position.x + x,
						this._position.y + y,
						this._position.z + z
					);

					if(this.shouldGenerateFace(x+1, y, z)) {
						tmpGeometry.merge(rightFaceGeometry, matrix)
					}
					if(this.shouldGenerateFace(x-1, y, z)) {
						tmpGeometry.merge(leftFaceGeometry, matrix)
					}
					if(this.shouldGenerateFace(x, y+1, z)) {
						tmpGeometry.merge(topFaceGeometry, matrix)
					}
					if(this.shouldGenerateFace(x, y-1, z)) {
						tmpGeometry.merge(botFaceGeometry, matrix)
					}
					if(this.shouldGenerateFace(x, y, z+1)) {
						tmpGeometry.merge(frontFaceGeometry, matrix)
					}
					if(this.shouldGenerateFace(x, y, z-1)) {
						tmpGeometry.merge(backFaceGeometry, matrix)
					}
				}
			}
		}

		var geometry = new THREE.BufferGeometry().fromGeometry(tmpGeometry);
		geometry.computeBoundingSphere();

		var texture = new THREE.TextureLoader().load( 'textures/crate.gif' );
		var material = new THREE.MeshPhongMaterial({map: texture})

		var mesh = new THREE.Mesh(geometry, material);
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		this._scene.add(mesh);

		var geometry2 = new THREE.BoxBufferGeometry( 32, 64, 32 );
		geometry2.translate(this._position.x + 32/2, this._position.y + 64/2, this._position.z + 32/2);
		var wireframe = new THREE.WireframeGeometry( geometry2 );
		var line = new THREE.LineSegments( wireframe );
		line.material.depthTest = false;
		line.material.opacity = 0.25;
		line.material.transparent = true;
		this._scene.add( line );
	}
}