const API_CRENEAUX = 'https://faycalbennasr.app.n8n.cloud/webhook/creneaux';
const API_RESERVATION = 'https://faycalbennasr.app.n8n.cloud/webhook/2324c5c2-c8b3-40bb-a17b-62ccff5f269c';

let creneauxData = {};
let currentDate = new Date();
let selectedDate = null;
let selectedHeure = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const moisNoms = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const joursSemaine = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

document.addEventListener('DOMContentLoaded', function() {
    chargerCreneaux();
    
    document.getElementById('prevMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        afficherCalendrier();
    });

    document.getElementById('nextMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        afficherCalendrier();
    });

    document.getElementById('reservationForm').addEventListener('submit', handleSubmit);
});

async function chargerCreneaux(forceReload = false) {
    const now = Date.now();
    
    if (!forceReload && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
        afficherCalendrier();
        document.getElementById('loader').classList.add('hidden');
        return;
    }
    
    try {
        const response = await fetch(API_CRENEAUX);
        const data = await response.json();
        creneauxData = data.json || data;
        cacheTimestamp = now;
        afficherCalendrier();
    } catch (error) {
        console.error('Erreur chargement créneaux:', error);
    } finally {
        document.getElementById('loader').classList.add('hidden');
    }
}

function afficherCalendrier() {
    const mois = currentDate.getMonth();
    const annee = currentDate.getFullYear();
    
    document.getElementById('currentMonth').textContent = `${moisNoms[mois]} ${annee}`;
    
    const premierJour = new Date(annee, mois, 1);
    const dernierJour = new Date(annee, mois + 1, 0);
    
    let jourSemainePremier = premierJour.getDay();
    jourSemainePremier = jourSemainePremier === 0 ? 6 : jourSemainePremier - 1;
    
    const calendarDays = document.getElementById('calendarDays');
    
    const headers = calendarDays.querySelectorAll('.calendar-day-header');
    const headerHTML = Array.from(headers).map(h => h.outerHTML).join('');
    
    calendarDays.innerHTML = headerHTML;
    
    for (let i = 0; i < jourSemainePremier; i++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day other-month';
        calendarDays.appendChild(dayDiv);
    }
    
    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);
    
    for (let jour = 1; jour <= dernierJour.getDate(); jour++) {
        const date = new Date(annee, mois, jour);
        const dateStr = formatDateISO(date);
        
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day';
        dayDiv.textContent = jour;
        
        if (date.toDateString() === aujourdhui.toDateString()) {
            dayDiv.classList.add('today');
        }
        
        if (creneauxData[dateStr] && creneauxData[dateStr].length > 0 && date >= aujourdhui) {
            dayDiv.classList.add('available');
            dayDiv.onclick = () => selectionnerDate(dateStr, date);
        } else {
            dayDiv.classList.add('unavailable');
        }
        
        calendarDays.appendChild(dayDiv);
    }
}

function formatDateISO(date) {
    const annee = date.getFullYear();
    const mois = String(date.getMonth() + 1).padStart(2, '0');
    const jour = String(date.getDate()).padStart(2, '0');
    return `${annee}-${mois}-${jour}`;
}

function selectionnerDate(dateStr, date) {
    selectedDate = dateStr;
    selectedHeure = null;
    
    document.querySelectorAll('.calendar-day').forEach(day => {
        day.classList.remove('selected');
    });
    event.target.classList.add('selected');
    
    const jourSemaine = joursSemaine[date.getDay()];
    const jour = date.getDate();
    const mois = moisNoms[date.getMonth()];
    const annee = date.getFullYear();
    
    document.getElementById('selectedDateTitle').textContent = `Créneaux disponibles pour ${jourSemaine} ${jour} ${mois} ${annee}`;
    
    const creneauxList = document.getElementById('creneauxList');
    creneauxList.innerHTML = '';
    
    const creneaux = creneauxData[dateStr] || [];
    
    creneaux.forEach(heure => {
        const btn = document.createElement('div');
        btn.className = 'creneau-btn';
        btn.textContent = heure.replace(':', 'h');
        btn.onclick = () => selectionnerHeure(heure, btn);
        creneauxList.appendChild(btn);
    });
    
    document.getElementById('creneauxSection').style.display = 'block';
    document.getElementById('reservationForm').style.display = 'none';
    
    document.getElementById('creneauxSection').scrollIntoView({ behavior: 'smooth' });
}

function selectionnerHeure(heure, btnElement) {
    selectedHeure = heure;
    
    document.querySelectorAll('.creneau-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    btnElement.classList.add('selected');
    
    updateRecap();
    document.getElementById('reservationForm').style.display = 'block';
    document.getElementById('reservationForm').scrollIntoView({ behavior: 'smooth' });
}

function updateRecap() {
    const date = new Date(selectedDate);
    const jourSemaine = joursSemaine[date.getDay()];
    const jour = date.getDate();
    const mois = moisNoms[date.getMonth()];
    const annee = date.getFullYear();
    
    const recapText = `${jourSemaine} ${jour} ${mois} ${annee} à ${selectedHeure.replace(':', 'h')}`;
    document.getElementById('recapText').textContent = recapText;
}

async function handleSubmit(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submitBtn');
    const btnText = document.getElementById('btnText');
    const btnLoader = document.getElementById('btnLoader');
    const messageDiv = document.getElementById('message');
    
    submitBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline-block';
    messageDiv.style.display = 'none';
    
    const formData = {
        prenom: document.getElementById('prenom').value,
        nom: document.getElementById('nom').value,
        telephone: document.getElementById('telephone').value,
        email: document.getElementById('email').value,
        prestation: document.getElementById('prestation').value,
        date: selectedDate,
        heure: selectedHeure
    };
    
    try {
        const response = await fetch(API_RESERVATION, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            messageDiv.className = 'message success';
            messageDiv.textContent = '✅ Votre rendez-vous a été confirmé ! Vous recevrez une confirmation par email.';
            messageDiv.style.display = 'block';
            
            document.getElementById('reservationForm').reset();
            document.getElementById('reservationForm').style.display = 'none';
            document.getElementById('creneauxSection').style.display = 'none';
            
            selectedDate = null;
            selectedHeure = null;
            
            setTimeout(() => {
                chargerCreneaux(true);
                messageDiv.style.display = 'none';
            }, 3000);
        } else {
            throw new Error('Erreur serveur');
        }
    } catch (error) {
        console.error('Erreur:', error);
        messageDiv.className = 'message error';
        messageDiv.textContent = '❌ Une erreur est survenue. Veuillez réessayer.';
        messageDiv.style.display = 'block';
    } finally {
        submitBtn.disabled = false;
        btnText.style.display = 'inline-block';
        btnLoader.style.display = 'none';
    }
}
