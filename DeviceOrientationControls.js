// DeviceOrientationControls.js — compatível com Three.js r160+

import {
    Euler, EventDispatcher, MathUtils, Quaternion, Vector3
} from "https://unpkg.com/three@0.160.0/build/three.module.js";

const _zee = new Vector3(0, 0, 1);
const _euler = new Euler();
const _q0 = new Quaternion();
const _q1 = new Quaternion(- Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));

export class DeviceOrientationControls extends EventDispatcher {

    constructor(object) {
        super();
        this.object = object;
        this.object.rotation.reorder("YXZ");

        this.enabled = true;

        this.deviceOrientation = {};
        this.screenOrientation = 0;

        this.alphaOffset = 0;

        this.onDeviceOrientationChangeEvent = (event) => {
            this.deviceOrientation = event;
        };

        this.onScreenOrientationChangeEvent = () => {
            this.screenOrientation = window.orientation || 0;
        };

        this.connect();
    }

    connect() {
        this.onScreenOrientationChangeEvent();

        if (typeof DeviceOrientationEvent !== "undefined" &&
            typeof DeviceOrientationEvent.requestPermission === "function") {

            document.body.addEventListener("click", async () => {
                const permission = await DeviceOrientationEvent.requestPermission();
                if (permission === "granted") {
                    window.addEventListener("deviceorientation", this.onDeviceOrientationChangeEvent);
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
        if (this.enabled === false) return;

        const device = this.deviceOrientation;
        if (!device) return;

        const alpha = device.alpha ? MathUtils.degToRad(device.alpha) + this.alphaOffset : 0;
        const beta  = device.beta  ? MathUtils.degToRad(device.beta)  : 0;
        const gamma = device.gamma ? MathUtils.degToRad(device.gamma) : 0;

        const orient = this.screenOrientation ? MathUtils.degToRad(this.screenOrientation) : 0;

        this.setObjectQuaternion(
            this.object.quaternion,
            alpha, beta, gamma, orient
        );
    }

    setObjectQuaternion(quaternion, alpha, beta, gamma, orient) {

        _euler.set(beta, alpha, -gamma, 'YXZ');
        quaternion.setFromEuler(_euler);
        quaternion.multiply(_q1);
        quaternion.multiply(_q0.setFromAxisAngle(_zee, -orient));
    }

    dispose() {
        this.disconnect();
    }
}
