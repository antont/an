var AN = {};

function randomChoice(arr) {
    return arr[Math.floor(arr.length * Math.random())];
}

function createFaceWithVertexColors(facear) {
    var posar = facear[0];
    var colar = facear[1];
    var geometry = new THREE.Geometry();

    for (var i = 0; i < posar.length; i++) {
        var posdata = posar[i];
        var vertex = new THREE.Vector3().fromArray(posdata);
        geometry.vertices.push(vertex);
    }
    
    var face = new THREE.Face3(0, 1, 2);
    geometry.faces.push(face);
    if (geometry.vertices.length == 4) {
        var face2 = new THREE.Face3(0, 3, 2); //http://stackoverflow.com/questions/16498296/three-js-face4-generates-triangle-instead-of-square
        geometry.faces.push(face2);
    }
        
    //geometry.computeBoundingSphere();

    for ( var i = 0; i < geometry.faces.length; i ++ ) {
	var f  = geometry.faces[ i ];

        for( var j = 0; j < 3; j++ ) { //geometry.vertices.length
            var colhex = colar[j];
	    var color = new THREE.Color(colhex);
	    f.vertexColors[j] = color;
	}
    }

    return geometry;
}

AN.Bird = function() {
    var headgeom = new THREE.SphereGeometry( 1, 8, 8 );
    var headmat  = new THREE.MeshLambertMaterial( {color: 0xa0a0a0} );
    this.head = new THREE.Mesh( headgeom, headmat ); //so can grow later, in eating thing
    this.head.position.set(0.8, 0.6, 0);
    this.head.scale.set(0.1, 0.1, 0.1);
        
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

    var geometry1 = createFaceWithVertexColors(wingdata1);
    var geometry2 = createFaceWithVertexColors(wingdata2);
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

    //tail, is simple static quad
    /*py:       Vertex(self, -0.4,  0.0,  0.1),
                Vertex(self, -0.9,  0.3,  0.3),                
                Vertex(self, -0.9,  0.3, -0.3),
                Vertex(self, -0.4,  0.0, -0.1) */
    var taildata = [[
        [-0.4,  0.0,  0],
        [-0.9,  0.3,  0.3],
        [-0.9,  0.3, -0.3],
        [-0.4,  0.0, -0.1]
   ], [
       0xff0000,
       0x00ff00,
       0x0000ff,
       0xff00ff
    ]];
    var tailgeom = createFaceWithVertexColors(taildata);
    geometry1.merge(tailgeom);

    var neckgeom = new THREE.Geometry();
    var neckmat = new THREE.LineBasicMaterial({
        color: headmat.color
    });
    neckgeom.vertices.push(this.head.position.clone());
    neckgeom.vertices.push(new THREE.Vector3(
        0.4, 0.0, 0.0
    ));
    var neck = new THREE.Line(neckgeom, neckmat);
    //can't marge is is a Line, not Mesh - oops
    //geometry1.merge(neckgeom);
    //adding as a child below, like the head (but that's by design. this refactor to mesh perhaps)

    THREE.Mesh.call(this, geometry1, material);

    this.add(neck);

    //head is not merged but separate for easy manip (grow when eats)
    this.add(this.head); 

    this.wdir = -1;
    this.vel = new THREE.Vector3();
    this.target = null;

    //for having offspring
    this.fertilized = false; //'pregnant', more like mammals than birds actually but oh well
    this.food = null; //list in original but in practise i think carries one only? so just single here
};

AN.Bird.prototype = Object.create( THREE.Mesh.prototype );
AN.Bird.prototype.constructor = AN.Bird;
AN.Bird.SPEED = 1.8; //0.3;

AN.Bird.prototype.targetFood = function () { //begin_turn of HungryBird in bird.py
    if (this.target === null) {
        //this.target = new THREE.Vector3();
        this.target = randomChoice(AN.food); //XXX TODO: food doesn't disappear yet, must fix when do that
    }
    //TODO: add logic for disappearing food - others may get the target before this makes it, see bird.py
}

AN.Bird.prototype.setTowardsTarget = function() {
    var d = new THREE.Vector3().subVectors(this.target.position, this.position);
    if (d.lengthSq() < 10) {
        return true; //reached this target now already
    } else {
        this.speed = AN.Bird.SPEED;

        d.setLength(this.speed);
        this.vel = d;

        this.lookAt(this.target.position);
        this.rotateY(180); //oh well.

        return false; //not there yet
    }
}

AN.Bird.prototype.update = function () {
    //console.log("BIRD update");
    
    //logic - the 'begin_round' part (not fps bound, but could be more rare) of the soya3d original
    if (this.food) {
        if (this.fertilized) {
            //can go breed
            console.log("+");
            if (this.target === null) {
                console.log("_");
                this.target = new THREE.Object3D();
                this.target.position.set(
                    (Math.random() - 0.5) * 1000,
                    -500, 0);
            }
            if (this.setTowardsTarget()) {
                var chick = this.breed();
                this.target = null;
            }
        } else {
            this.food.affect(this);
            this.food = null;
        }
    } else {
        this.targetFood();
        if (this.target != null) {
            if (this.setTowardsTarget()) {
                console.log("BIRD logic: reached target.");
                this.food = this.target; //now grabs the food first, no immediate eat
                scene.remove(this.target);
                this.target = null;
            }
        }
    }
    
    this.animate(); //could have different fps but same for both logic & anim now
}

AN.Bird.prototype.animate = function() {
    //the soya3d advance_time part, i.e. animation code:
    
    //movement
    this.position.add(this.vel);

    //wing flapping. not w.r.t. movement now
    var y = this.tip1.y;
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

AN.Bird.prototype.grow = function() {
    //this.head.scale.multiplyScalar(1.5); //actually in original grows only once, and that is indeed better than this..
    this.head.scale.set(0.15, 0.15, 0.15);
    this.head.geometry.verticesNeedUpdate = true;
};

AN.Bird.prototype.fertilize = function() {
    console.log(this + " fertilized!");
    this.fertilized = true;
};

AN.Bird.prototype.breed = function() {
    //now can do alone - for simplicity sake now(?)
    console.log("BREED!");
    if (this.food) {
        var o = new this.constructor();
        scene.add(o);
        o.position.copy(this.position);
        o.scale.set(this.scale.x / 2,
                    this.scale.y / 2,
                    this.scale.z / 2);
        this.food = null;
        return o;
    } else {
        return false;
    }
}
