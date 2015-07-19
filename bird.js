var AN = {};

//hack for: self.target = random.choice(self.parent.food)
AN.food = [
    new THREE.Vector3( 300, 0, 0),
    new THREE.Vector3(-300, 0, 0),
    new THREE.Vector3(0,  300, 0),
    new THREE.Vector3(0, -300, 0),
    new THREE.Vector3(0, 0,  300),
    new THREE.Vector3(0, 0, -300)
];

function randomChoice(arr) {
    return arr[Math.floor(arr.length * Math.random())];
}

function createFace(facear) {
    var posar = facear[0];
    var colar = facear[1];
    geometry = new THREE.Geometry()
    
    var vertex1 = new THREE.Vector3().fromArray(posar[0]);
    var vertex2 = new THREE.Vector3().fromArray(posar[1]);
    var vertex3 = new THREE.Vector3().fromArray(posar[2]);
    geometry.vertices.push(vertex1);
    geometry.vertices.push(vertex2);
    geometry.vertices.push(vertex3);
    var face = new THREE.Face3(0, 1, 2);
    geometry.faces.push( face );
    geometry.computeBoundingSphere();
            
    for ( var i = 0; i < geometry.faces.length; i ++ ) {
	f  = geometry.faces[ i ];

        for( var j = 0; j < 3; j++ ) {
            var colhex = colar[j];
	    var color = new THREE.Color(colhex);
	    f.vertexColors[j] = color;
	}
    }

    return geometry;
}

AN.Bird = function() {
    var headgeom = new THREE.SphereGeometry( 1, 32, 32 );
    var headmat  = new THREE.MeshBasicMaterial( {color: 0xa0a0a0} );
    this.head = new THREE.Mesh( headgeom, headmat ); //so can grow later, in eating thing
        
    var radius = 1;

    var wingdata1 = [[
        [-radius, 0, 0],
        [ radius, 0, 0],
        [0, radius * 1.3, radius]
    ], [
        0xff0000,
        0x00ff00,
        0x0000ff
    ]];

    var wingdata2 = [[
        [-radius, 0, 0],
        [ radius, 0, 0],
        [0, radius * 1.3, -radius]
    ], [
        0xff0000,
        0x00ff00,
        0x0000ff
    ]];

    geometry1 = createFace(wingdata1);
    geometry2 = createFace(wingdata2);
    geometry1.merge(geometry2);
    
    var material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        shading: THREE.FlatShading,
        vertexColors: THREE.VertexColors,
        side: THREE.DoubleSide
    });

    //for flapping wings in update()
    this.tip1 = geometry1.vertices[2];
    this.tip2 = geometry1.vertices[5];
    this.wdir = -1;

    this.vel = new THREE.Vector3();
    this.target = null;

    this.vel.x = 1;

    THREE.Mesh.call(this, geometry1, material);
    this.add(this.head); //is not merged but separate for easy manip
    this.head.position.set(0.8, 0.6, 0);
    this.head.scale.set(0.1, 0.1, 0.1);
};

AN.Bird.prototype = Object.create( THREE.Mesh.prototype );
AN.Bird.prototype.constructor = AN.Bird;

AN.Bird.prototype.update = function () {
    //console.log("BIRD update");
    
    //logic - the 'begin_round' part (not fps bound, but more rare) of the soya3d original
    if (this.target === null) {
        this.target = new THREE.Vector3();
        //this.target = randomChoice(AN.food);
        this.lookAt(this.target);
    }

    if (this.target != null) {
        var d = new THREE.Vector3().subVectors(this.target, this.position);

        if (d.lengthSquared < 10) {
            this.target = null;
            console.log("BIRD logic: reached target.");
        } else {
            this.speed = 0.3; //XXX
            d.setLength(this.speed);
            this.vel = d;

            //just testing here too
            this.lookAt(this.target);
        }
    }

    //the soya3d advance_time part, i.e. animation code:
    
    //movement
    this.position.add(this.vel);

    //wing flapping. not w.r.t. movement now
    y = this.tip1.y;
    y += this.wdir * 0.06 * 0.16 * 3;
    if (y < -0.6) {
        this.wdir = 1;
    } else if (y > 1.1) {
        this.wdir = -1;
    }
    this.tip1.y = y;
    this.tip2.y = y;
    
    this.geometry.verticesNeedUpdate = true;
};

