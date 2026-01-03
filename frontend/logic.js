const parent = document.querySelector(".chat-masg");
let input = document.querySelector("input");
const btn = document.querySelector("button");



function addMsg(text,type){
    const msg = document.createElement("div");
    msg.className=`message ${type}`;

    msg.innerHTML=`
    ${type==="bot"? `<div class="avatar">🤖</div>` : ""}
    <div class="bubble">${text}</div>
    ${type === "user" ? `<div class="avatar">👤</div>` : ""}
    `;
    parent.append(msg);


}

async function sendQuery(){
    
    const question = input.value.trim();
    if(!question)return;

    removeBot();

    // // show user message-----------
    addMsg(question,"user");
    input.value = "";

    // show bot thinking-------------
    addMsg("Thinking...","bot")

    try{
        const data = await fetch("http://localhost:5000/ask",{
        method:"POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ question })
        });

        const res = await data.json();
        parent.lastChild.querySelector(".bubble").innerText = res.answer;

    }catch (error) {
        parent.lastChild.querySelector(".bubble").innerText ="Sorry! something went wrong"
      
  }
    
}

function showBot() {
  if(parent.children.length === 0){
    parent.innerHTML=`<img src="./assets/bookreading.jpg" class="chat-img">`;
    }

}

function removeBot(){
    const img = parent.querySelector(".chat-img");
    if(img) img.remove();
}

function getNewpage(){

    parent.innerHTML="";
    showBot();
  
}

showBot();
