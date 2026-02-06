
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Dynamic import for fetch if needed, or use global if available (Node 18+)
// We will wrap in an async IIFE to handle top-level await if needed
(async () => {
    let fetch = global.fetch;
    if (!fetch) {
        try {
            fetch = (await import('node-fetch')).default;
        } catch (e) {
            console.warn("Could not load node-fetch, hoping global fetch works or using http");
        }
    }

    const API_URL = 'http://localhost:4000/api';

    async function verifyFlows() {
        console.log("🚀 Starting Pre-Production Audit (JS Mode)...");
        let errors = [];

        // 1. Register Gestor (and create Clinic)
        const gestorEmail = `gestor_${Date.now()}@test.com`;
        const clinicName = `Clinic Auto ${Date.now()}`;
        
        console.log(`\n[TEST 1] Testing Gestor Registration & Clinic Creation...`);
        try {
            const res = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: "Test Gestor",
                    email: gestorEmail,
                    password: "password123",
                    role: "GESTOR",
                    clinicName: clinicName,
                    clinicPhone: "11999999999"
                })
            });
            
            const data = await res.json();
            
            if (res.status === 201 && data.token) {
                console.log("✅ Gestor Registered Successfully");
                console.log("   User ID:", data.user ? data.user.id : "N/A");
            } else {
                errors.push(`Gestor Registration Failed: ${res.status} - ${JSON.stringify(data)}`);
                console.error("❌ Failed:", data);
            }

        } catch (e) {
            errors.push(`Gestor Registration Exception: ${e.message}`);
            console.error("❌ Exception:", e);
        }

        // 2. Register Medico with INVALID Invite Code
        console.log(`\n[TEST 2] Testing Medico Invite with INVALID Code...`);
        try {
            const res = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: "Dr. Invalid Code",
                    email: `wrong_${Date.now()}@test.com`,
                    password: "password123",
                    role: "MEDICO",
                    specialty: "Cardiologia",
                    inviteCode: "INVALID-CODE-999"
                })
            });
            const data = await res.json();
            if (res.status === 400 && data.error && data.error.includes("inválido")) {
                 console.log("✅ Correctly rejected invalid code");
            } else {
                 errors.push(`Invalid Code Test Failed: Expected 400, got ${res.status}`);
                 console.error("❌ Failed:", data);
            }
        } catch (e) {
            errors.push(`Invalid Code Test Exception: ${e.message}`);
        }

        // DB Integrity Check & Valid Registration
        try {
            console.log("\n[TEST 3] Verifying Database Records...");
            // Find the clinic we JUST created by name
            const recentClinics = await prisma.clinic.findMany({
                where: { name: clinicName },
                take: 1
            });
            
            if (recentClinics.length > 0) {
                const lastClinic = recentClinics[0];
                console.log(`Target Clinic: ${lastClinic.name}, Code: ${lastClinic.inviteCode}`);
                
                if (!lastClinic.inviteCode) {
                     errors.push("❌ CRITICAL: New clinic created without invite code!");
                } else {
                     console.log("✅ New Clinic has invite code.");
                     
                     // Now Try to Register with this code!
                     console.log(`\n[TEST 4] Registering Doctor with code ${lastClinic.inviteCode}...`);
                     const res = await fetch(`${API_URL}/auth/register`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: "Dr. Success",
                            email: `doctor_${Date.now()}@test.com`,
                            password: "password123",
                            role: "MEDICO",
                            specialty: "Dermatologia",
                            inviteCode: lastClinic.inviteCode
                        })
                    });
                    const data = await res.json();
                    if (res.status === 201) {
                        console.log("✅ Doctor registered with valid code");
                        
                        // Check if linked
                        const newUser = await prisma.user.findUnique({ where: { id: data.user.id } });
                        if (newUser.clinicId === lastClinic.id) {
                             console.log("✅ Doctor successfully linked to clinic!");
                        } else {
                             errors.push("❌ Doctor created but NOT linked to clinic!");
                        }
                    } else {
                        errors.push(`Failed to register with valid code: ${JSON.stringify(data)}`);
                    }
                }
            } else {
                errors.push("⚠️ Could not find the test clinic we just created!");
            }
        } catch(err) {
            console.error("DB Check failed:", err);
            errors.push(`DB Integrity Check Error: ${err.message}`);
        }

        // Summary
        console.log("\n--- Audit Summary ---");
        if (errors.length === 0) {
            console.log("✅ ALL CHECKS PASSED. Logic seems sound.");
            
            // Phase 2
            const phase2Errors = await verifyGeneralSystem(gestorEmail, "password123");
            if (phase2Errors.length > 0) {
                 console.log("\n⚠️ PHASE 2 ISSUES:");
                 phase2Errors.forEach(e => console.log(" - " + e));
                 process.exit(1);
            } else {
                 console.log("\n✅ PHASE 2 (Core System) PASSED.");
            }

        } else {
            console.log("⚠️ ISSUES FOUND:");
            errors.forEach(e => console.log(" - " + e));
            process.exit(1); 
        }
    }

    await verifyFlows();
})();

async function verifyGeneralSystem(gestorEmail, gestorPassword) {
    console.log("\n🚀 Starting Phase 2: Core System Audit...");
    const API_URL = 'http://localhost:4000/api';
    let token = "";
    let userId = "";
    let errors = [];
    
    // 1. LOGIN
    console.log(`\n[TEST 5] Testing Login for ${gestorEmail}...`);
    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: gestorEmail, password: gestorPassword })
        });
        const data = await res.json();
        if (res.status === 200 && data.token) {
            console.log("✅ Login Successful");
            token = data.token;
            userId = data.user.id;
        } else {
            console.error("❌ Login Failed:", data);
            errors.push("Login failed");
            return errors; // Cannot proceed without token
        }
    } catch (e) {
        console.error("❌ Login Exception:", e.message);
        errors.push(`Login Exception: ${e.message}`);
        return errors;
    }

    const authHeaders = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    // 2. DASHBOARD STATS
    console.log(`\n[TEST 6] Fetching Dashboard Stats...`);
    try {
        const res = await fetch(`${API_URL}/stats/dashboard`, { headers: authHeaders });
        const data = await res.json();
        if (res.status === 200) {
            console.log("✅ Stats retrieved:", `Patients: ${data.totalPatients || 0}, Consults: ${data.totalConsults || 0}`);
        } else {
             console.error("❌ Stats Failed:", data);
             errors.push(`Stats Failed: ${res.status}`);
        }
    } catch (e) {
        errors.push(`Stats Exception: ${e.message}`);
    }

    // 3. CREATE CONSULT (Agendamento)
    console.log(`\n[TEST 7] Creating a Test Consult...`);
    try {
        const res = await fetch(`${API_URL}/consults`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
                patientName: "Paciente Teste Audit",
                date: new Date().toISOString(),
                type: "CONSULTA",
                status: "AGENDADA",
                doctorId: userId // Gestor is also a user/doctor usually, or we use the user ID from login
            })
        });
        const data = await res.json();
        if (res.status === 201) {
            console.log("✅ Consult Created ID:", data.id);
        } else {
            console.error("❌ Consult Creation Failed:", data);
            errors.push(`Consult Creation Failed: ${res.status}`);
        }
    } catch (e) {
        errors.push(`Consult Exception: ${e.message}`);
    }

    // 4. LIST USERS (Team View)
    console.log(`\n[TEST 8] Fetching Clinic Team...`);
    try {
        const res = await fetch(`${API_URL}/users`, { headers: authHeaders });
        const data = await res.json();
        if (res.status === 200 && Array.isArray(data)) {
            console.log("✅ Team List retrieved. Count:", data.length);
        } else {
             console.error("❌ Users List Failed:", data);
             errors.push(`Users List Failed: ${res.status}`);
        }
    } catch (e) {
        errors.push(`Users List Exception: ${e.message}`);
    }

    return errors;
}
