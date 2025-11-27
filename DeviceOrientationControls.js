// DeviceOrientationControls.js
import {
    Euler,
    EventDispatcher,
    MathUtils,
    Quaternion,
    Vector3
} from "https://unpkg.com/three@0.159.0/build/three.module.js";

const _euler = new Euler();
const _vec3  = new Vector3();
const _quat  = new Quaternion();

export class DeviceOrientationControls extends EventDispatcher {

    constructor( object ) {
        super();
        this.object = object;
        this.object.rotation.reorder( 'YXZ' );
        this.enabled = true;
        this.deviceOrientation = { alpha: 0, beta: 0, gamma: 0 };
        this.screenOrientation = 0;
        this.alphaOffset = 0;
        this.onDeviceOrientationChangeEvent = ( event ) => {
            this.deviceOrientation = {
                alpha: event.alpha !== null ? event.alpha : 0,
                beta: event.beta !== null ? event.beta : 0,
                gamma: event.gamma !== null ? event.gamma : 0,
                absolute: event.absolute || false
            };
        };
        this.onScreenOrientationChangeEvent = () => {
            this.screenOrientation = (screen.orientation && screen.orientation.angle) ? screen.orientation.angle : (window.orientation || 0);
        };
        this.connect();
    }

    async connect() {
        this.onScreenOrientationChangeEvent();
        if ( typeof DeviceOrientationEvent !== "undefined" &&
             typeof DeviceOrientationEvent.requestPermission === "function" ) {

            document.body.addEventListener("click", async () => {
                try {
                    const response = await DeviceOrientationEvent.requestPermission();
                    if (response === "granted") {
                        window.addEventListener("deviceorientation", this.onDeviceOrientationChangeEvent);
                    } else {
                        console.warn("Permissão de DeviceOrientation negada:", response);
                    }
                } catch (err) {
                    console.warn("Erro pedindo permissao deviceorientation:", err);
                }
            }, { once: true });

        } else {
            window.addEventListener("deviceorientation", this.onDeviceOrientationChangeEvent);
        }

        window.addEventListener("orientationchange", this.onScreenOrientationChangeEvent);

        this.enabled = true;
    }

    disconnect() {
        window.removeEventListener("deviceorientation", this.onDeviceOrientationChangeEvent);
        window.removeEventListener("orientationchange", this.onScreenOrientationChangeEvent);
        this.enabled = false;
    }

    update() {
        if (!this.enabled) return;
        const device = this.deviceOrientation;
        if (device) {
            const alpha = device.alpha ? MathUtils.degToRad(device.alpha) + this.alphaOffset : 0;
            const beta  = device.beta  ? MathUtils.degToRad(device.beta)  : 0;
            const gamma = device.gamma ? MathUtils.degToRad(device.gamma) : 0;
            const orient = this.screenOrientation ? MathUtils.degToRad(this.screenOrientation) : 0;
            this.setObjectQuaternion(this.object.quaternion, alpha, beta, gamma, orient);
        }
    }

    setObjectQuaternion(quaternion, alpha, beta, gamma, orient) {
        _euler.set(beta, alpha, -gamma, "YXZ");
        quaternion.setFromEuler(_euler);
        quaternion.multiply(_quat.setFromAxisAngle(_vec3.set(0, 0, 1), -orient));
    }

    dispose() {
        this.disconnect();
    }
}
