/**
 * ジョイスティックでサーボモータを制御するための拡張機能
 * 
 * micro:bit V2ピン配置の考慮事項:
 * - アナログ入力として使用可能なピン: 
 *   - LED干渉なし: P0, P1, P2
 *   - LED干渉あり: P3, P4, P10
 * - デジタル出力（サーボ制御用）:
 *   - LED干渉なし: P8, P9, P12, P16
 * - P5とP11はボタンA/Bと共有されることに注意
 */

//% weight=100 color=#0fbc11 icon="\uf1b0" block="JoystickServo"
//% groups="['初期設定', 'サーボ制御', 'イベント']"
namespace joystick_servo {
    // 内部変数
    let _joystickXPin: AnalogPin = null;
    let _joystickYPin: AnalogPin = null;
    let _buttonPin: DigitalPin = null;
    let _servoXPin: AnalogPin = null;
    let _servoYPin: AnalogPin = null;

    // サーボ関連の設定
    let _servoMinAngle = 0;
    let _servoMaxAngle = 180;
    let _servoInitAngle = 90;
    let _servoStep = 15;

    // ジョイスティック閾値
    let _xMaxThresholdMax = 780;
    let _xMaxThresholdMin = 760;
    let _xMinThreshold = 250;
    let _yMaxThresholdMax = 800;
    let _yMaxThresholdMin = 760;
    let _yMinThreshold = 250;

    // 現在の角度
    let _xAngle = 90;
    let _yAngle = 90;

    // 前回の角度
    let _lastXAngle = 90;
    let _lastYAngle = 90;

    // 更新状態
    let _updated = false;
    let _lastActionTime = 0;

    // デバッグ設定
    let _debugMode = false;

    // イベントハンドラ
    let _buttonPressedHandler: () => void = null;
    let _angleChangedHandler: (xAngle: number, yAngle: number) => void = null;

    /**
     * ジョイスティックとサーボの初期設定
     * @param joystickXPin ジョイスティックX軸のピン設定 (推奨: P0, P1, P2)
     * @param joystickYPin ジョイスティックY軸のピン設定 (推奨: P0, P1, P2, P10)
     * @param buttonPin ジョイスティックボタンのピン設定 (推奨: P8, P9)
     * @param servoXPin X軸サーボのピン設定 (推奨: P12, P16)
     * @param servoYPin Y軸サーボのピン設定 (推奨: P12, P16)
     */
    //% blockId=joystick_servo_init
    //% block="ジョイスティックサーボを初期化 X軸 %joystickXPin Y軸 %joystickYPin ボタン %buttonPin サーボX %servoXPin サーボY %servoYPin"
    //% joystickXPin.defl=AnalogPin.P0
    //% joystickYPin.defl=AnalogPin.P1
    //% buttonPin.defl=DigitalPin.P8
    //% servoXPin.defl=AnalogPin.P12
    //% servoYPin.defl=AnalogPin.P16
    //% group="初期設定"
    //% weight=100
    export function init(
        joystickXPin: AnalogPin,
        joystickYPin: AnalogPin,
        buttonPin: DigitalPin,
        servoXPin: AnalogPin,
        servoYPin: AnalogPin
    ): void {
        _joystickXPin = joystickXPin;
        _joystickYPin = joystickYPin;
        _buttonPin = buttonPin;
        _servoXPin = servoXPin;
        _servoYPin = servoYPin;

        // ボタンピンをプルアップに設定
        pins.setPull(buttonPin, PinPullMode.PullUp);

        // サーボを初期位置に設定
        _xAngle = _servoInitAngle;
        _yAngle = _servoInitAngle;
        _lastXAngle = _servoInitAngle;
        _lastYAngle = _servoInitAngle;

        // サーボを初期位置に動かす
        pins.servoWritePin(_servoXPin, _xAngle);
        basic.pause(100);
        pins.servoWritePin(_servoYPin, _yAngle);

        if (_debugMode) {
            serial.redirectToUSB();
            serial.writeLine("=== JoystickServo初期化完了 ===");
            serial.writeLine(`ジョイスティックX: P${joystickXPin}`);
            serial.writeLine(`ジョイスティックY: P${joystickYPin}`);
            serial.writeLine(`ジョイスティックボタン: P${buttonPin}`);
            serial.writeLine(`サーボX: P${servoXPin}`);
            serial.writeLine(`サーボY: P${servoYPin}`);
            serial.writeLine(`サーボ初期角度: X=${_xAngle}度, Y=${_yAngle}度`);
        }

        // メインループの開始
        startMainLoop();
    }

    /**
     * サーボの角度範囲を設定する
     * @param minAngle 最小角度 (0-180)
     * @param maxAngle 最大角度 (0-180)
     * @param initAngle 初期角度 (0-180)
     * @param step 角度変化量
     */
    //% blockId=joystick_servo_set_limits
    //% block="サーボ角度範囲を設定 最小 %minAngle 最大 %maxAngle 初期値 %initAngle 変化量 %step"
    //% minAngle.min=0 minAngle.max=180 minAngle.defl=0
    //% maxAngle.min=0 maxAngle.max=180 maxAngle.defl=180
    //% initAngle.min=0 initAngle.max=180 initAngle.defl=90
    //% step.min=1 step.max=90 step.defl=15
    //% group="初期設定"
    //% weight=90
    export function setServoLimits(
        minAngle: number,
        maxAngle: number,
        initAngle: number,
        step: number
    ): void {
        _servoMinAngle = minAngle;
        _servoMaxAngle = maxAngle;
        _servoInitAngle = initAngle;
        _servoStep = step;

        // 初期角度を更新
        _xAngle = initAngle;
        _yAngle = initAngle;

        if (_debugMode) {
            serial.writeLine(`サーボ角度範囲更新: 最小=${minAngle}, 最大=${maxAngle}, 初期=${initAngle}, 変化量=${step}`);
        }
    }

    /**
     * ジョイスティックの閾値を設定する
     * @param xMaxThresholdMin X軸最大値の下限閾値
     * @param xMaxThresholdMax X軸最大値の上限閾値
     * @param xMinThreshold X軸最小値の閾値
     * @param yMaxThresholdMin Y軸最大値の下限閾値
     * @param yMaxThresholdMax Y軸最大値の上限閾値
     * @param yMinThreshold Y軸最小値の閾値
     */
    //% blockId=joystick_servo_set_thresholds
    //% block="ジョイスティック閾値を設定 X最大(下限-上限)%xMaxThresholdMin〜%xMaxThresholdMax X最小%xMinThreshold Y最大(下限-上限)%yMaxThresholdMin〜%yMaxThresholdMax Y最小%yMinThreshold"
    //% inlineInputMode=inline
    //% group="初期設定"
    //% weight=80
    export function setJoystickThresholds(
        xMaxThresholdMin: number,
        xMaxThresholdMax: number,
        xMinThreshold: number,
        yMaxThresholdMin: number,
        yMaxThresholdMax: number,
        yMinThreshold: number
    ): void {
        _xMaxThresholdMin = xMaxThresholdMin;
        _xMaxThresholdMax = xMaxThresholdMax;
        _xMinThreshold = xMinThreshold;
        _yMaxThresholdMin = yMaxThresholdMin;
        _yMaxThresholdMax = yMaxThresholdMax;
        _yMinThreshold = yMinThreshold;

        if (_debugMode) {
            serial.writeLine("ジョイスティック閾値を更新しました");
        }
    }

    /**
     * デバッグモードの設定
     * @param enabled デバッグモードを有効にするかどうか
     */
    //% blockId=joystick_servo_set_debug
    //% block="デバッグモードを %enabled にする"
    //% enabled.shadow="toggleOnOff"
    //% group="初期設定"
    //% weight=70
    export function setDebugMode(enabled: boolean): void {
        _debugMode = enabled;

        if (_debugMode) {
            serial.redirectToUSB();
            serial.writeLine("デバッグモードを有効にしました");
        } else {
            serial.writeLine("デバッグモードを無効にしました");
        }
    }

    /**
     * ボタンが押されたときに実行する関数を設定
     * @param handler ボタンが押されたときに実行する関数
     */
    //% blockId=joystick_servo_on_button_pressed
    //% block="ボタンが押されたとき"
    //% draggableParameters=reporter
    //% group="イベント"
    //% weight=60
    export function onButtonPressed(handler: () => void): void {
        _buttonPressedHandler = handler;
    }

    /**
     * サーボの角度が変化したときに実行する関数を設定
     * @param handler 角度が変化したときに実行する関数
     */
    //% blockId=joystick_servo_on_angle_changed
    //% block="角度が変化したとき"
    //% draggableParameters=reporter
    //% group="イベント"
    //% weight=50
    export function onAngleChanged(handler: (xAngle: number, yAngle: number) => void): void {
        _angleChangedHandler = handler;
    }

    /**
     * サーボの角度を手動で設定する
     * @param xAngle X軸サーボの角度
     * @param yAngle Y軸サーボの角度
     */
    //% blockId=joystick_servo_set_angles
    //% block="サーボ角度を設定 X %xAngle Y %yAngle"
    //% xAngle.min=0 xAngle.max=180 xAngle.defl=90
    //% yAngle.min=0 yAngle.max=180 yAngle.defl=90
    //% group="サーボ制御"
    //% weight=40
    export function setServoAngles(xAngle: number, yAngle: number): void {
        // 範囲内に収める
        _xAngle = Math.constrain(xAngle, _servoMinAngle, _servoMaxAngle);
        _yAngle = Math.constrain(yAngle, _servoMinAngle, _servoMaxAngle);

        // サーボを動かす
        moveServos();
    }

    /**
     * サーボを初期位置に戻す
     */
    //% blockId=joystick_servo_reset
    //% block="サーボを初期位置に戻す"
    //% group="サーボ制御"
    //% weight=30
    export function resetServos(): void {
        _xAngle = _servoInitAngle;
        _yAngle = _servoInitAngle;
        moveServos();
    }

    /**
     * X軸サーボの現在の角度を取得
     */
    //% blockId=joystick_servo_get_x_angle
    //% block="X軸サーボの角度"
    //% group="サーボ制御"
    //% weight=20
    export function getXAngle(): number {
        return _xAngle;
    }

    /**
     * Y軸サーボの現在の角度を取得
     */
    //% blockId=joystick_servo_get_y_angle
    //% block="Y軸サーボの角度"
    //% group="サーボ制御"
    //% weight=10
    export function getYAngle(): number {
        return _yAngle;
    }

    // 両方のサーボを現在の角度に移動させる (内部関数)
    function moveServos(): void {
        // X軸サーボの更新
        if (_xAngle != _lastXAngle) {
            pins.servoWritePin(_servoXPin, _xAngle);
            _lastXAngle = _xAngle;

            if (_debugMode) {
                serial.writeLine("X軸サーボ: " + _xAngle + "度に設定しました");
            }
        }

        // Y軸サーボの更新
        if (_yAngle != _lastYAngle) {
            pins.servoWritePin(_servoYPin, _yAngle);
            _lastYAngle = _yAngle;

            if (_debugMode) {
                serial.writeLine("Y軸サーボ: " + _yAngle + "度に設定しました");
            }
        }

        // イベントハンドラの呼び出し
        if (_angleChangedHandler && (_xAngle != _lastXAngle || _yAngle != _lastYAngle)) {
            _angleChangedHandler(_xAngle, _yAngle);
        }
    }

    // メインループの開始 (内部関数)
    function startMainLoop(): void {
        // メインループ
        basic.forever(function () {
            // 現在の時間を取得
            const currentTime = input.runningTime();

            // ジョイスティックの値を読み取る
            const xValue = pins.analogReadPin(_joystickXPin);
            const yValue = pins.analogReadPin(_joystickYPin);

            // ボタンの読み取り
            const buttonState = pins.digitalReadPin(_buttonPin);

            if (_debugMode) {
                serial.writeValue("x", xValue);
                serial.writeValue("y", yValue);
                serial.writeValue("btn", buttonState === 0 ? 1 : 0);
            }

            // 一定時間間隔でのみアクションを実行
            if (currentTime - _lastActionTime > 100) {
                _updated = false;

                // X軸の制御
                if (xValue > _xMaxThresholdMin && xValue <= _xMaxThresholdMax) {
                    // X軸が最大値範囲内なら角度を増やす
                    _xAngle = Math.min(_xAngle + _servoStep, _servoMaxAngle);
                    _updated = true;
                } else if (xValue < _xMinThreshold) {
                    // X軸が最小値より小さければ角度を減らす
                    _xAngle = Math.max(_xAngle - _servoStep, _servoMinAngle);
                    _updated = true;
                }

                // Y軸の制御
                if (yValue > _yMaxThresholdMin && yValue <= _yMaxThresholdMax) {
                    // Y軸が最大値範囲内なら角度を増やす
                    _yAngle = Math.min(_yAngle + _servoStep, _servoMaxAngle);
                    _updated = true;
                } else if (yValue < _yMinThreshold) {
                    // Y軸が最小値より小さければ角度を減らす
                    _yAngle = Math.max(_yAngle - _servoStep, _servoMinAngle);
                    _updated = true;
                }

                // ボタンが押されたとき
                if (buttonState === 0) {
                    // ボタンは通常プルアップされており、押すと0になる
                    if (_buttonPressedHandler) {
                        _buttonPressedHandler();
                    } else {
                        // デフォルトの動作（両方のサーボを中央に戻す）
                        _xAngle = _servoInitAngle;
                        _yAngle = _servoInitAngle;
                    }
                    _updated = true;

                    if (_debugMode) {
                        serial.writeLine("## ボタンが押されました ##");
                    }
                }

                // いずれかの値が更新されたら
                if (_updated) {
                    _lastActionTime = currentTime;
                    moveServos();
                }
            }

            // 短い待機時間
            basic.pause(50);
        });
    }
}