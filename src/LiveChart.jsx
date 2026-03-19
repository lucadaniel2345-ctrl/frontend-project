import { useEffect, useState } from "react";

export default function LiveChart() {

const [price,setPrice] = useState(0);

useEffect(()=>{

const fetchPrice = () => {

fetch("http://bestcryptotrading.rf.gd/backend/api/get_prices.php",{
credentials:"include"
})
.then(res=>res.json())
.then(data=>{
if(data.bitcoin){
setPrice(data.bitcoin.usd);
}
})
.catch(err=>{
console.log("price error",err);
});

};

fetchPrice();

const interval = setInterval(fetchPrice,10000);

return ()=>clearInterval(interval);

},[]);

return(

<div style={{
background:"#111",
padding:"20px",
borderRadius:"10px",
color:"#fff"
}}>

<h3>BTC Live Price</h3>

<h1>${price}</h1>

</div>

);

}
