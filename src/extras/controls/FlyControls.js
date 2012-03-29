/**
 * @author James Baicoianu / http://www.baicoianu.com/
 */

THREE.FlyControls = function ( object, domElement ) {

	this.object = object;

	this.domElement = ( domElement !== undefined ) ? domElement : document;
	if ( domElement ) this.domElement.setAttribute( 'tabindex', -1 );

	// API

	this.movementSpeed = 1.0;
	this.rollSpeed = 0.005;
    this.mouseEnabled = true;

    this.customControls = {};

    this.controls = {
	"movementSpeedMultiplier": 16, /* shift */
	"forward": 87, /*W*/
	"back": 83, /*S*/
	"left": 65, /*A*/
	"right": 68, /*D*/
	"up": 82, /*R*/
	"down": 70, /*F*/
	"pitchUp": 38, /*up*/
	"pitchDown": 40, /*down*/
	"yawLeft": 37, /*left*/
	"yawRight": 39, /*right*/
	"rollLeft": 81, /*Q*/
	"rollRight": 69 /*E*/
    };

	this.dragToLook = false;
	this.autoForward = false;

	// disable default target object behavior

	this.object.useQuaternion = true;

	// internals

	this.tmpQuaternion = new THREE.Quaternion();

	this.mouseStatus = 0;

	this.moveState = { up: 0, down: 0, left: 0, right: 0, forward: 0, back: 0, pitchUp: 0, pitchDown: 0, yawLeft: 0, yawRight: 0, rollLeft: 0, rollRight: 0 };
	this.moveVector = new THREE.Vector3( 0, 0, 0 );
	this.rotationVector = new THREE.Vector3( 0, 0, 0 );

	this.handleEvent = function ( event ) {

		if ( typeof this[ event.type ] == 'function' ) {

			this[ event.type ]( event );

		}

	};

	this.keydown = function( event ) {

		if ( event.altKey ) {

			return;

		}

		switch( event.keyCode ) {

			case this.controls["movementSpeedMultipler"]: /* shift */ this.movementSpeedMultiplier = .1; break;

			case this.controls["forward"]: /*W*/ this.moveState.forward = 1; break;
			case this.controls["back"]: /*S*/ this.moveState.back = 1; break;

			case this.controls["left"]: /*A*/ this.moveState.left = 1; break;
			case this.controls["right"]: /*D*/ this.moveState.right = 1; break;

			case this.controls["up"]: /*R*/ this.moveState.up = 1; break;
			case this.controls["down"]: /*F*/ this.moveState.down = 1; break;

			case this.controls["pitchUp"]: /*up*/ this.moveState.pitchUp = 1; break;
			case this.controls["pitchDown"]: /*down*/ this.moveState.pitchDown = 1; break;

			case this.controls["yawLeft"]: /*left*/ this.moveState.yawLeft = 1; break;
			case this.controls["yawRight"]: /*right*/ this.moveState.yawRight = 1; break;

			case this.controls["rollLeft"]: /*Q*/ this.moveState.rollLeft = 1; break;
			case this.controls["rollRight"]: /*E*/ this.moveState.rollRight = 1; break;
		default:
		    var cust = this.customControls[event.keyCode];
		    if (cust != null) {
			cust["down"]();
		    }
		}

		this.updateMovementVector();
		this.updateRotationVector();

	};

	this.keyup = function( event ) {

		switch( event.keyCode ) {

			case this.controls["movementSpeedMultipler"]: /* shift */ this.movementSpeedMultiplier = 1; break;

			case this.controls["forward"]: /*W*/ this.moveState.forward = 0; break;
			case this.controls["back"]: /*S*/ this.moveState.back = 0; break;

			case this.controls["left"]: /*A*/ this.moveState.left = 0; break;
			case this.controls["right"]: /*D*/ this.moveState.right = 0; break;

			case this.controls["up"]: /*R*/ this.moveState.up = 0; break;
			case this.controls["down"]: /*F*/ this.moveState.down = 0; break;

			case this.controls["pitchUp"]: /*up*/ this.moveState.pitchUp = 0; break;
			case this.controls["pitchDown"]: /*down*/ this.moveState.pitchDown = 0; break;

			case this.controls["yawLeft"]: /*left*/ this.moveState.yawLeft = 0; break;
			case this.controls["yawRight"]: /*right*/ this.moveState.yawRight = 0; break;

			case this.controls["rollLeft"]: /*Q*/ this.moveState.rollLeft = 0; break;
			case this.controls["rollRight"]: /*E*/ this.moveState.rollRight = 0; break;
		default:
		    var cust = this.customControls[event.keyCode];
		    if (cust != null) {
			cust["up"]();
		    }
		}

		this.updateMovementVector();
		this.updateRotationVector();

	};

	this.mousedown = function( event ) {
	    if (this.mouseEnabled) {
		if ( this.domElement !== document ) {

			this.domElement.focus();

		}

		event.preventDefault();
		event.stopPropagation();

		if ( this.dragToLook ) {

			this.mouseStatus ++;

		} else {

			switch ( event.button ) {

				case 0: this.object.moveForward = true; break;
				case 2: this.object.moveBackward = true; break;

			}

		}
	    }
	};

	this.mousemove = function( event ) {
	    if (this.mouseEnabled) {
		if ( !this.dragToLook || this.mouseStatus > 0 ) {

			var container = this.getContainerDimensions();
			var halfWidth  = container.size[ 0 ] / 2;
			var halfHeight = container.size[ 1 ] / 2;

			this.moveState.yawLeft   = - ( ( event.pageX - container.offset[ 0 ] ) - halfWidth  ) / halfWidth;
			this.moveState.pitchDown =   ( ( event.pageY - container.offset[ 1 ] ) - halfHeight ) / halfHeight;

			this.updateRotationVector();

		}
	    }
	};

	this.mouseup = function( event ) {
	    if (this.mouseEnabled) {
		event.preventDefault();
		event.stopPropagation();

		if ( this.dragToLook ) {

			this.mouseStatus --;

			this.moveState.yawLeft = this.moveState.pitchDown = 0;

		} else {

			switch ( event.button ) {

				case 0: this.moveForward = false; break;
				case 2: this.moveBackward = false; break;

			}

		}

		this.updateRotationVector();
	    }
	};

	this.update = function( delta ) {

		var moveMult = delta * this.movementSpeed;
		var rotMult = delta * this.rollSpeed;

		this.object.translateX( this.moveVector.x * moveMult );
		this.object.translateY( this.moveVector.y * moveMult );
		this.object.translateZ( this.moveVector.z * moveMult );

		this.tmpQuaternion.set( this.rotationVector.x * rotMult, this.rotationVector.y * rotMult, this.rotationVector.z * rotMult, 1 ).normalize();
		this.object.quaternion.multiplySelf( this.tmpQuaternion );

		this.object.matrix.setPosition( this.object.position );
		this.object.matrix.setRotationFromQuaternion( this.object.quaternion );
		this.object.matrixWorldNeedsUpdate = true;


	};

	this.updateMovementVector = function() {

		var forward = ( this.moveState.forward || ( this.autoForward && !this.moveState.back ) ) ? 1 : 0;

		this.moveVector.x = ( -this.moveState.left    + this.moveState.right );
		this.moveVector.y = ( -this.moveState.down    + this.moveState.up );
		this.moveVector.z = ( -forward + this.moveState.back );

		//console.log( 'move:', [ this.moveVector.x, this.moveVector.y, this.moveVector.z ] );

	};

	this.updateRotationVector = function() {

		this.rotationVector.x = ( -this.moveState.pitchDown + this.moveState.pitchUp );
		this.rotationVector.y = ( -this.moveState.yawRight  + this.moveState.yawLeft );
		this.rotationVector.z = ( -this.moveState.rollRight + this.moveState.rollLeft );

		//console.log( 'rotate:', [ this.rotationVector.x, this.rotationVector.y, this.rotationVector.z ] );

	};

	this.getContainerDimensions = function() {

		if ( this.domElement != document ) {

			return {
				size	: [ this.domElement.offsetWidth, this.domElement.offsetHeight ],
				offset	: [ this.domElement.offsetLeft,  this.domElement.offsetTop ]
			};

		} else {

			return {
				size	: [ window.innerWidth, window.innerHeight ],
				offset	: [ 0, 0 ]
			};

		}

	};

	function bind( scope, fn ) {

		return function () {

			fn.apply( scope, arguments );

		};

	};

	this.domElement.addEventListener( 'mousemove', bind( this, this.mousemove ), false );
	this.domElement.addEventListener( 'mousedown', bind( this, this.mousedown ), false );
	this.domElement.addEventListener( 'mouseup',   bind( this, this.mouseup ), false );

	this.domElement.addEventListener( 'keydown', bind( this, this.keydown ), false );
	this.domElement.addEventListener( 'keyup',   bind( this, this.keyup ), false );

	this.updateMovementVector();
	this.updateRotationVector();

};
