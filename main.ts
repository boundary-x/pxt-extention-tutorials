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

    /** 
     * The user can choose the mecanum mode direction 
     */
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

    /** 
    * The user can choose the mobility controll
    */
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

    /**
     * The user can choose the step motor model.
     */
    export enum Stepper {
        //% block="42"
        Ste1 = 1,
        //% block="28"
        Ste2 = 2
    }

    /**
     * The user can select the 8 steering gear controller.
     */
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

    /**
     * The user selects the 4-way dc motor.
     */
    export enum Motors {
        M1 = 0x1,
        M2 = 0x2,
        M3 = 0x3,
        M4 = 0x4
    }

    /**
     * The user defines the motor rotation direction.
     */
    export enum Dir {
        //% blockId="정회전" block="정회전"
        CW = 1,
        //% blockId="역회전" block="역회전"
        CCW = -1,
    }

    /**
     * The user can select a two-path stepper motor controller.
     */
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
        // Constrain the frequency
        let prescaleval = 25000000;
        prescaleval /= 4096;
        prescaleval /= freq;
        prescaleval -= 1;
        let prescale = prescaleval;//Math.floor(prescaleval + 0.5);
        let oldmode = i2cRead(PCA9685_ADDRESS, MODE1);
        let newmode = (oldmode & 0x7F) | 0x10; // sleep
        i2cWrite(PCA9685_ADDRESS, MODE1, newmode); // go to sleep
        i2cWrite(PCA9685_ADDRESS, PRESCALE, prescale); // set the prescaler
        i2cWrite(PCA9685_ADDRESS, MODE1, oldmode);
        control.waitMicros(5000);
        i2cWrite(PCA9685_ADDRESS, MODE1, oldmode | 0xa1);
    }

    function setPwm(channel: number, on: number, off: number): void {
        if (channel < 0 || channel > 15)
            return;

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


    /**
     * Steering gear control function.
     * S1~S8.
     * 0°~180°.
    */
    //% blockId=motor_servo block="|%index|서보모터|%degree|각도로 이동"
    //% weight=0
    //% degree.min=0 degree.max=180
    //% index.fieldEditor="gridpicker" index.fieldOptions.columns=4
    //% group="서보모터 제어"
    export function servo(index: Servos, degree: number): void {
        if (!initialized) {
            initPCA9685()
        }
        // 50hz
        let v_us = (degree * 1800 / 180 + 600) // 0.6ms ~ 2.4ms
        let value = v_us * 4096 / 20000
        setPwm(index + 7, 0, value)
    }

    /**
     * Execute a motor
     * M1~M4.
     * speed(0~255).
    */
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
        if (speed >= 4096) {
            speed = 4095
        }
        if (speed <= -4096) {
            speed = -4095
        }
        if (index > 4 || index <= 0)
            return
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

    /**
     * mecanum mode controll
     * M1~M4.
     * speed(0~255).
    */
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

        if (speed >= 4096) {
            speed = 4095
        }
        if (speed <= -4096) {
            speed = -4095
        }
        // motor controll
        // 1  2  3  |  ↖  ↑  ↗
        // 4  5  6  |  ←   s  →
        // 7  8  9  |  ↙  ↓  ↘
        if (direction == 1) {
            // M1 foward
            setPwm(7, 0, speed);
            setPwm(6, 0, 0);

            // M2 stop
            setPwm(5, 0, 0);
            setPwm(4, 0, 0);

            // M3 foward
            setPwm(3, 0, 0);
            setPwm(2, 0, speed);

            // M4 stop
            setPwm(1, 0, 0);
            setPwm(0, 0, 0);
        }

        if (direction == 2) {
            // M1 foward
            setPwm(7, 0, speed);
            setPwm(6, 0, 0);

            // M2 foward
            setPwm(5, 0, speed);
            setPwm(4, 0, 0);

            // M3 foward
            setPwm(3, 0, 0);
            setPwm(2, 0, speed);

            // M4 foward
            setPwm(1, 0, 0);
            setPwm(0, 0, speed);
        }

        if (direction == 3) {
            // M1 stop
            setPwm(7, 0, 0);
            setPwm(6, 0, 0);

            // M2 foward
            setPwm(5, 0, speed);
            setPwm(4, 0, 0);

            // M3 stop
            setPwm(3, 0, 0);
            setPwm(2, 0, 0);

            // M4 foward
            setPwm(1, 0, 0);
            setPwm(0, 0, speed);
        }

        if (direction == 4) {
            // M1 foward
            setPwm(7, 0, speed);
            setPwm(6, 0, 0);

            // M2 backward
            setPwm(5, 0, 0);
            setPwm(4, 0, speed);

            // M3 foward
            setPwm(3, 0, 0);
            setPwm(2, 0, speed);

            // M4 backward
            setPwm(1, 0, speed);
            setPwm(0, 0, 0);
        }

        if (direction == 5) {
            // M1 stop
            setPwm(7, 0, 0);
            setPwm(6, 0, 0);

            // M2 stop
            setPwm(5, 0, 0);
            setPwm(4, 0, 0);

            // M3 stop
            setPwm(3, 0, 0);
            setPwm(2, 0, 0);

            // M4 stop
            setPwm(1, 0, 0);
            setPwm(0, 0, 0);
        }

        if (direction == 6) {
            // M1 backward
            setPwm(7, 0, 0);
            setPwm(6, 0, speed);

            // M2 foward
            setPwm(5, 0, speed);
            setPwm(4, 0, 0);

            // M3 backward
            setPwm(3, 0, speed);
            setPwm(2, 0, 0);

            // M4 foward
            setPwm(1, 0, 0);
            setPwm(0, 0, speed);
        }

        if (direction == 7) {
            // M1 stop
            setPwm(7, 0, 0);
            setPwm(6, 0, 0);

            // M2 backward
            setPwm(5, 0, 0);
            setPwm(4, 0, speed);

            // M3 stop
            setPwm(3, 0, 0);
            setPwm(2, 0, 0);

            // M4 backward
            setPwm(1, 0, speed);
            setPwm(0, 0, 0);
        }

        if (direction == 8) {
            // M1 backward
            setPwm(7, 0, 0);
            setPwm(6, 0, speed);

            // M2 backward
            setPwm(5, 0, 0);
            setPwm(4, 0, speed);

            // M3 backward
            setPwm(3, 0, speed);
            setPwm(2, 0, 0);

            // M4 backward
            setPwm(1, 0, speed);
            setPwm(0, 0, 0);
        }

        if (direction == 9) {
            // M1 backward
            setPwm(7, 0, 0);
            setPwm(6, 0, speed);

            // M2 stop
            setPwm(5, 0, 0);
            setPwm(4, 0, 0);

            // M3 backward
            setPwm(3, 0, speed);
            setPwm(2, 0, 0);

            // M4 stop
            setPwm(1, 0, 0);
            setPwm(0, 0, 0);
        }
    }

    /**
     * Stop the dc motor.
    */
    //% weight=0
    //% blockId=motor_motorStop block="|%index|모터 정지"
    //% index.fieldEditor="gridpicker" index.fieldOptions.columns=2 
    //% group="모터 제어(심화)"
    export function motorStop(index: Motors) {
        setPwm((4 - index) * 2, 0, 0);
        setPwm((4 - index) * 2 + 1, 0, 0);
    }

    /**
     * Stop all motors
    */
    //% weight=20
    //% blockId=motor_motorStopAll block="|모든 모터 정지"
    //% group="모터 제어(기초)"
    export function motorStopAll(): void {
        for (let idx = 1; idx <= 4; idx++) {
            motorStop(idx);
        }
    }

    /**
        * noraml mode controll
        * M1~M4.
        * speed(0~255).
       */
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

        if (speed >= 4096) {
            speed = 4095
        }
        if (speed <= -4096) {
            speed = -4095
        }

        if (direction == 1) {
            // M1 foward
            setPwm(7, 0, speed);
            setPwm(6, 0, 0);

            // M2 foward
            setPwm(5, 0, speed);
            setPwm(4, 0, 0);

            // M3 foward
            setPwm(3, 0, 0);
            setPwm(2, 0, speed);

            // M4 foward
            setPwm(1, 0, 0);
            setPwm(0, 0, speed);
        }


        if (direction == 2) {
            // M1 backward
            setPwm(7, 0, 0);
            setPwm(6, 0, speed);

            // M2 backward
            setPwm(5, 0, 0);
            setPwm(4, 0, speed);

            // M3 backward
            setPwm(3, 0, speed);
            setPwm(2, 0, 0);

            // M4 backward
            setPwm(1, 0, speed);
            setPwm(0, 0, 0);
        }

        if (direction == 3) {
            // M1 foward
            setPwm(7, 0, speed);
            setPwm(6, 0, 0);

            // M2 foward
            setPwm(5, 0, speed);
            setPwm(4, 0, 0);

            // M3 backward
            setPwm(3, 0, speed);
            setPwm(2, 0, 0);

            // M4 backward
            setPwm(1, 0, speed);
            setPwm(0, 0, 0);
        }

        if (direction == 4) {
            // M1 backward
            setPwm(7, 0, 0);
            setPwm(6, 0, speed);

            // M2 backward
            setPwm(5, 0, 0);
            setPwm(4, 0, speed);

            // M3 backward
            setPwm(3, 0, 0);
            setPwm(2, 0, speed);

            // M4 backward
            setPwm(1, 0, 0);
            setPwm(0, 0, speed);
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
        // send pulse
        pins.setPull(trig, PinPullMode.PullNone);
        pins.digitalWritePin(trig, 0);
        control.waitMicros(2);
        pins.digitalWritePin(trig, 1);
        control.waitMicros(10);
        pins.digitalWritePin(trig, 0);

        // read pulse
        const d = pins.pulseIn(echo, PulseValue.High, maxCmDistance * 58);

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
        //% block="흰색"
        White,
        //% block="검은색"
        Black,
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
            smbus.writeByte(this.addr, 0x80, 0x03)
            smbus.writeByte(this.addr, 0x81, 0x2b)
        }

        setIntegrationTime(time: number): void {
            this.setup()
            time = Math.clamp(0, 255, time * 10 / 24)
            smbus.writeByte(this.addr, 0x81, 255 - time)
        }

        light(): number {
            return this.raw()[0]
        }

        rgb(): number[] {
            let result: number[] = this.raw()
            let clear: number = result.shift()
            for (let x: number = 0; x < result.length; x++) {
                result[x] = result[x] * 255 / clear
            }
            return result
        }

        raw(): number[] {
            this.setup()
            let result: Buffer = smbus.readBuffer(this.addr, 0xb4, pins.sizeOf(NumberFormat.UInt16LE) * 4)
            return smbus.unpack("HHHH", result)
        }
    }

    let _tcs3472: tcs3472 = new tcs3472(0x29)

    /**
     * 밝기 레벨 센싱
     */
    //% blockId=brickcell_color_tcs34725_get_light
    //% block="밝기(B) 값 읽기"
    //% group="색상 감지 센서"
    export function getLight(): number {
        return Math.round(_tcs3472.light())
    }

    /**
     * R 데이터 센싱
     */
    //% blockId=brickcell_color_tcs34725__get_red
    //% block="빨간색(R) 색상 값 읽기"
    //% group="색상 감지 센서"
    export function getRed(): number {
        return Math.round(_tcs3472.rgb()[0]);
    }

    /**
     * G 데이터 센싱
     */
    //% blockId=brickcell_color_tcs34725_get_green
    //% block="초록색(G) 색상 값 읽기"
    //% group="색상 감지 센서"
    export function getGreen(): number {
        return Math.round(_tcs3472.rgb()[1]);
    }

    /**
     * B 데이터 센싱
     */
    //% blockId=brickcell_color_tcs34725_get_blue
    //% block="파란색(B) 색상 값 읽기"
    //% group="색상 감지 센서"
    export function getBlue(): number {
        return Math.round(_tcs3472.rgb()[2]);
    }

    /**
     * Set the integration time of the colour sensor in ms
     */
    //% blockId=brickcell_color_tcs34725_set_integration_time
    //% block="색상 통합 시간을 %time ms로 설정"
    //% time.min=0 time.max=612 value.defl=500
    //% group="색상 감지 센서"
    export function setColourIntegrationTime(time: number): void {
        return _tcs3472.setIntegrationTime(time)
    }

    /**
     * 감지된 색상이 지정된 색상인지 확인
     */
    //% blockId=color_sensor_is_color
    //% block="감지된 색상이 %color"
    //% group="색상 감지 센서"
    export function isColor(color: DetectedColor): boolean {
        const rgb = _tcs3472.rgb();
        const r = rgb[0];
        const g = rgb[1];
        const b = rgb[2];

        const total = r + g + b;
        if (total === 0) return false;

        const normR = r / total;
        const normG = g / total;
        const normB = b / total;

        switch (color) {
            case DetectedColor.Red:
                return normR > 0.5 && normG < 0.3 && normB < 0.3;
            case DetectedColor.Green:
                return normG > 0.5 && normR < 0.3 && normB < 0.3;
            case DetectedColor.Blue:
                return normB > 0.5 && normR < 0.3 && normG < 0.3;
            case DetectedColor.White:
                return r > 200 && g > 200 && b > 200;
            case DetectedColor.Black:
                return r < 50 && g < 50 && b < 50;
            default:
                return false;
        }
    }

    /**
    * ---------------oled display(elecfrik)-------------------
       let font: Buffer;
   
       const SSD1306_SETCONTRAST = 0x81
       const SSD1306_SETCOLUMNADRESS = 0x21
       const SSD1306_SETPAGEADRESS = 0x22
       const SSD1306_DISPLAYALLON_RESUME = 0xA4
       const SSD1306_DISPLAYALLON = 0xA5
       const SSD1306_NORMALDISPLAY = 0xA6
       const SSD1306_INVERTDISPLAY = 0xA7
       const SSD1306_DISPLAYOFF = 0xAE
       const SSD1306_DISPLAYON = 0xAF
       const SSD1306_SETDISPLAYOFFSET = 0xD3
       const SSD1306_SETCOMPINS = 0xDA
       const SSD1306_SETVCOMDETECT = 0xDB
       const SSD1306_SETDISPLAYCLOCKDIV = 0xD5
       const SSD1306_SETPRECHARGE = 0xD9
       const SSD1306_SETMULTIPLEX = 0xA8
       const SSD1306_SETLOWCOLUMN = 0x00
       const SSD1306_SETHIGHCOLUMN = 0x10
       const SSD1306_SETSTARTLINE = 0x40
       const SSD1306_MEMORYMODE = 0x20
       const SSD1306_COMSCANINC = 0xC0
       const SSD1306_COMSCANDEC = 0xC8
       const SSD1306_SEGREMAP = 0xA0
       const SSD1306_CHARGEPUMP = 0x8D
       const chipAdress = 0x3C
       const xOffset = 0
       const yOffset = 0
       let charX = 0
       let charY = 0
       let displayWidth = 128
       let displayHeight = 64 / 8
       let screenSize = 0
       //let font: Array<Array<number>>
       let loadStarted: boolean;
       let loadPercent: number;
       function command(cmd: number) {
           let buf = pins.createBuffer(2)
           buf[0] = 0x00
           buf[1] = cmd
           pins.i2cWriteBuffer(chipAdress, buf, false)
       }
   
       //% group="디스플레이 설정"
       //% block="디스플레이 사용 시작"
       //% width.defl=128
       //% height.defl=64
       export function init() {
           command(SSD1306_DISPLAYOFF);
           command(SSD1306_SETDISPLAYCLOCKDIV);
           command(0x80);                                  // the suggested ratio 0x80
           command(SSD1306_SETMULTIPLEX);
           command(0x3F);
           command(SSD1306_SETDISPLAYOFFSET);
           command(0x0);                                   // no offset
           command(SSD1306_SETSTARTLINE | 0x0);            // line #0
           command(SSD1306_CHARGEPUMP);
           command(0x14);
           command(SSD1306_MEMORYMODE);
           command(0x00);                                  // 0x0 act like ks0108
           command(SSD1306_SEGREMAP | 0x1);
           command(SSD1306_COMSCANDEC);
           command(SSD1306_SETCOMPINS);
           command(0x12);
           command(SSD1306_SETCONTRAST);
           command(0xCF);
           command(SSD1306_SETPRECHARGE);
           command(0xF1);
           command(SSD1306_SETVCOMDETECT);
           command(0x40);
           command(SSD1306_DISPLAYALLON_RESUME);
           command(SSD1306_NORMALDISPLAY);
           command(SSD1306_DISPLAYON);
           displayWidth = 128
           displayHeight = 64 / 8
           screenSize = displayWidth * displayHeight
           charX = xOffset
           charY = yOffset
           font = hex`
       0000000000
       3E5B4F5B3E
       3E6B4F6B3E
       1C3E7C3E1C
       183C7E3C18
       1C577D571C
       1C5E7F5E1C
       00183C1800
       FFE7C3E7FF
       0018241800
       FFE7DBE7FF
       30483A060E
       2629792926
       407F050507
       407F05253F
       5A3CE73C5A
       7F3E1C1C08
       081C1C3E7F
       14227F2214
       5F5F005F5F
       06097F017F
       006689956A
       6060606060
       94A2FFA294
       08047E0408
       10207E2010
       08082A1C08
       081C2A0808
       1E10101010
       0C1E0C1E0C
       30383E3830
       060E3E0E06
       0000000000
       00005F0000
       0007000700
       147F147F14
       242A7F2A12
       2313086462
       3649562050
       0008070300
       001C224100
       0041221C00
       2A1C7F1C2A
       08083E0808
       0080703000
       0808080808
       0000606000
       2010080402
       3E5149453E
       00427F4000
       7249494946
       2141494D33
       1814127F10
       2745454539
       3C4A494931
       4121110907
       3649494936
       464949291E
       0000140000
       0040340000
       0008142241
       1414141414
       0041221408
       0201590906
       3E415D594E
       7C1211127C
       7F49494936
       3E41414122
       7F4141413E
       7F49494941
       7F09090901
       3E41415173
       7F0808087F
       00417F4100
       2040413F01
       7F08142241
       7F40404040
       7F021C027F
       7F0408107F
       3E4141413E
       7F09090906
       3E4151215E
       7F09192946
       2649494932
       03017F0103
       3F4040403F
       1F2040201F
       3F4038403F
       6314081463
       0304780403
       6159494D43
       007F414141
       0204081020
       004141417F
       0402010204
       4040404040
       0003070800
       2054547840
       7F28444438
       3844444428
       384444287F
       3854545418
       00087E0902
       18A4A49C78
       7F08040478
       00447D4000
       2040403D00
       7F10284400
       00417F4000
       7C04780478
       7C08040478
       3844444438
       FC18242418
       18242418FC
       7C08040408
       4854545424
       04043F4424
       3C4040207C
       1C2040201C
       3C4030403C
       4428102844
       4C9090907C
       4464544C44
       0008364100
       0000770000
       0041360800
       0201020402
       3C2623263C
       1EA1A16112
       3A4040207A
       3854545559
       2155557941
       2154547841
       2155547840
       2054557940
       0C1E527212
       3955555559
       3954545459
       3955545458
       0000457C41
       0002457D42
       0001457C40
       F0292429F0
       F0282528F0
       7C54554500
       2054547C54
       7C0A097F49
       3249494932
       3248484832
       324A484830
       3A4141217A
       3A42402078
       009DA0A07D
       3944444439
       3D4040403D
       3C24FF2424
       487E494366
       2B2FFC2F2B
       FF0929F620
       C0887E0903
       2054547941
       0000447D41
       3048484A32
       384040227A
       007A0A0A72
       7D0D19317D
       2629292F28
       2629292926
       30484D4020
       3808080808
       0808080838
       2F10C8ACBA
       2F102834FA
       00007B0000
       08142A1422
       22142A1408
       AA005500AA
       AA55AA55AA
       000000FF00
       101010FF00
       141414FF00
       1010FF00FF
       1010F010F0
       141414FC00
       1414F700FF
       0000FF00FF
       1414F404FC
       141417101F
       10101F101F
       1414141F00
       101010F000
       0000001F10
       1010101F10
       101010F010
       000000FF10
       1010101010
       101010FF10
       000000FF14
       0000FF00FF
       00001F1017
       0000FC04F4
       1414171017
       1414F404F4
       0000FF00F7
       1414141414
       1414F700F7
       1414141714
       10101F101F
       141414F414
       1010F010F0
       00001F101F
       0000001F14
       000000FC14
       0000F010F0
       1010FF10FF
       141414FF14
       1010101F00
       000000F010
       FFFFFFFFFF
       F0F0F0F0F0
       FFFFFF0000
       000000FFFF
       0F0F0F0F0F
       3844443844
       7C2A2A3E14
       7E02020606
       027E027E02
       6355494163
       3844443C04
       407E201E20
       06027E0202
       99A5E7A599
       1C2A492A1C
       4C7201724C
       304A4D4D30
       3048784830
       BC625A463D
       3E49494900
       7E0101017E
       2A2A2A2A2A
       44445F4444
       40514A4440
       40444A5140
       0000FF0103
       E080FF0000
       08086B6B08
       3612362436
       060F090F06
       0000181800
       0000101000
       3040FF0101
       001F01011E
       00191D1712
       003C3C3C3C
       0000000000`
           loadStarted = false
           loadPercent = 0
           clear()
       }
   
       //% group="디스플레이 제어(기초)"
       //% weight=6
       //% block="디스플레이 지움"
       export function clear() {
           loadStarted = false
           loadPercent = 0
           command(SSD1306_SETCOLUMNADRESS)
           command(0x00)
           command(displayWidth - 1)
           command(SSD1306_SETPAGEADRESS)
           command(0x00)
           command(displayHeight - 1)
           let data = pins.createBuffer(17);
           data[0] = 0x40; // Data Mode
           for (let i = 1; i < 17; i++) {
               data[i] = 0x00
           }
           // send display buffer in 16 byte chunks
           for (let i = 0; i < screenSize; i += 16) {
               pins.i2cWriteBuffer(chipAdress, data, false)
           }
           charX = xOffset
           charY = yOffset
       }
   
       //% group="디스플레이 제어(기초)"
       //% block="(줄바꿈 없이) 화면에 $str 문장 출력"
       export function writeString(str: string) {
           for (let i = 0; i < str.length; i++) {
               if (charX > displayWidth - 6) {
                   newLine()
               }
               drawChar(charX, charY, str.charAt(i))
               charX += 6
           }
       }
   
       //% group="디스플레이 제어(기초)"
       //% block="(줄바꿈 없이) 화면에 $n 숫자 출력"
       export function writeNum(n: number) {
           let numString = n.toString()
           writeString(numString)
       }
   
       //% group="디스플레이 제어(기초)"
       //% block="화면에 $str 문장 출력"
       export function writeStringNewLine(str: string) {
           writeString(str)
           newLine()
       }
   
       //% group="디스플레이 제어(기초)"
       //% block="화면에 $n 숫자 출력"
       export function writeNumNewLine(n: number) {
           writeNum(n)
           newLine()
       }
   
       //% group="디스플레이 제어(기초)"
       //% weight=5
       //% block="줄 바꿈"
       export function newLine() {
           charY++
           charX = xOffset
       }
   
       function drawChar(x: number, y: number, c: string) {
           command(SSD1306_SETCOLUMNADRESS)
           command(x)
           command(x + 5)
           command(SSD1306_SETPAGEADRESS)
           command(y)
           command(y + 1)
           let line = pins.createBuffer(2)
           line[0] = 0x40
           for (let i = 0; i < 6; i++) {
               if (i === 5) {
                   line[1] = 0x00
               } else {
                   let charIndex = c.charCodeAt(0)
                   let charNumber = font.getNumber(NumberFormat.UInt8BE, 5 * charIndex + i)
                   line[1] = charNumber
   
               }
               pins.i2cWriteBuffer(chipAdress, line, false)
           }
   
       }
       function drawShape(pixels: Array<Array<number>>) {
           let x1 = displayWidth
           let y1 = displayHeight * 8
           let x2 = 0
           let y2 = 0
           for (let i = 0; i < pixels.length; i++) {
               if (pixels[i][0] < x1) {
                   x1 = pixels[i][0]
               }
               if (pixels[i][0] > x2) {
                   x2 = pixels[i][0]
               }
               if (pixels[i][1] < y1) {
                   y1 = pixels[i][1]
               }
               if (pixels[i][1] > y2) {
                   y2 = pixels[i][1]
               }
           }
           let page1 = Math.floor(y1 / 8)
           let page2 = Math.floor(y2 / 8)
           let line = pins.createBuffer(2)
           line[0] = 0x40
           for (let x = x1; x <= x2; x++) {
               for (let page = page1; page <= page2; page++) {
                   line[1] = 0x00
                   for (let i = 0; i < pixels.length; i++) {
                       if (pixels[i][0] === x) {
                           if (Math.floor(pixels[i][1] / 8) === page) {
                               line[1] |= Math.pow(2, (pixels[i][1] % 8))
                           }
                       }
                   }
                   if (line[1] !== 0x00) {
                       command(SSD1306_SETCOLUMNADRESS)
                       command(x)
                       command(x + 1)
                       command(SSD1306_SETPAGEADRESS)
                       command(page)
                       command(page + 1)
                       //line[1] |= pins.i2cReadBuffer(chipAdress, 2)[1]
                       pins.i2cWriteBuffer(chipAdress, line, false)
                   }
               }
           }
       }
   
       //% group="디스플레이 제어(심화)"
       //% weight=4
       //% block="라인 출력:|x: $x0 y: $y0 에서| x: $x1 y: $y1|까지"
       //% x0.defl=0
       //% y0.defl=0
       //% x1.defl=20
       //% y1.defl=20
       export function drawLine(x0: number, y0: number, x1: number, y1: number) {
           let pixels: Array<Array<number>> = []
           let kx: number, ky: number, c: number, i: number, xx: number, yy: number, dx: number, dy: number;
           let targetX = x1
           let targetY = y1
           x1 -= x0; kx = 0; if (x1 > 0) kx = +1; if (x1 < 0) { kx = -1; x1 = -x1; } x1++;
           y1 -= y0; ky = 0; if (y1 > 0) ky = +1; if (y1 < 0) { ky = -1; y1 = -y1; } y1++;
           if (x1 >= y1) {
               c = x1
               for (i = 0; i < x1; i++ , x0 += kx) {
                   pixels.push([x0, y0])
                   c -= y1; if (c <= 0) { if (i != x1 - 1) pixels.push([x0 + kx, y0]); c += x1; y0 += ky; if (i != x1 - 1) pixels.push([x0, y0]); }
                   if (pixels.length > 20) {
                       drawShape(pixels)
                       pixels = []
                       drawLine(x0, y0, targetX, targetY)
                       return
                   }
               }
           } else {
               c = y1
               for (i = 0; i < y1; i++ , y0 += ky) {
                   pixels.push([x0, y0])
                   c -= x1; if (c <= 0) { if (i != y1 - 1) pixels.push([x0, y0 + ky]); c += y1; x0 += kx; if (i != y1 - 1) pixels.push([x0, y0]); }
                   if (pixels.length > 20) {
                       drawShape(pixels)
                       pixels = []
                       drawLine(x0, y0, targetX, targetY)
                       return
                   }
               }
           }
           drawShape(pixels)
       }
   
       //% group="디스플레이 제어(심화)"
       //% weight=3
       //% block="사각형 출력:| x: $x0 y: $y0 에서| x: $x1 y: $y1|까지"
       //% x0.defl=0
       //% y0.defl=0
       //% x1.defl=20
       //% y1.defl=20
       export function drawRectangle(x0: number, y0: number, x1: number, y1: number) {
           drawLine(x0, y0, x1, y0)
           drawLine(x0, y1, x1, y1)
           drawLine(x0, y0, x0, y1)
           drawLine(x1, y0, x1, y1)
       }
   
       //% group="디스플레이 제어(심화)"
       //% weight=2
       //% block="속이 비워진 원(○) 출력:| x: $x y: $y| 크기: radius: $r"
       //% x.defl=64
       //% y.defl=32
       //% r.defl=10
       //% weight=0
       export function drawCircle(x: number, y: number, r: number) {
           let theta = 0;
           let step = Math.PI / 90;  // Adjust step for smoothness
           let pixels: Array<Array<number>> = [];
       
           while (theta < 2 * Math.PI) {
               let xPos = Math.floor(x + r * Math.cos(theta));
               let yPos = Math.floor(y + r * Math.sin(theta));
               pixels.push([xPos, yPos]);
               theta += step;
           }
       
           drawShape(pixels);
       }
       
       //% group="디스플레이 제어(심화)"
       //% weight=1
       //% block="속이 채워진 원(●) 출력:| x: $x y: $y| 크기: radius: $r"
       //% x.defl=64
       //% y.defl=32
       //% r.defl=10
       export function drawFilledCircle(x: number, y: number, r: number) {
           for (let dx = -r; dx <= r; dx++) {
               let height = Math.floor(Math.sqrt(r * r - dx * dx));
               drawLine(x + dx, y - height, x + dx, y + height);
           }
       }
       */
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
        cmd1(0xb0 | page) // page number
        cmd1(0x00 | (col % 16)) // lower start column address
        cmd1(0x10 | (col >> 4)) // upper start column address    
    }

    // clear bit
    function clrbit(d: number, b: number): number {
        if (d & (1 << b))
            d -= (1 << b)
        return d
    }

    /**
     * draw / refresh screen
     */
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
        if (on)
            cmd1(0xAF);
        else
            cmd1(0xAE);
    }

    //% block="픽셀 출력 - 위치: x %x y %y, 색상: %color"
    //% x.max=127 x.min=0 x.defl=0
    //% y.max=63 y.min=0 y.defl=0
    //% color.max=1 color.min=0 color.defl=1
    //% group="디스플레이 제어(도형)"
    //% weight=4
    export function pixel(x: number, y: number, color: number = 1) {
        let page = y >> 3
        let shift_page = y % 8
        let ind = x + page * 128 + 1
        let b = (color) ? (_screen[ind] | (1 << shift_page)) : clrbit(_screen[ind], shift_page)
        _screen[ind] = b
        /*if (_DRAW) {
            set_pos(x, page)
            _buf2[0] = 0x40
            _buf2[1] = b
            pins.i2cWriteBuffer(_I2CAddr, _buf2)
        }*/
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
    //%blockGap=8 inlineInputMode=inline
    //% group="디스플레이 제어(데이터)"
    //% weight=1
    export function showString(s: string, col: number, row: number, color: number = 1) {
        let steps = 0
        if (_DOUBLE) {
            steps = 12
            row *= 2
        } else {
            steps = 6
        }
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

        if (_DOUBLE) {
            _cy += 2
        } else {
            _cy++
        }
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
        let steps = 0
        if (_DOUBLE) {
            steps = 12
        } else {
            steps = 6
        }

        for (let n = 0; n < s.length; n++) {
            char(s.charAt(n), _cx, _cy, 1)
            _cx += steps
            if (_cx > 120) {
                scroll()
            }
        }
        if (newline) {
            scroll()
        }

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
        if (x1 > x2)
            x1 = [x2, x2 = x1][0];
        if (y1 > y2)
            y1 = [y2, y2 = y1][0];
        _DRAW = 0
        horizontalLine(x1, y1, x2 - x1 + 1, color)
        horizontalLine(x1, y2, x2 - x1 + 1, color)
        verticalLine(x1, y1, y2 - y1 + 1, color)
        verticalLine(x2, y1, y2 - y1 + 1, color)
        _DRAW = 1
        draw(1)
    }


    // % blockId="OLED12864_I2C_init" block="start OD01"
    // % weight=5 blockGap=8
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
    function readNumber(addr: number, register: number, fmt: NumberFormat = NumberFormat.UInt8LE): number {
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