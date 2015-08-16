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

AN.Bird = {}; //now just a module, a namespace for bird things

AN.Bird.create = function() {
    //maturity defaults to adult -- is given 0 when breeding to have the helpless hungry offspring
    var maturity = arguments.length <= 0 || arguments[0] === undefined ? 1 : arguments[0];

    var headgeom = new THREE.SphereGeometry( 1, 8, 8 );
    var headmat  = new THREE.MeshLambertMaterial( {color: 0xa0a0a0} );
    var head = new THREE.Mesh( headgeom, headmat ); //so can grow later, in eating thing
    head.position.set(0.8, 0.6, 0);
    head.scale.set(0.1, 0.1, 0.1);
        
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
    var tip1 = geometry1.vertices[2];
    var tip2 = geometry1.vertices[5];

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
    neckgeom.vertices.push(head.position.clone());
    neckgeom.vertices.push(new THREE.Vector3(
        0.4, 0.0, 0.0
    ));
    var neck = new THREE.Line(neckgeom, neckmat);
    //can't marge is is a Line, not Mesh - oops
    //geometry1.merge(neckgeom);
    //adding as a child below, like the head (but that's by design. this refactor to mesh perhaps)

    var mesh = new THREE.Mesh(geometry1, material);

    mesh.add(neck);

    //head is not merged but separate for easy manip (grow when eats)
    mesh.add(head);

    var bird = {};
    bird.mesh = mesh;
    bird.head = head;
    bird.tip1 = tip1;
    bird.tip2 = tip2;
    bird.wdir = -1;
    bird.vel = new THREE.Vector3();
    bird.target = null;

    //for having offspring
    bird.fertilized = false; //'pregnant', more like mammals than birds actually but oh well
    bird.food = null; //list in original but in practice i think carries one only? so just single here
    bird.offspring = null; //also list in original, following parent biz in human.py, but single ob here now
    bird.maturity = maturity;

    //bird.update = AN.Bird.update;

    return bird;
};

AN.Bird.SPEED = 1.8; //0.3;

AN.Bird.targetFood = function () { //begin_turn of HungryBird in bird.py
    if (this.target === null) {
        //this.target = new THREE.Vector3();
        this.target = randomChoice(AN.food); //XXX TODO: food doesn't disappear yet, must fix when do that
    }
    //TODO: add logic for disappearing food - others may get the target before this makes it, see bird.py
}

AN.Bird.setTowardsTarget = function(curpos, target) {
    var d = new THREE.Vector3().subVectors(curpos, target);
    if (d.lengthSq() < 10) {
        return true; //reached this target now already
    } else {
        this.speed = AN.Bird.SPEED;

        d.setLength(this.speed);
        this.vel = d; 
//XXX TODO GRAAH porting this in functional branch is .. well, where am at now :/
        this.lookAt(this.target.position);
        this.rotateY(180); //oh well.

        return false; //not there yet
    }
}

AN.Bird.update = function (maturity, food, offspring, target,
                           targetFood, setTowardsTarget, fertilized, breed,
                           mesh) {
    //logic - the 'begin_round' part (not fps bound, but could be more rare) of the soya3d original

    if (maturity > 0) {
        if (food) {
            if (offspring) {
                if (offspring.maturity == 0) {
                    if (offspring.food === null) {
                        if (target !== offspring) {
                            target = offspring;
                            console.log("BreedingBird: going to feed a baby", target);
                        }
                        if (setTowardsTarget()) {
                            offspring.food = food;
                            food = null;
                            console.log(".. baby bird fed");
                            target = null;
                        }
                    }
                } else { //mature ones can do well on their own (for now)
                    offspring = null; //pretty extreme: just forget grown children
                }
            } else if (fertilized) {
                //can go breed
                //console.log("+");
                if (target === null) {
                    console.log("_");
                    target = new THREE.Object3D();
                    target.position.set(
                        (Math.random() - 0.5) * 1000,
                            -500, 0);
                }
                if (setTowardsTarget()) {
                    var chick = breed();
                    birds.push(chick); //for index.html animate() to call update -- move to some World thing later
                    target = null;
                }
            } else {
                //food.affect(this); //XXX TODO
                food = null;
            }
        } else {
            targetFood();
            if (target !== null) {
                if (setTowardsTarget()) {
                    console.log("BIRD logic: reached target.");
                    food = target; //now grabs the food first, no immediate eat
                    scene.remove(target);
                    target = null;
                }
            }
        }
    } else {
        if (food) {
            maturity += 1;
            mesh.scale.set(150, 150, 150);
            food = null;
            console.log("chick had food and grew up"); //apparently no special effects from foods to kids..
        }
    }

    //can not create some newstate ob at start an modify as the vals are used also in more logic after mods
    return {
        'target': target,
        //offspring.food,
        'food': food,
        'offspring': offspring,
        //birds,
        'maturity': maturity
    };
}

AN.Bird.animate = function(o3d, vel, wdir, tip1, tip2) {
    //the soya3d advance_time part, i.e. animation code:
    
    //movement
    o3d.position.add(vel);

    //wing flapping. not w.r.t. movement now
    var y = tip1.y;
    y += wdir * 0.06 * 0.16 * 3;
    if (y < -0.6) {
        wdir = 1;
    } else if (y > 1.1) {
        wdir = -1;
    }
    tip1.y = y;
    tip2.y = y;
    
    o3d.geometry.verticesNeedUpdate = true;
    return wdir;
};

AN.Bird.grow = function() {
    //this.head.scale.multiplyScalar(1.5); //actually in original grows only once, and that is indeed better than this..
    this.head.scale.set(0.15, 0.15, 0.15);
    this.head.geometry.verticesNeedUpdate = true;
};

AN.Bird.fertilize = function() {
    console.log(this + " fertilized!");
    this.fertilized = true;
};

AN.Bird.breed = function() {
    //now can do alone - for simplicity sake now(?)
    console.log("BREED!");
    if (this.food) {
        var o = new this.constructor(0); //maturity 0, needs feeding before can fly
        scene.add(o);
        o.position.copy(this.position);
        o.scale.set(this.scale.x / 2,
                    this.scale.y / 2,
                    this.scale.z / 2);
        this.food = null;
        this.offspring = o; //should never override little children as they are fed first before breed more
        this.fertilized = false;
        return o;
    } else {
        return false;
    }
}
