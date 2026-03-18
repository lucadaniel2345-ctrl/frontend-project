import { useEffect } from "react"

export default function Chart({asset}){

useEffect(()=>{

const script = document.createElement("script")

script.src = "https://s3.tradingview.com/tv.js"

script.onload = () => {

new window.TradingView.widget({

width:"100%",
height:400,
symbol:"BINANCE:BTCUSDT",
interval:"1",
theme:"dark",
style:"1",
container_id:"tv_chart"

})

}

document.body.appendChild(script)

},[])

return <div id="tv_chart"></div>

}