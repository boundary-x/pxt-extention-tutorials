//% weight=10 color=#58ACFA icon="\uf057" block="Pony Bot"
namespace ponyBot {
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

    export enum PingUnit {
        //% block="마이크로초"
        MicroSeconds,
        //% block="센티미터"
        Centimeters,
        //% block="인치"
        Inches
    }

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

    let _tcs3472: tcs3472 = new tcs3472(0x29);
    let calibrationMin: number[] = [0, 0, 0];
    let calibrationMax: number[] = [255, 255, 255];
    let isCalibrated: boolean = false;

    /**
     * 색상 센서 캘리브레이션
     */
    //% blockId=color_sensor_calibrate
    //% block="색상 센서 캘리브레이션 시작"
    //% group="색상 감지 센서"
    export function calibrate(): void {
        let calibrationStep = 0;

        // 초기 상태: 흰색 데이터 측정
        basic.showString("W");

        // A 버튼: 흰색 또는 검은색 데이터 측정
        input.onButtonPressed(Button.A, function () {
            if (calibrationStep === 0) {
                // 흰색 데이터 측정
                calibrationMax = _tcs3472.rgb();
                basic.showIcon(IconNames.Square); // 흰색 완료 표시
            } else if (calibrationStep === 1) {
                // 검은색 데이터 측정
                calibrationMin = _tcs3472.rgb();
                basic.showIcon(IconNames.SmallSquare); // 검은색 완료 표시
            }
        });

        // B 버튼: 단계 전환 및 완료 확인
        input.onButtonPressed(Button.B, function () {
            if (calibrationStep === 0) {
                // 블랙 측정 단계로 이동
                calibrationStep = 1;
                basic.showString("B");
            } else if (calibrationStep === 1) {
                // 완료 확인 단계로 이동
                calibrationStep = 2;

                // 유효성 검사 및 결과 표시
                if (isCalibrationDataValid()) {
                    applyCalibrationCorrection(); // 보정 적용
                    isCalibrated = true;
                    basic.showIcon(IconNames.Yes); // V 표시
                } else {
                    isCalibrated = false;
                    basic.showIcon(IconNames.No); // X 표시
                }
            }
        });
    }

    /**
     * 캘리브레이션 데이터가 유효한지 확인
     * @returns boolean 데이터가 유효하면 true, 그렇지 않으면 false
     */
    function isCalibrationDataValid(): boolean {
        return calibrationMax[0] > calibrationMin[0] &&
            calibrationMax[1] > calibrationMin[1] &&
            calibrationMax[2] > calibrationMin[2];
    }

    /**
     * 캘리브레이션 데이터 보정
     * 데이터 차이가 너무 작을 경우 기본 범위를 설정하여 보정
     */
    function applyCalibrationCorrection(): void {
        for (let i = 0; i < 3; i++) {
            if (calibrationMax[i] - calibrationMin[i] < 10) {
                // 흰색과 검은색 차이가 작으면 기본값 보정
                calibrationMin[i] = Math.max(0, calibrationMin[i] - 10);
                calibrationMax[i] = Math.min(255, calibrationMax[i] + 10);
            }
        }
    }

    /**
      * 캘리브레이션된 R, G, B 값 반환
      */
    export function getCalibratedRGB(): number[] {
        if (!isCalibrated) {
            basic.showIcon(IconNames.No); // 캘리브레이션이 필요함
            return [0, 0, 0];
        }
        const rawRGB = _tcs3472.rgb();
        return normalizeRGB(rawRGB);
    }

    /**
     * 정규화된 RGB 값 계산
     * @param rgb Raw RGB values from the sensor
     */
    function normalizeRGB(rgb: number[]): number[] {
        let normalized: number[] = [];
        for (let i = 0; i < rgb.length; i++) {
            const range = calibrationMax[i] - calibrationMin[i];
            if (range <= 0) {
                normalized.push(0);
            } else {
                const value = ((rgb[i] - calibrationMin[i]) / range) * 255;
                normalized.push(Math.clamp(0, 255, value));
            }
        }
        return normalized;
    }

    /**
    * RGB 데이터 중 하나 선택
    */
    export enum RGBColor {
        //% block="빨간색"
        Red = 0,
        //% block="초록색"
        Green = 1,
        //% block="파란색"
        Blue = 2
    }

    //% blockId=get_rgb_value
    //% block="%color 값 읽기"
    //% group="색상 감지 센서"
    export function getRGBValue(color: RGBColor): number {
        const calibratedRGB = getCalibratedRGB();
        return Math.round(calibratedRGB[color]);
    }

    /**
     * 특정 색상 감지
     */
    //% blockId=is_detected_color
    //% block="감지된 색상이 %color 입니까?"
    //% group="색상 감지 센서"
    export function isColor(color: DetectedColor): boolean {
        const rgb = getCalibratedRGB();
        const r = rgb[0];
        const g = rgb[1];
        const b = rgb[2];

        const total = r + g + b;
        if (total === 0) return false; // 검출 불가 시 false

        const normR = r / total;
        const normG = g / total;
        const normB = b / total;

        switch (color) {
            case DetectedColor.Red:
                return normR > 0.4 && normG < 0.3 && normB < 0.3;
            case DetectedColor.Green:
                return normG > 0.4 && normR < 0.3 && normB < 0.3;
            case DetectedColor.Blue:
                return normB > 0.4 && normR < 0.3 && normG < 0.3;
            case DetectedColor.White:
                return r > 200 && g > 200 && b > 200;
            case DetectedColor.Black:
                return r < 50 && g < 50 && b < 50;
            default:
                return false;
        }
    }
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