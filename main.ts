
/*！
 * @file pxt-motor/main.ts
 * @brief DFRobot's microbit motor drive makecode library.
 * @n [Get the module here](http://www.dfrobot.com.cn/goods-1577.html)
 * @n This is the microbit special motor drive library, which realizes control 
 *    of the eight-channel steering gear, two-step motor and four-way dc motor.
 *
 * @copyright	[DFRobot](http://www.dfrobot.com), 2016
 * @copyright	GNU Lesser General Public License
 *
 * @author [email](1035868977@qq.com)
 * @version  V1.0.1
 * @date  2018-03-20
 */

/**
 *This is DFRobot:motor user motor and steering control function.
 */
//% weight=10 color=#58ACFA icon="\uf057" block="Pony Bot"
//% groups="['서보모터 제어', '모터 제어(기초)','모터 제어(심화)']"
namespace motor {
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
        //% block="↖️"
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
        let buf = pins.createBuffer(1)
        buf[0] = value
        pins.i2cWriteBuffer(addr, buf)
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

        let buf = pins.createBuffer(5);
        buf[0] = LED0_ON_L + 4 * channel;
        buf[1] = on & 0xff;
        buf[2] = (on >> 8) & 0xff;
        buf[3] = off & 0xff;
        buf[4] = (off >> 8) & 0xff;
        pins.i2cWriteBuffer(PCA9685_ADDRESS, buf);
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
        // 1  2  3  |  ↖️  ↑  ↗
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

}