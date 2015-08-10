//hack for: self.target = random.choice(self.parent.food)
var foodpositions = [
    new THREE.Vector3( 300, 0, 0),
    new THREE.Vector3(-300, 0, 0),
    new THREE.Vector3(0,  300, 0),
    new THREE.Vector3(0, -300, 0),
    new THREE.Vector3(0, 0,  300),
    new THREE.Vector3(0, 0, -300)
];

AN.food = [];

AN.Apple = function() {
    var faceIndices = [ 'a', 'b', 'c' ];

    var color, f, p, vertexIndex, radius = 40;
    var geometry  = new THREE.IcosahedronGeometry( radius, 1 );

    for ( var i = 0; i < geometry.faces.length; i ++ ) {
	f  = geometry.faces[ i ];

	for( var j = 0; j < 3; j++ ) {
	    vertexIndex = f[ faceIndices[ j ] ];

	    p = geometry.vertices[ vertexIndex ];

	    color = new THREE.Color( 0xffffff );
	    color.setHSL( ( p.y / radius + 1 ) / 2, 1.0, 0.5 );
	    f.vertexColors[ j ] = color;
	}
    }

    var material = new THREE.MeshLambertMaterial( { color: 0xffffff, shading: THREE.FlatShading, vertexColors: THREE.VertexColors } )
    //XXX note: should actually reuse the geometry and material!

    THREE.Mesh.call(this, geometry, material);
}

AN.Apple.prototype = Object.create( THREE.Mesh.prototype );
AN.Apple.prototype.constructor = AN.Apple;

AN.Apple.prototype.affect = function(eater) {
    eater.grow();
};
