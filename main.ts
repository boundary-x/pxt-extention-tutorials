declare interface Math {
    floor(x: number): number;
}

//% weight=10 color=#58ACFA icon="\uf057" block="AI ponybot"
namespace AIponybot {
    /**
     * ---------------PCA9685-------------------
     */
    const PCA9685_ADDRESS = 0x40
    const MODE1 = 0x00
    const MODE2 = 0x01
    const SUBADR1 = 0x02
    const SUBADR2 = 0x03
    const SUBADR3 = 0x04
    const PRESCALE = 0xFE
    const LED0_ON_L = 0x06
    const LED0_ON_H = 0x07
    const LED0_OFF_L = 0x08
    const LED0_OFF_H = 0x09
    const ALL_LED_ON_L = 0xFA
    const ALL_LED_ON_H = 0xFB
    const ALL_LED_OFF_L = 0xFC
    const ALL_LED_OFF_H = 0xFD

    const STP_CHA_L = 2047
    const STP_CHA_H = 4095
    const STP_CHB_L = 1
    const STP_CHB_H = 2047
    const STP_CHC_L = 1023
    const STP_CHC_H = 3071
    const STP_CHD_L = 3071
    const STP_CHD_H = 1023

    const BYG_CHA_L = 3071
    const BYG_CHA_H = 1023
    const BYG_CHB_L = 1023
    const BYG_CHB_H = 3071
    const BYG_CHC_L = 4095
    const BYG_CHC_H = 2047
    const BYG_CHD_L = 2047
    const BYG_CHD_H = 4095

    export enum Mecanum {
        //% block="↖"
        lf = 1,
        //% block="↑"
        ff = 2,
        //% block="↗"
        rf = 3,
        //% block="←"
        ll = 4,
        //% block="s"
        ss = 5,
        //% block="→"
        rr = 6,
        //% block="↙"
        lb = 7,
        //% block="↓"
        bb = 8,
        //% block="↘"
        rb = 9
    }

    export enum DirControll {
        //% block="↑"
        foward = 1,
        //% block="↓"
        backward = 2,
        //% block="↶"
        CWRotate = 3,
        //% block="↷"
        CCWRotate = 4,
    }

    export enum Stepper {
        //% block="42"
        Ste1 = 1,
        //% block="28"
        Ste2 = 2
    }

    export enum Servos {
        S1 = 0x01,
        S2 = 0x02,
        S3 = 0x03,
        S4 = 0x04,
        S5 = 0x05,
        S6 = 0x06,
        S7 = 0x07,
        S8 = 0x08
    }

    export enum Motors {
        M1 = 0x1,
        M2 = 0x2,
        M3 = 0x3,
        M4 = 0x4
    }

    export enum Dir {
        //% blockId="정회전" block="정회전"
        CW = 1,
        //% blockId="역회전" block="역회전"
        CCW = -1,
    }

    export enum Steppers {
        M1_M2 = 0x1,
        M3_M4 = 0x2
    }

    let initialized = false

    function i2cWrite(addr: number, reg: number, value: number) {
        let buf = pins.createBuffer(2)
        buf[0] = reg
        buf[1] = value
        pins.i2cWriteBuffer(addr, buf)
    }

    function i2cCmd(addr: number, value: number) {
        let buf2 = pins.createBuffer(1)
        buf2[0] = value
        pins.i2cWriteBuffer(addr, buf2)
    }

    function i2cRead(addr: number, reg: number) {
        pins.i2cWriteNumber(addr, reg, NumberFormat.UInt8BE);
        let val = pins.i2cReadNumber(addr, NumberFormat.UInt8BE);
        return val;
    }

    function initPCA9685(): void {
        i2cWrite(PCA9685_ADDRESS, MODE1, 0x00)
        setFreq(50);
        initialized = true
    }

    function setFreq(freq: number): void {
        let prescaleval = 25000000;
        prescaleval /= 4096;
        prescaleval /= freq;
        prescaleval -= 1;
        let prescale = prescaleval;
        let oldmode = i2cRead(PCA9685_ADDRESS, MODE1);
        let newmode = (oldmode & 0x7F) | 0x10; // sleep
        i2cWrite(PCA9685_ADDRESS, MODE1, newmode); // go to sleep
        i2cWrite(PCA9685_ADDRESS, PRESCALE, prescale); // set the prescaler
        i2cWrite(PCA9685_ADDRESS, MODE1, oldmode);
        control.waitMicros(5000);
        i2cWrite(PCA9685_ADDRESS, MODE1, oldmode | 0xa1);
    }

    function setPwm(channel: number, on: number, off: number): void {
        if (channel < 0 || channel > 15) return;

        let buf3 = pins.createBuffer(5);
        buf3[0] = LED0_ON_L + 4 * channel;
        buf3[1] = on & 0xff;
        buf3[2] = (on >> 8) & 0xff;
        buf3[3] = off & 0xff;
        buf3[4] = (off >> 8) & 0xff;
        pins.i2cWriteBuffer(PCA9685_ADDRESS, buf3);
    }

    function setStepper_28(index: number, dir: boolean): void {
        if (index == 1) {
            if (dir) {
                setPwm(4, STP_CHA_L, STP_CHA_H);
                setPwm(6, STP_CHB_L, STP_CHB_H);
                setPwm(5, STP_CHC_L, STP_CHC_H);
                setPwm(7, STP_CHD_L, STP_CHD_H);
            } else {
                setPwm(7, STP_CHA_L, STP_CHA_H);
                setPwm(5, STP_CHB_L, STP_CHB_H);
                setPwm(6, STP_CHC_L, STP_CHC_H);
                setPwm(4, STP_CHD_L, STP_CHD_H);
            }
        } else {
            if (dir) {
                setPwm(0, STP_CHA_L, STP_CHA_H);
                setPwm(2, STP_CHB_L, STP_CHB_H);
                setPwm(1, STP_CHC_L, STP_CHC_H);
                setPwm(3, STP_CHD_L, STP_CHD_H);
            } else {
                setPwm(3, STP_CHA_L, STP_CHA_H);
                setPwm(1, STP_CHB_L, STP_CHB_H);
                setPwm(2, STP_CHC_L, STP_CHC_H);
                setPwm(0, STP_CHD_L, STP_CHD_H);
            }
        }
    }

    function setStepper_42(index: number, dir: boolean): void {
        if (index == 1) {
            if (dir) {
                setPwm(7, BYG_CHA_L, BYG_CHA_H);
                setPwm(6, BYG_CHB_L, BYG_CHB_H);
                setPwm(5, BYG_CHC_L, BYG_CHC_H);
                setPwm(4, BYG_CHD_L, BYG_CHD_H);
            } else {
                setPwm(7, BYG_CHC_L, BYG_CHC_H);
                setPwm(6, BYG_CHD_L, BYG_CHD_H);
                setPwm(5, BYG_CHA_L, BYG_CHA_H);
                setPwm(4, BYG_CHB_L, BYG_CHB_H);
            }
        } else {
            if (dir) {
                setPwm(3, BYG_CHA_L, BYG_CHA_H);
                setPwm(2, BYG_CHB_L, BYG_CHB_H);
                setPwm(1, BYG_CHC_L, BYG_CHC_H);
                setPwm(0, BYG_CHD_L, BYG_CHD_H);
            } else {
                setPwm(3, BYG_CHC_L, BYG_CHC_H);
                setPwm(2, BYG_CHD_L, BYG_CHD_H);
                setPwm(1, BYG_CHA_L, BYG_CHA_H);
                setPwm(0, BYG_CHB_L, BYG_CHB_H);
            }
        }
    }

    //% blockId=motor_servo block="|%index|서보모터|%degree|각도로 이동"
    //% weight=0
    //% degree.min=0 degree.max=180
    //% index.fieldEditor="gridpicker" index.fieldOptions.columns=4
    //% group="서보모터 제어"
    export function servo(index: Servos, degree: number): void {
        if (!initialized) {
            initPCA9685()
        }
        let v_us = (degree * 1800 / 180 + 600) // 0.6ms ~ 2.4ms
        let value = v_us * 4096 / 20000
        setPwm(index + 7, 0, value)
    }

    //% weight=0
    //% blockId=motor_MotorRun block="|%index|모터|%Dir|방향|%speed|속도로 회전"
    //% speed.min=0 speed.max=255
    //% index.fieldEditor="gridpicker" index.fieldOptions.columns=2
    //% direction.fieldEditor="gridpicker" direction.fieldOptions.columns=2
    //% group="모터 제어(심화)"
    export function MotorRun(index: Motors, direction: Dir, speed: number): void {
        if (!initialized) {
            initPCA9685()
        }
        if (index === 3 || index === 4) {
            direction = direction * -1;
        }
        speed = speed * 16 * direction; // map 255 to 4096
        if (speed >= 4096) speed = 4095
        if (speed <= -4096) speed = -4095
        if (index > 4 || index <= 0) return
        let pn = (4 - index) * 2
        let pp = (4 - index) * 2 + 1
        if (speed >= 0) {
            setPwm(pp, 0, speed)
            setPwm(pn, 0, 0)
        } else {
            setPwm(pp, 0, 0)
            setPwm(pn, 0, -speed)
        }
    }

    //% weight=0
    //% blockId=motor_MecanumRun block="|메카넘|%Mecanum|방향|%speed|속도로 이동"
    //% speed.min=0 speed.max=255
    //% direction.fieldEditor="gridpicker" direction.fieldOptions.columns=3
    //% group="모터 제어(기초)"
    export function MecanumRun(direction: Mecanum, speed: number): void {
        if (!initialized) {
            initPCA9685()
        }
        speed = speed * 16; // map 255 to 4096
        if (speed >= 4096) speed = 4095
        if (speed <= -4096) speed = -4095

        if (direction == 1) { // ↖
            setPwm(7, 0, speed); setPwm(6, 0, 0); // M1 foward
            setPwm(5, 0, 0); setPwm(4, 0, 0); // M2 stop
            setPwm(3, 0, 0); setPwm(2, 0, speed); // M3 foward
            setPwm(1, 0, 0); setPwm(0, 0, 0); // M4 stop
        } else if (direction == 2) { // ↑
            setPwm(7, 0, speed); setPwm(6, 0, 0); // M1 foward
            setPwm(5, 0, speed); setPwm(4, 0, 0); // M2 foward
            setPwm(3, 0, 0); setPwm(2, 0, speed); // M3 foward
            setPwm(1, 0, 0); setPwm(0, 0, speed); // M4 foward
        } else if (direction == 3) { // ↗
            setPwm(7, 0, 0); setPwm(6, 0, 0); // M1 stop
            setPwm(5, 0, speed); setPwm(4, 0, 0); // M2 foward
            setPwm(3, 0, 0); setPwm(2, 0, 0); // M3 stop
            setPwm(1, 0, 0); setPwm(0, 0, speed); // M4 foward
        } else if (direction == 4) { // ←
            setPwm(7, 0, speed); setPwm(6, 0, 0); // M1 foward
            setPwm(5, 0, 0); setPwm(4, 0, speed); // M2 backward
            setPwm(3, 0, 0); setPwm(2, 0, speed); // M3 foward
            setPwm(1, 0, speed); setPwm(0, 0, 0); // M4 backward
        } else if (direction == 5) { // s
            setPwm(7, 0, 0); setPwm(6, 0, 0); // M1 stop
            setPwm(5, 0, 0); setPwm(4, 0, 0); // M2 stop
            setPwm(3, 0, 0); setPwm(2, 0, 0); // M3 stop
            setPwm(1, 0, 0); setPwm(0, 0, 0); // M4 stop
        } else if (direction == 6) { // →
            setPwm(7, 0, 0); setPwm(6, 0, speed); // M1 backward
            setPwm(5, 0, speed); setPwm(4, 0, 0); // M2 foward
            setPwm(3, 0, speed); setPwm(2, 0, 0); // M3 backward
            setPwm(1, 0, 0); setPwm(0, 0, speed); // M4 foward
        } else if (direction == 7) { // ↙
            setPwm(7, 0, 0); setPwm(6, 0, 0); // M1 stop
            setPwm(5, 0, 0); setPwm(4, 0, speed); // M2 backward
            setPwm(3, 0, 0); setPwm(2, 0, 0); // M3 stop
            setPwm(1, 0, speed); setPwm(0, 0, 0); // M4 backward
        } else if (direction == 8) { // ↓
            setPwm(7, 0, 0); setPwm(6, 0, speed); // M1 backward
            setPwm(5, 0, 0); setPwm(4, 0, speed); // M2 backward
            setPwm(3, 0, speed); setPwm(2, 0, 0); // M3 backward
            setPwm(1, 0, speed); setPwm(0, 0, 0); // M4 backward
        } else if (direction == 9) { // ↘
            setPwm(7, 0, 0); setPwm(6, 0, speed); // M1 backward
            setPwm(5, 0, 0); setPwm(4, 0, 0); // M2 stop
            setPwm(3, 0, speed); setPwm(2, 0, 0); // M3 backward
            setPwm(1, 0, 0); setPwm(0, 0, 0); // M4 stop
        }
    }

    //% weight=0
    //% blockId=motor_motorStop block="|%index|모터 정지"
    //% index.fieldEditor="gridpicker" index.fieldOptions.columns=2 
    //% group="모터 제어(심화)"
    export function motorStop(index: Motors) {
        setPwm((4 - index) * 2, 0, 0);
        setPwm((4 - index) * 2 + 1, 0, 0);
    }

    //% weight=20
    //% blockId=motor_motorStopAll block="|모든 모터 정지"
    //% group="모터 제어(기초)"
    export function motorStopAll(): void {
        for (let idx = 1; idx <= 4; idx++) {
            motorStop(idx);
        }
    }

    //% weight=0
    //% blockId=motor_NormalRun block="|포니봇|%Mecanum|방향|%speed|속도로 이동"
    //% speed.min=0 speed.max=255
    //% DirControll.fieldEditor="gridpicker" DirControll.fieldOptions.columns=2
    //% group="모터 제어(기초)"
    export function NomalRun(direction: DirControll, speed: number): void {
        if (!initialized) {
            initPCA9685()
        }
        speed = speed * 16; // map 255 to 4096
        if (speed >= 4096) speed = 4095
        if (speed <= -4096) speed = -4095

        if (direction == 1) { // ↑
            setPwm(7, 0, speed); setPwm(6, 0, 0); // M1 foward
            setPwm(5, 0, speed); setPwm(4, 0, 0); // M2 foward
            setPwm(3, 0, 0); setPwm(2, 0, speed); // M3 foward
            setPwm(1, 0, 0); setPwm(0, 0, speed); // M4 foward
        } else if (direction == 2) { // ↓
            setPwm(7, 0, 0); setPwm(6, 0, speed); // M1 backward
            setPwm(5, 0, 0); setPwm(4, 0, speed); // M2 backward
            setPwm(3, 0, speed); setPwm(2, 0, 0); // M3 backward
            setPwm(1, 0, speed); setPwm(0, 0, 0); // M4 backward
        } else if (direction == 3) { // ↶
            setPwm(7, 0, speed); setPwm(6, 0, 0); // M1 foward
            setPwm(5, 0, speed); setPwm(4, 0, 0); // M2 foward
            setPwm(3, 0, speed); setPwm(2, 0, 0); // M3 backward
            setPwm(1, 0, speed); setPwm(0, 0, 0); // M4 backward
        } else if (direction == 4) { // ↷
            setPwm(7, 0, 0); setPwm(6, 0, speed); // M1 backward
            setPwm(5, 0, 0); setPwm(4, 0, speed); // M2 backward
            setPwm(3, 0, 0); setPwm(2, 0, speed); // M3 backward
            setPwm(1, 0, 0); setPwm(0, 0, speed); // M4 backward
        }
    }

    /**
     * ---------------line sensor-------------------
     */
    export enum twoLineState {
        //% block="◌ ◌ " 
        two_line_State_0 = 0,
        //% block="● ●" 
        two_line_State_1 = 1,
        //% block="● ◌" 
        two_line_State_2 = 2,
        //% block="◌ ●" 
        two_line_State_3 = 3,
    }

    export enum lineState {
        //% block="◌" 
        line_State_0 = 0,
        //% block="●" 
        line_State_1 = 1
    }

    export enum lineSensorChannel {
        //% block="왼쪽"
        reft = 1,
        //% block="오른쪽"
        right = 2,
    }

    //% blockId="check_two_line_state"
    //% block="두 라인 센서의 값이 %state"
    //% state.shadow="dropdown"
    //% group="라인 감지 센서"
    //% weight=0
    export function checkTwoLineState(state: twoLineState): boolean {
        const leftSensor = pins.digitalReadPin(DigitalPin.P16);
        const rightSensor = pins.digitalReadPin(DigitalPin.P15);

        switch (state) {
            case twoLineState.two_line_State_0:
                return leftSensor === 0 && rightSensor === 0;
            case twoLineState.two_line_State_1:
                return leftSensor === 1 && rightSensor === 1;
            case twoLineState.two_line_State_2:
                return leftSensor === 1 && rightSensor === 0;
            case twoLineState.two_line_State_3:
                return leftSensor === 0 && rightSensor === 1;
            default:
                return false;
        }
    }

    //% blockId="check_single_line_sensor"
    //% block="%channel 라인 센서의 값이 %state"
    //% channel.shadow="dropdown"
    //% state.shadow="dropdown"
    //% group="라인 감지 센서"
    //% weight=0
    export function checkSingleLineSensor(channel: lineSensorChannel, state: lineState): boolean {
        const sensorValue = channel === lineSensorChannel.reft
            ? pins.digitalReadPin(DigitalPin.P16)
            : pins.digitalReadPin(DigitalPin.P15);
        return sensorValue === state;
    }

    //% blockId="read_line_sensor"
    //% block="%channel 라인 센서 값 읽기"
    //% channel.shadow="dropdown"
    //% group="라인 감지 센서"
    //% weight=0
    export function readLineSensor(channel: lineSensorChannel): number {
        return channel === lineSensorChannel.reft
            ? pins.digitalReadPin(DigitalPin.P16)
            : pins.digitalReadPin(DigitalPin.P15);
    }

    /**
     * ---------------sonar sensor-------------------
     */
    export enum PingUnit {
        //% block="마이크로초"
        MicroSeconds,
        //% block="센티미터"
        Centimeters,
        //% block="인치"
        Inches
    }

    //% blockId=sonar_ping 
    //% block="%unit 단위로 측정한 거리"
    //% unit.shadow="dropdown"
    //% group="거리 감지 센서"
    //% weight=0
    export function ping(unit: PingUnit, maxCmDistance = 500): number {
        const trig = DigitalPin.P13; // Trig 핀 기본값
        const echo = DigitalPin.P14; // Echo 핀 기본값
        pins.setPull(trig, PinPullMode.PullNone);
        pins.digitalWritePin(trig, 0);
        control.waitMicros(2);
        pins.digitalWritePin(trig, 1);
        control.waitMicros(10);
        pins.digitalWritePin(trig, 0);

        const d = pins.pulseIn(echo, PulseValue.High, maxCmDistance * 58);

        if (d === 0) {
            switch (unit) {
                case PingUnit.Centimeters: return maxCmDistance;
                case PingUnit.Inches: return Math.idiv(maxCmDistance * 100, 254);
                default: return maxCmDistance * 58;
            }
        }

        switch (unit) {
            case PingUnit.Centimeters: return Math.idiv(d, 58);
            case PingUnit.Inches: return Math.idiv(d, 148);
            default: return d;
        }
    }

    /**
     * ---------------color sensor-------------------
     */
    export enum DetectedColor {
        //% block="빨간색"
        Red,
        //% block="초록색"
        Green,
        //% block="파란색"
        Blue,
        //% block="노란색"
        Yellow
        // 'White'는 제거됨
    }

    class tcs3472 {
        is_setup: boolean
        addr: number
        leds: DigitalPin

        constructor(addr: number) {
            this.is_setup = false
            this.addr = addr
        }

        setup(): void {
            if (this.is_setup) return
            this.is_setup = true
            smbus.writeByte(this.addr, 0x80, 0x03) // Enable register: PON | AEN
            smbus.writeByte(this.addr, 0x81, 0x2b) // Integration time: 103.2ms
        }

        setIntegrationTime(time: number): void {
            this.setup()
            time = Math.clamp(0, 255, time * 10 / 24)
            smbus.writeByte(this.addr, 0x81, 255 - time)
        }

        light(): number {
            return this.raw()[0] // Clear channel 값 반환
        }

        rgb(): number[] {
            let result: number[] = this.raw()
            let clear: number = result.shift() // Clear 값을 제거하고 저장
            if (clear === 0) return [0, 0, 0]; // Clear가 0이면 기본값 반환
            for (let x: number = 0; x < result.length; x++) {
                result[x] = result[x] * 255 / clear // RGB 값을 Clear로 정규화
            }
            return result // [R, G, B]
        }

        raw(): number[] {
            this.setup()
            try {
                let result: Buffer = smbus.readBuffer(this.addr, 0xb4, pins.sizeOf(NumberFormat.UInt16LE) * 4)
                return smbus.unpack("HHHH", result) // [Clear, R, G, B]
            } catch (e) {
                return [0, 0, 0, 0]; // I2C 오류 시 기본값 반환
            }
        }
    }

    let _tcs3472: tcs3472 = new tcs3472(0x29) // 기본 I2C 주소 0x29

    //% blockId=brickcell_color_tcs34725_get_light
    //% block="밝기(B) 값 읽기"
    //% group="색상 감지 센서"
    export function getLight(): number {
        return Math.round(_tcs3472.light())
    }

    //% blockId=brickcell_color_tcs34725__get_red
    //% block="빨간색(R) 색상 값 읽기"
    //% group="색상 감지 센서"
    export function getRed(): number {
        return Math.round(_tcs3472.rgb()[0]);
    }

    //% blockId=brickcell_color_tcs34725_get_green
    //% block="초록색(G) 색상 값 읽기"
    //% group="색상 감지 센서"
    export function getGreen(): number {
        return Math.round(_tcs3472.rgb()[1]);
    }

    //% blockId=brickcell_color_tcs34725_get_blue
    //% block="파란색(B) 색상 값 읽기"
    //% group="색상 감지 센서"
    export function getBlue(): number {
        return Math.round(_tcs3472.rgb()[2]);
    }

    //% blockId=brickcell_color_tcs34725_set_integration_time
    //% block="색상 통합 시간을 %time ms로 설정"
    //% time.min=0 time.max=612 value.defl=500
    //% group="색상 감지 센서"
    export function setColourIntegrationTime(time: number): void {
        return _tcs3472.setIntegrationTime(time)
    }

    //% blockId=color_sensor_is_color_advanced
    //% block="감지된 색상이 %color (임계값 %threshold)"
    //% threshold.min=10 threshold.max=100 threshold.defl=40
    //% group="색상 감지 센서"
    export function isColorAdvanced(color: DetectedColor, threshold: number = 40): boolean {
        const rgb = _tcs3472.rgb();
        const r = rgb[0];
        const g = rgb[1];
        const b = rgb[2];
        const clear = _tcs3472.light();

        if (clear < 100) return false;

        const total = r + g + b;
        if (total === 0) return false;

        const rRatio = r / total;
        const gRatio = g / total;
        const bRatio = b / total;

        const thresholdRatio = threshold / 255;

        switch (color) {
            case DetectedColor.Red:
                return rRatio > gRatio + thresholdRatio &&
                    rRatio > bRatio + thresholdRatio &&
                    rRatio > 0.4;
            case DetectedColor.Green:
                return gRatio > rRatio + thresholdRatio &&
                    gRatio > bRatio + thresholdRatio &&
                    gRatio > 0.4;
            case DetectedColor.Blue:
                return bRatio > rRatio + thresholdRatio &&
                    bRatio > gRatio + thresholdRatio * 0.8 &&
                    bRatio > 0.35;
            case DetectedColor.Yellow:
                return rRatio > bRatio + thresholdRatio &&
                    gRatio > bRatio + thresholdRatio &&
                    Math.abs(rRatio - gRatio) < 0.1 &&
                    rRatio + gRatio > 0.6;
            default:
                return false;
        }
    }

    //% blockId=color_sensor_is_in_range
    //% block="R: %minR ~ %maxR, G: %minG ~ %maxG, B: %minB ~ %maxB"
    //% minR.min=0 minR.max=255 minR.defl=0
    //% maxR.min=0 maxR.max=255 maxR.defl=255
    //% minG.min=0 minG.max=255 minG.defl=0
    //% maxG.min=0 maxG.max=255 maxG.defl=255
    //% minB.min=0 minB.max=255 minB.defl=0
    //% maxB.min=0 maxB.max=255 maxB.defl=255
    //% group="색상 감지 센서"
    //% inlineInputMode=inline
    export function isColorInRange(minR: number, maxR: number, minG: number, maxG: number, minB: number, maxB: number): boolean {
        const rgb = _tcs3472.rgb();
        const r = rgb[0];
        const g = rgb[1];
        const b = rgb[2];

        return r > minR && r < maxR &&
            g > minG && g < maxG &&
            b > minB && b < maxB;
    }

    /**
     * ---------------oled display(od01)-------------------
     */
    const Font_5x7 = hex`000000000000005F00000007000700147F147F14242A072A12231308646237495522500005030000001C2241000041221C00082A1C2A0808083E080800503000000808080808006060000020100804023E5149453E00427F400042615149462141454B311814127F1027454545393C4A49493001710905033649494936064949291E003636000000563600000008142241141414141441221408000201510906324979413E7E1111117E7F494949363E414141227F4141221C7F494949417F090901013E414151327F0808087F00417F41002040413F017F081422417F404040407F0204027F7F0408107F3E4141413E7F090909063E4151215E7F09192946464949493101017F01013F4040403F1F2040201F7F2018207F63140814630304780403615149454300007F4141020408102041417F000004020102044040404040000102040020545454787F484444383844444420384444487F3854545418087E090102081454543C7F0804047800447D40002040443D00007F10284400417F40007C041804787C0804047838444444387C14141408081414187C7C080404084854545420043F4440203C4040207C1C2040201C3C4030403C44281028440C5050503C4464544C44000836410000007F000000413608000201020402`
    export enum Display {
        //% block="ON"
        On = 1,
        //% block="OFF"
        Off = 0
    }

    const MIN_X = 0
    const MIN_Y = 0
    const MAX_X = 127
    const MAX_Y = 63

    let _I2CAddr = 60
    let _screen = pins.createBuffer(1025)
    let _buf2 = pins.createBuffer(2)
    let _buf3 = pins.createBuffer(3)
    let _buf4 = pins.createBuffer(4)
    let _buf7 = pins.createBuffer(7)
    let _buf13 = pins.createBuffer(13)
    _buf7[0] = 0x40
    _buf13[0] = 0x40
    let _DRAW = 1
    let _cx = 0
    let _cy = 0

    let _ZOOM = 0
    let _DOUBLE = 0

    function cmd1(d: number) {
        let n = d % 256;
        pins.i2cWriteNumber(_I2CAddr, n, NumberFormat.UInt16BE);
    }

    function cmd2(d1: number, d2: number) {
        _buf3[0] = 0;
        _buf3[1] = d1;
        _buf3[2] = d2;
        pins.i2cWriteBuffer(_I2CAddr, _buf3);
    }

    function cmd3(d1: number, d2: number, d3: number) {
        _buf4[0] = 0;
        _buf4[1] = d1;
        _buf4[2] = d2;
        _buf4[3] = d3;
        pins.i2cWriteBuffer(_I2CAddr, _buf4);
    }

    function set_pos(col: number = 0, page: number = 0) {
        cmd1(0xb0 | page)
        cmd1(0x00 | (col % 16))
        cmd1(0x10 | (col >> 4))
    }

    function clrbit(d: number, b: number): number {
        if (d & (1 << b)) d -= (1 << b)
        return d
    }

    function draw(d: number) {
        if (d > 0) {
            set_pos()
            pins.i2cWriteBuffer(_I2CAddr, _screen)
        }
    }

    //% block="디스플레이 색상 반전 %on"
    //% blockGap=8
    //% group="디스플레이 제어"
    //% on.shadow="toggleOnOff"
    //% weight=2
    export function invert(on: boolean = true) {
        let n = (on) ? 0xA7 : 0xA6
        cmd1(n)
    }

    //% block="디스플레이 지우기"
    //% blockGap=8
    //% group="디스플레이 제어"
    //% weight=3
    export function clear() {
        _cx = _cy = 0
        _screen.fill(0)
        _screen[0] = 0x40
        draw(1)
    }

    //% block="디스플레이 화면 %on"
    //% on.defl=1
    //% blockGap=8
    //% group="디스플레이 제어"
    //% on.shadow="toggleOnOff"
    //% weight=1
    export function display(on: boolean) {
        if (on) cmd1(0xAF);
        else cmd1(0xAE);
    }

    //% block="픽셀 출력 - 위치: x %x y %y, 색상: %color"
    //% x.max=127 x.min=0 x.defl=0
    //% y.max=63 y.min=0 y.defl=0
    //% color.max=1 color.min=0 color.defl=1
    //% blockGap=8 inlineInputMode=inline
    //% group="디스플레이 제어(도형)"
    //% weight=4
    export function pixel(x: number, y: number, color: number = 1) {
        let page = y >> 3
        let shift_page = y % 8
        let ind = x + page * 128 + 1
        let b = (color) ? (_screen[ind] | (1 << shift_page)) : clrbit(_screen[ind], shift_page)
        _screen[ind] = b
    }

    function char(c: string, col: number, row: number, color: number = 1) {
        let p = (Math.min(127, Math.max(c.charCodeAt(0), 32)) - 32) * 5
        let m = 0
        let ind = col + row * 128 + 1

        if (_DOUBLE) {
            for (let i = 0; i < 5; i++) {
                let l = 0
                for (let j = 0; j < 8; j++) {
                    if (color > 0 ? Font_5x7[p + i] & (1 << j) : !(Font_5x7[p + i] & (1 << j))) {
                        pixel(col + m, row * 8 + l)
                        pixel(col + m, row * 8 + l + 1)
                        pixel(col + m + 1, row * 8 + l)
                        pixel(col + m + 1, row * 8 + l + 1)
                    }
                    l += 2
                }
                m += 2
            }
            let l = 0
            for (let j = 0; j < 8; j++) {
                if (color == 0) {
                    pixel(col + 10, row * 8 + l)
                    pixel(col + 10, row * 8 + l + 1)
                    pixel(col + 11, row * 8 + l)
                    pixel(col + 11, row * 8 + l + 1)
                }
                l += 2
            }
        } else {
            let j = 0
            for (let i = 0; i < 5; i++) {
                _screen[ind + i] = (color > 0) ? Font_5x7[p + i] : Font_5x7[p + i] ^ 0xFF
                if (_ZOOM) {
                    _buf13[j + 1] = _screen[ind + i]
                    _buf13[j + 2] = _screen[ind + i]
                } else {
                    _buf7[i + 1] = _screen[ind + i]
                }
                j += 2
            }
            _screen[ind + 5] = (color > 0) ? 0 : 0xFF
            if (_ZOOM) {
                _buf13[12] = _screen[ind + 5]
            } else {
                _buf7[6] = _screen[ind + 5]
            }
            set_pos(col, row)
            if (_ZOOM) {
                pins.i2cWriteBuffer(_I2CAddr, _buf13)
            } else {
                pins.i2cWriteBuffer(_I2CAddr, _buf7)
            }
        }
    }

    //% block="문장 출력 - 내용: %s, 위치: %col열 %row행, 색상: %color"
    //% s.defl='AI ponybot'
    //% col.max=120 col.min=0 col.defl=0
    //% row.max=7 row.min=0 row.defl=0
    //% color.max=1 color.min=0 color.defl=1
    //% blockGap=8 inlineInputMode=inline
    //% group="디스플레이 제어(데이터)"
    //% weight=1
    export function showString(s: string, col: number, row: number, color: number = 1) {
        let steps = _DOUBLE ? 12 : 6
        for (let n = 0; n < s.length; n++) {
            char(s.charAt(n), col, row, color)
            col += steps
        }
        if (_DOUBLE) draw(1)
    }

    //% block="숫자 출력 - 내용: %num, 위치: %col열 %row행, 색상: %color"
    //% num.defl=777
    //% col.max=120 col.min=0 col.defl=0
    //% row.max=7 row.min=0 row.defl=0
    //% color.max=1 color.min=0 color.defl=1
    //% blockGap=8 inlineInputMode=inline
    //% group="디스플레이 제어(데이터)"
    //% weight=3
    export function showNumber(num: number, col: number, row: number, color: number = 1) {
        showString(num.toString(), col, row, color)
    }

    function scroll() {
        _cx = 0
        _cy += _DOUBLE ? 2 : 1
        if (_cy > 7) {
            _cy = 7
            _screen.shift(128)
            _screen[0] = 0x40
            draw(1)
        }
    }

    //% block="문장 출력 - 내용: %s, 줄바꿈: %newline"
    //% s.defl="AI ponybot"
    //% newline.defl=true
    //% blockGap=8 inlineInputMode=inline
    //% group="디스플레이 제어(데이터)"
    //% weight=2
    export function printString(s: string, newline: boolean = true) {
        let steps = _DOUBLE ? 12 : 6
        for (let n = 0; n < s.length; n++) {
            char(s.charAt(n), _cx, _cy, 1)
            _cx += steps
            if (_cx > 120) scroll()
        }
        if (newline) scroll()
        if (_DOUBLE) draw(1)
    }

    //% block="숫자 출력 - 내용: %num, 줄바꿈: %newline"
    //% num.defl="777"
    //% newline.defl=true
    //% weight=86 blockGap=8 inlineInputMode=inline
    //% group="디스플레이 제어(데이터)"
    //% weight=4
    export function printNumber(num: number, newline: boolean = true) {
        printString(num.toString(), newline)
    }

    //% block="수평선 출력 - 위치: x %x y %y, 길이: %len, 색상: %color"
    //% x.max=127 x.min=0 x.defl=0
    //% y.max=63 y.min=0 y.defl=0
    //% len.max=128 len.min=1 len.defl=16
    //% color.max=1 color.min=0 color.defl=1
    //% blockGap=8 inlineInputMode=inline
    //% group="디스플레이 제어(도형)"
    //% weight=2
    export function horizontalLine(x: number, y: number, len: number, color: number = 1) {
        let _sav = _DRAW
        if ((y < MIN_Y) || (y > MAX_Y)) return
        _DRAW = 0
        for (let i = x; i < (x + len); i++)
            if ((i >= MIN_X) && (i <= MAX_X))
                pixel(i, y, color)
        _DRAW = _sav
        draw(_DRAW)
    }

    //% block="수직선 출력 - 위치: x %x y %y, 길이: %len, 색상: %color"
    //% x.max=127 x.min=0 x.defl=0
    //% y.max=63 y.min=0 y.defl=0
    //% len.max=128 len.min=1 len.defl=16
    //% color.max=1 color.min=0 color.defl=1
    //% blockGap=8 inlineInputMode=inline
    //% group="디스플레이 제어(도형)"
    //% weight=1
    export function verticalLine(x: number, y: number, len: number, color: number = 1) {
        let _sav = _DRAW
        _DRAW = 0
        if ((x < MIN_X) || (x > MAX_X)) return
        for (let i = y; i < (y + len); i++)
            if ((i >= MIN_Y) && (i <= MAX_Y))
                pixel(x, i, color)
        _DRAW = _sav
        draw(_DRAW)
    }

    //% block="사각형 출력 - x1 %x1 y1 %y1 x2 %x2 y2 %y2, 색상: %color"
    //% color.defl=1
    //% blockGap=8 inlineInputMode=inline
    //% group="디스플레이 제어(도형)"
    //% weight=3
    export function rectangle(x1: number, y1: number, x2: number, y2: number, color: number = 1) {
        if (x1 > x2) x1 = [x2, x2 = x1][0];
        if (y1 > y2) y1 = [y2, y2 = y1][0];
        _DRAW = 0
        horizontalLine(x1, y1, x2 - x1 + 1, color)
        horizontalLine(x1, y2, x2 - x1 + 1, color)
        verticalLine(x1, y1, y2 - y1 + 1, color)
        verticalLine(x2, y1, y2 - y1 + 1, color)
        _DRAW = 1
        draw(1)
    }

    function init() {
        cmd1(0xAE)       // SSD1306_DISPLAYOFF
        cmd1(0xA4)       // SSD1306_DISPLAYALLON_RESUME
        cmd2(0xD5, 0xF0) // SSD1306_SETDISPLAYCLOCKDIV
        cmd2(0xA8, 0x3F) // SSD1306_SETMULTIPLEX
        cmd2(0xD3, 0x00) // SSD1306_SETDISPLAYOFFSET
        cmd1(0 | 0x0)    // line #SSD1306_SETSTARTLINE
        cmd2(0x8D, 0x14) // SSD1306_CHARGEPUMP
        cmd2(0x20, 0x00) // SSD1306_MEMORYMODE
        cmd3(0x21, 0, 127) // SSD1306_COLUMNADDR
        cmd3(0x22, 0, 63)  // SSD1306_PAGEADDR
        cmd1(0xa0 | 0x1) // SSD1306_SEGREMAP
        cmd1(0xc8)       // SSD1306_COMSCANDEC
        cmd2(0xDA, 0x12) // SSD1306_SETCOMPINS
        cmd2(0x81, 0xCF) // SSD1306_SETCONTRAST
        cmd2(0xd9, 0xF1) // SSD1306_SETPRECHARGE
        cmd2(0xDB, 0x40) // SSD1306_SETVCOMDETECT
        cmd1(0xA6)       // SSD1306_NORMALDISPLAY
        cmd2(0xD6, 0)    // zoom off
        cmd1(0xAF)       // SSD1306_DISPLAYON
        clear()
    }

    init();
}

namespace smbus {
    export function writeByte(addr: number, register: number, value: number): void {
        let temp = pins.createBuffer(2);
        temp[0] = register;
        temp[1] = value;
        pins.i2cWriteBuffer(addr, temp, false);
    }
    export function writeBuffer(addr: number, register: number, value: Buffer): void {
        let temp = pins.createBuffer(value.length + 1);
        temp[0] = register;
        for (let x = 0; x < value.length; x++) {
            temp[x + 1] = value[x];
        }
        pins.i2cWriteBuffer(addr, temp, false);
    }
    export function readBuffer(addr: number, register: number, len: number): Buffer {
        let temp = pins.createBuffer(1);
        temp[0] = register;
        pins.i2cWriteBuffer(addr, temp, false);
        return pins.i2cReadBuffer(addr, len, false);
    }
    export function readNumber(addr: number, register: number, fmt: NumberFormat = NumberFormat.UInt8LE): number {
        let temp = pins.createBuffer(1);
        temp[0] = register;
        pins.i2cWriteBuffer(addr, temp, false);
        return pins.i2cReadNumber(addr, fmt, false);
    }
    export function unpack(fmt: string, buf: Buffer): number[] {
        let le: boolean = true;
        let offset: number = 0;
        let result: number[] = [];
        let num_format: NumberFormat = 0;
        for (let c = 0; c < fmt.length; c++) {
            switch (fmt.charAt(c)) {
                case '<':
                    le = true;
                    continue;
                case '>':
                    le = false;
                    continue;
                case 'c':
                case 'B':
                    num_format = le ? NumberFormat.UInt8LE : NumberFormat.UInt8BE; break;
                case 'b':
                    num_format = le ? NumberFormat.Int8LE : NumberFormat.Int8BE; break;
                case 'H':
                    num_format = le ? NumberFormat.UInt16LE : NumberFormat.UInt16BE; break;
                case 'h':
                    num_format = le ? NumberFormat.Int16LE : NumberFormat.Int16BE; break;
            }
            result.push(buf.getNumber(num_format, offset));
            offset += pins.sizeOf(num_format);
        }
        return result;
    }
}