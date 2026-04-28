let items = JSON.parse(localStorage.getItem("items")) || {}
let money = parseFloat(localStorage.getItem("money")) || 0
let cart = {}

function save(){
	localStorage.setItem("items",JSON.stringify(items))
	localStorage.setItem("money",money.toString())
}

function show(v){
	document.querySelectorAll(".view").forEach(e=>e.style.display="none")
	document.getElementById(v).style.display="block"

	if(v==="stats"){
		document.getElementById("passwordPrompt").style.display="block"
		document.getElementById("statsContent").style.display="none"
		document.getElementById("csvBtn").style.display="none"
		document.getElementById("resetBtn").style.display="none"
		document.getElementById("statsPassword").value=""
	}

	render()
}

function addItem(){
	let name=document.getElementById("name").value
	let price=parseFloat(document.getElementById("price").value)
	let stock=parseInt(document.getElementById("stock").value)

	if(!name || isNaN(price) || isNaN(stock)){
		alert("Bitte alle Felder ausfüllen")
		return
	}

	items[name]={price,stock,sold:0}

	document.getElementById("name").value=""
	document.getElementById("price").value=""
	document.getElementById("stock").value=""

	save()
	render()
}

function addStock(name){
	items[name].stock++
	save()
	render()
}

function removeStock(name){
	if(items[name].stock>0){
		items[name].stock--
	}
	save()
	render()
}

function changeCartQty(name,change){
	let newQty=cart[name]+change

	if(newQty<=0){
		delete cart[name]
	}else{
		cart[name]=newQty
	}

	render()
}

function deleteItem(name){
	if(!confirm("Produkt '"+name+"' wirklich löschen?")) return
	delete items[name]
	save()
	render()
}

function checkPassword(){
	let pwd=document.getElementById("statsPassword").value

	if(pwd==="KingAshour"){
		document.getElementById("passwordPrompt").style.display="none"
		document.getElementById("statsContent").style.display="block"
		document.getElementById("csvBtn").style.display="inline-block"
		document.getElementById("resetBtn").style.display="inline-block"
		renderStats()
	}else{
		alert("Passwort falsch!")
	}
}

function renderStats(){
	let statsHTML="<b>Einnahmen: "+money.toFixed(2)+" €</b><br><br>"

	for(let name in items){
		let d=items[name]
		statsHTML+=`
		<b>${name}</b><br>
		Preis: ${d.price.toFixed(2)} €<br>
		verkauft: ${d.sold}<br>
		rest: ${d.stock}<br><br>
		`
	}

	document.getElementById("statsContent").innerHTML=statsHTML
}

// NEU: Funktion zum Zurücksetzen des Events
function resetEvent() {
    if(!confirm("Möchtest du wirklich ein neues Event starten? Alle Einnahmen und Verkaufszahlen werden auf 0 gesetzt. Die Lagerbestände bleiben erhalten!")) return;
    
    money = 0;
    for(let name in items) {
        items[name].sold = 0;
    }
    
    save();
    render();
    alert("Statistiken wurden zurückgesetzt. Viel Erfolg beim neuen Event!");
}

function exportCSV(){
	let csv="Name,Preis,Verkauft,Bestand,Gesamtumsatz\n"

	for(let name in items){
		let d=items[name]
		let revenue=(d.sold*d.price).toFixed(2)
		csv+=`"${name}",${d.price.toFixed(2)},${d.sold},${d.stock},${revenue}\n`
	}

	csv+=`\nGESAMT EINNAHMEN,${money.toFixed(2)}\n`

	let blob=new Blob([csv],{type:"text/csv;charset=utf-8;"})
	let link=document.createElement("a")
	link.href=URL.createObjectURL(blob)
	link.download="Statistik_"+new Date().toISOString().slice(0,10)+".csv"
	
	document.body.appendChild(link)
	link.click()
	document.body.removeChild(link)
}

function importCSV(event) {
    let file = event.target.files[0];
    if (!file) return;

    let reader = new FileReader();
    reader.onload = function(e) {
        let text = e.target.result;
        let lines = text.split('\n');
        
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim() === "") continue;
            
            let separator = lines[i].includes(';') ? ';' : ',';
            let parts = lines[i].split(separator);
            
            if(parts.length >= 3) {
                let name = parts[0].replace(/"/g, '').trim();
                let price = parseFloat(parts[1].replace(/"/g, '').replace(',', '.')); 
                let stock = parseInt(parts[2].replace(/"/g, ''));
                
                if(name && !isNaN(price) && !isNaN(stock)) {
                    items[name] = {price: price, stock: stock, sold: items[name] ? items[name].sold : 0};
                }
            }
        }
        save();
        render();
        alert("Inventar erfolgreich importiert!");
        event.target.value = ''; 
    };
    reader.readAsText(file);
}

function exportInventory(){
	let data={
		items:items,
		exportDate:new Date().toISOString()
	}
	
	let json=JSON.stringify(data, null, 2)
	let blob=new Blob([json],{type:"application/json"})
	let link=document.createElement("a")
	link.href=URL.createObjectURL(blob)
	link.download="Inventar_"+new Date().toISOString().slice(0,10)+".json"
	link.click()
}

function importInventory(){
	let file=document.getElementById("importFile").files[0]
	
	if(!file) return
	
	let reader=new FileReader()
	
	reader.onload=function(e){
		try{
			let data=JSON.parse(e.target.result)
			
			if(!data.items || typeof data.items !== 'object'){
				alert("Datei ist nicht im richtigen Format!")
				return
			}
			
			if(confirm("Aktuelles Inventar durch importierte Daten ersetzen?")){
				items=data.items
				save()
				render()
				alert("Inventar erfolgreich importiert!")
			}
		}catch(err){
			alert("Fehler beim Lesen der Datei: "+err.message)
		}
	}
	
	reader.readAsText(file)
	document.getElementById("importFile").value=""
}

function addCart(name, element){
	if(!cart[name]) cart[name]=0
	cart[name]++
	
	if(element){
		element.style.backgroundColor = "#4CAF50"
		element.style.color = "white"
		setTimeout(() => {
			element.style.backgroundColor = ""
			element.style.color = ""
		}, 300)
	}
	
	render()
}

function sell(){
	if(Object.keys(cart).length===0) return

	if(!confirm("Verkauf bestätigen?")) return

	for(let name in cart){
		let qty=cart[name]

		if(items[name].stock<qty){
			alert("Nicht genug "+name)
			return
		}

		items[name].stock -= qty
		items[name].sold += qty
		money = money + (qty * items[name].price)
	}

	cart={}
	save()
	render()
}

function render(){
	let itemsDiv=document.getElementById("items")
	itemsDiv.innerHTML=""

	for(let name in items){
		let d=items[name]

		if(d.stock>0){
			itemsDiv.innerHTML+=`
			<button class="itemBtn" onclick="addCart('${name}', this)">
				${name}<br>
				${d.price.toFixed(2)} €<br>
				Stock ${d.stock}
			</button>
			`
		}
	}

	let cartList=document.getElementById("cartList")
	cartList.innerHTML=""

	let total=0

	for(let name in cart){
		let qty=cart[name]
		let price=items[name].price
		let sum = qty*price
		total += sum

		cartList.innerHTML+=`${name} x <button onclick="changeCartQty('${name}',-1)">-</button> ${qty} <button onclick="changeCartQty('${name}',1)">+</button> = ${sum.toFixed(2)} €<br>`
	}

	document.getElementById("total").innerHTML="<b>Total: "+total.toFixed(2)+" €</b>"

	let table=document.getElementById("invTable")
	table.innerHTML=""

	for(let name in items){
		let d=items[name]

		table.innerHTML+=`
		<tr>
			<td>${name}</td>
			<td>${d.price.toFixed(2)} €</td>
			<td>${d.stock}</td>
			<td><button onclick="addStock('${name}')">+</button></td>
			<td><button onclick="removeStock('${name}')">-</button></td>
			<td><button onclick="deleteItem('${name}')" style="background:#f44336;color:white;">Löschen</button></td>
		</tr>
		`
	}
}

show("kasse")