import { useEffect } from "react"

export default function TradingViewChart(){

useEffect(()=>{

const script=document.createElement("script")

script.src="https://s3.tradingview.com/tv.js"

script.onload=()=>{

new window.TradingView.widget({
symbol:"BINANCE:BTCUSDT",
interval:"1",
theme:"dark",
style:"1",
container_id:"tv_chart"
})

}

document.body.appendChild(script)

},[])

return <div id="tv_chart" style={{height:"400px"}}></div>

}