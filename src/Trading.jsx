import { useState,useEffect } from "react"
import Chart from "./Chart"
import ProfitChart from "./ProfitChart"

export default function Trading(){

const [price,setPrice] = useState(0)
const [asset,setAsset] = useState("bitcoin")
const [amount,setAmount] = useState("")
const [timeframe,setTimeframe] = useState(30)

useEffect(()=>{

setInterval(fetchPrice,3000)

},[])

async function fetchPrice(){

const res = await fetch(`http://localhost/backend/price.php?coin=${asset}`)
const data = await res.json()

setPrice(data[asset].usd)

}

async function placeTrade(direction){

await fetch("http://localhost/backend/trade.php",{

method:"POST",
headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({

user:1,
asset,
direction,
amount,
timeframe,
price

})

})

alert("Trade placed")

}

return(

<div>

<h2>Smart Contract Trading</h2>

<select onChange={(e)=>setAsset(e.target.value)}>
<option value="bitcoin">BTC</option>
<option value="ethereum">ETH</option>
</select>

<p>Current Price: {price}</p>

<div>

<button onClick={()=>setTimeframe(30)}>30s</button>
<button onClick={()=>setTimeframe(60)}>60s</button>
<button onClick={()=>setTimeframe(120)}>120s</button>
<button onClick={()=>setTimeframe(3600)}>1h</button>

</div>

<input
placeholder="Enter Amount"
value={amount}
onChange={(e)=>setAmount(e.target.value)}
/>

<div>

<button onClick={()=>placeTrade("buy")}>BUY</button>
<button onClick={()=>placeTrade("sell")}>SELL</button>

</div>

<Chart asset={asset}/>
<ProfitChart/>

</div>

)

}