

class LiquidHFTChart {
    constructor() {
        const self = this
        this.exchange = new LiquidExchange()
        this.dom = document.body;
        this.chart = LightweightCharts.createChart(this.dom,
            {
                width: self.dom.clientWidth,
                height: self.dom.clientHeight,
                localization: {
                    locale: 'ja-JP',
                },
                layout: {
                    backgroundColor: '#12151A'
                },
                grid: {
                    vertLines: {
                        color: 'rgba(180, 180, 180, 0.3)',
                        style: 1,
                        visible: true,
                    },
                    horzLines: {
                        color: 'rgba(180, 180, 180, 0.3)',
                        style: 1,
                        visible: true,
                    },
                },
            });
        this.my_exec_series = this.chart.addLineSeries({
            lineWidth: 0,
            color: 'rgba(0,0,0,0)',
        })
        this.bid_series = this.chart.addLineSeries(
            {
                lineWidth: 1,
                lineStyle: LightweightCharts.LineStyle.Dotted,
                lastValueVisible: false,
                priceLineVisible: false,
                color: '#E54F6B',
                scaleMargins: {
                    top: 0,
                    bottom: 0.8,
                },
            }
        );

        this.ask_series = this.chart.addLineSeries(
            {
                lineWidth: 1,
                lineStyle: LightweightCharts.LineStyle.Dotted,
                lastValueVisible: false,
                priceLineVisible: false,
                color: '#4BA375',
                scaleMargins: {
                    top: 0,
                    bottom: 0.8,
                },
            }
        );
        this.buy_series = this.chart.addLineSeries(
            {
                lineWidth: 2,
                color: '#4BA375',
                scaleMargins: {
                    top: 0,
                    bottom: 0.8,
                },
            }
        );

        this.sell_series = this.chart.addLineSeries(
            {
                lineWidth: 2,
                color: '#E54F6B',
                scaleMargins: {
                    top: 0,
                    bottom: 0.8,
                },
            }
        );

        this.sell_vol = this.chart.addHistogramSeries(
            {
                overlay: true,
                lastValueVisible: false,
                priceLineVisible: false,
                color: 'rgba(229,79,106,0.5)',
                scaleMargins: {
                    top: 0.8,
                    bottom: 0,
                },
            }
        );
        this.buy_vol = this.chart.addHistogramSeries(
            {
                overlay: true,
                lastValueVisible: false,
                priceLineVisible: false,
                color: 'rgba(75,179,116,0.5)',
                scaleMargins: {
                    top: 0.8,
                    bottom: 0,
                },
            }
        );
        this.chart.applyOptions({
            timeScale: {
                rightOffset: 12,
                barSpacing: 3,
                visible: true,
                timeVisible: true,
                secondsVisible: true,
            },
        });

        this.contour_ask_series = new Array(5).fill(0).map((i, idx) => {
            const alpha = 1.0 - 0.2 * (idx-1)
            return this.chart.addLineSeries(
                {
                    lineWidth: 0.5,
                    lineStyle: LightweightCharts.LineStyle.Solid,
                    lastValueVisible: false,
                    priceLineVisible: false,
                    color: `rgba(75,163,117,${alpha})`,
                    scaleMargins: {
                        top: 0,
                        bottom: 0.8,
                    },
                });
        })
        this.contour_bid_series = new Array(5).fill(0).map((i, idx) => {
            const alpha = 1.0 - 0.2 * (idx-1)
            return this.chart.addLineSeries(
                {
                    lineWidth: 0.5,
                    lineStyle: LightweightCharts.LineStyle.Solid,
                    lastValueVisible: false,
                    priceLineVisible: false,
                    color: `rgba(229,79,107,${alpha})`,
                    scaleMargins: {
                        top: 0,
                        bottom: 0.8,
                    },
                });
        })

        this.markers = []
        this.orders_line = {}
        // resize to window size
        window.onresize = function () {
            self.chart.resize(self.dom.clientHeight, self.dom.clientWidth)
        }
        // control private ch enable button
        document.getElementById('enable_private_ch').onclick = function () {
            const api_key = document.getElementById('key').value
            const secret = document.getElementById('secret').value
            if (api_key && secret) self.exchange.enable_private_ch(api_key, secret)
        }

        // control realtime button
        document.getElementById('realtime').onclick = function () {
            self.chart.timeScale().scrollToRealTime();
        }

        // subscribe crosshair
        self.chart.subscribeCrosshairMove(function (param) {
            //document.getElementById('time').innerText = new Date(param.time*1000)
            const buy_price = param.seriesPrices.get(self.buy_series)
            const buy_vol = param.seriesPrices.get(self.buy_vol)
            const sell_price = param.seriesPrices.get(self.sell_series)
            const sell_vol = param.seriesPrices.get(self.sell_vol)
            const tooltip_buy = document.getElementById('tooltip_buy')
            const tooltip_sell = document.getElementById('tooltip_sell')

            if (buy_price) {
                tooltip_buy.style.display = 'block'
                tooltip_buy.style.left = param.point.x

                var coordinate = self.buy_series.priceToCoordinate(buy_price);
                tooltip_buy.style.top = coordinate
                document.getElementById('buy_price').innerText = buy_price
                document.getElementById('buy_vol').innerText = buy_vol
            }
            else {
                tooltip_buy.style.display = 'none'
            }
            if (sell_price) {
                tooltip_sell.style.display = 'block'
                tooltip_sell.style.left = param.point.x

                var coordinate = self.sell_series.priceToCoordinate(sell_price);
                tooltip_sell.style.top = coordinate

                document.getElementById('sell_price').innerText = sell_price
                document.getElementById('sell_vol').innerText = sell_vol
            }
            else {
                tooltip_sell.style.display = 'none'
            }
        })

        // subscribe visible time range change
        self.chart.subscribeVisibleTimeRangeChange(function () {
            var buttonVisible = self.chart.timeScale().scrollPosition() < 0;
            document.getElementById('realtime').style.display = buttonVisible ? 'block' : 'none';
        });
    }

    create() {
        const self = this
        this.exchange.onexecution = function (m) {
            m = JSON.parse(m);
            const t = Number(m.created_at);
            if (m.taker_side == 'buy') {
                self.buy_series.update({ time: t, value: Number(m.price) });
                self.buy_vol.update({ time: t, value: Number(m.quantity) })
            }
            if (m.taker_side == 'sell') {
                self.sell_series.update({ time: t, value: Number(m.price) });
                self.sell_vol.update({ time: t, value: Number(m.quantity) })
            }
        }

        this.exchange.onboard_buy = function (m) {
            const bids = JSON.parse(m);
            const t = Date.now() / 1000
            if (t - self.exchange.board_buy_updated > 0.5) {
                self.bid_series.update({ time: t, value: bids[0][0] })
                self.exchange.board_buy_updated = t
                if (self.exchange.board_buy_ready) {
                    let vol = 0;
                    for (let i = 0; i < bids.length; i++) {
                        const quantity = Number(bids[i][1]);
                        vol += quantity;
                        // vol to series index
                        const series_idx = Math.ceil(vol / 1); // 1line per 1 btc
                        if (series_idx in self.contour_bid_series) {
                            self.contour_bid_series[series_idx].update({ time: t, value: Number(bids[i][0]) })
                        } else {
                            break
                        }
                    }
                }
            }
        }

        this.exchange.onboard_sell = function (m) {
            const asks = JSON.parse(m);
            const t = Date.now() / 1000
            if (t - self.exchange.board_sell_updated > 0.5) {
                self.ask_series.update({ time: t, value: asks[0][0] })
                self.exchange.board_sell_updated = t
                if (self.exchange.board_sell_ready) {
                    let vol = 0;
                    for (let i = 0; i < asks.length; i++) {
                        const quantity = Number(asks[i][1])
                        vol += quantity;
                        // vol to series index
                        const series_idx = Math.ceil(vol / 1); // 1line per 1 btc
                        if (series_idx in self.contour_ask_series) {
                            self.contour_ask_series[series_idx].update({ time: t, value: Number(asks[i][0]) })
                        } else {
                            break
                        }
                    }
                }
            }
        }

        this.exchange.onorder = function (m) {
            //console.log("order: " + m);
            // Mark New Order
            m = JSON.parse(m);
            if (m.id in self.orders_line) {
                // delete cancelled or edited order
                self.my_exec_series.removePriceLine(self.orders_line[m.id])
                delete self.orders_line[m.id]
                console.log("deleted " + m.side + " Order" + "(" + m.id + ")")
            }
            // add edited or created order
            if (m.side == "buy" && m.status == 'live') {
                console.log(m.side + " Order" + "(" + m.id + ")" + "@ " + m.price, "JPY, " + m.quantity + "BTC")
                self.orders_line[m.id] = self.my_exec_series.createPriceLine({ color: '#4BA375', price: m.price, outbound_size: new Decimal(m.quantity), lineStyle: LightweightCharts.LineStyle.LargeDashed });
            }
            else if (m.side == "sell" && m.status == 'live') {
                console.log(m.side + " Order" + "(" + m.id + ")" + "@ " + m.price, "JPY, " + m.quantity + "BTC")
                self.orders_line[m.id] = self.my_exec_series.createPriceLine({ color: '#E54F6B', price: m.price, outbound_size: new Decimal(m.quantity), lineStyle: LightweightCharts.LineStyle.LargeDashed });
            }

        }

        this.exchange.onmyexecution = function (m) {
            m = JSON.parse(m);
            // Order Executed
            const t = Number(m.created_at)
            console.log(m.created_at + " Execution @ " + m.price, "JPY, " + m.quantity + "BTC")
            self.my_exec_series.update({ time: t, value: Number(m.price) });
            if (m.my_side == "buy") {
                self.markers.push({ time: t, position: 'belowBar', color: '#6EFF3C', shape: 'arrowUp', id: m.id })
            }
            else if (m.my_side == "sell") {
                self.markers.push({ time: t, position: 'belowBar', color: '#FF00FF', shape: 'arrowDown', id: m.id })
            }
            self.my_exec_series.setMarkers(self.markers);

        }
        this.exchange.run()
    }
}

class LiquidExchange {
    constructor() {
        this.mid_price = 0;
        this.asks = [];
        this.bids = [];
        this.onboard_buy = null;
        this.onboard_sell = null;
        this.board_buy_updated = Date.now() / 1000
        this.board_sell_updated = Date.now() / 1000
        this.onexecution = null;
        this.onorder = null;
        this.ontrade = null;
        this.api_key = '';
        this.secret = '';
        this.board_buy_ready = false
        this.board_sell_ready = false
    };

    get_auth_params(api_key, secret) {

        let header = {
            "alg": "HS256",
            "typ": "JWT"
        };
        let auth_payload = {
            token_id: Number(api_key),
            path: '/realtime',
            nonce: Date.now()
        };
        function base64url(source) {
            let encodedSource = CryptoJS.enc.Base64.stringify(source);
            encodedSource = encodedSource.replace(/=+$/, '');
            encodedSource = encodedSource.replace(/\+/g, '-');
            encodedSource = encodedSource.replace(/\//g, '_');
            return encodedSource;
        }
        let stringifiedHeader = CryptoJS.enc.Utf8.parse(JSON.stringify(header));
        let encodedHeader = base64url(stringifiedHeader);
        let stringifiedData = CryptoJS.enc.Utf8.parse(JSON.stringify(auth_payload));
        let encodedData = base64url(stringifiedData);
        let signature = encodedHeader + "." + encodedData;
        signature = CryptoJS.HmacSHA256(signature, secret);
        signature = base64url(signature);


        let auth_request = {
            headers: {
                'X-Quoine-Auth': encodedHeader + "." + encodedData + "." + signature
            },
            path: '/realtime'
        }
        return auth_request
    };

    run() {
        const self = this;
        const subscribe = function () {
            console.log('Subscribing public channels')
            self.ws = new WebSocket('wss://tap.liquid.com/app/LiquidTapClient')
            console.log('Binding callback for public channels')
            self.on_public_message = (message) => {
                const ws_event = JSON.parse(message.data);
                switch (ws_event.event) {
                    case 'pusher:connection_established':
                        console.log('Connected to pusher.');
                        self.ws.send(JSON.stringify({ "event": "pusher:subscribe", "data": { "channel": "executions_cash_btcjpy" } }));
                        self.ws.send(JSON.stringify({ "event": "pusher:subscribe", "data": { "channel": "price_ladders_cash_btcjpy_buy" } }));
                        self.ws.send(JSON.stringify({ "event": "pusher:subscribe", "data": { "channel": "price_ladders_cash_btcjpy_sell" } }));
                        break;
                    case 'pusher_internal:subscription_succeeded':
                        console.log(ws_event.event + ': ' + ws_event.channel);
                        break;
                    case 'updated':
                        //console.log(ws_event.event + ': ' + ws_event.data);
                        switch (ws_event.channel) {
                            case 'price_ladders_cash_btcjpy_buy':
                                if (self.onboard_buy) self.onboard_buy(ws_event.data)
                                self.board_buy_ready = true
                                break;
                            case 'price_ladders_cash_btcjpy_sell':
                                if (self.onboard_sell) self.onboard_sell(ws_event.data)
                                self.board_sell_ready = true
                                break;
                        }
                        break;
                    case 'created':
                        //console.log(ws_event.event + ': ' + ws_event.data)
                        switch (ws_event.channel) {
                            case 'executions_cash_btcjpy':
                                if (self.onexecution) self.onexecution(ws_event.data)
                                break;
                        }
                        break;
                }
            }
            self.ws.onmessage = self.on_public_message
        };
        subscribe();
        if (this.api_key && this.secret)
            this.enable_private_ch(this.api_key, this.secret);
    };

    enable_private_ch(key, secret) {
        const self = this
        console.log('Subscribing private channels')
        let auth_request = this.get_auth_params(key, secret);
        this.on_private_message = (message) => {
            const ws_event = JSON.parse(message.data);
            switch (ws_event.event) {
                case 'pusher:connection_established':
                    console.log('Connected');
                    self.ws.send(JSON.stringify({ "event": "quoine:auth_request", "data": auth_request }));
                    break;
                case 'quoine:auth_success':
                    console.log('Authenticated');
                    self.ws.send(JSON.stringify({ "event": "pusher:subscribe", "data": { "channel": "user_executions_cash_btcjpy" } })); // created
                    self.ws.send(JSON.stringify({ "event": "pusher:subscribe", "data": { "channel": "user_account_jpy_orders" } })); // updated
                    self.ws.send(JSON.stringify({ "event": "pusher:subscribe", "data": { "channel": "user_account_jpy_trades" } })); // updated
                    break;
                case 'quoine:auth_failure':
                    console.log('Auth failed');
                    console.log(ws_event)
                    break;
                case 'pusher_internal:subscription_succeeded':
                    console.log('Subscribed: ' + ws_event.channel);
                    break;
                case 'updated':
                    if (ws_event.channel.includes("user")) {
                        switch (ws_event.channel) {
                            case 'user_account_jpy_orders':
                                if (self.onorder) self.onorder(ws_event.data)
                                break;
                            case 'user_account_jpy_trades':
                                console.log('updated ' + ws_event.channel + ": " + ws_event.data)
                                if (self.ontrade) self.ontrade(ws_event.data)
                                break;
                        }
                    }
                    break;
                case 'created':
                    if (ws_event.channel.includes("user")) {
                        switch (ws_event.channel) {
                            case 'user_executions_cash_btcjpy':
                                if (self.onmyexecution) self.onmyexecution(ws_event.data)
                                break;
                        }
                    }
                    break;
            }

        }
        this.ws = new WebSocket('wss://tap.liquid.com/app/LiquidTapClient')
        this.ws.onmessage = (message) => {
            self.on_public_message(message)
            self.on_private_message(message)
        }
    };
};

window.onload = function () {
    const chart = new LiquidHFTChart()
    chart.create()

    window.chart = chart
};