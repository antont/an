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

AN.Apple = function(material) {
    THREE.Mesh.call(this, AN.Apple.geometry, material);
}

//to reuse the geom for all instances
AN.Apple.radius = 40;
AN.Apple.geometry = new THREE.IcosahedronGeometry( AN.Apple.radius, 1 );
AN.Apple.setColors = function(geometry, radius) {
    var faceIndices = [ 'a', 'b', 'c' ];
    var color, f, p, vertexIndex;

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
}
AN.Apple.setColors(AN.Apple.geometry, AN.Apple.radius);

AN.Apple.prototype = Object.create( THREE.Mesh.prototype );
AN.Apple.prototype.constructor = AN.Apple;
AN.Apple.prototype.affect = function(eater) {
    //abstract base, no effect here
};

//apple that grows the eater('s head, in case of Bird)
AN.GrowthApple = function() {
    AN.Apple.call(this, AN.GrowthApple.material);
}
AN.GrowthApple.prototype = Object.create( AN.Apple.prototype );
AN.GrowthApple.material = new THREE.MeshLambertMaterial( { color: 0xffffff, shading: THREE.FlatShading, vertexColors: THREE.VertexColors } )
AN.GrowthApple.prototype.affect = function(eater) {
    eater.grow();
};

//apple that fertilizes the eater / makes it pregnant, causes to have an offspring
AN.FertilizingApple = function() {
    AN.Apple.call(this, AN.FertilizingApple.material);
}
AN.FertilizingApple.prototype = Object.create( AN.Apple.prototype );
AN.FertilizingApple.material = new THREE.MeshLambertMaterial( { color: 0xff00ff, shading: THREE.FlatShading, vertexColors: THREE.VertexColors } )
AN.FertilizingApple.prototype.affect = function(eater) {
    eater.fertilize();
};
