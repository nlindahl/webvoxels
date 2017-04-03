import * as THREE from 'three'
import AbstractApplication from 'scripts/views/AbstractApplication'
import Chunk from 'scripts/voxel/Chunk'
const glslify = require('glslify')
const shaderVert = glslify('./../shaders/custom.vert')
const shaderFrag = glslify('./../shaders/custom.frag')
var SimplexNoise = require('simplex-noise');
var Alea = require('alea');

class Main extends AbstractApplication {
    constructor(){

        super();

        this.addLights();
        //this.addObjects();
        var seed = '123452';
        var random = new Alea('alea');
        var simplex = new SimplexNoise(random);
        
        var axisHelper = new THREE.AxisHelper(5);
        this._scene.add(axisHelper);

        var worldSizeX = 2;
        var worldSizeZ = 2;

        this._chunks = new Array();

        for(var x = -worldSizeX; x < worldSizeX; ++x) {
            for(var z = -worldSizeZ; z < worldSizeZ; ++z) {
                this._chunks.push(new Chunk(this._scene, new THREE.Vector3(x * 32, 0, z * 32), simplex));
            }
        }

        this._chunks.forEach((chunk) => {
            if(chunk.changed) {
                chunk.rebuild();
                return true;            
            }
        })

        this.animate();
    }

    rebuildChunks() {
        this._chunks.some((chunk) => {
            if(chunk.changed) {
                chunk.rebuild();
                return true;            
            }
        })
    }

    animate() {
        super.animate();
        this.rebuildChunks()
    }

    addLights() {
        this._light = new THREE.DirectionalLight(0xffffff, 1);
        this._light.position.set(50, 50, 0);
        this._light.castShadow = true;
        this._scene.add(this._light);

        this._ambLight = new THREE.AmbientLight( 0x404040 ); // soft white light
        this._scene.add(this._ambLight);
    }

    addObjects() {
        var boxGeometry = new THREE.BoxGeometry( 1, 1, 1 );
        var texture = new THREE.TextureLoader().load( 'textures/crate.gif' );
        var material = new THREE.MeshPhongMaterial( { map: texture } );
        this._box = new THREE.Mesh( boxGeometry, material );
        this._box.position.y = 0.5;
        this._box.castShadow = true;
        this._box.receiveShadow = true;
        this._scene.add(this._box);

        var floorGeometry = new THREE.PlaneGeometry(10, 10);
        this._floor = new THREE.Mesh(floorGeometry, material);
        this._floor.rotateY(-Math.PI/2);
        this._floor.castShadow = true;
        this._floor.receiveShadow = true;
        this._scene.add(this._floor);
    }

}
export default Main;