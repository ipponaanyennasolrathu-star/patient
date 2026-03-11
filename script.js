// --- DATABASES ---
let nursesDB = [
    { name: "Nurse Mary", password: "admin", badge: "001" }
];

// Notice: Vitals are now stored individually per patient!
let usersDB = [
    { 
        name: "Vasanth", password: "1234", age: "20", blood: "O+", 
        bed: "Ward 4 - Bed 12", doctor: "Dr. Sarah Jenkins", contact: "9876543210", 
        allergies: "None", vitals: { hydration: 100, meal: 100 } 
    }
];

let currentUser = null;
let currentRole = null; 
let vitalsTimer = null; 
let isRobotBusy = false; 

let inventory = [
    { id: 1, name: "Paracetamol 500mg", qty: 12, img: "https://via.placeholder.com/150/FFB6C1/000000?text=Paracetamol", restocking: false },
    { id: 2, name: "Amoxicillin 250mg", qty: 11, img: "https://via.placeholder.com/150/87CEFA/000000?text=Amoxicillin", restocking: false },
    { id: 3, name: "Ibuprofen 400mg", qty: 25, img: "https://via.placeholder.com/150/98FB98/000000?text=Ibuprofen", restocking: false },
    { id: 4, name: "Vitamin C 1000mg", qty: 12, img: "https://via.placeholder.com/150/FFD700/000000?text=Vitamin+C", restocking: false }
];

// --- NAVIGATION & SIDEBAR LOGIC ---
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebar-overlay').classList.toggle('show');
}

function switchView(viewId) {
    document.querySelectorAll('.app-view').forEach(view => view.classList.remove('active-view'));
    document.querySelectorAll('.sidebar a').forEach(link => link.classList.remove('active-link'));
    document.getElementById(`view-${viewId}`).classList.add('active-view');
    event.currentTarget.classList.add('active-link');
    if(window.innerWidth < 768) toggleSidebar();
}

function showPortal(portal) {
    document.getElementById('role-selection').classList.add('hidden');
    document.getElementById('nurse-auth-container').classList.add('hidden');
    document.getElementById('patient-auth-container').classList.add('hidden');

    if (portal === 'nurse') {
        document.getElementById('nurse-auth-container').classList.remove('hidden');
        toggleNurseAuth('login');
    } else if (portal === 'patient') {
        document.getElementById('patient-auth-container').classList.remove('hidden');
        togglePatientAuth('login');
    } else {
        document.getElementById('role-selection').classList.remove('hidden'); 
    }
}

// --- AUTHENTICATION LOGIC ---
function toggleNurseAuth(type) {
    if (type === 'register') {
        document.getElementById('nurse-login-form').classList.add('hidden');
        document.getElementById('nurse-register-form').classList.remove('hidden');
    } else {
        document.getElementById('nurse-register-form').classList.add('hidden');
        document.getElementById('nurse-login-form').classList.remove('hidden');
    }
}

function togglePatientAuth(type) {
    if (type === 'register') {
        document.getElementById('patient-login-form').classList.add('hidden');
        document.getElementById('patient-register-form').classList.remove('hidden');
    } else {
        document.getElementById('patient-register-form').classList.add('hidden');
        document.getElementById('patient-login-form').classList.remove('hidden');
    }
}

function registerNurse() {
    const name = document.getElementById('nurse-reg-name').value;
    const pass = document.getElementById('nurse-reg-pass').value;
    const badge = document.getElementById('nurse-reg-id').value;

    if (!name || !pass || !badge) return showAlert("Fill out all staff details.", "alert-danger");
    if (nursesDB.find(n => n.name.toLowerCase() === name.toLowerCase())) return showAlert("Name already registered.", "alert-warning");

    nursesDB.push({ name, password: pass, badge });
    showAlert("Staff Registration Successful! Please login.", "alert-success");
    document.querySelectorAll('#nurse-register-form input').forEach(i => i.value = '');
    toggleNurseAuth('login');
}

function registerPatientSelf() {
    const inputs = ['pat-reg-name', 'pat-reg-pass', 'pat-reg-age', 'pat-reg-blood', 'pat-reg-bed', 'pat-reg-doc', 'pat-reg-contact', 'pat-reg-allergies'];
    const values = inputs.map(id => document.getElementById(id).value);

    if (values.includes('')) return showAlert("Please fill out all medical fields to register.", "alert-danger");
    if (usersDB.find(u => u.name.toLowerCase() === values[0].toLowerCase())) return showAlert("Patient name already exists.", "alert-warning");

    usersDB.push({ 
        name: values[0], password: values[1], age: values[2], blood: values[3], 
        bed: values[4], doctor: values[5], contact: values[6], allergies: values[7],
        vitals: { hydration: 100, meal: 100 } // Give new patient their own meters
    });
    
    showAlert(`Registration successful! You may now login.`, "alert-success");
    inputs.forEach(id => document.getElementById(id).value = '');
    togglePatientAuth('login');
    updatePatientDropdown(); // Update nurse dropdown if a new patient registers
}

function nurseLogin() {
    const name = document.getElementById('nurse-login-name').value;
    const pass = document.getElementById('nurse-login-pass').value;
    const nurse = nursesDB.find(n => n.name.toLowerCase() === name.toLowerCase() && n.password === pass);

    if (nurse) {
        currentRole = 'nurse';
        setupAppInterface();
        showAlert(`Logged in as Staff: ${nurse.name}`, "alert-success");
        renderPatientList();
        switchView('nurse-roster');
    } else showAlert("Invalid Staff Credentials.", "alert-danger");
}

function patientLogin() {
    const name = document.getElementById('patient-login-name').value;
    const pass = document.getElementById('patient-login-pass').value;
    const user = usersDB.find(u => u.name.toLowerCase() === name.toLowerCase() && u.password === pass);

    if (user) {
        currentUser = user;
        currentRole = 'patient';
        setupAppInterface();
        showAlert(`Welcome back, ${user.name}!`, "alert-success");
        
        // Populate profile view
        document.getElementById('display-name').innerText = currentUser.name;
        document.getElementById('display-age').innerText = currentUser.age;
        document.getElementById('display-blood').innerText = currentUser.blood;
        document.getElementById('display-bed').innerText = currentUser.bed;
        document.getElementById('display-doc').innerText = currentUser.doctor;
        document.getElementById('display-contact').innerText = currentUser.contact;
        document.getElementById('display-allergies').innerText = currentUser.allergies;
        
        switchView('profile');
    } else showAlert("Invalid Patient Credentials.", "alert-danger");
}

function logout() {
    currentUser = null;
    currentRole = null;
    if (vitalsTimer) clearInterval(vitalsTimer);

    document.getElementById('app-container').classList.add('hidden');
    document.getElementById('nav-logout-btn').classList.add('hidden');
    document.getElementById('menu-btn').classList.add('hidden');
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.remove('show');
    
    document.getElementById('auth-section').classList.remove('hidden');
    showPortal('role');
    
    document.querySelectorAll('input').forEach(i => i.value = '');
}

// --- CORE APP SETUP ---
function setupAppInterface() {
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('app-container').classList.remove('hidden');
    document.getElementById('nav-logout-btn').classList.remove('hidden');
    document.getElementById('menu-btn').classList.remove('hidden');

    // Show/Hide role specific links and UI elements
    if (currentRole === 'nurse') {
        document.getElementById('nurse-links').classList.remove('hidden');
        document.getElementById('patient-links').classList.add('hidden');
        document.getElementById('nurse-patient-selector').classList.remove('hidden');
        updatePatientDropdown();
    } else {
        document.getElementById('patient-links').classList.remove('hidden');
        document.getElementById('nurse-links').classList.add('hidden');
        document.getElementById('nurse-patient-selector').classList.add('hidden');
    }

    document.getElementById('shared-links').classList.remove('hidden');
    renderInventory();
    startRealLifeVitalsSimulation();
}

// Generates the Target Patient Dropdown for the Nurse
function updatePatientDropdown() {
    const select = document.getElementById('global-target-patient');
    select.innerHTML = ''; 
    usersDB.forEach(u => {
        select.innerHTML += `<option value="${u.name}">${u.name} (${u.bed})</option>`;
    });
    updateMeterUI(); // Refresh meters to show the first patient's vitals
}

// Renders the Patient Roster for the Nurse
function renderPatientList() {
    const container = document.getElementById('patient-list-container');
    container.innerHTML = ''; 
    if (usersDB.length === 0) {
        container.innerHTML = `<p class="label">No patients currently registered.</p>`;
        return;
    }
    usersDB.forEach(patient => {
        container.innerHTML += `
            <div class="info-box" style="border-left: 5px solid var(--secondary);">
                <h3 class="text-purple" style="margin-bottom: 15px; font-size: 1.3rem;">${patient.name}</h3>
                <p class="label" style="margin-bottom: 8px;">🛏️ Bed: <span class="value" style="font-size: 1.05rem;">${patient.bed}</span></p>
                <p class="label" style="margin-bottom: 8px;">🩸 Blood Group: <span class="value text-red" style="font-size: 1.05rem;">${patient.blood}</span></p>
                <p class="label" style="margin-bottom: 8px;">🎂 Age: <span class="value" style="font-size: 1.05rem;">${patient.age}</span></p>
                <p class="label" style="margin-bottom: 8px;">👨‍⚕️ Doctor: <span class="value" style="font-size: 1.05rem;">${patient.doctor}</span></p>
            </div>
        `;
    });
}

// --- GET ACTIVE PATIENT (Crucial for routing actions) ---
function getActivePatient() {
    if (currentRole === 'patient') return currentUser;
    if (currentRole === 'nurse') {
        const selectedName = document.getElementById('global-target-patient').value;
        return usersDB.find(u => u.name === selectedName);
    }
    return null;
}

// --- ROBOT LOCATION TRACKER ---
function updateLocationUI(statusText, activeStep, activeLine) {
    document.getElementById('robot-status-text').innerText = statusText;
    ['step-1', 'step-2', 'step-3'].forEach(id => document.getElementById(id).classList.remove('active-step'));
    ['line-1', 'line-2'].forEach(id => document.getElementById(id).classList.remove('active-line'));

    if (activeStep) document.getElementById(activeStep).classList.add('active-step');
    if (activeLine === 1) document.getElementById('line-1').classList.add('active-line'); 
    if (activeLine === 2) { document.getElementById('line-1').classList.add('active-line'); document.getElementById('line-2').classList.add('active-line'); }
}

function animateRobotJourney(itemType, targetPatient) {
    if (isRobotBusy) {
        showAlert("Robot is currently completing another task!", "alert-warning");
        return false;
    }
    if (!targetPatient) {
        showAlert("No patient selected!", "alert-danger");
        return false;
    }
    
    isRobotBusy = true;
    updateLocationUI(`Navigating to pickup ${itemType}...`, 'step-1', 1);
    
    setTimeout(() => { updateLocationUI(`Collecting ${itemType}...`, 'step-2', 1); }, 2000);
    setTimeout(() => { updateLocationUI(`Navigating to ${targetPatient.bed}...`, 'step-2', 2); }, 4500);
    setTimeout(() => { updateLocationUI(`Delivering ${itemType} to ${targetPatient.name}...`, 'step-3', 2); }, 7000);
    
    setTimeout(() => {
        updateLocationUI(`Returning to Charging Dock...`, 'step-2', 1);
        // Refill vitals only for the specific targeted patient!
        if (itemType === 'Water') targetPatient.vitals.hydration = 100;
        if (itemType === 'Meal') targetPatient.vitals.meal = 100;
        updateMeterUI(); 
    }, 10000);

    setTimeout(() => {
        updateLocationUI(`Idle at Charging Dock`, 'step-1', 0);
        isRobotBusy = false;
    }, 13000);

    return true;
}

// --- INDIVIDUALIZED REAL-LIFE METERS ---
function startRealLifeVitalsSimulation() {
    if (vitalsTimer) clearInterval(vitalsTimer); 
    
    // Simulate drop for ALL users in the database
    vitalsTimer = setInterval(() => {
        usersDB.forEach(user => {
            user.vitals.hydration -= 0.2; 
            user.vitals.meal -= 0.27;      
            if (user.vitals.hydration < 0) user.vitals.hydration = 0;
            if (user.vitals.meal < 0) user.vitals.meal = 0;

            // Trigger alert if the active view is showing a critically low patient
            let active = getActivePatient();
            if (active && user.name === active.name) {
                if (user.vitals.hydration < 25 && user.vitals.hydration > 24.8) showAlert(`⚠️ ${user.name}'s hydration is critically low!`, "alert-danger");
                if (user.vitals.meal < 25 && user.vitals.meal > 24.7) showAlert(`⚠️ ${user.name} has missed a meal!`, "alert-warning");
            }
        });
        updateMeterUI();
    }, 60000); 
}

function updateMeterUI() {
    let activePatient = getActivePatient();
    if (!activePatient) return;

    const hBar = document.getElementById('hydration-bar');
    const hText = document.getElementById('hydration-text');
    const mBar = document.getElementById('meal-bar');
    const mText = document.getElementById('meal-text');

    hBar.style.width = activePatient.vitals.hydration + '%';
    hText.innerText = Math.floor(activePatient.vitals.hydration) + '%';
    mBar.style.width = activePatient.vitals.meal + '%';
    mText.innerText = Math.floor(activePatient.vitals.meal) + '%';

    hBar.className = activePatient.vitals.hydration <= 25 ? 'meter-fill bg-gradient-red' : 'meter-fill bg-gradient-blue';
    mBar.className = activePatient.vitals.meal <= 25 ? 'meter-fill bg-gradient-red' : 'meter-fill bg-gradient-orange';
}

function refill(type) {
    let target = getActivePatient();
    if (type === 'hydration') {
        let started = animateRobotJourney('Water', target);
        if(started) showAlert(`🤖 Robot dispatched to deliver water to ${target.name}!`, 'alert-success');
    } else if (type === 'meal') {
        let started = animateRobotJourney('Meal', target);
        if(started) showAlert(`🤖 Robot dispatched to deliver meal to ${target.name}!`, 'alert-success');
    }
}

// --- INVENTORY LOGIC ---
function renderInventory() {
    const grid = document.getElementById('inventory-grid');
    grid.innerHTML = ''; 

    inventory.forEach(med => {
        const stockClass = med.qty < 10 ? 'stock-low' : 'stock-high';
        const isOutOfStock = med.qty === 0;
        
        const cardHTML = `
            <div class="med-card">
                <img src="${med.img}" alt="${med.name}" class="med-img">
                <h3 class="med-title">${med.name}</h3>
                <p class="stock-text"><span class="${stockClass}">${med.qty}</span> Units Available</p>
                <button 
                    onclick="dispenseMedicine(${med.id})" 
                    class="btn-dispense" 
                    ${isOutOfStock || med.restocking ? 'disabled' : ''}>
                    ${med.restocking ? 'Restacking...' : (isOutOfStock ? 'Out of Stock' : 'Dispense')}
                </button>
            </div>
        `;
        grid.innerHTML += cardHTML;
    });
}

function dispenseMedicine(id) {
    const medIndex = inventory.findIndex(m => m.id === id);
    let target = getActivePatient();

    if (inventory[medIndex].qty > 0) {
        let started = animateRobotJourney(`Medicine (${inventory[medIndex].name})`, target);
        
        if (started) {
            inventory[medIndex].qty -= 1;
            renderInventory();

            if (inventory[medIndex].qty < 10 && !inventory[medIndex].restocking) {
                inventory[medIndex].restocking = true;
                setTimeout(() => {
                    showAlert(`⚠️ ${inventory[medIndex].name} is low. Pharmacy notified for restock.`, 'alert-warning');
                    renderInventory(); 

                    setTimeout(() => {
                        inventory[medIndex].qty += 15;
                        inventory[medIndex].restocking = false;
                        showAlert(`✅ ${inventory[medIndex].name} successfully restocked!`, 'alert-success');
                        renderInventory(); 
                    }, 14000); 
                }, 2000); 
            }
        }
    }
}

// --- UTILITY ---
function showAlert(message, typeClass) {
    const alertBox = document.getElementById('alert-box');
    alertBox.className = `alert ${typeClass}`;
    alertBox.innerText = message;
    alertBox.classList.remove('hidden');
    
    if (window.alertTimeout) clearTimeout(window.alertTimeout);
    window.alertTimeout = setTimeout(() => { alertBox.classList.add('hidden'); }, 4000);
}