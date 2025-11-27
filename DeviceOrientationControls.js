// DeviceOrientationControls.js
// Standalone version (Three.js r159+ compatible)

import {
    Euler,
    EventDispatcher,
    MathUtils,
    Quaternion,
    Vector3
} from "https://unpkg.com/three@0.159.0/build/three.module.js";

const _euler = new Euler();
const _vector3 = new Vector3();
const _quaternion = new Quaternion();

export class DeviceOrientationControls extends EventDispatcher {

    constructor( object ) {

        super();

        this.object = object;
        this.object.rotation.reorder( 'YXZ' );

        this.enabled = true;

        this.deviceOrientation = {};
        this.screenOrientation = 0;

        this.alphaOffset = 0; // configurable correction value

        this.onDeviceOrientationChangeEvent = ( event ) => {

            this.deviceOrientation = event;

        };

        this.onScreenOrientationChangeEvent = () => {

            this.screenOrientation = window.orientation || 0;

        };

        this.connect();

    }

    connect() {

        this.onScreenOrientationChangeEvent(); // run once on load

        // iOS requires user gesture
        if ( typeof DeviceOrientationEvent !== "undefined" &&
             typeof DeviceOrientationEvent.requestPermission === "function" ) {

            document.body.addEventListener( "click", async () => {
                const r = await DeviceOrientationEvent.requestPermission();
                if ( r === "granted" ) {
                    window.addEventListener( "deviceorientation", this.onDeviceOrientationChangeEvent );
                }
            }, { once: true });

        } else {
            window.addEventListener( "deviceorientation", this.onDeviceOrientationChangeEvent );
        }

        window.addEventListener( "orientationchange", this.onScreenOrientationChangeEvent );

        this.enabled = true;

    }

    disconnect() {

        window.removeEventListener( "deviceorientation", this.onDeviceOrientationChangeEvent );
        window.removeEventListener( "orientationchange", this.onScreenOrientationChangeEvent );

        this.enabled = false;

    }

    update() {

        if ( this.enabled === false ) return;

        const device = this.deviceOrientation;

        if ( device ) {

            const alpha = device.alpha ? MathUtils.degToRad( device.alpha ) + this.alphaOffset : 0; // Z
            const beta  = device.beta  ? MathUtils.degToRad( device.beta )  : 0; // X'
            const gamma = device.gamma ? MathUtils.degToRad( device.gamma ) : 0; // Y''
            const orient = this.screenOrientation ? MathUtils.degToRad( this.screenOrientation ) : 0;

            this.setObjectQuaternion( this.object.quaternion, alpha, beta, gamma, orient );

        }

    }

    setObjectQuaternion( quaternion, alpha, beta, gamma, orient ) {

        _euler.set( beta, alpha, -gamma, "YXZ" );
        quaternion.setFromEuler( _euler );
        quaternion.multiply( _quaternion.setFromAxisAngle( _vector3.set( 0, 0, 1 ), - orient ) );

    }

    dispose() {

        this.disconnect();

    }

}
