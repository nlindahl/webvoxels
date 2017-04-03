onmessage = function(e) {

	var simplex = e.data.simplex;
	var position = e.data.position;

	const chunkSizeX = 32;
	const chunkSizeY = 40;
	const chunkSizeZ = 32;

	const noiseHeight = 32;
	const noiseSize = 500;


	var noise = function(nx, nz) {
		return (simplex.noise2D(nx, nz) / 2 + 0.5) * noiseHeight;
	};

	var shouldGenerateFace = function(x, y, z) {
		if (x >= 0 && x < chunkSizeX && y >= 0 && y < chunkSizeY && z >= 0 && z < chunkSizeZ) {
			return blocks[x][y][z] === 'air'
		}
		return true;
	}

	var blocks = new Array(chunkSizeX);
	for(var x = 0; x < chunkSizeX; ++x) {
		var xBlocks = new Array(chunkSizeY);
		for(var y = 0; y < chunkSizeX; ++y) {
			var yBlocks = new Array(chunkSizeZ);
			for(var z = 0; z < chunkSizeX; ++z) {
				if(noise((position.x + x)/noiseSize - 0.5, (position.z + z)/noiseSize - 0.5) > y)
					yBlocks[z] ='dirt';
				else
					yBlocks[z] ='air';
			}
			xBlocks[y] = yBlocks;
		}
		blocks[x] = xBlocks;
	}

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
		for(var y = 0; y < chunkSizeX; ++y) {
			for(var z = 0; z < chunkSizeX; ++z) {

				var blockType = blocks[x][y][z];
				if(blockType === 'air')
					continue;

				matrix.makeTranslation(
					position.x + x,
					position.y + y,
					position.z + z
				);

				if(shouldGenerateFace(x+1, y, z)) {
					tmpGeometry.merge(rightFaceGeometry, matrix)
				}
				if(shouldGenerateFace(x-1, y, z)) {
					tmpGeometry.merge(leftFaceGeometry, matrix)
				}
				if(shouldGenerateFace(x, y+1, z)) {
					tmpGeometry.merge(topFaceGeometry, matrix)
				}
				if(shouldGenerateFace(x, y-1, z)) {
					tmpGeometry.merge(botFaceGeometry, matrix)
				}
				if(shouldGenerateFace(x, y, z+1)) {
					tmpGeometry.merge(frontFaceGeometry, matrix)
				}
				if(shouldGenerateFace(x, y, z-1)) {
					tmpGeometry.merge(backFaceGeometry, matrix)
				}
			}
		}
	}

	var geometry = new THREE.BufferGeometry().fromGeometry(tmpGeometry);
	geometry.computeBoundingSphere();
	
	postMessage({
		geometry: geometry
	});
}