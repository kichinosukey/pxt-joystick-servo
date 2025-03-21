# JoystickServo 拡張機能

micro:bit でジョイスティックを使ってサーボモーターを簡単に制御するための拡張機能です。

## 使い方の基本

```blocks
// 初期化
joystick_servo.init(
    AnalogPin.P0,  // ジョイスティックX軸
    AnalogPin.P1,  // ジョイスティックY軸
    DigitalPin.P8, // ジョイスティックボタン
    AnalogPin.P12, // X軸サーボ
    AnalogPin.P16  // Y軸サーボ
)

// デバッグモードをオンにする（シリアル出力が有効になります）
joystick_servo.setDebugMode(true)

// ボタンが押されたときのカスタム動作を設定
joystick_servo.onButtonPressed(function() {
    // サーボを初期位置に戻す
    joystick_servo.resetServos()
    serial.writeLine("サーボをリセットしました")
})
```

### 詳細

```blocks
// サーボの角度範囲とステップ量を設定
joystick_servo.setServoLimits(
    0,    // 最小角度
    180,  // 最大角度
    90,   // 初期角度（中央位置）
    15    // ステップ量（一度の動きでの角度変化）
)

// ジョイスティックの閾値を設定
joystick_servo.setJoystickThresholds(
    760,  // X軸最大の下限閾値
    780,  // X軸最大の上限閾値
    250,  // X軸最小閾値
    760,  // Y軸最大の下限閾値
    800,  // Y軸最大の上限閾値
    250   // Y軸最小閾値
)
```

### イベント処理

```blocks
// サーボの角度が変わったときに実行する処理
joystick_servo.onAngleChanged(function(xAngle, yAngle) {
    // 現在の角度を表示
    serial.writeValue("X", xAngle)
    serial.writeValue("Y", yAngle)
})
```

## 接続方法

### 推奨ピン設定

推奨するピン設定は以下の通りです：

**単一ジョイスティック使用時：**
* **ジョイスティックX軸**: P0に接続（アナログ入力）
* **ジョイスティックY軸**: P1に接続（アナログ入力）
* **ジョイスティックボタン**: P8に接続（デジタル入力）
* **サーボモーターX**: P12に接続（デジタル出力）
* **サーボモーターY**: P16に接続（デジタル出力）

**2つのジョイスティック使用時：**
* **ジョイスティック1 X軸**: P0に接続（アナログ入力）
* **ジョイスティック1 Y軸**: P1に接続（アナログ入力）
* **ジョイスティック1 ボタン**: P8に接続（デジタル入力）
* **ジョイスティック2 X軸**: P2に接続（アナログ入力） 
* **ジョイスティック2 Y軸**: P10に接続（アナログ入力、LED列5と共有）
* **ジョイスティック2 ボタン**: P9に接続（デジタル入力）
* **サーボモーターX**: P12に接続（デジタル出力）
* **サーボモーターY**: P16に接続（デジタル出力）

## micro:bit V2のピン配置の考慮事項

micro:bitのピン配置を考慮することで、LEDマトリックスとの干渉を避けつつ、最適な動作を実現できます。

### ピンタイプと機能

* **アナログ入力として使用可能なピン**: 
  * LED干渉なし: P0, P1, P2
  * LED干渉あり: P3, P4, P10

* **デジタル出力として使用可能なピン（サーボ制御用）**:
  * LED干渉なし: P8, P9, P12, P16
  * LED干渉あり: P3, P4, P5, P6, P7, P10, P11

* **注意すべきピン**:
  * P5: ボタンAと共有
  * P11: ボタンBと共有

### ピン選択の基本方針

1. **ジョイスティックのアナログ入力**:
   - 最も精度が求められるため、LED干渉のないP0, P1, P2を優先的に使用
   - 追加で必要な場合はP10を使用（LED Col 5と共有）

2. **ジョイスティックのボタン入力**:
   - デジタル入力用としてP8, P9を優先的に使用

3. **サーボモーター制御**:
   - P12, P16を優先的に使用（LED干渉なし）

参考資料: [micro:bit ピン配置](https://makecode.microbit.org/device/pins)

### 推奨ジョイスティックモジュール

一般的な2軸ジョイスティックモジュール（XY軸 + ボタン）が使用できます。

**重要な注意事項:**
- **電源**: ジョイスティックモジュールは5V電源での動作を推奨します。micro:bitの3.3V電源では正確な値が得られない場合があります。

## Supported targets

* for PXT/microbit
(The metadata above is needed for package search.)


> このページを開く [https://kichinosukey.github.io/pxt-joystick-servo-/](https://kichinosukey.github.io/pxt-joystick-servo-/)

## 拡張機能として使用

このリポジトリは、MakeCode で **拡張機能** として追加できます。

* [https://makecode.microbit.org/](https://makecode.microbit.org/) を開く
* **新しいプロジェクト** をクリックしてください
* ギアボタンメニューの中にある **拡張機能** をクリックしてください
* **https://github.com/kichinosukey/pxt-joystick-servo** を検索してインポートします。

## このプロジェクトを編集します

MakeCode でこのリポジトリを編集します。

* [https://makecode.microbit.org/](https://makecode.microbit.org/) を開く
* **読み込む** をクリックし、 **URLから読み込む...** をクリックしてください
* **https://github.com/kichinosukey/pxt-joystick-servo** を貼り付けてインポートをクリックしてください

#### メタデータ (検索、レンダリングに使用)

* for PXT/microbit
<script src="https://makecode.com/gh-pages-embed.js"></script><script>makeCodeRender("{{ site.makecode.home_url }}", "{{ site.github.owner_name }}/{{ site.github.repository_name }}");</script>
