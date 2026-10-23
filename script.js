// Theme preference is saved in this browser.
const themeToggle = document.getElementById("themeToggle");
const savedTheme = localStorage.getItem("baka-bots-theme");
const preferredTheme = savedTheme || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  if (themeToggle) {
    themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
    themeToggle.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
  }
}

applyTheme(preferredTheme);
if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    localStorage.setItem("baka-bots-theme", nextTheme);
    applyTheme(nextTheme);
  });
}

const API_URL = "https://script.google.com/macros/s/AKfycbw6UjesvZBmufHckMHKqsoAHB8JRbgnpvADXPfyOysb6JtCxOZCpDX0sUJDkkXVt7sJ/exec";
    const RAFFLE_WALLET = "0xbB9D5006E01c0898c88FA8290C1F54d9527D14E9";
    const TICKET_PRICE_ETH = 0.002;

    const $ = id => document.getElementById(id);
    const usernameInput=$("usernameInput"), searchButton=$("searchButton"), message=$("message"), results=$("results");
    const modalOverlay=$("modalOverlay"), closeModalButton=$("closeModal"), closeRaffleModal=$("closeRaffleModal");
    const modalEyebrow=$("modalEyebrow"), modalTitle=$("modalTitle"), modalBotImage=$("modalBotImage"), modalUsername=$("modalUsername"), modalBotId=$("modalBotId");
    const reservationContent=$("reservationContent"), airdropOption=$("airdropOption"), reservedDetails=$("reservedDetails"), reservedWallet=$("reservedWallet"), reservedAirdropStatus=$("reservedAirdropStatus");
    const walletInput=$("walletInput"), submitAirdrop=$("submitAirdrop"), airdropMessage=$("airdropMessage");
    const successScreen=$("successScreen"), successText=$("successText"), doneButton=$("doneButton");
    const openRaffleButton=$("openRaffle"), raffleScreen=$("raffleScreen"), raffleBotImage=$("raffleBotImage"), raffleUsername=$("raffleUsername"), raffleBotId=$("raffleBotId");
    const raffleChooseStage=$("raffleChooseStage"), rafflePaymentStage=$("rafflePaymentStage"), raffleSuccess=$("raffleSuccess");
    const ticketMinus=$("ticketMinus"), ticketPlus=$("ticketPlus"), ticketCount=$("ticketCount"), raffleTotal=$("raffleTotal"), shippingCheck=$("shippingCheck"), continueRaffle=$("continueRaffle");
    const paymentAmount=$("paymentAmount"), raffleWalletDisplay=$("raffleWalletDisplay"), copyRaffleWallet=$("copyRaffleWallet");
    const raffleSenderWallet=$("raffleSenderWallet"), submitRaffle=$("submitRaffle"), backToTickets=$("backToTickets"), raffleMessage=$("raffleMessage"), raffleSuccessText=$("raffleSuccessText"), raffleDone=$("raffleDone");
    const verifiedTicketCount=$("verifiedTicketCount"), raffleEntries=$("raffleEntries"), raffleCounterButton=$("raffleCounterButton"), rafflePopover=$("rafflePopover"), closeRafflePopover=$("closeRafflePopover");

    let selectedBot=null, raffleTickets=1;

    async function loadRaffleStats(){
      try{
        const r=await fetch(API_URL+"?action=rafflestats");
        const d=await r.json();
        if(!d.success) return;

        const total=Number(d.verified_tickets)||0;
        verifiedTicketCount.textContent=total;
        const promoTicketCount=$("promoTicketCount"); if(promoTicketCount) promoTicketCount.textContent=total;

        const entries=Array.isArray(d.entries)?d.entries:[];
        if(!entries.length){
          raffleEntries.innerHTML='<div class="raffle-empty">No verified entries yet.</div>';
          return;
        }

        raffleEntries.innerHTML=entries.map(entry=>`
          <div class="raffle-entry">
            <div class="raffle-entry-user">${escapeHTML(entry.username||"Unknown")}</div>
            <div class="raffle-entry-wallet">${escapeHTML(entry.wallet_display||"")}</div>
            <div class="raffle-entry-tickets">${Number(entry.tickets)||0} ${Number(entry.tickets)===1?"ticket":"tickets"}</div>
          </div>
        `).join("");
      }catch(err){ console.error("Raffle stats:",err); }
    }

    async function searchBots(){
      const username=usernameInput.value.trim();
      message.className=""; message.textContent=""; results.innerHTML="";
      if(!username){ message.className="error"; message.textContent="Enter your X username first 🤖"; return; }
      searchButton.disabled=true; searchButton.textContent="Searching...";
      try{
        const r=await fetch(API_URL+"?action=search&username="+encodeURIComponent(username));
        if(!r.ok) throw new Error("Could not connect to the Bot database.");
        const d=await r.json();
        if(!d.success) throw new Error(d.error||"Something went wrong.");
        if(!d.found||!d.bots.length){ message.textContent="No Bot found for that username yet 👀"; return; }
        message.className="success";
        message.textContent=d.bots.length===1?"Found your Bot! 🤖":`Found ${d.bots.length} Bots for you! 🤖`;
        displayBots(d.bots);
      }catch(err){ console.error(err); message.className="error"; message.textContent="Couldn't search right now. Try again in a moment."; }
      finally{ searchButton.disabled=false; searchButton.textContent="Search"; }
    }

    function displayBots(bots){
      results.innerHTML="";
      bots.forEach(bot=>{
        const card=document.createElement("article");
        card.className="bot-card";
        const isAvailable=String(bot.status||"available").toLowerCase()==="available";
        card.innerHTML=`
          <div class="bot-image-wrap"><img class="bot-image" src="${escapeHTML(bot.image_url)}" alt="${escapeHTML(bot.username)} Bot" /></div>
          <div class="bot-info">
            <div class="bot-username">${escapeHTML(bot.username)}</div>
            <div class="bot-id">${escapeHTML(bot.bot_id)}</div>
            <div class="status-row"><div class="status ${isAvailable?"available":"reserved"}">● ${isAvailable?"Available":"Reserved"}</div></div>
            <button class="reserve-button ${isAvailable?"":"view-reservation"}" type="button">${isAvailable?"Reserve this Bot":"View Reservation"}</button>
          </div>`;
        card.querySelector(".reserve-button").addEventListener("click",()=>openBotModal(bot));
        results.appendChild(card);
      });
    }

    function openBotModal(bot){
      selectedBot=bot;
      const isReserved=String(bot.status||"").toLowerCase()==="reserved";
      modalBotImage.src=bot.image_url; modalBotImage.alt=bot.username+" Bot";
      modalUsername.textContent=bot.username; modalBotId.textContent=bot.bot_id;
      walletInput.value=""; airdropMessage.textContent=""; airdropMessage.className="form-message";
      reservationContent.style.display="block"; successScreen.style.display="none"; raffleScreen.style.display="none";
      if(isReserved){
        modalEyebrow.textContent="BAKA BOTS / RESERVATION DETAILS"; modalTitle.textContent="This Bot is reserved 🤖";
        airdropOption.style.display="none"; reservedDetails.style.display="block";
        reservedWallet.textContent=bot.wallet_display||"Reserved";
        reservedAirdropStatus.textContent=bot.airdrop_status||"Pending";
      }else{
        modalEyebrow.textContent="BAKA BOTS / RESERVATION"; modalTitle.textContent="Found your Bot? 🤖";
        airdropOption.style.display="block"; reservedDetails.style.display="none";
      }
      modalOverlay.classList.add("open"); document.body.style.overflow="hidden";
    }

    function closeModal(){ modalOverlay.classList.remove("open"); document.body.style.overflow=""; selectedBot=null; resetRaffle(); }
    function validEthereumAddress(v){ return /^0x[a-fA-F0-9]{40}$/.test(v); }

    async function reserveAirdrop(){
      if(!selectedBot)return;
      const wallet=walletInput.value.trim();
      airdropMessage.className="form-message";
      if(!validEthereumAddress(wallet)){ airdropMessage.classList.add("error"); airdropMessage.textContent="Please enter a valid Ethereum address."; return; }
      submitAirdrop.disabled=true; submitAirdrop.textContent="Reserving...";
      try{
        const r=await fetch(API_URL,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({action:"reserve",bot_id:selectedBot.bot_id,wallet})});
        const d=await r.json(); if(!d.success)throw new Error(d.error||"Reservation failed.");
        reservationContent.style.display="none"; successScreen.style.display="block";
        successText.textContent=`${selectedBot.username} / ${selectedBot.bot_id} has been reserved for ${shortWallet(wallet)}. Baka will handle the future airdrop.`;
      }catch(err){ airdropMessage.className="form-message error"; airdropMessage.textContent=err.message||"Couldn't reserve this Bot."; }
      finally{ submitAirdrop.disabled=false; submitAirdrop.textContent="Reserve for Airdrop"; }
    }

    function openRaffle(){
      if(!selectedBot)return;
      reservationContent.style.display="none"; successScreen.style.display="none"; raffleScreen.style.display="block";
      raffleBotImage.src=selectedBot.image_url; raffleBotImage.alt=selectedBot.username+" Bot";
      raffleUsername.textContent=selectedBot.username; raffleBotId.textContent=selectedBot.bot_id;
      resetRaffle(); raffleScreen.style.display="block";
    }

    function resetRaffle(){
      raffleTickets=1;
      if(!raffleChooseStage)return;
      raffleChooseStage.style.display="block"; rafflePaymentStage.style.display="none"; raffleSuccess.style.display="none";
      shippingCheck.checked=false; continueRaffle.disabled=true; raffleSenderWallet.value="";
      raffleMessage.textContent=""; raffleMessage.className="form-message"; raffleWalletDisplay.textContent=RAFFLE_WALLET; updateTicketUI();
    }

    function formatEth(n){ return Number(n).toFixed(6).replace(/0+$/,"").replace(/\.$/,""); }
    function updateTicketUI(){
      const total=Number((raffleTickets*TICKET_PRICE_ETH).toFixed(6));
      ticketCount.textContent=raffleTickets; raffleTotal.textContent=`Total: ${formatEth(total)} ETH`; paymentAmount.textContent=`Send exactly ${formatEth(total)} ETH`;
      ticketMinus.disabled=raffleTickets<=1;
      submitRaffle.textContent=`Submit ${raffleTickets} ${raffleTickets===1?"Ticket":"Tickets"}`;
    }
    function changeTickets(n){ raffleTickets=Math.max(1,raffleTickets+n); updateTicketUI(); }

    async function copyWallet(){
      try{ await navigator.clipboard.writeText(RAFFLE_WALLET); copyRaffleWallet.textContent="Copied! ✓"; setTimeout(()=>copyRaffleWallet.textContent="Copy Raffle Wallet",1400); }
      catch(err){ copyRaffleWallet.textContent="Copy failed — select address above"; }
    }

    async function submitRaffleEntry(){
      if(!selectedBot)return;
      const wallet=raffleSenderWallet.value.trim();
      raffleMessage.className="form-message"; raffleMessage.textContent="";
      if(!validEthereumAddress(wallet)){ raffleMessage.classList.add("error"); raffleMessage.textContent="Please paste the Ethereum wallet you used to send the raffle payment."; return; }
      submitRaffle.disabled=true; submitRaffle.textContent="Submitting...";
      try{
        const payload={action:"raffle",bot_id:selectedBot.bot_id,wallet,tickets:raffleTickets};
        const r=await fetch(API_URL,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(payload)});
        const d=await r.json(); if(!d.success)throw new Error(d.error||"Raffle entry could not be submitted.");
        rafflePaymentStage.style.display="none"; raffleChooseStage.style.display="none"; raffleSuccess.style.display="block";
        raffleSuccessText.textContent=`${d.tickets} ${d.tickets===1?"ticket":"tickets"} · ${formatEth(d.amount_eth)} ETH. Payment verification: ${d.payment_status}. Your tickets will appear in the public count after verification.`;
        loadRaffleStats();
      }catch(err){ raffleMessage.className="form-message error"; raffleMessage.textContent=err.message||"Couldn't submit the raffle entry."; }
      finally{ submitRaffle.disabled=false; updateTicketUI(); }
    }

    function shortWallet(w){ return w.slice(0,6)+"..."+w.slice(-4); }
    function escapeHTML(v){ return String(v).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;"); }

    function setRafflePopover(open){
      rafflePopover.classList.toggle("open",open);
      raffleCounterButton.setAttribute("aria-expanded",String(open));
    }

    raffleCounterButton.addEventListener("click",()=>setRafflePopover(!rafflePopover.classList.contains("open")));
    closeRafflePopover.addEventListener("click",()=>setRafflePopover(false));

    searchButton.addEventListener("click",searchBots);
    let searchTimer;
    usernameInput.addEventListener("input",()=>{ clearTimeout(searchTimer); const v=usernameInput.value.trim(); if(!v){results.innerHTML="";message.textContent="";return;} searchTimer=setTimeout(searchBots,300); });
    usernameInput.addEventListener("keydown",e=>{if(e.key==="Enter")searchBots();});
    submitAirdrop.addEventListener("click",reserveAirdrop);
    openRaffleButton.addEventListener("click",openRaffle);
    ticketMinus.addEventListener("click",()=>changeTickets(-1));
    ticketPlus.addEventListener("click",()=>changeTickets(1));
    shippingCheck.addEventListener("change",()=>continueRaffle.disabled=!shippingCheck.checked);
    continueRaffle.addEventListener("click",()=>{if(shippingCheck.checked){raffleChooseStage.style.display="none";rafflePaymentStage.style.display="block";updateTicketUI();}});
    backToTickets.addEventListener("click",()=>{rafflePaymentStage.style.display="none";raffleChooseStage.style.display="block";});
    copyRaffleWallet.addEventListener("click",copyWallet);
    submitRaffle.addEventListener("click",submitRaffleEntry);
    closeModalButton.addEventListener("click",closeModal); closeRaffleModal.addEventListener("click",closeModal);
    doneButton.addEventListener("click",()=>{closeModal();searchBots();});
    raffleDone.addEventListener("click",closeModal);
    modalOverlay.addEventListener("click",e=>{if(e.target===modalOverlay)closeModal();});
    document.addEventListener("keydown",e=>{if(e.key==="Escape"&&modalOverlay.classList.contains("open"))closeModal();});
    loadRaffleStats();


// 2026-10 refresh interactions
const findBotForRaffle = $("findBotForRaffle");
const raffleDetailsButton = $("raffleDetailsButton");
const raffleDetails = $("raffleDetails");
if (findBotForRaffle) findBotForRaffle.addEventListener("click", () => {
  document.querySelector(".search-section")?.scrollIntoView({behavior:"smooth", block:"start"});
  setTimeout(() => usernameInput?.focus(), 450);
});
if (raffleDetailsButton && raffleDetails) raffleDetailsButton.addEventListener("click", () => {
  const open = raffleDetails.classList.toggle("open");
  raffleDetailsButton.setAttribute("aria-expanded", String(open));
  raffleDetailsButton.textContent = open ? "Hide details −" : "Raffle details +";
});
// Hide any decorative hero image whose filename has not been uploaded yet.
document.querySelectorAll(".hero-bot").forEach(img => img.addEventListener("error", () => img.remove()));
