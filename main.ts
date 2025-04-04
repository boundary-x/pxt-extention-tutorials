//% weight=10 color=#58ACFA icon="\uf057" block="AI ponybot"
namespace aiPonybot {
    /**
     * ---------------PCA9685-------------------
     */
    const PCA9685_ADDRESS = 0x40;
    const MODE1 = 0x00;
    const MODE2 = 0x01;
    const SUBADR1 = 0x02;
    const SUBADR2 = 0x03;
    const SUBADR3 = 0x04;
    const PRESCALE = 0xFE;
    const LED0_ON_L = 0x06;
    const LED0_ON_H = 0x07;
    const LED0_OFF_L = 0x08;
    const LED0_OFF_H = 0x09;
    const ALL_LED_ON_L = 0xFA;
    const ALL_LED_ON_H = 0xFB;
    const ALL_LED_OFF_L = 0xFC;
    const ALL_LED_OFF_H = 0xFD;

    const STP_CHA_L = 2047;
    const STP_CHA_H = 4095;
    const STP_CHB_L = 1;
    const STP_CHB_H = 2047;
    const STP_CHC_L = 1023;
    const STP_CHC_H = 3071;
    const STP_CHD_L = 3071;
    const STP_CHD_H = 1023;

    const BYG_CHA_L = 3071;
    const BYG_CHA_H = 1023;
    const BYG_CHB_L = 1023;
    const BYG_CHB_H = 3071;
    const BYG_CHC_L = 4095;
    const BYG_CHC_H = 2047;
    const BYG_CHD_L = 2047;
    const BYG_CHD_H = 4095;

    export enum Mecanum {
        //% block="↖"
        LeftForward = 1,
        //% block="↑"
        Forward = 2,
        //% block="↗"
        RightForward = 3,
        //% block="←"
        Left = 4,
        //% block="s"
        Stop = 5,
        //% block="→"
        Right = 6,
        //% block="↙"
        LeftBackward = 7,
        //% block="↓"
        Backward = 8,
        //% block="↘"
        RightBackward = 9
    }

    export enum DirectionControl {
        //% block="↑"
        Forward = 1,
        //% block="↓"
        Backward = 2,
        //% block="↶"
        Clockwise = 3,
        //% block="↷"
        CounterClockwise = 4,
    }

    export enum Stepper {
        //% block="42"
        Stepper42 = 1,
        //% block="28"
        Stepper28 = 2
    }

    export enum Servo {
        //% block="서보 1"
        Servo1 = 0x01,
        //% block="서보 2"
        Servo2 = 0x02,
        //% block="서보 3"
        Servo3 = 0x03,
        //% block="서보 4"
        Servo4 = 0x04,
        //% block="서보 5"
        Servo5 = 0x05,
        //% block="서보 6"
        Servo6 = 0x06,
        //% block="서보 7"
        Servo7 = 0x07,
        //% block="서보 8"
        Servo8 = 0x08
    }

    export enum Motor {
        //% block="모터 1"
        Motor1 = 0x1,
        //% block="모터 2"
        Motor2 = 0x2,
        //% block="모터 3"
        Motor3 = 0x3,
        //% block="모터 4"
        Motor4 = 0x4
    }

    export enum Direction {
        //% blockId="정회전" block="정회전"
        Clockwise = 1,
        //% blockId="역회전" block="역회전"
        CounterClockwise = -1,
    }

    export enum StepperPair {
        Motors1And2 = 0x1,
        Motors3And4 = 0x2
    }

    let initialized = false;

    function i2cWrite(address: number, register: number, value: number) {
        let buffer = pins.createBuffer(2);
        buffer[0] = register;
        buffer[1] = value;
        pins.i2cWriteBuffer(address, buffer);
    }

    function i2cCmd(address: number, value: number) {
        let buffer = pins.createBuffer(1);
        buffer[0] = value;
        pins.i2cWriteBuffer(address, buffer);
    }

    function i2cRead(address: number, register: number) {
        pins.i2cWriteNumber(address, register, NumberFormat.UInt8BE);
        let value = pins.i2cReadNumber(address, NumberFormat.UInt8BE);
        return value;
    }

    function initPCA9685(): void {
        i2cWrite(PCA9685_ADDRESS, MODE1, 0x00);
        setFreq(50);
        initialized = true;
    }

    function setFreq(frequency: number): void {
        let prescaleValue = 25000000;
        prescaleValue /= 4096;
        prescaleValue /= frequency;
        prescaleValue -= 1;
        let prescale = prescaleValue;
        let oldMode = i2cRead(PCA9685_ADDRESS, MODE1);
        let newMode = (oldMode & 0x7F) | 0x10; // sleep
        i2cWrite(PCA9685_ADDRESS, MODE1, newMode); // go to sleep
        i2cWrite(PCA9685_ADDRESS, PRESCALE, prescale); // set the prescaler
        i2cWrite(PCA9685_ADDRESS, MODE1, oldMode);
        control.waitMicros(5000);
        i2cWrite(PCA9685_ADDRESS, MODE1, oldMode | 0xa1);
    }

    function setPwm(channel: number, on: number, off: number): void {
        if (channel < 0 || channel > 15) return;

        let buffer = pins.createBuffer(5);
        buffer[0] = LED0_ON_L + 4 * channel;
        buffer[1] = on & 0xff;
        buffer[2] = (on >> 8) & 0xff;
        buffer[3] = off & 0xff;
        buffer[4] = (off >> 8) & 0xff;
        pins.i2cWriteBuffer(PCA9685_ADDRESS, buffer);
    }

    function setStepper28(index: number, direction: boolean): void {
        if (index == 1) {
            if (direction) {
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
            if (direction) {
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

    function setStepper42(index: number, direction: boolean): void {
        if (index == 1) {
            if (direction) {
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
            if (direction) {
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

    //% blockId=aiponybot_motor_servo block="|%index|서보모터|%degree|각도로 이동"
    //% weight=0
    //% degree.min=0 degree.max=180
    //% index.fieldEditor="gridpicker" index.fieldOptions.columns=4
    //% group="서보모터 제어"
    export function servo(index: Servo, degree: number): void {
        if (!initialized) {
            initPCA9685();
        }
        let microseconds = (degree * 1800 / 180 + 600); // 0.6ms ~ 2.4ms
        let value = microseconds * 4096 / 20000;
        setPwm(index + 7, 0, value);
    }

    //% weight=0
    //% blockId=aiponybot_motor_runMotor block="|%index|모터|%direction|방향|%speed|속도로 회전"
    //% speed.min=0 speed.max=255
    //% index.fieldEditor="gridpicker" index.fieldOptions.columns=2
    //% direction.fieldEditor="gridpicker" direction.fieldOptions.columns=2
    //% group="모터 제어(심화)"
    export function runMotor(index: Motor, direction: Direction, speed: number): void {
        if (!initialized) {
            initPCA9685();
        }
        if (index === Motor.Motor3 || index === Motor.Motor4) {
            direction = direction * -1 as Direction;
        }
        speed = speed * 16 * direction; // map 255 to 4096
        if (speed >= 4096) speed = 4095;
        if (speed <= -4096) speed = -4095;
        if (index > 4 || index <= 0) return;
        let positivePin = (4 - index) * 2;
        let negativePin = (4 - index) * 2 + 1;
        if (speed >= 0) {
            setPwm(positivePin, 0, 0);
            setPwm(negativePin, 0, speed);
        } else {
            setPwm(positivePin, 0, -speed);
            setPwm(negativePin, 0, -0);
        }
    }

    //% weight=0
    //% blockId=aiponybot_motor_runMecanum block="|메카넘|%direction|방향|%speed|속도로 이동"
    //% speed.min=0 speed.max=255
    //% direction.fieldEditor="gridpicker" direction.fieldOptions.columns=3
    //% group="모터 제어(기초)"
    export function runMecanum(direction: Mecanum, speed: number): void {
        if (!initialized) {
            initPCA9685();
        }
        speed = speed * 16; // map 255 to 4096
        if (speed >= 4096) speed = 4095;
        if (speed <= -4096) speed = -4095;

        switch (direction) {
            case Mecanum.LeftForward: // ↖
                setPwm(7, 0, speed); setPwm(6, 0, 0); // M1 forward
                setPwm(5, 0, 0); setPwm(4, 0, 0); // M2 stop
                setPwm(3, 0, 0); setPwm(2, 0, speed); // M3 forward
                setPwm(1, 0, 0); setPwm(0, 0, 0); // M4 stop
                break;
            case Mecanum.Forward: // ↑
                setPwm(7, 0, speed); setPwm(6, 0, 0); // M1 forward
                setPwm(5, 0, speed); setPwm(4, 0, 0); // M2 forward
                setPwm(3, 0, 0); setPwm(2, 0, speed); // M3 forward
                setPwm(1, 0, 0); setPwm(0, 0, speed); // M4 forward
                break;
            case Mecanum.RightForward: // ↗
                setPwm(7, 0, 0); setPwm(6, 0, 0); // M1 stop
                setPwm(5, 0, speed); setPwm(4, 0, 0); // M2 forward
                setPwm(3, 0, 0); setPwm(2, 0, 0); // M3 stop
                setPwm(1, 0, 0); setPwm(0, 0, speed); // M4 forward
                break;
            case Mecanum.Left: // ←
                setPwm(7, 0, speed); setPwm(6, 0, 0); // M1 forward
                setPwm(5, 0, 0); setPwm(4, 0, speed); // M2 backward
                setPwm(3, 0, 0); setPwm(2, 0, speed); // M3 forward
                setPwm(1, 0, speed); setPwm(0, 0, 0); // M4 backward
                break;
            case Mecanum.Stop: // s
                setPwm(7, 0, 0); setPwm(6, 0, 0); // M1 stop
                setPwm(5, 0, 0); setPwm(4, 0, 0); // M2 stop
                setPwm(3, 0, 0); setPwm(2, 0, 0); // M3 stop
                setPwm(1, 0, 0); setPwm(0, 0, 0); // M4 stop
                break;
            case Mecanum.Right: // →
                setPwm(7, 0, 0); setPwm(6, 0, speed); // M1 backward
                setPwm(5, 0, speed); setPwm(4, 0, 0); // M2 forward
                setPwm(3, 0, speed); setPwm(2, 0, 0); // M3 backward
                setPwm(1, 0, 0); setPwm(0, 0, speed); // M4 forward
                break;
            case Mecanum.LeftBackward: // ↙
                setPwm(7, 0, 0); setPwm(6, 0, 0); // M1 stop
                setPwm(5, 0, 0); setPwm(4, 0, speed); // M2 backward
                setPwm(3, 0, 0); setPwm(2, 0, 0); // M3 stop
                setPwm(1, 0, speed); setPwm(0, 0, 0); // M4 backward
                break;
            case Mecanum.Backward: // ↓
                setPwm(7, 0, 0); setPwm(6, 0, speed); // M1 backward
                setPwm(5, 0, 0); setPwm(4, 0, speed); // M2 backward
                setPwm(3, 0, speed); setPwm(2, 0, 0); // M3 backward
                setPwm(1, 0, speed); setPwm(0, 0, 0); // M4 backward
                break;
            case Mecanum.RightBackward: // ↘
                setPwm(7, 0, 0); setPwm(6, 0, speed); // M1 backward
                setPwm(5, 0, 0); setPwm(4, 0, 0); // M2 stop
                setPwm(3, 0, speed); setPwm(2, 0, 0); // M3 backward
                setPwm(1, 0, 0); setPwm(0, 0, 0); // M4 stop
                break;
        }
    }

    //% weight=0
    //% blockId=aiponybot_motor_stopMotor block="|%index|모터 정지"
    //% index.fieldEditor="gridpicker" index.fieldOptions.columns=2 
    //% group="모터 제어(심화)"
    export function stopMotor(index: Motor) {
        setPwm((4 - index) * 2, 0, 0);
        setPwm((4 - index) * 2 + 1, 0, 0);
    }

    //% weight=20
    //% blockId=aiponybot_motor_stopAllMotors block="|모든 모터 정지"
    //% group="모터 제어(기초)"
    export function stopAllMotors(): void {
        for (let idx = 1; idx <= 4; idx++) {
            stopMotor(idx as Motor);
        }
    }

    //% weight=0
    //% blockId=aiponybot_motor_runNormal block="|포니봇|%direction|방향|%speed|속도로 이동"
    //% speed.min=0 speed.max=255
    //% direction.fieldEditor="gridpicker" direction.fieldOptions.columns=2
    //% group="모터 제어(기초)"
    export function runNormal(direction: DirectionControl, speed: number): void {
        if (!initialized) {
            initPCA9685();
        }
        speed = speed * 16; // map 255 to 4096
        if (speed >= 4096) speed = 4095;
        if (speed <= -4096) speed = -4095;

        switch (direction) {
            case DirectionControl.Forward: // ↑
                setPwm(7, 0, speed); setPwm(6, 0, 0); // M1 forward
                setPwm(5, 0, speed); setPwm(4, 0, 0); // M2 forward
                setPwm(3, 0, 0); setPwm(2, 0, speed); // M3 forward
                setPwm(1, 0, 0); setPwm(0, 0, speed); // M4 forward
                break;
            case DirectionControl.Backward: // ↓
                setPwm(7, 0, 0); setPwm(6, 0, speed); // M1 backward
                setPwm(5, 0, 0); setPwm(4, 0, speed); // M2 backward
                setPwm(3, 0, speed); setPwm(2, 0, 0); // M3 backward
                setPwm(1, 0, speed); setPwm(0, 0, 0); // M4 backward
                break;
            case DirectionControl.Clockwise: // ↶
                setPwm(7, 0, speed); setPwm(6, 0, 0); // M1 forward
                setPwm(5, 0, speed); setPwm(4, 0, 0); // M2 forward
                setPwm(3, 0, speed); setPwm(2, 0, 0); // M3 backward
                setPwm(1, 0, speed); setPwm(0, 0, 0); // M4 backward
                break;
            case DirectionControl.CounterClockwise: // ↷
                setPwm(7, 0, 0); setPwm(6, 0, speed); // M1 backward
                setPwm(5, 0, 0); setPwm(4, 0, speed); // M2 backward
                setPwm(3, 0, 0); setPwm(2, 0, speed); // M3 forward
                setPwm(1, 0, 0); setPwm(0, 0, speed); // M4 forward
                break;
        }
    }

    /**
     * ---------------line sensor-------------------
     */
    export enum TwoLineState {
        //% block="◌ ◌ " 
        OffOff = 0,
        //% block="● ●" 
        OnOn = 1,
        //% block="● ◌" 
        OnOff = 2,
        //% block="◌ ●" 
        OffOn = 3,
    }

    export enum LineState {
        //% block="◌" 
        Off = 0,
        //% block="●" 
        On = 1
    }

    export enum LineSensorChannel {
        //% block="왼쪽"
        Left = 1,
        //% block="오른쪽"
        Right = 2,
    }

    //% blockId="checkTwoLineState"
    //% block="두 라인 센서의 값이 %state"
    //% state.fieldEditor="gridpicker" state.fieldOptions.columns=2
    //% group="라인 감지 센서"
    //% weight=0
    export function checkTwoLineState(state: TwoLineState): boolean {
        const leftSensor = pins.digitalReadPin(DigitalPin.P16);
        const rightSensor = pins.digitalReadPin(DigitalPin.P15);

        switch (state) {
            case TwoLineState.OffOff:
                return leftSensor === 0 && rightSensor === 0;
            case TwoLineState.OnOn:
                return leftSensor === 1 && rightSensor === 1;
            case TwoLineState.OnOff:
                return leftSensor === 1 && rightSensor === 0;
            case TwoLineState.OffOn:
                return leftSensor === 0 && rightSensor === 1;
            default:
                return false;
        }
    }

    //% blockId="checkSingleLineSensor"
    //% block="%channel 라인 센서의 값이 %state"
    //% channel.fieldEditor="gridpicker" channel.fieldOptions.columns=2
    //% state.fieldEditor="gridpicker" state.fieldOptions.columns=2
    //% group="라인 감지 센서"
    //% weight=0
    export function checkSingleLineSensor(channel: LineSensorChannel, state: LineState): boolean {
        const sensorValue = channel === LineSensorChannel.Left
            ? pins.digitalReadPin(DigitalPin.P16)
            : pins.digitalReadPin(DigitalPin.P15);
        return sensorValue === state;
    }

    //% blockId="readLineSensor"
    //% block="%channel 라인 센서 값 읽기"
    //% channel.fieldEditor="gridpicker" channel.fieldOptions.columns=2
    //% group="라인 감지 센서"
    //% weight=0
    export function readLineSensor(channel: LineSensorChannel): number {
        return channel === LineSensorChannel.Left
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

    //% blockId=aiponybot_sonar_ping
    //% block="%unit 단위로 측정한 거리"
    //% unit.fieldEditor="gridpicker" unit.fieldOptions.columns=2
    //% group="거리 감지 센서"
    //% weight=0
    export function ping(unit: PingUnit, maxCmDistance = 500): number {
        const trigger = DigitalPin.P13; // Trig 핀 기본값
        const echo = DigitalPin.P14; // Echo 핀 기본값
        pins.setPull(trigger, PinPullMode.PullNone);
        pins.digitalWritePin(trigger, 0);
        control.waitMicros(2);
        pins.digitalWritePin(trigger, 1);
        control.waitMicros(10);
        pins.digitalWritePin(trigger, 0);

        const distance = pins.pulseIn(echo, PulseValue.High, maxCmDistance * 58);

        if (distance === 0) {
            switch (unit) {
                case PingUnit.Centimeters: return maxCmDistance;
                case PingUnit.Inches: return Math.idiv(maxCmDistance * 100, 254);
                default: return maxCmDistance * 58;
            }
        }

        switch (unit) {
            case PingUnit.Centimeters: return Math.idiv(distance, 58);
            case PingUnit.Inches: return Math.idiv(distance, 148);
            default: return distance;
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
    }

    class Tcs3472 {
        isSetup: boolean;
        address: number;
        leds: DigitalPin;

        constructor(address: number) {
            this.isSetup = false;
            this.address = address;
        }

        setup(): void {
            if (this.isSetup) return;
            this.isSetup = true;
            aiPonybot.smbus.writeByte(this.address, 0x80, 0x03); // Enable register: PON | AEN
            aiPonybot.smbus.writeByte(this.address, 0x81, 0x2b); // Integration time: 103.2ms
        }

        setIntegrationTime(time: number): void {
            this.setup();
            time = Math.clamp(0, 255, time * 10 / 24);
            aiPonybot.smbus.writeByte(this.address, 0x81, 255 - time);
        }

        light(): number {
            return this.raw()[0]; // Clear channel 값 반환
        }

        rgb(): number[] {
            let result: number[] = this.raw();
            let clear: number = result.shift(); // Clear 값을 제거하고 저장
            if (clear === 0) return [0, 0, 0]; // Clear가 0이면 기본값 반환
            for (let index: number = 0; index < result.length; index++) {
                result[index] = result[index] * 255 / clear; // RGB 값을 Clear로 정규화
            }
            return result; // [R, G, B]
        }

        raw(): number[] {
            this.setup();
            try {
                let result: Buffer = aiPonybot.smbus.readBuffer(this.address, 0xb4, pins.sizeOf(NumberFormat.UInt16LE) * 4);
                return aiPonybot.smbus.unpack("HHHH", result); // [Clear, R, G, B]
            } catch (e) {
                return [0, 0, 0, 0]; // I2C 오류 시 기본값 반환
            }
        }
    }

    let colorSensor: Tcs3472 = new Tcs3472(0x29); // 기본 I2C 주소 0x29

    //% blockId=aiponybot_color_tcs34725_get_light
    //% block="밝기(B) 값 읽기"
    //% group="색상 감지 센서"
    export function getLight(): number {
        return Math.round(colorSensor.light());
    }

    //% blockId=aiponybot_color_tcs34725_get_red
    //% block="빨간색(R) 색상 값 읽기"
    //% group="색상 감지 센서"
    export function getRed(): number {
        return Math.round(colorSensor.rgb()[0]);
    }

    //% blockId=aiponybot_color_tcs34725_get_green
    //% block="초록색(G) 색상 값 읽기"
    //% group="색상 감지 센서"
    export function getGreen(): number {
        return Math.round(colorSensor.rgb()[1]);
    }

    //% blockId=aiponybot_color_tcs34725_get_blue
    //% block="파란색(B) 색상 값 읽기"
    //% group="색상 감지 센서"
    export function getBlue(): number {
        return Math.round(colorSensor.rgb()[2]);
    }

    //% blockId=aiponybot_color_tcs34725_set_integration_time
    //% block="색상 통합 시간을 %time ms로 설정"
    //% time.min=0 time.max=612 value.defl=500
    //% group="색상 감지 센서"
    export function setColorIntegrationTime(time: number): void {
        return colorSensor.setIntegrationTime(time);
    }

    //% blockId=aiponybot_color_sensor_is_color_advanced
    //% block="감지된 색상이 %color (임계값 %threshold)"
    //% threshold.min=10 threshold.max=100 threshold.defl=40
    //% group="색상 감지 센서"
    export function isColorAdvanced(color: DetectedColor, threshold: number = 40): boolean {
        const rgb = colorSensor.rgb();
        const red = rgb[0];
        const green = rgb[1];
        const blue = rgb[2];
        const clear = colorSensor.light();

        if (clear < 100) return false;

        const total = red + green + blue;
        if (total === 0) return false;

        const redRatio = red / total;
        const greenRatio = green / total;
        const blueRatio = blue / total;

        const thresholdRatio = threshold / 255;

        switch (color) {
            case DetectedColor.Red:
                return redRatio > greenRatio + thresholdRatio &&
                    redRatio > blueRatio + thresholdRatio &&
                    redRatio > 0.4;
            case DetectedColor.Green:
                return greenRatio > redRatio + thresholdRatio &&
                    greenRatio > blueRatio + thresholdRatio &&
                    greenRatio > 0.4;
            case DetectedColor.Blue:
                return blueRatio > redRatio + thresholdRatio &&
                    blueRatio > greenRatio + thresholdRatio * 0.8 &&
                    blueRatio > 0.35;
            case DetectedColor.Yellow:
                return redRatio > blueRatio + thresholdRatio &&
                    greenRatio > blueRatio + thresholdRatio &&
                    Math.abs(redRatio - greenRatio) < 0.1 &&
                    redRatio + greenRatio > 0.6;
            default:
                return false;
        }
    }

    //% blockId=aiponybot_color_sensor_is_in_range
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
        const rgb = colorSensor.rgb();
        const red = rgb[0];
        const green = rgb[1];
        const blue = rgb[2];

        return red > minR && red < maxR &&
            green > minG && green < maxG &&
            blue > minB && blue < maxB;
    }

    /**
 * ---------------oled display-------------------
 */
    const FONT_5X7 = hex`000000000000005F00000007000700147F147F14242A072A12231308646237495522500005030000001C2241000041221C00082A1C2A0808083E080800503000000808080808006060000020100804023E5149453E00427F400042615149462141454B311814127F1027454545393C4A49493001710905033649494936064949291E003636000000563600000008142241141414141441221408000201510906324979413E7E1111117E7F494949363E414141227F4141221C7F494949417F090901013E414151327F0808087F00417F41002040413F017F081422417F404040407F0204027F7F0408107F3E4141413E7F090909063E4151215E7F09192946464949493101017F01013F4040403F1F2040201F7F2018207F63140814630304780403615149454300007F4141020408102041417F000004020102044040404040000102040020545454787F484444383844444420384444487F3854545418087E090102081454543C7F0804047800447D40002040443D00007F10284400417F40007C041804787C0804047838444444387C14141408081414187C7C080404084854545420043F4440203C4040207C1C2040201C3C4030403C44281028440C5050503C4464544C44000836410000007F000000413608000201020402`;

    export enum Display {
        //% block="ON"
        On = 1,
        //% block="OFF"
        Off = 0
    }

    const MIN_X = 0;
    const MIN_Y = 0;
    const MAX_X = 127;
    const MAX_Y = 63;

    let i2cAddress = 60;
    let screen = pins.createBuffer(1025);
    let buffer2 = pins.createBuffer(2);
    let buffer3 = pins.createBuffer(3);
    let buffer4 = pins.createBuffer(4);
    let buffer7 = pins.createBuffer(7);
    let buffer13 = pins.createBuffer(13);
    buffer7[0] = 0x40;
    buffer13[0] = 0x40;
    let drawEnabled = 1;
    let cursorX = 0;
    let cursorY = 0;

    let zoomEnabled = 0;
    let doubleSize = 0;

    function sendCommand1(data: number) {
        let number = data % 256;
        pins.i2cWriteNumber(i2cAddress, number, NumberFormat.UInt16BE);
    }

    function sendCommand2(data1: number, data2: number) {
        buffer3[0] = 0;
        buffer3[1] = data1;
        buffer3[2] = data2;
        pins.i2cWriteBuffer(i2cAddress, buffer3);
    }

    function sendCommand3(data1: number, data2: number, data3: number) {
        buffer4[0] = 0;
        buffer4[1] = data1;
        buffer4[2] = data2;
        buffer4[3] = data3;
        pins.i2cWriteBuffer(i2cAddress, buffer4);
    }

    function setPosition(column: number = 0, page: number = 0) {
        sendCommand1(0xb0 | page);
        sendCommand1(0x00 | (column % 16));
        sendCommand1(0x10 | (column >> 4));
    }

    function clearBit(data: number, bit: number): number {
        if (data & (1 << bit)) data -= (1 << bit);
        return data;
    }

    function draw(data: number) {
        if (data > 0) {
            setPosition();
            pins.i2cWriteBuffer(i2cAddress, screen);
        }
    }

    //% block="디스플레이 색상 반전 %on"
    //% blockGap=8
    //% group="디스플레이 제어"
    //% on.shadow="toggleOnOff"
    //% weight=2
    export function invert(on: boolean = true) {
        let number = (on) ? 0xA7 : 0xA6;
        sendCommand1(number);
    }

    //% block="디스플레이 지우기"
    //% blockGap=8
    //% group="디스플레이 제어"
    //% weight=3
    export function clear() {
        cursorX = cursorY = 0;
        screen.fill(0);
        screen[0] = 0x40;
        draw(1);
    }

    //% block="디스플레이 화면 %on"
    //% on.defl=1
    //% blockGap=8
    //% group="디스플레이 제어"
    //% on.shadow="toggleOnOff"
    //% weight=1
    export function display(on: boolean) {
        if (on) sendCommand1(0xAF);
        else sendCommand1(0xAE);
    }

    //% block="픽셀 출력 - 위치: x %x y %y, 색상: %color"
    //% x.max=127 x.min=0 x.defl=0
    //% y.max=63 y.min=0 y.defl=0
    //% color.max=1 color.min=0 color.defl=1
    //% blockGap=8 inlineInputMode=inline
    //% group="디스플레이 제어(도형)"
    //% weight=4
    export function pixel(x: number, y: number, color: number = 1) {
        let page = y >> 3;
        let shiftPage = y % 8;
        let index = x + page * 128 + 1;
        let byte = (color) ? (screen[index] | (1 << shiftPage)) : clearBit(screen[index], shiftPage);
        screen[index] = byte;
    }

    function drawChar(character: string, column: number, row: number, color: number = 1) {
        let position = (Math.min(127, Math.max(character.charCodeAt(0), 32)) - 32) * 5;
        let margin = 0;
        let index = column + row * 128 + 1;

        if (doubleSize) {
            for (let i = 0; i < 5; i++) {
                let line = 0;
                for (let j = 0; j < 8; j++) {
                    if (color > 0 ? FONT_5X7[position + i] & (1 << j) : !(FONT_5X7[position + i] & (1 << j))) {
                        pixel(column + margin, row * 8 + line);
                        pixel(column + margin, row * 8 + line + 1);
                        pixel(column + margin + 1, row * 8 + line);
                        pixel(column + margin + 1, row * 8 + line + 1);
                    }
                    line += 2;
                }
                margin += 2;
            }
            let line = 0;
            for (let j = 0; j < 8; j++) {
                if (color == 0) {
                    pixel(column + 10, row * 8 + line);
                    pixel(column + 10, row * 8 + line + 1);
                    pixel(column + 11, row * 8 + line);
                    pixel(column + 11, row * 8 + line + 1);
                }
                line += 2;
            }
        } else {
            let j = 0;
            for (let i = 0; i < 5; i++) {
                screen[index + i] = (color > 0) ? FONT_5X7[position + i] : FONT_5X7[position + i] ^ 0xFF;
                if (zoomEnabled) {
                    buffer13[j + 1] = screen[index + i];
                    buffer13[j + 2] = screen[index + i];
                } else {
                    buffer7[i + 1] = screen[index + i];
                }
                j += 2;
            }
            screen[index + 5] = (color > 0) ? 0 : 0xFF;
            if (zoomEnabled) {
                buffer13[12] = screen[index + 5];
            } else {
                buffer7[6] = screen[index + 5];
            }
            setPosition(column, row);
            if (zoomEnabled) {
                pins.i2cWriteBuffer(i2cAddress, buffer13);
            } else {
                pins.i2cWriteBuffer(i2cAddress, buffer7);
            }
        }
    }

    //% block="문장 출력 - 내용: %text, 위치: %column열 %row행, 색상: %color"
    //% text.defl='AI ponybot'
    //% column.max=120 column.min=0 column.defl=0
    //% row.max=7 row.min=0 row.defl=0
    //% color.max=1 color.min=0 color.defl=1
    //% blockGap=8 inlineInputMode=inline
    //% group="디스플레이 제어(데이터)"
    //% weight=1
    export function showString(text: string, column: number, row: number, color: number = 1) {
        let steps = doubleSize ? 12 : 6;
        for (let n = 0; n < text.length; n++) {
            drawChar(text.charAt(n), column, row, color);
            column += steps;
        }
        if (doubleSize) draw(1);
    }

    //% block="숫자 출력 - 내용: %number, 위치: %column열 %row행, 색상: %color"
    //% number.defl=777
    //% column.max=120 column.min=0 column.defl=0
    //% row.max=7 row.min=0 row.defl=0
    //% color.max=1 color.min=0 color.defl=1
    //% blockGap=8 inlineInputMode=inline
    //% group="디스플레이 제어(데이터)"
    //% weight=3
    export function showNumber(number: number, column: number, row: number, color: number = 1) {
        showString(number.toString(), column, row, color);
    }

    function scroll() {
        cursorX = 0;
        cursorY += doubleSize ? 2 : 1;
        if (cursorY > 7) {
            cursorY = 7;
            screen.shift(128);
            screen[0] = 0x40;
            draw(1);
        }
    }

    //% block="문장 출력 - 내용: %text, 줄바꿈: %newline"
    //% text.defl="AI ponybot"
    //% newline.defl=true
    //% blockGap=8 inlineInputMode=inline
    //% group="디스플레이 제어(데이터)"
    //% weight=2
    export function printString(text: string, newline: boolean = true) {
        let steps = doubleSize ? 12 : 6;
        for (let n = 0; n < text.length; n++) {
            drawChar(text.charAt(n), cursorX, cursorY, 1);
            cursorX += steps;
            if (cursorX > 120) scroll();
        }
        if (newline) scroll();
        if (doubleSize) draw(1);
    }

    //% block="숫자 출력 - 내용: %number, 줄바꿈: %newline"
    //% number.defl="777"
    //% newline.defl=true
    //% weight=86 blockGap=8 inlineInputMode=inline
    //% group="디스플레이 제어(데이터)"
    //% weight=4
    export function printNumber(number: number, newline: boolean = true) {
        printString(number.toString(), newline);
    }

    //% block="수평선 출력 - 위치: x %x y %y, 길이: %length, 색상: %color"
    //% x.max=127 x.min=0 x.defl=0
    //% y.max=63 y.min=0 y.defl=0
    //% length.max=128 length.min=1 length.defl=16
    //% color.max=1 color.min=0 color.defl=1
    //% blockGap=8 inlineInputMode=inline
    //% group="디스플레이 제어(도형)"
    //% weight=2
    export function horizontalLine(x: number, y: number, length: number, color: number = 1) {
        let savedDraw = drawEnabled;
        if ((y < MIN_Y) || (y > MAX_Y)) return;
        drawEnabled = 0;
        for (let i = x; i < (x + length); i++)
            if ((i >= MIN_X) && (i <= MAX_X))
                pixel(i, y, color);
        drawEnabled = savedDraw;
        draw(drawEnabled);
    }

    //% block="수직선 출력 - 위치: x %x y %y, 길이: %length, 색상: %color"
    //% x.max=127 x.min=0 x.defl=0
    //% y.max=63 y.min=0 y.defl=0
    //% length.max=128 length.min=1 length.defl=16
    //% color.max=1 color.min=0 color.defl=1
    //% blockGap=8 inlineInputMode=inline
    //% group="디스플레이 제어(도형)"
    //% weight=1
    export function verticalLine(x: number, y: number, length: number, color: number = 1) {
        let savedDraw = drawEnabled;
        drawEnabled = 0;
        if ((x < MIN_X) || (x > MAX_X)) return;
        for (let i = y; i < (y + length); i++)
            if ((i >= MIN_Y) && (i <= MAX_Y))
                pixel(x, i, color);
        drawEnabled = savedDraw;
        draw(drawEnabled);
    }

    //% block="사각형 출력 - x1 %x1 y1 %y1 x2 %x2 y2 %y2, 색상: %color"
    //% color.defl=1
    //% blockGap=8 inlineInputMode=inline
    //% group="디스플레이 제어(도형)"
    //% weight=3
    export function rectangle(x1: number, y1: number, x2: number, y2: number, color: number = 1) {
        if (x1 > x2) x1 = [x2, x2 = x1][0];
        if (y1 > y2) y1 = [y2, y2 = y1][0];
        drawEnabled = 0;
        horizontalLine(x1, y1, x2 - x1 + 1, color);
        horizontalLine(x1, y2, x2 - x1 + 1, color);
        verticalLine(x1, y1, y2 - y1 + 1, color);
        verticalLine(x2, y1, y2 - y1 + 1, color);
        drawEnabled = 1;
        draw(1);
    }

    function initialize() {
        sendCommand1(0xAE);       // SSD1306_DISPLAYOFF
        sendCommand1(0xA4);       // SSD1306_DISPLAYALLON_RESUME
        sendCommand2(0xD5, 0xF0); // SSD1306_SETDISPLAYCLOCKDIV
        sendCommand2(0xA8, 0x3F); // SSD1306_SETMULTIPLEX
        sendCommand2(0xD3, 0x00); // SSD1306_SETDISPLAYOFFSET
        sendCommand1(0 | 0x0);    // line #SSD1306_SETSTARTLINE
        sendCommand2(0x8D, 0x14); // SSD1306_CHARGEPUMP
        sendCommand2(0x20, 0x00); // SSD1306_MEMORYMODE
        sendCommand3(0x21, 0, 127); // SSD1306_COLUMNADDR
        sendCommand3(0x22, 0, 63);  // SSD1306_PAGEADDR
        sendCommand1(0xa0 | 0x1); // SSD1306_SEGREMAP
        sendCommand1(0xc8);       // SSD1306_COMSCANDEC
        sendCommand2(0xDA, 0x12); // SSD1306_SETCOMPINS
        sendCommand2(0x81, 0xCF); // SSD1306_SETCONTRAST
        sendCommand2(0xd9, 0xF1); // SSD1306_SETPRECHARGE
        sendCommand2(0xDB, 0x40); // SSD1306_SETVCOMDETECT
        sendCommand1(0xA6);       // SSD1306_NORMALDISPLAY
        sendCommand2(0xD6, 0);    // zoom off
        sendCommand1(0xAF);       // SSD1306_DISPLAYON
        clear();
    }

    export namespace smbus {
        export function writeByte(address: number, register: number, value: number): void {
            let temp = pins.createBuffer(2);
            temp[0] = register;
            temp[1] = value;
            pins.i2cWriteBuffer(address, temp, false);
        }
        export function writeBuffer(address: number, register: number, value: Buffer): void {
            let temp = pins.createBuffer(value.length + 1);
            temp[0] = register;
            for (let index = 0; index < value.length; index++) {
                temp[index + 1] = value[index];
            }
            pins.i2cWriteBuffer(address, temp, false);
        }
        export function readBuffer(address: number, register: number, length: number): Buffer {
            let temp = pins.createBuffer(1);
            temp[0] = register;
            pins.i2cWriteBuffer(address, temp, false);
            return pins.i2cReadBuffer(address, length, false);
        }
        export function readNumber(address: number, register: number, format: NumberFormat = NumberFormat.UInt8LE): number {
            let temp = pins.createBuffer(1);
            temp[0] = register;
            pins.i2cWriteBuffer(address, temp, false);
            return pins.i2cReadNumber(address, format, false);
        }
        export function unpack(format: string, buffer: Buffer): number[] {
            let littleEndian: boolean = true;
            let offset: number = 0;
            let result: number[] = [];
            let numberFormat: NumberFormat = 0;
            for (let charIndex = 0; charIndex < format.length; charIndex++) {
                switch (format.charAt(charIndex)) {
                    case '<':
                        littleEndian = true;
                        continue;
                    case '>':
                        littleEndian = false;
                        continue;
                    case 'c':
                    case 'B':
                        numberFormat = littleEndian ? NumberFormat.UInt8LE : NumberFormat.UInt8BE; break;
                    case 'b':
                        numberFormat = littleEndian ? NumberFormat.Int8LE : NumberFormat.Int8BE; break;
                    case 'H':
                        numberFormat = littleEndian ? NumberFormat.UInt16LE : NumberFormat.UInt16BE; break;
                    case 'h':
                        numberFormat = littleEndian ? NumberFormat.Int16LE : NumberFormat.Int16BE; break;
                }
                result.push(buffer.getNumber(numberFormat, offset));
                offset += pins.sizeOf(numberFormat);
            }
            return result;
        }
    }

    initialize();
}