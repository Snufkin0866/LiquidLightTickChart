# LiquidLightTickChart

 Rosさん作成の[TradingView/lightweight-charts](https://github.com/tradingview/lightweight-charts)を使用したbitFlyer FXのTickチャート
https://ros522.github.io/LightTickChart
をLiquid用にも作りました。高頻度取引、スキャルパー向け。

- →こちらで使用可。
https://snufkin0866.github.io/LiquidLightTickChart/

# Feature

 - リアルタイムAPIを使用した描画
 - Privavate Channelによる注文、約定表示

 - 自注文はヨコ破線で表示されます。
 - 板のベスト値は点線で表示されます。
 - 約定情報は実線で表示されます。
 - 自注文の約定情報は矢印で表示されます。
 - LiquidはBoardの最良気配値更新をeventごとに描画すると更新回数が多すぎるため、前回更新から1秒経過しないと更新しないようにしています。
 - LiquidはbitFlyerのtickerに相当するリアルタイムAPIがないため、price_laddersチャンネルを板のベスト値取得に使っていますが、このチャンネルはタイムスタンプを返さないため受信タイムスタンプを使用しています。
 - 左上のSettingでAPI情報をセットするとプライベート約定及び注文の描画ができます。
 
 ![result](https://github.com/Snufkin0866/LiquidLightTickChart/blob/master/index.html-Google-Chrome-2019-12-16-01-44-32.gif)

# その他
 - プルリク歓迎です。
 - 可視化してみて分かったのですが、Liquidまじで約定少ないですね。出来高増えるように運営頑張ってほしい... 

 - bitMEXバージョンも気が向いたら作ろうと思ってるのですが、そうしているうちに誰かが作ってくれないかなとか思ってます。
 
 - 利用は自己責任で。本アプリケーション利用によるあらゆる利益損失の責任は負いかねます。 
